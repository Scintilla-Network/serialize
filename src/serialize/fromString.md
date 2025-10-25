# fromString

## Overview
The `fromString` function serializes JavaScript strings into binary format following the Scintilla Network protocol. Strings are encoded with a variable-length prefix indicating byte count, followed by UTF-8 encoded character data.

## Protocol Structure

### Byte Layout
```
[LENGTH][UTF8_BYTES]
```

### Binary Format

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|    LENGTH (varint)    |           UTF-8 BYTES                 |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                    (continued...)                             |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

### Field Breakdown

```
Byte Structure:
┌──────────────────────────────────────────────────────────┐
│ LENGTH (varint)                                          │
│ • Byte count of UTF-8 encoded string                    │
│ • Variable length: 1-9 bytes depending on string size   │
│ • Uses Protocol Buffers varint encoding                 │
├──────────────────────────────────────────────────────────┤
│ UTF-8 BYTES (n bytes)                                    │
│ • String encoded as UTF-8                               │
│ • Length matches LENGTH field                           │
│ • No null terminator                                    │
└──────────────────────────────────────────────────────────┘
```

### VarInt Length Encoding

| String Byte Length | VarInt Bytes | VarInt Encoding |
|-------------------|--------------|-----------------|
| 0-127             | 1            | Direct value    |
| 128-16,383        | 2            | 2-byte varint   |
| 16,384-2,097,151  | 3            | 3-byte varint   |
| 2,097,152+        | 4+           | Multi-byte      |

## Encoding Process

### Step-by-Step Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. Validate input is string type                        │
│    └─ Check: typeof value === 'string'                  │
├─────────────────────────────────────────────────────────┤
│ 2. Convert to UTF-8 bytes                               │
│    └─ Use TextEncoder.encode() (JavaScript)             │
├─────────────────────────────────────────────────────────┤
│ 3. Determine UTF-8 byte length                          │
│    └─ Note: byte length ≠ character length              │
├─────────────────────────────────────────────────────────┤
│ 4. Encode length as VarInt                              │
│    └─ Creates 1-9 byte length prefix                    │
├─────────────────────────────────────────────────────────┤
│ 5. Allocate output buffer                               │
│    └─ size = varint_length + utf8_length                │
├─────────────────────────────────────────────────────────┤
│ 6. Write VarInt length prefix                           │
├─────────────────────────────────────────────────────────┤
│ 7. Write UTF-8 bytes                                    │
├─────────────────────────────────────────────────────────┤
│ 8. Return result                                         │
│    ├─ value: complete byte array                        │
│    └─ length: total bytes written                       │
└─────────────────────────────────────────────────────────┘
```

## Examples

### Empty String

**Input:**
```javascript
""
```

**Byte-by-Byte:**
```
Offset  Hex   Dec  Description
------  ----  ---  -----------
0x00    0x00   0   LENGTH = 0 bytes

Total: 1 byte
```

**Output:**
```
Hex: 00
```

### Single Character

**Input:**
```javascript
"A"
```

**Byte-by-Byte:**
```
Offset  Hex   Dec  Description
------  ----  ---  -----------
0x00    0x01   1   LENGTH = 1 byte
0x01    0x41  65   'A' (UTF-8)

Total: 2 bytes
```

**Output:**
```
Hex: 01 41
```

### ASCII String

**Input:**
```javascript
"hello"
```

**Byte-by-Byte:**
```
Offset  Hex   Dec  Description
------  ----  ---  -----------
0x00    0x05   5   LENGTH = 5 bytes
0x01    0x68 104   'h'
0x02    0x65 101   'e'
0x03    0x6C 108   'l'
0x04    0x6C 108   'l'
0x05    0x6F 111   'o'

