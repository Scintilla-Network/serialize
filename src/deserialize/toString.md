# toString

## Overview
The `toString` function deserializes byte data back into JavaScript strings following the Scintilla Network protocol. It reverses the process performed by `fromString()`.

## Protocol Structure

### Input Format
```
[LENGTH][UTF8_BYTES]
```

### Field Breakdown
- **LENGTH**: VarInt-encoded byte count of UTF-8 string
- **UTF8_BYTES**: UTF-8 encoded string data

## Deserialization Process

### Step-by-Step Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. Read LENGTH (varint from input)                      │
│    ├─ Parse varint to get UTF-8 byte count             │
│    └─ Track bytes consumed by varint                    │
├─────────────────────────────────────────────────────────┤
│ 2. Validate sufficient bytes available                  │
│    └─ Check: remaining_bytes >= LENGTH                  │
├─────────────────────────────────────────────────────────┤
│ 3. Extract UTF-8 bytes                                  │
│    └─ Slice: bytes[varint_length : varint_length+LENGTH]│
├─────────────────────────────────────────────────────────┤
│ 4. Decode UTF-8 to string                               │
│    └─ Use TextDecoder (JavaScript)                      │
├─────────────────────────────────────────────────────────┤
│ 5. Return result                                         │
│    ├─ value: decoded string                             │
│    └─ length: varint_length + UTF-8_length             │
└─────────────────────────────────────────────────────────┘
```

## Examples

### Empty String

**Input Bytes:**
```
00
```

**Parsing:**
```
Step 1: Read LENGTH
Offset  Value  Description
------  -----  -----------
0x00    0x00   LENGTH = 0 bytes

Step 2: Extract UTF-8 bytes
(No bytes to extract)

Step 3: Decode UTF-8
Result: "" (empty string)

Return: { value: "", length: 1 }
```

### Single Character

**Input Bytes:**
```
01 41
```

**Parsing:**
```
Step 1: Read LENGTH
0x00    0x01   LENGTH = 1 byte

Step 2: Extract UTF-8 bytes
0x01    0x41   'A'

Step 3: Decode UTF-8
0x41 → U+0041 → 'A'

Return: { value: "A", length: 2 }
```

### ASCII String

**Input Bytes:**
```
05 68 65 6C 6C 6F
```

**Parsing:**
```
Step 1: Read LENGTH
0x00    0x05   LENGTH = 5 bytes

Step 2: Extract UTF-8 bytes
0x01    0x68   'h'
0x02    0x65   'e'
0x03    0x6C   'l'
0x04    0x6C   'l'
0x05    0x6F   'o'

Step 3: Decode UTF-8
Each byte is single-byte UTF-8 (ASCII)

Return: { value: "hello", length: 6 }
```

### Unicode String (Multi-byte)

**Input Bytes:**
```
0C 48 65 6C 6C 6F 20 E4 B8 96 E7 95 8C
```

**Parsing:**
```
Step 1: Read LENGTH
0x00    0x0C   LENGTH = 12 bytes

Step 2: Extract UTF-8 bytes
0x01    0x48         'H'
0x02    0x65         'e'
0x03    0x6C         'l'
0x04    0x6C         'l'
0x05    0x6F         'o'
0x06    0x20         ' '
0x07    0xE4 B8 96   '世' (3-byte UTF-8)
0x0A    0xE7 95 8C   '界' (3-byte UTF-8)

Step 3: Decode UTF-8
0xE4B896 → U+4E16 → '世'
0xE7958C → U+754C → '界'

Return: { value: "Hello 世界", length: 13 }
```

### Emoji String

**Input Bytes:**
```
07 48 69 20 F0 9F 91 8B
```

**Parsing:**
```
Step 1: Read LENGTH
0x00    0x07   LENGTH = 7 bytes

Step 2: Extract UTF-8 bytes
0x01    0x48               'H'
0x02    0x69               'i'
0x03    0x20               ' '
0x04    0xF0 9F 91 8B      '👋' (4-byte UTF-8)

Step 3: Decode UTF-8
0xF09F918B → U+1F44B → '👋' (waving hand emoji)

Return: { value: "Hi 👋", length: 8 }
```

## UTF-8 Decoding Details

### Byte Sequence Patterns

```
1-byte sequence (ASCII):
  0xxxxxxx
  Example: 0x41 → 'A'

2-byte sequence:
  110xxxxx 10xxxxxx
  Example: 0xC3A9 → 'é'

3-byte sequence:
  1110xxxx 10xxxxxx 10xxxxxx
  Example: 0xE4B896 → '世'

4-byte sequence:
  11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
  Example: 0xF09F918B → '👋'
