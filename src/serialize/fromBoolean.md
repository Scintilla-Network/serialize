# fromBoolean

## Overview
The `fromBoolean` function serializes JavaScript boolean values into binary format following the Scintilla Network protocol. Booleans are encoded as a single byte with values `0x00` (false) or `0x01` (true).

## Protocol Structure

### Byte Layout
```
[VALUE]
```

A single byte representing the boolean state.

### Binary Format

```
Single Byte:
┌─────────┐
│ Boolean │
└─────────┘
  1 byte

Value Encoding:
┌──────────┬────────┐
│ Boolean  │  Byte  │
├──────────┼────────┤
│ false    │  0x00  │
│ true     │  0x01  │
└──────────┴────────┘
```

### Bit Layout

```
false (0x00):
┌─┬─┬─┬─┬─┬─┬─┬─┐
│0│0│0│0│0│0│0│0│ = 0x00
└─┴─┴─┴─┴─┴─┴─┴─┘
  All bits zero

true (0x01):
┌─┬─┬─┬─┬─┬─┬─┬─┐
│0│0│0│0│0│0│0│1│ = 0x01
└─┴─┴─┴─┴─┴─┴─┴─┘
  LSB set, others zero
```

## Encoding Rules

### Value Mapping
```
Input: false → Output: 0x00
Input: true  → Output: 0x01
```

### Type Safety
**Strict type checking enforced:**
- Input MUST be JavaScript boolean type
- No coercion from other types
- Only `true` and `false` accepted

## Examples

### Basic Values

#### False Value
```javascript
Input: false
```

**Output:**
```
Hex: 00
Binary: 00000000
Decimal: 0
```

**Byte-by-Byte:**
```
Offset  Hex   Dec  Description
------  ----  ---  -----------
0x00    0x00   0   false

Total: 1 byte
```

#### True Value
```javascript
Input: true
```

**Output:**
```
Hex: 01
Binary: 00000001
Decimal: 1
```

**Byte-by-Byte:**
```
Offset  Hex   Dec  Description
------  ----  ---  -----------
0x00    0x01   1   true

Total: 1 byte
```

### In Array Context

```javascript
Input: [true, false, true]
```

When serialized in an array, each boolean gets a type byte prefix:
```
Offset  Hex   Type      Value
------  ----  --------  -----
0x00    0x18  KIND      PACKEDARRAY
0x01    0x03  COUNT     3 items
0x02    0x06  LENGTH    6 bytes of items
0x03    0x55  TYPE      Boolean
0x04    0x01  VALUE     true
0x05    0x55  TYPE      Boolean
0x06    0x00  VALUE     false
0x07    0x55  TYPE      Boolean
0x08    0x01  VALUE     true

Total: 9 bytes
```

### In Object Context

```javascript
Input: { active: true, deleted: false }
```

When serialized in an object (fields alphabetically sorted):
```
Object structure with:
- Field "active": TYPE_BYTE 0x55 + 0x01 (true)
- Field "deleted": TYPE_BYTE 0x55 + 0x00 (false)

Field values section:
  55 01    Boolean type + true
  55 00    Boolean type + false
```

### Boolean Sequences

Multiple booleans in different combinations:
```
[false, false] → Items: 55 00 55 00
[true, true]   → Items: 55 01 55 01
[false, true]  → Items: 55 00 55 01
[true, false]  → Items: 55 01 55 00
```

## Type Validation

### Valid Inputs
```javascript
fromBoolean(true)       // ✓ Actual boolean
fromBoolean(false)      // ✓ Actual boolean
fromBoolean(2 > 1)      // ✓ Expression result is boolean
fromBoolean(!flag)      // ✓ Negation preserves boolean type
```

### Invalid Inputs
```javascript
// These will throw TypeError
fromBoolean(0)          // ✗ Number 0 is not false
fromBoolean(1)          // ✗ Number 1 is not true
fromBoolean("")         // ✗ Empty string is not false
fromBoolean("false")    // ✗ String is not boolean
fromBoolean(null)       // ✗ Null is not boolean
fromBoolean(undefined)  // ✗ Undefined is not boolean
```

**Why strict?** JavaScript has truthy/falsy values, but the protocol requires explicit boolean type to maintain type safety during serialization/deserialization.

## Encoding Process

