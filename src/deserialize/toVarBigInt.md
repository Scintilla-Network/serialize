# toVarBigInt

## Overview
The `toVarBigInt` function deserializes variable-length big integer (VarBigInt) byte sequences back into JavaScript BigInt values. It reverses the process performed by `fromVarBigInt()`.

## Protocol Structure

### Input Format
```
[VARBIGINT_BYTES]
```

Variable-length encoding: 1 to N bytes depending on value magnitude.

### Byte Structure
```
Each byte (identical to VarInt):
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
│    ├─ result = 0n (BigInt)                              │
│    ├─ shift = 0n (BigInt)                               │
│    └─ bytesRead = 0                                     │
├─────────────────────────────────────────────────────────┤
│ 2. Read bytes while continuation bit set                │
│    For each byte:                                        │
│    ├─ value = BigInt(byte & 0x7F)                      │
│    ├─ result |= (value << shift)                       │
│    ├─ shift += 7n                                       │
│    ├─ bytesRead++                                       │
│    └─ Check continuation bit (byte & 0x80)              │
├─────────────────────────────────────────────────────────┤
│ 3. Validate result                                       │
│    ├─ result >= 0n                                      │
│    └─ Encoding is canonical (no overlong)              │
├─────────────────────────────────────────────────────────┤
│ 4. Return result                                         │
│    ├─ value: decoded BigInt                            │
│    └─ length: bytesRead                                 │
└─────────────────────────────────────────────────────────┘
```

### Decoding Algorithm

```javascript
function decodeVarBigInt(bytes) {
  let result = 0n;
  let shift = 0n;
  let bytesRead = 0;
  
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    bytesRead++;
    
    // Extract lower 7 bits as BigInt
    const value = BigInt(byte & 0x7F);
    
    // Add to result with shift
    result |= (value << shift);
    
    // Check continuation bit
    if ((byte & 0x80) === 0) {
      // Last byte
      break;
    }
    
    // Prepare for next byte
    shift += 7n;
    
    // Safety check (prevent DoS)
    if (bytesRead > MAX_VARBIGINT_BYTES) {
      throw new Error('VarBigInt too long');
    }
  }
  
  return { value: result, length: bytesRead };
}
```

## Examples

### Small Values (VarInt Range)

#### Zero
```
Input: 00

Decoding:
Byte 0: 0x00
  value = 0n
  continuation = 0

Return: { value: 0n, length: 1 }
```

#### Value: 1000n
```
Input: E8 07

Decoding:
Byte 0: 0xE8
  value = 0x68n = 104n
  result = 104n
  continuation = 1

Byte 1: 0x07
  value = 7n
  result = 104n | (7n << 7n) = 104n + 896n = 1000n
  continuation = 0

Return: { value: 1000n, length: 2 }
```

### Large Values (Beyond Safe Integer)

#### Value: 2^53 (Beyond JavaScript Number)
```
Input: 80 80 80 80 80 80 80 80 01

Decoding: (9 bytes)
  Byte 0-7: All continuation bits set
  Byte 8: 0x01, last byte

Result: 9007199254740992n (exactly 2^53)

Return: { value: 9007199254740992n, length: 9 }

Note: This value cannot be represented as JavaScript Number
```

#### Value: 1 Billion (10^9)
```
Input: 80 94 EB DC 03

Decoding: (5 bytes)
Step-by-step:
  Byte 0: 0x80 → 0n
  Byte 1: 0x94 → 0n + (20n << 7n) = 2560n
  Byte 2: 0xEB → 2560n + (107n << 14n) = 1753600n
  Byte 3: 0xDC → 1753600n + (92n << 21n) = 194903680n
  Byte 4: 0x03 → 194903680n + (3n << 28n) = 1000000000n

Return: { value: 1000000000n, length: 5 }
```

#### Value: 2^64-1 (Maximum 64-bit)
```
Input: FF FF FF FF FF FF FF FF FF 01

Decoding: (10 bytes)
All value bits set in first 9 bytes, final byte = 1

Result: 18446744073709551615n

Return: { value: 18446744073709551615n, length: 10 }
```

## Example Trace: Decode 1000000000n

```
Input: 80 94 EB DC 03

Iteration 1:
  byte = 0x80
  value = 0n
  result = 0n
  shift = 0n
  continuation = true
  shift becomes 7n

Iteration 2:
  byte = 0x94
  value = 20n (0x94 & 0x7F = 0x14 = 20)
  result = 0n | (20n << 7n) = 2560n
  shift = 7n
  continuation = true
  shift becomes 14n

Iteration 3:
  byte = 0xEB
  value = 107n
  result = 2560n | (107n << 14n) = 1753600n
  shift = 14n
  continuation = true
  shift becomes 21n

Iteration 4:
  byte = 0xDC
  value = 92n
  result = 1753600n | (92n << 21n) = 194903680n
  shift = 21n
  continuation = true
  shift becomes 28n

Iteration 5:
  byte = 0x03
  value = 3n
  result = 194903680n | (3n << 28n) = 1000000000n
  continuation = false
  stop

Return: { value: 1000000000n, length: 5 }
```

## Error Handling

### Empty Buffer

```
┌────────────────────────────────────────────────────────────┐
│ ERROR: Empty buffer                                        │
│ ───────────────────────────────────────────────────────────│
│ Input:  []                                                 │
│ Message: "Cannot decode varbigint from empty buffer"      │
│ Action: Verify buffer is not empty                        │
└────────────────────────────────────────────────────────────┘
```

