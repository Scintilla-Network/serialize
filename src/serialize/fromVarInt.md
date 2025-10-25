# fromVarInt

## Overview
The `fromVarInt` function serializes JavaScript numbers into variable-length integer (VarInt) format following the Scintilla Network protocol. VarInt encoding provides compact representation for integers, using fewer bytes for smaller values.

## Protocol Structure

### Byte Layout
```
[VARINT_BYTES]
```

Variable-length encoding: 1-8 bytes depending on value magnitude.

### Binary Format

```
Each byte:
┌─┬─┬─┬─┬─┬─┬─┬─┐
│C│ Data (7b)  │
└─┴─┴─┴─┴─┴─┴─┴─┘
 │ └────┬──────┘
 │      └─ Value bits (7 bits)
 └──────── Continuation bit (0=last byte, 1=more bytes)
```

### Multi-byte Structure

```
 Byte 0        Byte 1        Byte 2        Byte N
┌─┬──────┐   ┌─┬──────┐   ┌─┬──────┐   ┌─┬──────┐
│1│ 7bit │   │1│ 7bit │   │1│ 7bit │...│0│ 7bit │
└─┴──────┘   └─┴──────┘   └─┴──────┘   └─┴──────┘
  LSB          ↑             ↑             MSB
  First        More          More          Last
```

### Byte Count by Value Range

| Value Range        | Bytes | Representation                    |
|-------------------|-------|-----------------------------------|
| 0 - 127           | 1     | 0xxxxxxx                         |
| 128 - 16,383      | 2     | 1xxxxxxx 0xxxxxxx                |
| 16,384 - 2,097,151 | 3    | 1xxxxxxx 1xxxxxxx 0xxxxxxx       |
| 2^21 - 2^28-1     | 4     | 4 bytes                          |
| 2^28 - 2^35-1     | 5     | 5 bytes                          |
| 2^35 - 2^42-1     | 6     | 6 bytes                          |
| 2^42 - 2^49-1     | 7     | 7 bytes                          |
| 2^49 - 2^53-1     | 8     | 8 bytes (JS safe integer limit)  |

## Encoding Process

### Step-by-Step Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. Validate input                                        │
│    ├─ Check: is a number                                │
│    ├─ Check: is an integer (no decimals)                │
│    ├─ Check: is non-negative                            │
│    └─ Check: is safe integer (≤ 2^53-1)                 │
├─────────────────────────────────────────────────────────┤
│ 2. For each 7-bit group (LSB first):                    │
│    ├─ Take lower 7 bits (value & 0x7F)                  │
│    ├─ If more bits remain: set bit 7 (OR 0x80)          │
│    ├─ If last byte: leave bit 7 clear                   │
│    └─ Shift value right 7 bits (value >> 7)             │
├─────────────────────────────────────────────────────────┤
│ 3. Special case: zero                                    │
│    └─ If no bytes yet: output single 0x00 byte          │
├─────────────────────────────────────────────────────────┤
│ 4. Return result                                         │
│    ├─ value: Uint8Array with varint bytes              │
│    └─ length: number of bytes used                      │
└─────────────────────────────────────────────────────────┘
```

### Encoding Algorithm

```javascript
function encodeVarInt(value) {
  const result = [];
  
  while (value > 0) {
    // Take lower 7 bits
    let byte = value & 0x7F;
    
    // Shift value right 7 bits
    value = value >> 7;
    
    // If more bytes needed, set continuation bit
    if (value > 0) {
      byte = byte | 0x80;
    }
    
    // Add byte to result
    result.push(byte);
  }
  
  // Special case: zero
  if (result.length === 0) {
    result.push(0x00);
  }
  
  return new Uint8Array(result);
}
```

## Examples

### Single Byte Values (0-127)

#### Zero
```
Input:  0
Binary: 00000000
Output: 0x00

Breakdown:
┌─┬───────┐
│0│0000000│ ← Continuation bit = 0 (last byte)
└─┴───────┘   Value = 0
```

#### Value: 1
```
Input:  1
Binary: 00000001
Output: 0x01

Breakdown:
┌─┬───────┐
│0│0000001│
└─┴───────┘
  Value = 1
```

#### Value: 42
```
Input:  42
Output: 0x2A

Binary: 00101010 (single byte, < 128)
```

#### Value: 127 (Maximum 1-byte)
```
Input:  127
Binary: 01111111
Output: 0x7F

Breakdown:
┌─┬───────┐
│0│1111111│ ← All 7 data bits set
└─┴───────┘   Value = 127
```

### Two Byte Values (128-16,383)

#### Value: 128
```
Input:  128
Binary: 10000000 00000001
Output: 0x80 0x01

Byte-by-Byte:
Byte 0:
┌─┬───────┐
│1│0000000│ ← Continuation = 1 (more bytes)
└─┴───────┘   Lower 7 bits = 0

Byte 1:
┌─┬───────┐
│0│0000001│ ← Continuation = 0 (last byte)
└─┴───────┘   Upper 7 bits = 1

Calculation: (0 × 1) + (1 × 128) = 128
```

#### Value: 300
```
Input:  300
Binary: 10101100 00000010
Output: 0xAC 0x02

Breakdown:
300 = 256 + 44
    = (2 × 128) + 44

Byte 0: 44 | 0x80 = 0xAC (10101100)
        └─ Lower 7 bits   └─ Continuation bit

Byte 1: 2 | 0x00 = 0x02 (00000010)
        └─ Upper 7 bits   └─ Last byte
```

#### Value: 1000
```
Input:  1000
Output: 0xE8 0x07

