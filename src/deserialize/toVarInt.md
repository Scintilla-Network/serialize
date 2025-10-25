# toVarInt

## Overview
The `toVarInt` function deserializes variable-length integer (VarInt) byte sequences back into JavaScript numbers. It reverses the process performed by `fromVarInt()`.

## Protocol Structure

### Input Format
```
[VARINT_BYTES]
```

Variable-length encoding: 1-8 bytes depending on value.

### Byte Structure
```
Each byte:
┌─┬─┬─┬─┬─┬─┬─┬─┐
│C│ Data (7b)  │
└─┴─┴─┴─┴─┴─┴─┴─┘
 │ └────┬──────┘
 │      └─ Value bits (7 bits)
 └──────── Continuation bit (0=last byte, 1=more bytes)
```

## Deserialization Process

### Step-by-Step Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. Initialize accumulator                                │
│    ├─ result = 0                                        │
│    ├─ shift = 0                                         │
│    └─ bytesRead = 0                                     │
├─────────────────────────────────────────────────────────┤
│ 2. Read bytes while continuation bit set                │
│    For each byte:                                        │
│    ├─ Extract value bits (lower 7 bits)                │
│    ├─ result |= (valueBits << shift)                   │
│    ├─ shift += 7                                        │
│    ├─ bytesRead++                                       │
│    └─ Check continuation bit (bit 7)                    │
├─────────────────────────────────────────────────────────┤
│ 3. Validate result                                       │
│    ├─ result <= Number.MAX_SAFE_INTEGER                │
│    └─ No overlong encoding                              │
├─────────────────────────────────────────────────────────┤
│ 4. Return result                                         │
│    ├─ value: decoded number                             │
│    └─ length: bytesRead                                 │
└─────────────────────────────────────────────────────────┘
```

### Decoding Algorithm

```javascript
function decodeVarInt(bytes) {
  let result = 0;
  let shift = 0;
  let bytesRead = 0;
  
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    bytesRead++;
    
    // Extract lower 7 bits
    const value = byte & 0x7F;
    
    // Add to result with shift
    result |= (value << shift);
    
    // Check continuation bit
    if ((byte & 0x80) === 0) {
      // Last byte reached
      break;
    }
    
    // Prepare for next byte
    shift += 7;
    
    // Safety check
    if (shift > 63) {
      throw new Error('Varint too long');
    }
  }
  
  // Validate safe integer
  if (!Number.isSafeInteger(result)) {
    throw new RangeError('Value exceeds safe integer');
  }
  
  return { value: result, length: bytesRead };
}
```

## Examples

### Single Byte Values

#### Zero
```
Input bytes: 00

Decoding:
Byte 0: 0x00 (00000000)
  ├─ Value bits: 0000000 = 0
  └─ Continuation: 0 (last byte)

result = 0

Return: { value: 0, length: 1 }
```

#### Value: 42
```
Input bytes: 2A

Decoding:
Byte 0: 0x2A (00101010)
  ├─ Value bits: 0101010 = 42
  └─ Continuation: 0 (last byte)

result = 42

Return: { value: 42, length: 1 }
```

#### Value: 127
```
Input bytes: 7F

Decoding:
Byte 0: 0x7F (01111111)
  ├─ Value bits: 1111111 = 127
  └─ Continuation: 0 (last byte)

result = 127

Return: { value: 127, length: 1 }
```

### Two Byte Values

#### Value: 128
```
Input bytes: 80 01

Decoding:
Byte 0: 0x80 (10000000)
  ├─ Value bits: 0000000 = 0
  ├─ Continuation: 1 (more bytes)
  └─ result = 0 << 0 = 0

Byte 1: 0x01 (00000001)
  ├─ Value bits: 0000001 = 1
  ├─ Continuation: 0 (last byte)
  └─ result = 0 | (1 << 7) = 128

Return: { value: 128, length: 2 }
```

#### Value: 300
```
Input bytes: AC 02

Decoding:
Byte 0: 0xAC (10101100)
  ├─ Value bits: 0101100 = 44
  ├─ Continuation: 1
  └─ result = 44

Byte 1: 0x02 (00000010)
  ├─ Value bits: 0000010 = 2
  ├─ Continuation: 0
  └─ result = 44 | (2 << 7) = 44 + 256 = 300

Return: { value: 300, length: 2 }
```

### Three Byte Values

#### Value: 16384
```
Input bytes: 80 80 01

Decoding:
Byte 0: 0x80
  result = 0

Byte 1: 0x80
  result = 0 | (0 << 7) = 0

Byte 2: 0x01
  result = 0 | (1 << 14) = 16384

Return: { value: 16384, length: 3 }
```

### Maximum Safe Integer

```
Input bytes: FF FF FF FF FF FF FF 7F

Decoding: (8 bytes)
Byte 0-6: All 0xFF (continuation set, all value bits 1)
Byte 7: 0x7F (last byte, all value bits 1)

result = 9007199254740991 (2^53 - 1)

Return: { value: 9007199254740991, length: 8 }
```

## Example Trace: Decode 300

```
Input: AC 02

Iteration 1:
  byte = 0xAC = 10101100
  value = 0xAC & 0x7F = 0x2C = 44
  result = 0 | (44 << 0) = 44
  continuation = 0xAC & 0x80 = 0x80 (set)
  shift = 7
  continue...

Iteration 2:
  byte = 0x02 = 00000010
  value = 0x02 & 0x7F = 0x02 = 2
  result = 44 | (2 << 7) = 44 | 256 = 300
  continuation = 0x02 & 0x80 = 0x00 (clear)
  stop

