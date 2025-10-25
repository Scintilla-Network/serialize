# fromObject

## Overview
The `fromObject` function serves as the universal serialization entry point for JavaScript objects, arrays, and primitives following the Scintilla Network protocol. It handles deterministic serialization with support for nested structures and multiple data types.

## Protocol Structure

### Supported Input Types

```
fromObject() handles:
├─ Objects: Plain JavaScript objects {}
├─ Arrays: JavaScript arrays []
└─ Primitives: Objects with .kind property (delegates to .toUint8Array())
```

### Type Detection Flow

```
Input Type Detection:
├─ Has .kind property? → Call input.toUint8Array()
├─ Array.isArray() === true? → serializeArray()
└─ Otherwise → serializeObject()
```

## Object Binary Format

### Byte Layout

```
[KIND][OBJECT_TOTAL_LENGTH][FIELD_NAMES_LENGTH][FIELD_VALUES_LENGTH][FIELD_NAMES_SECTION][FIELD_VALUES_SECTION]
```

### Visual Structure

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|     KIND      |         OBJECT_TOTAL_LENGTH (varint)          |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|       FIELD_NAMES_LENGTH (varint)     |  FIELD_VALUES_LENGTH  |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                    FIELD_NAMES_SECTION                        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                   FIELD_VALUES_SECTION                        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

### Field Breakdown

```
Byte Structure:
┌──────────────────────────────────────────────────────────┐
│ KIND (1 byte)                                            │
│ • Value: 0x17 (23 decimal)                              │
│ • Constant: NET_KINDS.PACKEDOBJECT                      │
├──────────────────────────────────────────────────────────┤
│ OBJECT_TOTAL_LENGTH (varint)                            │
│ • Sum of: FIELD_NAMES_LENGTH + FIELD_VALUES_LENGTH     │
│ • Includes length prefix bytes themselves              │
├──────────────────────────────────────────────────────────┤
│ FIELD_NAMES_LENGTH (varint)                             │
│ • Byte length of entire FIELD_NAMES_SECTION            │
├──────────────────────────────────────────────────────────┤
│ FIELD_VALUES_LENGTH (varint)                            │
│ • Byte length of entire FIELD_VALUES_SECTION           │
├──────────────────────────────────────────────────────────┤
│ FIELD_NAMES_SECTION                                      │
│ ┌────────────────────────────────────────────────────┐  │
│ │ FIELD_COUNT (varint)                               │  │
│ ├────────────────────────────────────────────────────┤  │
│ │ For each field (alphabetically sorted):            │  │
│ │   • STRING_LENGTH (varint)                         │  │
│ │   • UTF8_BYTES (field name)                        │  │
│ └────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────┤
│ FIELD_VALUES_SECTION                                     │
│ ┌────────────────────────────────────────────────────┐  │
│ │ FIELD_COUNT (varint)                               │  │
│ ├────────────────────────────────────────────────────┤  │
│ │ For each field (same order as names):              │  │
│ │   • TYPE_BYTE (1 byte) [0x50-0x55]                │  │
│ │   • VALUE_DATA (variable, type-dependent)          │  │
│ └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

## Array Binary Format

### Byte Layout

```
[KIND][ITEM_COUNT][ITEMS_BYTES_LENGTH][ITEMS_SECTION]
```

### Visual Structure

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|     KIND      |          ITEM_COUNT (varint)                  |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|         ITEMS_BYTES_LENGTH (varint)                           |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                      ITEMS_SECTION                            |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

### Field Breakdown

```
Byte Structure:
┌──────────────────────────────────────────────────────────┐
│ KIND (1 byte)                                            │
│ • Value: 0x18 (24 decimal)                              │
│ • Constant: NET_KINDS.PACKEDARRAY                       │
├──────────────────────────────────────────────────────────┤
│ ITEM_COUNT (varint)                                      │
│ • Number of items in array                              │
├──────────────────────────────────────────────────────────┤
│ ITEMS_BYTES_LENGTH (varint)                              │
│ • Total byte length of ITEMS_SECTION                    │
├──────────────────────────────────────────────────────────┤
│ ITEMS_SECTION                                            │
│ ┌────────────────────────────────────────────────────┐  │
│ │ For each item (index order):                       │  │
│ │   • TYPE_BYTE (1 byte) [0x50-0x55]                │  │
│ │   • VALUE_DATA (variable, type-dependent)          │  │
│ └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

