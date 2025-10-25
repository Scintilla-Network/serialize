# toObject

## Overview
The `toObject` function serves as the universal deserialization entry point for converting Scintilla Network binary data back into JavaScript structures. It handles objects, arrays, and primitives, reversing the process performed by `fromObject()`.

## Protocol Structure

### Supported Output Types

```
toObject() handles:
├─ Objects: Packed object structures (KIND 0x17)
├─ Arrays: Packed array structures (KIND 0x18)
└─ Primitives: Network primitives (other KIND values)
```

### Type Detection Flow

```
Input Kind Detection:
├─ KIND = 0x17 (PACKEDOBJECT)? → deserializeObject()
├─ KIND = 0x18 (PACKEDARRAY)? → deserializeArray()
├─ KIND in NET_KINDS_ARRAY? → Use kindToConstructor()
└─ Otherwise → Error: Unknown kind
```

## Object Deserialization

### Expected Byte Layout
```
[KIND][OBJECT_TOTAL_LENGTH][FIELD_NAMES_LENGTH][FIELD_VALUES_LENGTH][FIELD_NAMES_SECTION][FIELD_VALUES_SECTION]
```

### Field Specifications

#### 1. KIND (1 byte)
- **Expected Value**: `0x17` (23 decimal)
- **Constant**: `NET_KINDS.PACKEDOBJECT`
- **Validation**: Must match expected kind or throw error

#### 2. OBJECT_TOTAL_LENGTH (Variable length)
- **Format**: VarInt encoding
- **Purpose**: Sum of FIELD_NAMES_LENGTH + FIELD_VALUES_LENGTH
- **Includes**: Length prefix bytes themselves

#### 3. FIELD_NAMES_LENGTH (Variable length)
- **Format**: VarInt encoding
- **Purpose**: Byte length of entire FIELD_NAMES_SECTION

#### 4. FIELD_VALUES_LENGTH (Variable length)
- **Format**: VarInt encoding
- **Purpose**: Byte length of entire FIELD_VALUES_SECTION

#### 5. FIELD_NAMES_SECTION
```
[FIELD_COUNT][NAME_1_LENGTH][NAME_1_BYTES]...[NAME_N_LENGTH][NAME_N_BYTES]
```

- **FIELD_COUNT**: VarInt-encoded number of fields
- **Each name**: LENGTH (varint) + UTF-8 bytes
- **Order**: Alphabetically sorted

#### 6. FIELD_VALUES_SECTION
```
[FIELD_COUNT][TYPE_BYTE][VALUE_DATA]...[TYPE_BYTE][VALUE_DATA]
```

- **FIELD_COUNT**: VarInt-encoded number of values (must match names count)
- **Each value**: TYPE_BYTE + serialized value
- **Order**: Same order as field names

### Type Byte Mappings

| Hex Value | Type | Description |
|-----------|------|-------------|
| 0x50 | String | UTF-8 encoded string |
| 0x51 | VarInt | Variable-length integer |
| 0x52 | BigInt | Variable-length big integer |
| 0x53 | Array | Nested array (recursive) |
| 0x54 | Object | Nested object |
| 0x55 | Boolean | Single byte boolean |

## Array Deserialization

### Expected Byte Layout
```
[KIND][ITEM_COUNT][ITEMS_BYTES_LENGTH][ITEMS_SECTION]
```

### Field Specifications

#### 1. KIND (1 byte)
- **Expected Value**: `0x18` (24 decimal)
- **Constant**: `NET_KINDS.PACKEDARRAY`

#### 2. ITEM_COUNT (Variable length)
- **Format**: VarInt encoding
- **Purpose**: Number of items in the array

#### 3. ITEMS_BYTES_LENGTH (Variable length)
- **Format**: VarInt encoding
- **Purpose**: Total byte length of all items

#### 4. ITEMS_SECTION
```
[TYPE_BYTE][VALUE_DATA]...[TYPE_BYTE][VALUE_DATA]
```

- **Each item**: TYPE_BYTE + serialized value
- **Order**: Array index order (0, 1, 2, ...)

## Deserialization Process