Total: 6 bytes
```

**Output:**
```
Hex: 05 68 65 6C 6C 6F
```

### Unicode String (Multi-byte Characters)

**Input:**
```javascript
"Hello 世界"  // "Hello World" in Chinese
```

**Byte-by-Byte:**
```
Offset  Hex   Dec  Description
------  ----  ---  -----------
0x00    0x0C  12   LENGTH = 12 bytes (not 8 chars!)
0x01    0x48  72   'H'
0x02    0x65 101   'e'
0x03    0x6C 108   'l'
0x04    0x6C 108   'l'
0x05    0x6F 111   'o'
0x06    0x20  32   ' ' (space)
0x07    0xE4 228   '世' byte 1 (3-byte UTF-8)
0x08    0xB8 184   '世' byte 2
0x09    0x96 150   '世' byte 3
0x0A    0xE7 231   '界' byte 1 (3-byte UTF-8)
0x0B    0x95 149   '界' byte 2
0x0C    0x8C 140   '界' byte 3

Total: 13 bytes
```

**Output:**
```
Hex: 0C 48 65 6C 6C 6F 20 E4 B8 96 E7 95 8C
```

**Note:** Chinese characters use 3 bytes each in UTF-8.

### Emoji String

**Input:**
```javascript
"Hi 👋"
```

**Byte-by-Byte:**
```
Offset  Hex   Dec  Description
------  ----  ---  -----------
0x00    0x07   7   LENGTH = 7 bytes
0x01    0x48  72   'H'
0x02    0x69 105   'i'
0x03    0x20  32   ' ' (space)
0x04    0xF0 240   '👋' byte 1 (4-byte UTF-8)
0x05    0x9F 159   '👋' byte 2
0x06    0x91 145   '👋' byte 3
0x07    0x8B 139   '👋' byte 4

Total: 8 bytes
```

**Output:**
```
Hex: 07 48 69 20 F0 9F 91 8B
```

**Note:** Emoji typically use 4 bytes in UTF-8.

## UTF-8 Encoding Reference

### UTF-8 Byte Sequences

| Code Point Range | Bytes | Byte Pattern                           |
|------------------|-------|----------------------------------------|
| U+0000 - U+007F  | 1     | 0xxxxxxx                              |
| U+0080 - U+07FF  | 2     | 110xxxxx 10xxxxxx                     |
| U+0800 - U+FFFF  | 3     | 1110xxxx 10xxxxxx 10xxxxxx            |
| U+10000 - U+10FFFF | 4   | 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx   |

### Character Ranges

```
ASCII (1 byte):
  U+0000 - U+007F
  Examples: A-Z, a-z, 0-9, basic punctuation

Latin Extended (2 bytes):
  U+0080 - U+07FF
  Examples: é, ñ, ü, ö, Greek, Cyrillic

CJK & Most Symbols (3 bytes):
  U+0800 - U+FFFF
  Examples: 中文, 日本語, ❤, ★

Emoji & Rare Characters (4 bytes):
  U+10000 - U+10FFFF
  Examples: 🎉, 👋, 𝕏, Ancient scripts
```

### Multi-byte Examples

#### 2-byte UTF-8 (Latin Extended)
```
Input:  "café"
Output: 05 63 61 66 C3 A9
        └─┘ c  a  f  é(2B)
```

#### 3-byte UTF-8 (CJK)
```
Input:  "日本"
Output: 06 E6 97 A5 E6 9C AC
        └─┘ 日(3B)   本(3B)
```

#### 4-byte UTF-8 (Emoji)
```
Input:  "🎉"
Output: 04 F0 9F 8E 89
        └─┘ 🎉(4B)
```

## Edge Cases

### Empty String
Empty strings are valid and serialize to a single zero byte:
```javascript
"" → 0x00
```

### String with Null Bytes
Null characters (`\0`) are valid within strings:
```javascript
"a\0b" → 03 61 00 62
```

### Special Characters

#### Newline
```
Input:  "a\nb"
Output: 03 61 0A 62
        └─┘ a  \n b