## Type System

### Type Byte Encoding

| Type    | Byte | Hex  | Description                     |
|---------|------|------|---------------------------------|
| String  | 80   | 0x50 | UTF-8 encoded, length-prefixed  |
| VarInt  | 81   | 0x51 | Variable-length signed integer  |
| BigInt  | 82   | 0x52 | Variable-length big integer     |
| Array   | 83   | 0x53 | Packed array structure          |
| Object  | 84   | 0x54 | Packed object structure         |
| Boolean | 85   | 0x55 | Single byte: 0x00 or 0x01       |

### Kind Bytes (Top-Level)

| Structure | Byte | Hex  | Constant             |
|-----------|------|------|----------------------|
| Object    | 23   | 0x17 | NET_KINDS.PACKEDOBJECT |
| Array     | 24   | 0x18 | NET_KINDS.PACKEDARRAY  |

### Primitive Value Formats

#### String (0x50)
```
┌─────────┬─────────────────┬──────────────────────┐
│ 0x50    │ LENGTH (varint) │ UTF8_BYTES (n bytes) │
└─────────┴─────────────────┴──────────────────────┘
   1 byte      var bytes          n bytes
```

#### VarInt (0x51)
```
┌─────────┬────────────────────────┐
│ 0x51    │ VARINT_BYTES (1-9)     │
└─────────┴────────────────────────┘
   1 byte      1-9 bytes
```

#### BigInt (0x52)
```
┌─────────┬──────────────────────────┐
│ 0x52    │ VARBIGINT_BYTES (var)    │
└─────────┴──────────────────────────┘
   1 byte      variable bytes
```

#### Boolean (0x55)
```
┌─────────┬──────────┐
│ 0x55    │ VALUE    │
└─────────┴──────────┘
   1 byte    1 byte
   
VALUE: 0x00 = false, 0x01 = true
```

#### Nested Array (0x53)
```
┌─────────┬─────────────────┬─────────────────────────┐
│ 0x53    │ LENGTH (varint) │ ARRAY_BYTES (n bytes)   │
└─────────┴─────────────────┴─────────────────────────┘
   1 byte      var bytes          n bytes
   
ARRAY_BYTES: Complete array structure (recursive format)
```

#### Nested Object (0x54)
```
┌─────────┬─────────────────┬──────────────────────────┐
│ 0x54    │ LENGTH (varint) │ OBJECT_BYTES (n bytes)   │
└─────────┴─────────────────┴──────────────────────────┘
   1 byte      var bytes           n bytes
   
OBJECT_BYTES: Complete object structure (recursive format)
```

## Object Serialization Process

### Step-by-Step Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. Extract and sort field names                         │
│    └─ Sort alphabetically (UTF-8 byte order)            │
├─────────────────────────────────────────────────────────┤
│ 2. For each field, determine type:                      │
│    ├─ typeof === 'string' → 0x50                        │
│    ├─ typeof === 'number' → 0x51                        │
│    ├─ typeof === 'bigint' → 0x52                        │
│    ├─ typeof === 'boolean' → 0x55                       │
│    ├─ Array.isArray() → 0x53                            │
│    └─ typeof === 'object' → 0x54                        │
├─────────────────────────────────────────────────────────┤
│ 3. Serialize field names section:                       │
│    ├─ FIELD_COUNT (varint)                              │
│    └─ For each: LENGTH (varint) + UTF8_BYTES            │
├─────────────────────────────────────────────────────────┤
│ 4. Serialize field values section:                      │
│    ├─ FIELD_COUNT (varint)                              │
│    └─ For each: TYPE_BYTE + serialized value            │
├─────────────────────────────────────────────────────────┤
│ 5. Calculate all lengths                                 │
│    ├─ FIELD_NAMES_LENGTH                                │
│    ├─ FIELD_VALUES_LENGTH                               │
│    └─ OBJECT_TOTAL_LENGTH                               │
├─────────────────────────────────────────────────────────┤
│ 6. Assemble complete structure:                         │
│    [KIND][lengths][names][values]                       │
└─────────────────────────────────────────────────────────┘
```

## Array Serialization Process

### Step-by-Step Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. Get item count                                        │
├─────────────────────────────────────────────────────────┤
│ 2. For each item (in index order):                       │
│    ├─ Determine type                                     │
│    ├─ Serialize: TYPE_BYTE + VALUE                       │
│    └─ Accumulate bytes                                   │
├─────────────────────────────────────────────────────────┤
│ 3. Calculate total items byte length                     │
├─────────────────────────────────────────────────────────┤
│ 4. Assemble: [KIND][count][length][items]              │
└─────────────────────────────────────────────────────────┘
```

