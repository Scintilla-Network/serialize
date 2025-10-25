# fromVarBigInt

## Overview
The `fromVarBigInt` function serializes JavaScript BigInt values into variable-length integer format following the Scintilla Network protocol. VarBigInt extends VarInt encoding to support arbitrarily large integers beyond JavaScript's safe integer range (2^53-1).

## Protocol Structure

### Byte Layout
```
[VARBIGINT_BYTES]
```

Variable-length encoding: 1 to N bytes depending on value magnitude (theoretically unlimited).

### Binary Format

```
Each byte (identical to VarInt):
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

| Value Range     | Bytes | Binary Range              |
|-----------------|-------|---------------------------|
| 0 - 127         | 1     | 2^0 to 2^7-1             |
| 128 - 16,383    | 2     | 2^7 to 2^14-1            |
| 16,384 - 2M     | 3     | 2^14 to 2^21-1           |
| 2M - 256M       | 4     | 2^21 to 2^28-1           |
| 256M - 32B      | 5     | 2^28 to 2^35-1           |
| 32B - 4T        | 6     | 2^35 to 2^42-1           |
| 4T - 512T       | 7     | 2^42 to 2^49-1           |
| 512T - 64P      | 8     | 2^49 to 2^56-1           |
| 64P - 8E        | 9     | 2^56 to 2^63-1           |
| 8E+             | 10+   | 2^63 and beyond          |

## Encoding Process

### Step-by-Step Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. Validate input                                        │
│    ├─ Check: is a BigInt                                │
│    └─ Check: is non-negative                            │
├─────────────────────────────────────────────────────────┤
│ 2. For each 7-bit group (LSB first):                    │
│    ├─ Take lower 7 bits (value & 0x7Fn)                 │
│    ├─ If more bits remain: set bit 7 (OR 0x80)          │
│    ├─ If last byte: leave bit 7 clear                   │
│    └─ Shift value right 7 bits (value >> 7n)            │
├─────────────────────────────────────────────────────────┤
│ 3. Special case: zero                                    │
│    └─ If no bytes yet: output single 0x00 byte          │
├─────────────────────────────────────────────────────────┤
│ 4. Return result                                         │
│    ├─ value: Uint8Array with varbigint bytes           │
│    └─ length: number of bytes used                      │
└─────────────────────────────────────────────────────────┘
```

### Encoding Algorithm

```javascript
function encodeVarBigInt(value) {
  const result = [];
  
  while (value > 0n) {
    // Take lower 7 bits as number
    let byte = Number(value & 0x7Fn);
    
    // Shift value right 7 bits
    value = value >> 7n;
    
    // If more bytes needed, set continuation bit
    if (value > 0n) {
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

### Small Values (Within VarInt Range)

#### Value: 0n
```
Input:  0n
Output: 0x00
Bytes:  1

Same as VarInt(0)
```

#### Value: 42n
```
Input:  42n
Output: 0x2A
Bytes:  1

Same as VarInt(42)
```

#### Value: 1000n
```
Input:  1000n
Output: 0xE8 0x07
Bytes:  2

Same as VarInt(1000)
```

### Large Values (Beyond JavaScript Safe Integer)

#### Value: 2^53 (Beyond Safe Integer)
```
Input:  9007199254740992n  (2^53)
Binary: 100000000000000000000000000000000000000000000000000000
Output: 0x80 0x80 0x80 0x80 0x80 0x80 0x80 0x80 0x01
Bytes:  9

Breakdown:
- Value requires 54 bits
- 54 ÷ 7 = 7.71 → 8 complete 7-bit groups
- Byte count: 8 data bytes + 1 final byte = 9 total
```

#### Value: 2^64-1 (Maximum 64-bit)
```
Input:  18446744073709551615n  (2^64-1)
Binary: All 64 bits set
Output: 0xFF 0xFF 0xFF 0xFF 0xFF 0xFF 0xFF 0xFF 0xFF 0x01
Bytes:  10

This is the maximum 64-bit unsigned integer
```

### Cryptographic Values

#### Value: 2^256
```
Input:  2^256n
       = 115792089237316195423570985008687907853269984665640564039457584007913129639936n

Bytes:  37 (256 bits ÷ 7 bits/byte ≈ 36.6 → 37 bytes)