### Step-by-Step
```
1. Validate input is boolean type
   └─ Check: typeof value === 'boolean'

2. Convert to byte
   ├─ If false: byte = 0x00
   └─ If true:  byte = 0x01

3. Create Uint8Array
   └─ Return single-byte array

4. Return result
   ├─ value: Uint8Array with encoded byte
   └─ length: 1 (always)
```

### Implementation Flow
```javascript
function fromBoolean(value) {
  // Type validation
  if (typeof value !== 'boolean') {
    throw new TypeError('Input must be a boolean');
  }
  
  // Encode
  const byte = value ? 0x01 : 0x00;
  
  // Return as Uint8Array
  return {
    value: new Uint8Array([byte]),
    length: 1
  };
}
```

## Return Value

```javascript
{
    value: Uint8Array,    // Single-byte array [0x00] or [0x01]
    length: number        // Always 1
}
```

## Usage

### Basic Usage
```javascript
import { fromBoolean } from './fromBoolean.js';

const resultTrue = fromBoolean(true);
// resultTrue.value: Uint8Array [1]
// resultTrue.length: 1

const resultFalse = fromBoolean(false);
// resultFalse.value: Uint8Array [0]
// resultFalse.length: 1
```

### With Flag Fields
```javascript
const permissions = {
  canRead: true,
  canWrite: false,
  canExecute: true
};

// Each boolean field serializes to 1 byte
// Total: 3 bytes for boolean values (plus type bytes in context)
```

### State Representation
```javascript
const state = {
  isActive: true,
  isPaused: false,
  isComplete: false
};

// Compact state representation
// 3 bytes total for the boolean values
```

### With Comparisons
```javascript
const isValid = value > threshold;
const encoded = fromBoolean(isValid);
// Comparison result is boolean type, works correctly
```

## Performance Characteristics

### Complexity
```
Time Complexity:  O(1) constant time
                  - Single boolean check
                  - Single byte write
                  
Space Complexity: O(1) constant space
                  - Always 1 byte output
```

### Efficiency
Boolean is the most efficient primitive type:
- Smallest possible encoding (1 byte)
- No variable-length overhead
- Single CPU instruction to encode

### Comparison
```
Type     | Min Size | Boolean | Overhead
---------|----------|---------|----------
String   | 1+ bytes | 1 byte  | 0%
VarInt   | 1+ bytes | 1 byte  | 0%
Boolean  | 1 byte   | 1 byte  | 0%
```

## Type Byte Integration

### In Objects
When boolean is a field value, it includes type byte `0x55`:
```
[TYPE_BYTE 0x55][BOOLEAN_BYTE]

Examples:
true  → 55 01
false → 55 00
```

### In Arrays
When boolean is an array item, it includes type byte `0x55`:
```
[TYPE_BYTE 0x55][BOOLEAN_BYTE]

Example array [true]:
18 01 02 55 01
└──┘ Array header
   └────┘ Item: TYPE 0x55 + VALUE 0x01
```

### Type Byte Value
```
Boolean Type Byte: 0x55 (85 decimal)

Complete type system:
0x50 - String
0x51 - VarInt
0x52 - BigInt
0x53 - Array
0x54 - Object
0x55 - Boolean  ← This function
```

## Error Handling

### TypeError: Invalid Input
```
Input:  0
Error:  TypeError: Input must be a boolean
Cause:  Type coercion is not allowed
Fix:    Convert to boolean explicitly: fromBoolean(value !== 0)
```

### Common Mistakes
```javascript
// WRONG: Using truthy/falsy values
fromBoolean(0)         // Error: 0 is not false
fromBoolean(1)         // Error: 1 is not true

// CORRECT: Using actual booleans
fromBoolean(value === 0)  // ✓ Boolean comparison
fromBoolean(Boolean(value)) // ✓ Explicit conversion
fromBoolean(!!value)   // ✓ Double negation creates boolean
```

## Relationship to Deserialization

This function is the inverse of `toBoolean()`:
```javascript
const original = true;
const serialized = fromBoolean(original);
const deserialized = toBoolean(serialized.value);
// deserialized.value === original (true)
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
- **C/C++**: `false`=0, `true`=1 (by convention)
- **Java**: `boolean` false/true
- **Python**: `False`/`True` (0/1 in bytes)
- **Go**: `false`/`true`
- **Rust**: `false`/`true`

All languages use similar conventions for boolean binary representation.