```

### Validation Rules

**Continuation bytes must:**
- Start with `10` (0x80-0xBF range)
- Follow a leading byte
- Be complete (no truncation)

**Leading bytes must:**
- Match expected pattern
- Not be overlong encoding
- Encode valid Unicode code point

## Error Handling

### Insufficient Bytes

```
┌────────────────────────────────────────────────────────────┐
│ ERROR: Insufficient bytes                                  │
│ ───────────────────────────────────────────────────────────│
│ Input:  03 41 42     (claims 3 bytes, only has 2)         │
│ Message: "Insufficient bytes: expected 3, available 2"     │
│ Cause: Buffer truncated or length corrupted                │
│ Action: Verify complete data received                      │
└────────────────────────────────────────────────────────────┘
```

### Invalid UTF-8

```
┌────────────────────────────────────────────────────────────┐
│ ERROR: Invalid UTF-8 sequence                              │
│ ───────────────────────────────────────────────────────────│
│ Input:  03 FF FE FD  (invalid UTF-8 bytes)                │
│ Message: "Invalid UTF-8 encoding"                          │
│ Cause: Malformed UTF-8 or data corruption                  │
│ Action: Replacement char (�) or throw error                │
└────────────────────────────────────────────────────────────┘
```

### Invalid VarInt

```
┌────────────────────────────────────────────────────────────┐
│ ERROR: Invalid varint length prefix                        │
│ ───────────────────────────────────────────────────────────│
│ Input:  FF FF FF ...  (varint never terminates)           │
│ Message: "Invalid varint encoding"                         │
│ Cause: Malformed length prefix                             │
│ Action: Verify data integrity                              │
└────────────────────────────────────────────────────────────┘
```

### Length Too Large

```
┌────────────────────────────────────────────────────────────┐
│ ERROR: String length exceeds limit                         │
│ ───────────────────────────────────────────────────────────│
│ Input:  FF FF FF 7F  (claims gigabytes)                   │
│ Message: "String length exceeds maximum: {length}"         │
│ Cause: Malicious input or corrupted length                 │
│ Action: Reject and enforce size limits                     │
└────────────────────────────────────────────────────────────┘
```

## Performance Characteristics

### Complexity

```
Time Complexity:  O(n) where n = byte length
                  (single pass through bytes)
Space Complexity: O(n) for output string
```

### TextDecoder Performance

```javascript
// Native TextDecoder (fast, optimized)
const decoder = new TextDecoder('utf-8', { fatal: true });
const str = decoder.decode(utf8Bytes);

// Options:
// - fatal: true  → throw on invalid UTF-8
// - fatal: false → replace with � (U+FFFD)
```

## Usage Examples

### Basic Usage

```javascript
import { toString } from './toString.js';

const bytes = new Uint8Array([5, 104, 101, 108, 108, 111]);
const result = toString(bytes);
// result.value: "hello"
// result.length: 6 (1 byte length + 5 UTF-8 bytes)
```

### Streaming/Multiple Strings

```javascript
const buffer = new Uint8Array([...]);
let offset = 0;

// First string
const str1 = toString(buffer.subarray(offset));
offset += str1.length;

// Second string
const str2 = toString(buffer.subarray(offset));
offset += str2.length;
```

### Integration with Objects

```javascript
// String from object field
// Input: TYPE_BYTE 0x50 + string bytes

// Skip type byte, then deserialize
const str = toString(bytes.subarray(1));
```

## Test Vectors

### Edge Cases

```
Empty:
  Input:  00
  Output: ""
  Length: 1

Spaces:
  Input:  05 20 20 20 20 20
  Output: "     " (5 spaces)
  Length: 6

Newlines:
  Input:  03 0A 0A 0A
  Output: "\n\n\n"
  Length: 4

Null chars:
  Input:  03 61 00 62
  Output: "a\x00b"
  Length: 4
```

### Unicode Test Vectors

```
Latin Extended:
  Input:  05 63 61 66 C3 A9
  Output: "café"
  Length: 6

CJK:
  Input:  06 E6 97 A5 E6 9C AC
  Output: "日本"
  Length: 7

Emoji:
  Input:  04 F0 9F 8E 89
  Output: "🎉"
  Length: 5

Mixed:
  Input:  0E 48 65 6C 6C 6F 20 F0 9F 8C 8D 20 21
  Output: "Hello 🌍 !"
  Length: 15
```

## Return Value

```javascript
{
    value: string,     // Decoded string
    length: number     // Total bytes consumed (varint length + UTF-8 bytes)
}
```

## Common Issues

### Replacement Character (�)

```
When you see �:
- Invalid UTF-8 sequence encountered
- TextDecoder replaced it with U+FFFD
- Check data integrity

Example:
  Input:  02 FF FE  (invalid)
  Output: "��"      (two replacement chars)
```

### Truncated Strings

```
Problem: String appears cut off

Possible causes:
1. Incomplete buffer transmission
2. Incorrect length prefix
3. Null byte interpreted as terminator (application bug)

Diagnosis:
- Check result.length matches expected
- Verify buffer.length >= declared length
```

### Character Count vs Byte Count

```javascript
const str = "Hello 世界";

str.length              // 8 characters (JavaScript counts UTF-16 code units)
utf8Bytes.length        // 12 bytes (actual UTF-8 size)

Important: LENGTH field = UTF-8 byte count, not character count
```

## Relationship to Serialization

This function is the inverse of `fromString()`:
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

UTF-8 decoding is universal:
- All languages support UTF-8
- Standard encoding for web/network
- Compatible with JSON, XML, etc.
- No endianness issues