Used for: Cryptographic key sizes, hash values
```

### Common BigInt Values

#### 1 Billion (10^9)
```
Input:  1000000000n
Output: 0x80 0x94 0xEB 0xDC 0x03
Bytes:  5
```

#### 1 Trillion (10^12)
```
Input:  1000000000000n
Output: 0x80 0x80 0xAC 0x8F 0xE6 0xE8 0x00
Bytes:  7
```

#### Ethereum Wei (10^18)
```
Input:  1000000000000000000n
Output: [9 bytes]

Common in cryptocurrency calculations
```

## BigInt Bit Operations Example

Encoding 1000000000n (1 billion) step-by-step:

```
const value = 1000000000n;

// Binary: 111011100110101100101000000000

Step 1: Extract lower 7 bits
  1000000000n & 0x7Fn = 0n
  Set continuation bit: 0x80

Step 2: Shift and extract next 7 bits
  (1000000000n >> 7n) & 0x7Fn = 20n
  Set continuation bit: 0x80 | 20 = 0x94

Step 3-5: Continue process...

Result: 80 94 EB DC 03
```

## Test Vectors

### Edge Cases

```
Minimum Value:
  0n → 00
  Length: 1 byte

Maximum Safe Integer:
  9007199254740991n (2^53-1) → FF FF FF FF FF FF FF 7F
  Length: 8 bytes

Just Beyond Safe Integer:
  9007199254740992n (2^53) → 80 80 80 80 80 80 80 80 01
  Length: 9 bytes
```

### Powers of 2

```
2^7  = 128n               → 80 01
2^8  = 256n               → 80 02
2^14 = 16384n             → 80 80 01
2^21 = 2097152n           → 80 80 80 01
2^28 = 268435456n         → 80 80 80 80 01
2^35 = 34359738368n       → 80 80 80 80 80 01
2^42 = 4398046511104n     → 80 80 80 80 80 80 01
2^49 = 562949953421312n   → 80 80 80 80 80 80 80 01
2^56 = 72057594037927936n → 80 80 80 80 80 80 80 80 01
2^63 = 9223372036854775808n → 80 80 80 80 80 80 80 80 80 01
```

### Large Round Numbers

```
1 Million (10^6):
  1000000n → C0 C4 3D

1 Billion (10^9):
  1000000000n → 80 94 EB DC 03

1 Trillion (10^12):
  1000000000000n → 80 80 AC 8F E6 E8 00

1 Quadrillion (10^15):
  1000000000000000n → 80 80 80 80 E9 A2 FA DC 03
```

## Constraints and Limits

### Value Range

**JavaScript BigInt:**
- Minimum: 0n (negative not supported)
- Maximum: Theoretically unlimited (memory constrained)
- Practical limit: ~2^1,000,000 (implementation dependent)

**VarBigInt Encoding:**
- No theoretical maximum
- Each byte adds 7 bits of range
- 1000 bytes can encode ~2^7000

### Byte Count Formula

```
Bytes required = ⌈(bit_length(value) / 7)⌉

Examples:
- 64-bit value:  ⌈64 / 7⌉ = 10 bytes
- 128-bit value: ⌈128 / 7⌉ = 19 bytes
- 256-bit value: ⌈256 / 7⌉ = 37 bytes
- 512-bit value: ⌈512 / 7⌉ = 74 bytes
```

### Invalid Inputs

```javascript
fromVarBigInt(-1n)         → Error (negative not supported)
fromVarBigInt(1.5)         → Error (not a BigInt)
fromVarBigInt(1000)        → Error (Number, not BigInt)
fromVarBigInt("1000")      → Error (String, not BigInt)
```

## Performance Characteristics

### Complexity

```
Time Complexity:  O(log n) where n = value
                  (proportional to number of bits)
Space Complexity: O(log n) for output buffer
```

### Efficiency vs Fixed-Width

| Bits | Fixed Width | VarBigInt | Savings |
|------|-------------|-----------|---------|
| 64   | 8 bytes     | 1-10 bytes| 0-87%   |
| 128  | 16 bytes    | 1-19 bytes| 0-93%   |
| 256  | 32 bytes    | 1-37 bytes| 0-96%   |
| 512  | 64 bytes    | 1-74 bytes| 0-98%   |

**Overhead**: ~14% expansion (8/7 ratio) in worst case

### Comparison with VarInt

```
Value Range               VarInt      VarBigInt
--------------------     --------    -----------
0 to 2^53-1              Supported   Supported (same encoding)
2^53 to 2^64-1           NOT         Supported (9-10 bytes)
2^64 to 2^128-1          NOT         Supported (10-19 bytes)
2^128 and beyond         NOT         Supported (20+ bytes)
```

## Return Value

```javascript
{
    value: Uint8Array,    // VarBigInt-encoded bytes
    length: number        // Number of bytes (1-N)
}
```

## Usage

### Basic Usage

```javascript
import { fromVarBigInt } from './fromVarBigInt.js';

