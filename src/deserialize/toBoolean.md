# toBoolean

## Overview
The `toBoolean` function deserializes byte data back into JavaScript booleans following the Scintilla Network protocol. It reverses the process performed by `fromBoolean()`.

## Protocol Structure

### Input Format
```
[VALUE]
```

A single byte representing the boolean state.

### Decoding Rules

```
Current Implementation (Lenient):
  0x00 → false
  Any non-zero → true

Strict Interpretation:
  0x00 → false
  0x01 → true
  Other → Error
```

## Deserialization Process

### Step-by-Step Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. Validate input                                        │
│    └─ Check: buffer has at least 1 byte                │
├─────────────────────────────────────────────────────────┤
│ 2. Read single byte                                      │
│    └─ byte = input[0]                                   │
├─────────────────────────────────────────────────────────┤
│ 3. Interpret byte value                                  │
│    ├─ if byte === 0x00: result = false                 │
│    └─ else: result = true                              │
├─────────────────────────────────────────────────────────┤
│ 4. Return result                                         │
│    ├─ value: boolean                                    │
│    └─ length: 1 (always)                                │
└─────────────────────────────────────────────────────────┘
```

## Examples

### False Value

**Input:**
```
00
```

**Decoding:**
```
Byte: 0x00
Result: false

Return: { value: false, length: 1 }
```

### True Value

**Input:**
```
01
```

**Decoding:**
```
Byte: 0x01
Result: true

Return: { value: true, length: 1 }
```

### Non-Standard Values (Lenient Mode)

**Input:**
```
42
```

**Decoding:**
```
Byte: 0x42 (66 decimal)
Result: true (any non-zero → true)

Return: { value: true, length: 1 }
```

**Input:**
```
FF
```

**Decoding:**
```
Byte: 0xFF (255 decimal)
Result: true (any non-zero → true)

Return: { value: true, length: 1 }
```

### Boolean Array Context

**Input:**
```
Array bytes: ... 55 01 55 00 55 01 ...
```

**Decoding each:**
```
Position 0: TYPE_BYTE 0x55 (Boolean type)
Position 1: 0x01 → true
Position 2: TYPE_BYTE 0x55
Position 3: 0x00 → false
Position 4: TYPE_BYTE 0x55
Position 5: 0x01 → true

Result: [true, false, true]
```

## Decoding Algorithms

### Lenient Implementation (Current)

```javascript
function decodeBoolean(bytes) {
  // Validate input
  if (bytes.length === 0) {
    throw new Error('Empty buffer');
  }
  
  // Read first byte
  const byte = bytes[0];
  
  // Interpret: 0 = false, non-zero = true
  const value = byte !== 0x00;
  
  return { value, length: 1 };
}
```

### Strict Implementation (Alternative)

```javascript
function decodeBooleanStrict(bytes) {
  if (bytes.length === 0) {
    throw new Error('Empty buffer');
  }
  
  const byte = bytes[0];
  
  // Only accept 0x00 or 0x01
  if (byte !== 0x00 && byte !== 0x01) {
    throw new Error(`Invalid boolean: 0x${byte.toString(16)}`);
  }
  
  return { value: byte === 0x01, length: 1 };
}
```

## Validation

### Strict Mode Validation

```
Valid inputs:
  0x00 → false ✓
  0x01 → true ✓

Invalid inputs:
  0x02 → Error ✗
  0xFF → Error ✗
  
Strict mode ensures canonical encoding.
```

### Lenient Mode Validation

```
Valid inputs:
  0x00 → false ✓
  Any non-zero → true ✓