### Object Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. Read KIND byte (must be 0x17)                        │
├─────────────────────────────────────────────────────────┤
│ 2. Read OBJECT_TOTAL_LENGTH (varint)                    │
├─────────────────────────────────────────────────────────┤
│ 3. Read FIELD_NAMES_LENGTH (varint)                     │
├─────────────────────────────────────────────────────────┤
│ 4. Read FIELD_VALUES_LENGTH (varint)                    │
├─────────────────────────────────────────────────────────┤
│ 5. Parse FIELD_NAMES_SECTION                            │
│    ├─ Read FIELD_COUNT                                  │
│    └─ For each field:                                   │
│       ├─ Read STRING_LENGTH (varint)                    │
│       └─ Read UTF8_BYTES                                │
├─────────────────────────────────────────────────────────┤
│ 6. Validate FIELD_NAMES_LENGTH matches consumed bytes   │
├─────────────────────────────────────────────────────────┤
│ 7. Parse FIELD_VALUES_SECTION                           │
│    ├─ Read FIELD_COUNT (must match names count)         │
│    └─ For each value:                                   │
│       ├─ Read TYPE_BYTE (0x50-0x55)                     │
│       └─ Deserialize value based on type                │
├─────────────────────────────────────────────────────────┤
│ 8. Validate FIELD_VALUES_LENGTH matches consumed bytes  │
├─────────────────────────────────────────────────────────┤
│ 9. Construct JavaScript object                          │
│    └─ Combine field names and values in order          │
├─────────────────────────────────────────────────────────┤
│ 10. Return {value: object, length: totalBytesConsumed}  │
└─────────────────────────────────────────────────────────┘
```

### Array Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. Read KIND byte (must be 0x18)                        │
├─────────────────────────────────────────────────────────┤
│ 2. Read ITEM_COUNT (varint)                             │
├─────────────────────────────────────────────────────────┤
│ 3. Read ITEMS_BYTES_LENGTH (varint)                     │
├─────────────────────────────────────────────────────────┤
│ 4. Parse ITEMS_SECTION                                  │
│    └─ For each item (ITEM_COUNT times):                 │
│       ├─ Read TYPE_BYTE                                 │
│       └─ Deserialize value based on type                │
├─────────────────────────────────────────────────────────┤
│ 5. Construct JavaScript array                           │
├─────────────────────────────────────────────────────────┤
│ 6. Return {value: array, length: totalBytesConsumed}    │
└─────────────────────────────────────────────────────────┘
```

## Examples

### Simple Object Deserialization

**Input Bytes:**
```
17 21 1A 07 02 05 63 6F 75 6E 74 04 6E 61 6D 65 02 51 2A 50 05 41 6C 69 63 65
```

**Step-by-Step Parsing:**

```
Step 1: Read KIND
Offset  Value  Description
------  -----  -----------
0x00    0x17   KIND = PACKEDOBJECT ✓

Step 2: Read Lengths
0x01    0x21   OBJECT_TOTAL_LENGTH = 33 bytes
0x02    0x1A   FIELD_NAMES_LENGTH = 26 bytes
0x03    0x07   FIELD_VALUES_LENGTH = 7 bytes

Step 3: Parse Field Names (starts at 0x04, length 26)
0x04    0x02   FIELD_COUNT = 2 fields

  Field 0:
  0x05    0x05   STRING_LENGTH = 5
  0x06-0A        'count' (63 6F 75 6E 74)

  Field 1:
  0x0B    0x04   STRING_LENGTH = 4
  0x0C-0F        'name' (6E 61 6D 65)

Validation: Consumed 26 bytes ✓ (matches FIELD_NAMES_LENGTH)

Step 4: Parse Field Values (starts at 0x10, length 7)
0x10    0x02   FIELD_COUNT = 2 fields

  Value 0 (for 'count'):
  0x11    0x51   TYPE = VarInt
  0x12    0x2A   VALUE = 42

  Value 1 (for 'name'):
  0x13    0x50   TYPE = String
  0x14    0x05   STRING_LENGTH = 5
  0x15-19        'Alice' (41 6C 69 63 65)

Validation: Consumed 7 bytes ✓ (matches FIELD_VALUES_LENGTH)

Step 5: Construct Object
Result: { count: 42, name: "Alice" }

Step 6: Calculate Total Length
Total = 1 (KIND) + 1 (obj_len) + 1 (names_len) + 1 (vals_len) + 26 (names) + 7 (vals)
      = 37 bytes

Return: { value: { count: 42, name: "Alice" }, length: 37 }
```

### Simple Array Deserialization

**Input Bytes:**
```
18 03 0B 51 01 50 05 68 65 6C 6C 6F 55 01
```