const result = fromVarBigInt(1000000000n);
// result.value: Uint8Array [128, 148, 235, 220, 3]
// result.length: 5
```

### Cryptocurrency Amounts

```javascript
// Ethereum: 1 ETH = 10^18 wei
const oneEth = 1000000000000000000n;
const encoded = fromVarBigInt(oneEth);
// Compact encoding for large currency values
```

### Cryptographic Keys

```javascript
// 256-bit key
const key256 = 2n ** 256n - 1n;
const encoded = fromVarBigInt(key256);
// result.length: 37 bytes (vs 32 for fixed width)
```

### Integration with Objects

```javascript
// BigInt used as object field value
const obj = { balance: 1000000000000n, timestamp: 1672531200n };
// When serialized:
// - balance: TYPE_BYTE 0x52 + fromVarBigInt(...)
// - timestamp: TYPE_BYTE 0x52 + fromVarBigInt(...)
```

## Error Handling

### Invalid Input Type
```
Input:  1000 (number)
Error:  TypeError: Input must be a BigInt
Fix:    fromVarBigInt(1000n) or fromVarBigInt(BigInt(1000))
```

### Negative Value
```
Input:  -1n
Error:  RangeError: Negative values not supported
Fix:    Use absolute value or different encoding
```

## BigInt Literal Syntax

### Creating BigInt Values

```javascript
// BigInt literal (note the 'n' suffix)
const big = 1000000000000000000n;

// Converting from Number
const fromNum = BigInt(1000);

// From string
const fromStr = BigInt("1000000000000000000");

// From hex
const fromHex = BigInt("0x123456789ABCDEF");
```

### BigInt Operations

```javascript
// Arithmetic
10n + 20n         // 30n
10n * 20n         // 200n
10n ** 20n        // 100000000000000000000n

// Bitwise
1n << 7n          // 128n
128n >> 7n        // 1n
255n & 0x7Fn      // 127n
```

### BigInt Gotchas

```javascript
// Cannot mix BigInt and Number
10n + 20          // TypeError ✗

// Must use BigInt methods
BigInt(10) / BigInt(3)  // 3n (integer division)

// Comparison works
10n < 20            // true
10n === 10          // false (different types)
10n == 10           // true (type coercion)
```

## Relationship to Deserialization

This function is the inverse of `toVarBigInt()`:
```javascript
const original = 1000000000n;
const serialized = fromVarBigInt(original);
const deserialized = toVarBigInt(serialized.value);
// deserialized.value === original
```

### Round-Trip Example

```javascript
// Serialize
const bigNum = 9007199254740992n; // 2^53
const encoded = fromVarBigInt(bigNum);
// encoded.value: Uint8Array [128, 128, 128, 128, 128, 128, 128, 128, 1]

// Deserialize
const decoded = toVarBigInt(encoded.value);
// decoded.value: 9007199254740992n

// Verify
console.assert(bigNum === decoded.value); // ✓ Passes
```

## VarInt Compatibility

For values 0 to 2^53-1:
- **Encoding**: Identical to VarInt
- **Type**: Returns BigInt vs Number
- **Interchangeable**: Type byte (0x51 vs 0x52) distinguishes them

```javascript
// Same encoding, different types
fromVarInt(42);      // { value: Uint8Array [42], length: 1 }
fromVarBigInt(42n);  // { value: Uint8Array [42], length: 1 }
```

## Use Cases

### Cryptocurrency
```javascript
// Bitcoin: Satoshis (10^8 per BTC)
const btc = 21_000_000n * 100_000_000n;  // Total supply

// Ethereum: Wei (10^18 per ETH)
const eth = 1_000_000_000_000_000_000n;  // 1 ETH
```

### Timestamps (Microseconds)
```javascript
// Unix timestamp in microseconds
const timestamp = 1672531200000000n;
```

### Large Counters
```javascript
// Event counters that exceed 2^53
const eventCount = 9007199254740992n;
```

## Cross-Platform Compatibility

BigInt support across languages:
- **JavaScript**: Native BigInt (ES2020+)
- **Python**: Native `int` (unlimited precision)
- **Java**: `java.math.BigInteger`
- **Go**: `math/big.Int`
- **Rust**: `num_bigint::BigUint`
- **C/C++**: GMP library