## Examples

### Simple Object

**Input:**
```javascript
{ count: 42, name: "Alice" }
```

**Byte-by-Byte Breakdown:**

```
Offset  Hex    Dec  Description
------  ----   ---  -----------
0x00    0x17    23  KIND = PACKEDOBJECT
0x01    0x21    33  OBJECT_TOTAL_LENGTH = 33 bytes
0x02    0x1A    26  FIELD_NAMES_LENGTH = 26 bytes
0x03    0x07     7  FIELD_VALUES_LENGTH = 7 bytes

--- FIELD_NAMES_SECTION (26 bytes) ---
0x04    0x02     2  FIELD_COUNT = 2 fields

Field 0:
0x05    0x05     5  STRING_LENGTH = 5
0x06    0x63   'c'  'count'
0x07    0x6F   'o'
0x08    0x75   'u'
0x09    0x6E   'n'
0x0A    0x74   't'

Field 1:
0x0B    0x04     4  STRING_LENGTH = 4
0x0C    0x6E   'n'  'name'
0x0D    0x61   'a'
0x0E    0x6D   'm'
0x0F    0x65   'e'

--- FIELD_VALUES_SECTION (7 bytes) ---
0x10    0x02     2  FIELD_COUNT = 2 fields

Value 0 (count):
0x11    0x51    81  TYPE = VarInt
0x12    0x2A    42  VALUE = 42

Value 1 (name):
0x13    0x50    80  TYPE = String
0x14    0x05     5  STRING_LENGTH = 5
0x15    0x41   'A'  'Alice'
0x16    0x6C   'l'
0x17    0x69   'i'
0x18    0x63   'c'
0x19    0x65   'e'

Total: 26 bytes (0x1A)
```

### Simple Array

**Input:**
```javascript
[1, "hello", true]
```

**Byte-by-Byte Breakdown:**

```
Offset  Hex    Dec  Description
------  ----   ---  -----------
0x00    0x18    24  KIND = PACKEDARRAY
0x01    0x03     3  ITEM_COUNT = 3 items
0x02    0x0B    11  ITEMS_BYTES_LENGTH = 11 bytes

--- ITEMS_SECTION (11 bytes) ---

Item 0:
0x03    0x51    81  TYPE = VarInt
0x04    0x01     1  VALUE = 1

Item 1:
0x05    0x50    80  TYPE = String
0x06    0x05     5  STRING_LENGTH = 5
0x07    0x68   'h'  'hello'
0x08    0x65   'e'
0x09    0x6C   'l'
0x0A    0x6C   'l'
0x0B    0x6F   'o'

Item 2:
0x0C    0x55    85  TYPE = Boolean
0x0D    0x01     1  VALUE = true

Total: 14 bytes (0x0E)
```

### Nested Structure

**Input:**
```javascript
{
  user: { id: 1, active: true },
  count: 5
}
```

**Structure:**
```
17                  KIND = PACKEDOBJECT (outer)
...                 lengths
  Field Names: "count", "user" (alphabetically sorted)
  Field Values:
    51 05           count = 5 (VarInt)
    54 ...          user = nested object (Object type)
      17            KIND = PACKEDOBJECT (nested)
      ...           nested object content
```

### Empty Object

```
Input:  {}
Output: 17 06 02 02 00 00

Breakdown:
  17    - KIND (PACKEDOBJECT)
  06    - OBJECT_TOTAL_LENGTH
  02    - FIELD_NAMES_LENGTH
  02    - FIELD_VALUES_LENGTH
  00    - FIELD_COUNT in names (0 fields)
  00    - FIELD_COUNT in values (0 fields)
```