**Step-by-Step Parsing:**

```
Step 1: Read KIND
0x00    0x18   KIND = PACKEDARRAY ✓

Step 2: Read Counts
0x01    0x03   ITEM_COUNT = 3 items
0x02    0x0B   ITEMS_BYTES_LENGTH = 11 bytes

Step 3: Parse Items (starts at 0x03, length 11)
  
  Item 0:
  0x03    0x51   TYPE = VarInt
  0x04    0x01   VALUE = 1

  Item 1:
  0x05    0x50   TYPE = String
  0x06    0x05   STRING_LENGTH = 5
  0x07-0B        'hello' (68 65 6C 6C 6F)

  Item 2:
  0x0C    0x55   TYPE = Boolean
  0x0D    0x01   VALUE = true

Step 4: Construct Array
Result: [1, "hello", true]

Step 5: Calculate Total Length
Total = 1 (KIND) + 1 (count) + 1 (bytes_len) + 11 (items)
      = 14 bytes

Return: { value: [1, "hello", true], length: 14 }
```

### Nested Structure Deserialization

**Input:**
```javascript
// Bytes representing:
{
  user: { id: 1, active: true },
  count: 5
}
```

**Key Steps:**

```
1. Outer Object Deserialization
   ├─ KIND: 0x17 (PACKEDOBJECT)
   ├─ Fields: "count", "user" (alphabetically sorted)
   └─ Values: 5, [nested object]

2. When TYPE_BYTE = 0x54 (nested object):
   ├─ Read nested object length: 26 bytes
   ├─ Extract next 26 bytes
   ├─ Recursively call deserializeObject() on extracted bytes
   └─ Assign result to field

3. Nested Object Deserialization (recursive call)
   ├─ KIND: 0x17 (PACKEDOBJECT)
   ├─ Fields: "active", "id"
   ├─ Values: true, 1
   └─ Return nested object

4. Final Result:
   {
     count: 5,
     user: { active: true, id: 1 }
   }
```

## Validation

### Mandatory Checks

```
Pre-Deserialization:
├─ Sufficient bytes available?
├─ KIND byte valid?
└─ Length fields reasonable?

During Deserialization:
├─ FIELD_COUNT matches between names and values?
├─ TYPE_BYTE recognized (0x50-0x55)?
├─ String UTF-8 valid?
├─ VarInt/VarBigInt encodings valid?
└─ Nested structures well-formed?

Post-Deserialization:
├─ FIELD_NAMES_LENGTH matches consumed bytes?
├─ FIELD_VALUES_LENGTH matches consumed bytes?
└─ OBJECT_TOTAL_LENGTH consistent?
```

## Error Conditions

### Invalid KIND

```
┌────────────────────────────────────────────────────────────┐
│ ERROR: Invalid KIND                                        │
│ ───────────────────────────────────────────────────────────│
│ Message: "Invalid kind: {value} - Expected PACKEDOBJECT    │
│          (23), got {actual}"                               │
│ Cause: First byte is not 0x17 or 0x18                     │
│ Action: Check byte stream alignment                        │
└────────────────────────────────────────────────────────────┘
```

### Field Count Mismatch

```
┌────────────────────────────────────────────────────────────┐
│ ERROR: Field Count Mismatch                                │
│ ───────────────────────────────────────────────────────────│
│ Message: "Field count mismatch: names={n}, values={m}"     │
│ Cause: FIELD_COUNT differs between names and values        │
│ Action: Verify serialization produced matching counts      │
└────────────────────────────────────────────────────────────┘
```

### Length Mismatch

```
┌────────────────────────────────────────────────────────────┐
│ ERROR: Length Mismatch                                     │
│ ───────────────────────────────────────────────────────────│
│ Message: "Field names length mismatch: expected {n},       │
│          got {m}"                                          │
│ Cause: Declared length doesn't match consumed bytes        │
│ Action: Check for truncated data or incorrect lengths      │
└────────────────────────────────────────────────────────────┘
```

### Unsupported Type

```
┌────────────────────────────────────────────────────────────┐
│ ERROR: Unsupported Type                                    │
│ ───────────────────────────────────────────────────────────│
│ Message: "Unsupported field type: {type}"                  │
│ Cause: TYPE_BYTE not in range 0x50-0x55                   │
│ Action: Check for version mismatch or data corruption      │
└────────────────────────────────────────────────────────────┘
```