Return: { value: 300, length: 2 }
```

## Error Handling

### Empty Buffer

```
┌────────────────────────────────────────────────────────────┐
│ ERROR: Empty buffer                                        │
│ ───────────────────────────────────────────────────────────│
│ Input:  [] (no bytes)                                     │
│ Message: "Cannot decode varint from empty buffer"         │
│ Cause: No data provided                                    │
│ Action: Verify buffer is not empty                        │
└────────────────────────────────────────────────────────────┘
```

### Truncated VarInt

```
┌────────────────────────────────────────────────────────────┐
│ ERROR: Truncated varint                                    │
│ ───────────────────────────────────────────────────────────│
│ Input:  80 (continuation set, but no more bytes)          │
│ Message: "Truncated varint: continuation bit set but       │
│          no more bytes available"                          │
│ Cause: Incomplete transmission or corruption               │
│ Action: Verify complete data received                      │
└────────────────────────────────────────────────────────────┘
```

### Value Overflow

```
┌────────────────────────────────────────────────────────────┐
│ ERROR: Value exceeds safe integer                          │
│ ───────────────────────────────────────────────────────────│
│ Input:  80 80 80 80 80 80 80 80 80 01 (2^63)             │
│ Message: "Varint value exceeds MAX_SAFE_INTEGER"          │
│ Cause: Value too large for JavaScript Number              │
│ Action: Use toVarBigInt() instead                         │
└────────────────────────────────────────────────────────────┘
```

### Too Many Bytes

```
┌────────────────────────────────────────────────────────────┐
│ ERROR: Varint too long                                     │
│ ───────────────────────────────────────────────────────────│
│ Input:  80 80 80 80 80 80 80 80 80 80 01... (11+ bytes)  │
│ Message: "Varint encoding exceeds maximum length"         │
│ Cause: Malformed or malicious input                       │
│ Action: Reject and validate data source                   │
└────────────────────────────────────────────────────────────┘
```

## Performance Characteristics

### Complexity

```
Time Complexity:  O(1) to O(log n)
                  - Constant for values < 128
                  - Logarithmic for larger values
                  - Maximum 10 iterations

Space Complexity: O(1) constant space
```

### Optimization Notes

- **Early Exit**: Stops at first byte with continuation bit clear
- **Bit Operations**: Fast bitwise AND, OR, shift
- **No Allocation**: Operates on primitive number

## Usage Examples

### Basic Usage

```javascript
import { toVarInt } from './toVarInt.js';

const bytes = new Uint8Array([0xAC, 0x02]);
const result = toVarInt(bytes);
// result.value: 300
// result.length: 2
```

### Stream Parsing

```javascript
const buffer = new Uint8Array([...]);
let offset = 0;

// Parse first varint
const num1 = toVarInt(buffer.subarray(offset));
offset += num1.length;

// Parse second varint
const num2 = toVarInt(buffer.subarray(offset));
offset += num2.length;
```

### Integration with Objects

```javascript
// VarInt from object field value
// Input: TYPE_BYTE 0x51 + varint bytes

// Skip type byte
const num = toVarInt(bytes.subarray(1));
```

## Test Vectors

### Single Byte
```
00 → 0
01 → 1
0A → 10
2A → 42
64 → 100
7F → 127
```

### Two Bytes
```
80 01 → 128
80 02 → 256
E8 07 → 1000
FF 7F → 16383
```

### Three Bytes
```
80 80 01 → 16384
A0 8D 06 → 100000
FF FF 7F → 2097151
```

### Edge Cases
```
Maximum safe integer:
  FF FF FF FF FF FF FF 7F → 9007199254740991

Powers of 2:
  80 01       → 128 (2^7)
  80 80 01    → 16384 (2^14)
  80 80 80 01 → 2097152 (2^21)
```

## Return Value

```javascript
{
    value: number,     // Decoded integer
    length: number     // Bytes consumed (1-8)
}
```

## Common Issues

### Precision Loss

```javascript
// These look the same but differ
const a = 9007199254740992;     // 2^53 (unsafe)
const b = 9007199254740993;     // 2^53 + 1 (unsafe)

console.log(a === b);  // true! (precision lost)

// Always check:
Number.isSafeInteger(value)
```

### Debugging Malformed VarInts

```
Tools:
1. Hex dump the bytes
2. Check each byte's continuation bit
3. Verify last byte has bit 7 clear
4. Calculate expected value manually

Example:
  Bytes: 80 80
  Problem: Both have continuation set, but buffer ends
  Fix: Missing final byte
```

## Relationship to Serialization

This function is the inverse of `fromVarInt()`:
```javascript
const original = 300;
const serialized = fromVarInt(original);
const deserialized = toVarInt(serialized.value);
// deserialized.value === original
```

### Round-Trip Example

```javascript
// Serialize
const num = 1000;
const encoded = fromVarInt(num);
// encoded.value: Uint8Array [232, 7]

// Deserialize
const decoded = toVarInt(encoded.value);
// decoded.value: 1000

// Verify
console.assert(num === decoded.value); // ✓ Passes
```

## Cross-Platform Compatibility

Fully compatible with Protocol Buffers varint:
- Same decoding algorithm
- Same byte format
- Interoperable

### JavaScript Number Limitations

```
Safe Range: -(2^53-1) to (2^53-1)

This implementation: 0 to 2^53-1 (unsigned only)

For larger values: Use toVarBigInt()
For negative values: Not supported (use signed varint variant)
```