Calculation:
1000 = 7×128 + 104
Byte 0: 104 | 0x80 = 0xE8
Byte 1: 7 | 0x00 = 0x07
```

### Three Byte Values

#### Value: 16,384
```
Input:  16384
Binary: 10000000 10000000 00000001
Output: 0x80 0x80 0x01

Byte-by-Byte:
Byte 0: 0x80 (10000000) ← Lower 7 bits = 0, continue
Byte 1: 0x80 (10000000) ← Next 7 bits = 0, continue  
Byte 2: 0x01 (00000001) ← Upper bits = 1, last

Calculation: (0 × 1) + (0 × 128) + (1 × 16384) = 16384
```

#### Value: 1,000,000
```
Input:  1000000
Output: 0xC0 0xC4 0x3D

3 bytes (value in range 2^14 to 2^21)
```

### Bit Manipulation Example

Encoding 300 step-by-step:

```
Step 1: 300 in binary
  300 = 0000000100101100 (16 bits)

Step 2: Split into 7-bit groups (LSB first)
  Group 0: 0101100 (44 decimal)
  Group 1: 0000010 (2 decimal)

Step 3: Add continuation bits
  Byte 0: 1_0101100 = 0xAC (more bytes follow)
  Byte 1: 0_0000010 = 0x02 (last byte)

Result: 0xAC 0x02
```

## Test Vectors

### Edge Cases

```
Minimum Value:
  0 → 00
  Length: 1 byte

Maximum 1-byte:
  127 → 7F
  Length: 1 byte

Minimum 2-byte:
  128 → 80 01
  Length: 2 bytes

Maximum 2-byte:
  16383 → FF 7F
  Length: 2 bytes

Minimum 3-byte:
  16384 → 80 80 01
  Length: 3 bytes
```

### Powers of 2

```
2^0  = 1          → 01
2^1  = 2          → 02
2^2  = 4          → 04
2^3  = 8          → 08
2^4  = 16         → 10
2^5  = 32         → 20
2^6  = 64         → 40
2^7  = 128        → 80 01
2^8  = 256        → 80 02
2^10 = 1024       → 80 08
2^14 = 16384      → 80 80 01
2^20 = 1048576    → 80 80 40
```

### Common Numbers

```
10      → 0A
100     → 64
1000    → E8 07
10000   → 90 4E
100000  → A0 8D 06
1000000 → C0 C4 3D
```

## Constraints and Limits

### Value Range

**JavaScript Number:**
- Minimum: 0
- Maximum: 2^53-1 (9,007,199,254,740,991)
- Safe integer range only

**VarInt Encoding:**
- Theoretically supports up to 2^64-1
- Limited by JavaScript Number precision

### Invalid Inputs

```javascript
fromVarInt(-1)        → Error (negative not supported)
fromVarInt(1.5)       → Error (non-integer)
fromVarInt(2**54)     → Error (exceeds safe integer)
fromVarInt(NaN)       → Error (not a number)
fromVarInt(Infinity)  → Error (not finite)
```

## Performance Characteristics

### Complexity

```
Time Complexity:  O(log n) where n = value
                  (proportional to number of bytes)
Space Complexity: O(log n) for output buffer
```

### Efficiency Comparison

| Value  | Fixed 32-bit | Fixed 64-bit | VarInt | Savings |
|--------|--------------|--------------|--------|---------|
| 1      | 4 bytes      | 8 bytes      | 1 byte | 75-87%  |
| 100    | 4 bytes      | 8 bytes      | 1 byte | 75-87%  |
| 1000   | 4 bytes      | 8 bytes      | 2 bytes| 50-75%  |
| 10000  | 4 bytes      | 8 bytes      | 2 bytes| 50-75%  |
| 1000000| 4 bytes      | 8 bytes      | 3 bytes| 25-62%  |

**Conclusion**: VarInt is highly efficient for values < 16,384 (most common case).

## Return Value

```javascript
{
    value: Uint8Array,    // VarInt-encoded bytes
    length: number        // Number of bytes (1-8)
}
```

## Usage

### Basic Usage

```javascript
import { fromVarInt } from './fromVarInt.js';

const result = fromVarInt(300);
// result.value: Uint8Array [172, 2]  (0xAC, 0x02)
// result.length: 2
```

### Array of Integers

```javascript
const numbers = [1, 10, 100, 1000];
const encoded = numbers.map(n => fromVarInt(n));

// Efficient: small numbers use 1 byte each
```

### Integration with Objects

```javascript
// VarInt used as object field value
const obj = { count: 42, total: 1000 };
// When serialized:
// - count: TYPE_BYTE 0x51 + fromVarInt(42)
// - total: TYPE_BYTE 0x51 + fromVarInt(1000)
```

## Error Handling

### Invalid Input Type
```
Input:  "42"
Error:  TypeError: Input must be a number
Fix:    fromVarInt(Number("42"))
```

### Non-Integer
```
Input:  42.5
Error:  RangeError: Input must be an integer
Fix:    fromVarInt(Math.floor(42.5))
```

### Negative Value
```
Input:  -1
Error:  RangeError: Input must be non-negative
Fix:    Use absolute value or different encoding
```

### Unsafe Integer
```
Input:  9007199254740992 (2^53)
Error:  RangeError: Input exceeds safe integer range
Fix:    Use fromVarBigInt() for values > 2^53-1
```

## Relationship to Deserialization

This function is the inverse of `toVarInt()`:
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

### Protocol Buffers

This implementation is **compatible** with Protocol Buffers varint encoding:
- Same bit-level format
- Same byte ordering
- Interoperable with protobuf libraries

### Cross-Platform

VarInt encoding works across:
- Different endianness (little/big endian)
- 32-bit and 64-bit systems
- All programming languages