### Truncated VarBigInt

```
┌────────────────────────────────────────────────────────────┐
│ ERROR: Truncated varbigint                                 │
│ ───────────────────────────────────────────────────────────│
│ Input:  80 80 (continuation set, but ends)                │
│ Message: "Truncated varbigint: expected more bytes"       │
│ Action: Verify complete data received                     │
└────────────────────────────────────────────────────────────┘
```

### Excessive Length

```
┌────────────────────────────────────────────────────────────┐
│ ERROR: VarBigInt too long                                  │
│ ───────────────────────────────────────────────────────────│
│ Input:  [200+ bytes with continuation bits]               │
│ Message: "VarBigInt exceeds maximum allowed length"       │
│ Action: Enforce reasonable limits (e.g., 128 bytes)       │
└────────────────────────────────────────────────────────────┘
```

## Performance Characteristics

### Complexity

```
Time Complexity:  O(n) where n = number of bytes
                  (up to a reasonable maximum)

Space Complexity: O(1) for the BigInt result
                  (JavaScript handles BigInt memory)
```

### BigInt Operations

```javascript
// BigInt operations are slower than Number
// But necessary for values > 2^53

Relative performance:
  Number operations:  1x (baseline)
  BigInt operations:  ~5-10x slower
  
Still very fast in absolute terms.
```

## Usage Examples

### Basic Usage

```javascript
import { toVarBigInt } from './toVarBigInt.js';

const bytes = new Uint8Array([0x80, 0x94, 0xEB, 0xDC, 0x03]);
const result = toVarBigInt(bytes);
// result.value: 1000000000n
// result.length: 5
```

### Cryptocurrency Amounts

```javascript
// Decode Ethereum wei amount
const weiBytes = new Uint8Array([...]); // 9 bytes
const wei = toVarBigInt(weiBytes);
// wei.value: 1000000000000000000n (1 ETH)
```

### Large Counters

```javascript
// Decode event counter beyond safe integer
const counterBytes = new Uint8Array([...]);
const count = toVarBigInt(counterBytes);
// count.value: 10000000000000000n (beyond Number range)
```

## Test Vectors

### Small Values
```
00 → 0n
01 → 1n
2A → 42n
E8 07 → 1000n
```

### Large Values
```
Just beyond safe integer:
  80 80 80 80 80 80 80 80 01 → 9007199254740992n (2^53)

Maximum 64-bit:
  FF FF FF FF FF FF FF FF FF 01 → 18446744073709551615n (2^64-1)

1 Trillion:
  80 80 AC 8F E6 E8 00 → 1000000000000n
```

### Powers of 2
```
2^7   → 80 01
2^14  → 80 80 01
2^21  → 80 80 80 01
2^28  → 80 80 80 80 01
2^35  → 80 80 80 80 80 01
2^42  → 80 80 80 80 80 80 01
2^49  → 80 80 80 80 80 80 80 01
2^56  → 80 80 80 80 80 80 80 80 01
2^63  → 80 80 80 80 80 80 80 80 80 01
```

## Return Value

```javascript
{
    value: bigint,     // Decoded BigInt
    length: number     // Bytes consumed
}
```

## VarInt Compatibility

For values 0 to 2^53-1:
- **Decoding**: Identical result to toVarInt
- **Type**: Returns BigInt vs Number
- **Interchangeable**: Can decode VarInt as VarBigInt

```javascript
// Same encoding, different types
toVarInt([0x2A]);      // { value: 42, length: 1 }
toVarBigInt([0x2A]);   // { value: 42n, length: 1 }
```

## When to Use VarBigInt

### Use VarBigInt When:
```
✓ Value might exceed 2^53-1
✓ Cryptocurrency amounts (wei, satoshis)
✓ Microsecond timestamps
✓ Cryptographic key sizes
✓ Very large counters
✓ Exact precision required
```

### Use VarInt When:
```
✓ Value guaranteed < 2^53
✓ Regular integers
✓ Array indices
✓ Counts and lengths
✓ Performance critical (faster)
```

## BigInt Gotchas

### Type Mixing

```javascript
// Cannot mix BigInt and Number
10n + 20      // TypeError ✗

// Must convert
10n + 20n     // 30n ✓
Number(10n) + 20  // 30 ✓ (but loses precision if big)
```

### Comparison

```javascript
// Comparison works across types
10n < 20      // true
10n === 10    // false (different types)
10n == 10     // true (coerced comparison)

// Use type-safe comparison
BigInt(10) === 10n  // true
```

### JSON Serialization

```javascript
// BigInt doesn't serialize to JSON by default
JSON.stringify({ value: 10n });  // TypeError

// Use custom replacer
JSON.stringify({ value: 10n }, (key, val) =>
  typeof val === 'bigint' ? val.toString() : val
);
// '{"value":"10"}'
```

## Relationship to Serialization

This function is the inverse of `fromVarBigInt()`:
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

## Cross-Platform Compatibility

BigInt support across languages:
- **JavaScript**: Native BigInt (ES2020+)
- **Python**: Native `int` (unlimited precision)
- **Java**: `java.math.BigInteger`
- **Go**: `math/big.Int`
- **Rust**: `num_bigint::BigUint`
- **C/C++**: GMP library