### Insufficient Bytes

```
┌────────────────────────────────────────────────────────────┐
│ ERROR: Insufficient Bytes                                  │
│ ───────────────────────────────────────────────────────────│
│ Message: "Unexpected end of data"                          │
│ Cause: Input buffer exhausted before parsing complete      │
│ Action: Verify complete byte stream received               │
└────────────────────────────────────────────────────────────┘
```

## Test Vectors

### Empty Object
```
Input:  17 06 02 02 00 00
Output: {}
Length: 6 bytes

Validation Points:
✓ KIND = 0x17
✓ OBJECT_TOTAL_LENGTH = 6
✓ FIELD_NAMES_LENGTH = 2
✓ FIELD_VALUES_LENGTH = 2
✓ FIELD_COUNT (names) = 0
✓ FIELD_COUNT (values) = 0
```

### Empty Array
```
Input:  18 00 00
Output: []
Length: 3 bytes

Validation Points:
✓ KIND = 0x18
✓ ITEM_COUNT = 0
✓ ITEMS_BYTES_LENGTH = 0
```

### All Primitive Types
```
Input:  [Complete byte sequence with all types]

Output: {
  str: "test",
  num: 42,
  big: 1000n,
  bool: true,
  arr: [1, 2, 3],
  obj: { x: 1 }
}

Demonstrates: Complete type coverage
```

## Performance Characteristics

### Complexity

```
Time Complexity:
├─ Object: O(n) where n = total bytes
├─ Array: O(n) where n = total bytes
├─ Nested: O(n) where n = total bytes (recursive)
└─ No re-scanning required (single-pass)

Space Complexity:
├─ Output object: O(m) where m = number of fields/items
├─ Call stack: O(d) where d = nesting depth
└─ Temporary buffers: O(1) constant
```

### Optimization

- **Single-Pass Parsing**: No backtracking required
- **Offset Tracking**: Maintains running offset for sequential reading
- **Length Prefixes**: Enable direct buffer slicing for nested structures
- **Type Dispatch**: Direct function calls based on type byte

## Usage

### Basic Usage
```javascript
import { toObject } from './toObject.js';

const bytes = new Uint8Array([...]);
const result = toObject(bytes);
// result.value: { name: "Alice", age: 30 }
// result.length: total bytes consumed
```

### Stream Parsing
```javascript
const buffer = new Uint8Array([...]);
let offset = 0;

// Parse first value
const obj1 = toObject(buffer.subarray(offset));
offset += obj1.length;

// Parse second value
const obj2 = toObject(buffer.subarray(offset));
offset += obj2.length;
```

## Return Value

```javascript
{
  value: any,      // Deserialized JavaScript value (object/array/primitive)
  length: number   // Total bytes consumed from input buffer
}
```

**Purpose of `length` field:**
- Enables parsing multiple serialized values from single buffer
- Allows caller to verify all expected data was processed
- Supports stream parsing scenarios

## Common Issues

### Invalid KIND Error
```
Issue: "Invalid kind" error
├─ Check: Is buffer starting at correct offset?
├─ Check: Was data truncated during transmission?
└─ Fix: Ensure full serialized data received
```

### Field Count Mismatch
```
Issue: "Field count mismatch"
├─ Check: Did serialization complete successfully?
├─ Check: Was buffer modified after serialization?
└─ Fix: Re-serialize or use validated buffer
```

### Length Mismatch
```
Issue: "Length mismatch"
├─ Check: Are nested structures causing offset drift?
├─ Check: Did nested call consume correct bytes?
└─ Fix: Verify nested structure lengths
```

## Relationship to Serialization

This function is the inverse of `fromObject()`:
```javascript
const original = { name: "Alice", age: 30 };
const serialized = fromObject(original);
const deserialized = toObject(serialized.value);
// deserialized.value deep equals original
```

### Round-Trip Example
```javascript
// Serialize
const obj = { count: 42, items: [1, 2, 3] };
const encoded = fromObject(obj);

// Deserialize
const decoded = toObject(encoded.value);

// Verify
console.assert(JSON.stringify(obj) === JSON.stringify(decoded.value)); // ✓
```

## Cross-Platform Compatibility

The binary format is:
- Language-agnostic
- Platform-independent
- Endianness-neutral (uses variable-length encoding)
- Compatible with Protocol Buffers varint encoding