```

#### Tab
```
Input:  "a\tb"
Output: 03 61 09 62
        └─┘ a  \t b
```

### Boundary Cases

#### 127 bytes (max 1-byte varint)
```
Input:  "a" repeated 127 times
Output: 7F [61 × 127]
Length: 128 bytes
```

#### 128 bytes (min 2-byte varint)
```
Input:  "a" repeated 128 times
Output: 80 01 [61 × 128]
Length: 130 bytes (2-byte varint)
```

## JavaScript Implementation Notes

### TextEncoder Usage
```javascript
// JavaScript strings are UTF-16 internally
const str = "hello";

// Convert to UTF-8
const utf8Encoder = new TextEncoder();
const utf8Bytes = utf8Encoder.encode(str);

// utf8Bytes is Uint8Array with UTF-8 encoding
```

### Character vs Byte Length
```javascript
const str = "Hello 世界";

str.length              // 8 (JavaScript UTF-16 code units)
utf8Bytes.length        // 12 (actual UTF-8 bytes)

// Important: LENGTH field = UTF-8 byte count, not character count
```

## Return Value

```javascript
{
    value: Uint8Array,    // Complete encoded bytes (length prefix + UTF-8)
    length: number        // Total bytes: varint_length + utf8_length
}
```

## Usage

### Basic Usage
```javascript
import { fromString } from './fromString.js';

const result = fromString("hello");
// result.value: Uint8Array [5, 104, 101, 108, 108, 111]
// result.length: 6

console.log(result.value);  // Serialized bytes
console.log(result.length); // Total bytes
```

### Unicode Handling
```javascript
const result = fromString("日本");
// result.value: Uint8Array [6, 230, 151, 165, 230, 156, 172]
// result.length: 7 (1 byte length + 6 UTF-8 bytes)
```

### Integration with Objects
```javascript
// String used as object field value
const obj = { name: "Alice", greeting: "Hello 👋" };
// When serialized via fromObject():
// - Field value has TYPE_BYTE 0x50 (string)
// - Followed by fromString() output
```

## Performance Characteristics

### Complexity
```
Time Complexity:  O(n) where n = byte length of UTF-8 string
Space Complexity: O(n) for output buffer
```

### Overhead

| String Length (bytes) | VarInt Overhead | Total Overhead |
|----------------------|-----------------|----------------|
| 0-127                | 1 byte          | ~0.8-100%      |
| 128-16,383           | 2 bytes         | ~0.01-1.5%     |
| 16,384-2,097,151     | 3 bytes         | ~0.0001-0.02%  |

**Conclusion**: Overhead is negligible for strings > 100 bytes.

## Error Conditions

### Invalid Input Type
```javascript
fromString(null)      → TypeError
fromString(undefined) → TypeError
fromString(123)       → TypeError
fromString({})        → TypeError
```

### Memory Errors
```javascript
fromString("x".repeat(10**9))  → May throw RangeError
```

**Expected behavior:** Throw error for invalid types, fail gracefully for memory errors.

## Relationship to Deserialization

This function is the inverse of `toString()`:
```javascript
const original = "hello";
const serialized = fromString(original);
const deserialized = toString(serialized.value);
// deserialized.value === original
```

### Round-Trip Example
```javascript
// Serialize
const str = "Hello 世界";
const encoded = fromString(str);
// encoded.value: Uint8Array [12, 72, 101, 108, 108, 111, 32, 228, 184, 150, 231, 149, 140]

// Deserialize
const decoded = toString(encoded.value);
// decoded.value: "Hello 世界"

// Verify
console.assert(str === decoded.value); // ✓ Passes
```

## Cross-Platform Compatibility

UTF-8 encoding ensures compatibility across:
- Different JavaScript engines (V8, SpiderMonkey, JavaScriptCore)
- Different operating systems (Windows, macOS, Linux)
- Network transmission
- Storage systems
- All programming languages with UTF-8 support