No invalid inputs (all bytes accepted).
```

### Buffer Validation

```
Must check:
✓ Buffer is not empty
✓ Buffer has at least 1 byte
```

## Error Handling

### Empty Buffer

```
┌────────────────────────────────────────────────────────────┐
│ ERROR: Empty buffer                                        │
│ ───────────────────────────────────────────────────────────│
│ Input:  []                                                 │
│ Message: "Cannot decode boolean from empty buffer"        │
│ Action: Verify buffer is not empty                        │
└────────────────────────────────────────────────────────────┘
```

### Invalid Value (Strict Mode Only)

```
┌────────────────────────────────────────────────────────────┐
│ ERROR: Invalid boolean value                               │
│ ───────────────────────────────────────────────────────────│
│ Input:  02                                                 │
│ Message: "Invalid boolean value: 0x02 (expected 0x00 or   │
│          0x01)"                                            │
│ Action: Check data integrity or use lenient mode          │
└────────────────────────────────────────────────────────────┘
```

## Performance Characteristics

### Complexity

```
Time Complexity:  O(1) constant time
                  (single byte read and comparison)

Space Complexity: O(1) constant space
                  (boolean result)
```

### Fastest Primitive

Boolean decoding is the fastest operation:
- Single byte read
- Single comparison
- No loops or calculations
- No memory allocation

## Validation Strategy

### Choose Based on Requirements

**Lenient Mode:**
- More forgiving
- Accepts any byte
- Backwards compatible
- Non-canonical encodings allowed

**Strict Mode:**
- Enforces canonical encoding
- Catches data corruption
- Explicit validation
- Less forgiving

## Usage Examples

### Basic Usage

```javascript
import { toBoolean } from './toBoolean.js';

// Decode false
const falseBytes = new Uint8Array([0x00]);
const result1 = toBoolean(falseBytes);
// result1.value: false
// result1.length: 1

// Decode true
const trueBytes = new Uint8Array([0x01]);
const result2 = toBoolean(trueBytes);
// result2.value: true
// result2.length: 1
```

### In Object Deserialization

```javascript
// Boolean field in object
// Format: TYPE_BYTE 0x55 + BOOLEAN_BYTE

const bytes = new Uint8Array([0x55, 0x01]);
// Skip type byte
const boolResult = toBoolean(bytes.subarray(1));
// boolResult.value: true
```

### In Array Deserialization

```javascript
// Array of booleans: [true, false, true]
// Format: Array header + (TYPE + BOOL) repeated

let offset = arrayHeaderLength;
const bools = [];

for (let i = 0; i < 3; i++) {
  // Skip type byte (0x55)
  offset += 1;
  // Read boolean
  const b = toBoolean(bytes.subarray(offset));
  bools.push(b.value);
  offset += b.length;
}
```

## Test Vectors

### Standard Values

```
Input:  00
Output: false
Length: 1

Input:  01
Output: true
Length: 1
```

### Lenient Mode Values

```
02 → true
0A → true
FF → true
80 → true
```

### Boolean Sequences

```
Multiple booleans in sequence:
  00 01 00 00 01
  
Decoded: false, true, false, false, true
```

## Return Value

```javascript
{
    value: boolean,    // Decoded boolean value
    length: number     // Always 1
}
```

## Common Pitfalls

### Assuming Numeric Value

```javascript
// WRONG: Treating boolean as number
const byte = bytes[0];
const num = byte;  // 0 or 1
// Lost boolean semantics

// CORRECT: Use proper deserialization
const bool = toBoolean(bytes);
const value = bool.value;  // true or false
```

### Ignoring Return Length

```javascript
// WRONG: Assuming offset
offset += 1;  // Hardcoded

// CORRECT: Use returned length
const result = toBoolean(bytes.subarray(offset));
offset += result.length;  // Always 1, but explicit
```

## Relationship to Serialization

This function is the inverse of `fromBoolean()`:
```javascript
const original = true;
const serialized = fromBoolean(original);
const deserialized = toBoolean(serialized.value);
// deserialized.value === original
```

### Round-Trip Example

```javascript
// Serialize
const bool1 = false;
const encoded = fromBoolean(bool1);
// encoded.value: Uint8Array [0]

// Deserialize
const decoded = toBoolean(encoded.value);
// decoded.value: false

// Verify
console.assert(bool1 === decoded.value); // ✓ Passes
```

## Cross-Platform Compatibility

Boolean encoding (0x00/0x01) is universal:
- All languages use similar convention
- Standard binary representation
- No endianness issues (single byte)
- No precision concerns
- Compatible with Protocol Buffers bool wire type