### Empty Array

```
Input:  []
Output: 18 00 00

Breakdown:
  18    - KIND (PACKEDARRAY)
  00    - ITEM_COUNT (0 items)
  00    - ITEMS_BYTES_LENGTH (0 bytes)
```

### All Primitive Types

**Input:**
```javascript
{
  str: "test",
  num: 42,
  big: 1000n,
  bool: true
}
```

**Output (hex):**
```
17                  KIND = PACKEDOBJECT
26                  OBJECT_TOTAL_LENGTH = 38
17                  FIELD_NAMES_LENGTH = 23
0F                  FIELD_VALUES_LENGTH = 15

Field Names (23 bytes):
  04                FIELD_COUNT = 4
  03 62 69 67       "big"
  04 62 6F 6F 6C    "bool"
  03 6E 75 6D       "num"
  03 73 74 72       "str"

Field Values (15 bytes):
  04                FIELD_COUNT = 4
  52 E8 07          BigInt: 1000n
  55 01             Boolean: true
  51 2A             VarInt: 42
  50 04 74 65 73 74 String: "test"
```

## Determinism

### Field Ordering

**Critical requirement**: Fields MUST be sorted alphabetically (lexicographic, UTF-8 byte order):

```javascript
['zebra', 'apple', 'banana'] → ['apple', 'banana', 'zebra']
```

### Canonical Representation

Given identical input objects, serialization produces byte-for-byte identical output, regardless of:
- Original property insertion order
- JavaScript engine implementation
- Platform architecture

### Sorting Example

```javascript
const obj1 = { z: 1, a: 2, m: 3 };
const obj2 = { a: 2, m: 3, z: 1 };
const obj3 = { m: 3, z: 1, a: 2 };

// All produce identical serialization:
// Field names: "a", "m", "z" (alphabetically sorted)
```

## Return Value

```javascript
{
    value: Uint8Array,    // Complete serialized bytes
    length: number        // Total bytes written
}
```

## Usage

### Basic Object
```javascript
import { fromObject } from './fromObject.js';

const obj = { name: "Alice", age: 30 };
const result = fromObject(obj);
// result.value: Uint8Array [...]
// result.length: total bytes
```

### Array
```javascript
const arr = [1, 2, 3];
const result = fromObject(arr);
// result.value: Uint8Array [...]
// result.length: total bytes
```

### Nested Structures
```javascript
const data = {
  users: [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" }
  ],
  count: 2
};
const result = fromObject(data);
```

### Primitives with .kind
```javascript
const identity = new Identity({...});
const result = fromObject(identity);
// Delegates to identity.toUint8Array()
```

## Constraints

### Maximum Limits

- **Field Count**: Limited by VarInt encoding (practical limit: 2^53-1)
- **String Length**: Limited by VarInt encoding and memory
- **Nesting Depth**: Limited by JavaScript call stack (~1000-10000 levels)
- **Array Length**: Limited by VarInt encoding

### Unsupported Types

The following JavaScript types are NOT supported:
- `undefined`
- `null` (must be represented differently)
- `Symbol`
- `Function`
- Circular references

## Performance Characteristics

### Complexity
```
Time Complexity:  O(n log n) due to field sorting
Space Complexity: O(n) for output buffer

Where n = total data size
```

### Optimization
- Pre-calculate lengths to enable single-allocation assembly
- Single-pass writing after sorting
- No re-scanning required

## Error Conditions

### Unsupported Types
```javascript
fromObject(undefined)  → Error
fromObject(null)       → Error
fromObject(Symbol())   → Error
fromObject(() => {})   → Error
```

### Circular References
```javascript
const obj = {};
obj.self = obj;
fromObject(obj)  → Error: Circular reference detected
```

## Relationship to Deserialization

This function is the inverse of `toObject()`:
```javascript
const original = { name: "Alice", age: 30 };
const serialized = fromObject(original);
const deserialized = toObject(serialized.value);
// deserialized.value deep equals original
```

## Cross-Platform Compatibility

The binary format is:
- Language-agnostic
- Platform-independent
- Endianness-neutral (uses variable-length encoding)
- Compatible with Protocol Buffers varint encoding
