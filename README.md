# @scintilla-network/serialize

[![npm version](https://badge.fury.io/js/@scintilla-network%2Fserialize.svg)](https://www.npmjs.com/package/@scintilla-network/serialize)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A library for serializing and deserializing data according to the Scintilla Network protocol. Provides efficient binary serialization for JavaScript objects, arrays, strings, numbers, and booleans with support for nested structures and variable-length encoding.

## Features

- **Universal Serialization**: Convert JavaScript objects, arrays, and primitives to binary format
- **Type-Safe Deserialization**: Convert binary data back to JavaScript structures
- **Variable-Length Encoding**: Efficient encoding for integers and big integers
- **Nested Structure Support**: Handle complex nested objects and arrays recursively

## Installation

```bash
npm install @scintilla-network/serialize
```

## Quick Start

```javascript
import { serialize, deserialize } from '@scintilla-network/serialize';

// Serialize JavaScript object to binary
const data = {
  name: 'Alice',
  age: 30,
  active: true,
  scores: [95, 87, 92],
  metadata: { version: 1, tags: ['user', 'premium'] }
};

const serialized = serialize.fromObject(data);
console.log(serialized.value); // Uint8Array with binary data
console.log(serialized.length); // Total bytes used

// Deserialize binary back to JavaScript object
const deserialized = deserialize.toObject(serialized.value);
console.log(deserialized.value); // Original object restored
console.log(deserialized.length); // Bytes consumed
```

## API Reference

### Serialization Functions

The `serialize` namespace provides functions to convert JavaScript values into binary format:

| Function | Description | Input | Output |
|----------|-------------|-------|--------|
| `fromObject()` | Serialize objects and arrays | Object/Array | `{value: Uint8Array, length: number}` |
| `fromString()` | Serialize strings | String | `{value: Uint8Array, length: number}` |
| `fromVarInt()` | Serialize variable-length integers | Number | `{value: Uint8Array, length: number}` |
| `fromVarBigInt()` | Serialize variable-length big integers | BigInt | `{value: Uint8Array, length: number}` |
| `fromBoolean()` | Serialize booleans | Boolean | `{value: Uint8Array, length: number}` |

### Deserialization Functions

The `deserialize` namespace provides functions to convert binary data back to JavaScript values:

| Function | Description | Input | Output |
|----------|-------------|-------|--------|
| `toObject()` | Deserialize objects and arrays | Uint8Array | `{value: Object/Array, length: number}` |
| `toString()` | Deserialize strings | Uint8Array | `{value: String, length: number}` |
| `toVarInt()` | Deserialize variable-length integers | Uint8Array | `{value: Number, length: number}` |
| `toVarBigInt()` | Deserialize variable-length big integers | Uint8Array | `{value: BigInt, length: number}` |
| `toBoolean()` | Deserialize booleans | Uint8Array | `{value: Boolean, length: number}` |

## Detailed Documentation

For comprehensive protocol specifications, implementation details, examples, and advanced usage patterns, see the detailed documentation:

### Serialization Details

- **[fromObject](src/serialize/fromObject.md)** - Complete object and array serialization
- **[fromString](src/serialize/fromString.md)** - String encoding and UTF-8 handling
- **[fromVarInt](src/serialize/fromVarInt.md)** - Variable-length integer encoding
- **[fromVarBigInt](src/serialize/fromVarBigInt.md)** - Big integer encoding
- **[fromBoolean](src/serialize/fromBoolean.md)** - Boolean serialization

### Deserialization Details

- **[toObject](src/deserialize/toObject.md)** - Complete object and array deserialization
- **[toString](src/deserialize/toString.md)** - String decoding and validation
- **[toVarInt](src/deserialize/toVarInt.md)** - Variable-length integer decoding
- **[toVarBigInt](src/deserialize/toVarBigInt.md)** - Big integer decoding
- **[toBoolean](src/deserialize/toBoolean.md)** - Boolean deserialization

## Protocol Specification

The library implements the Scintilla Network binary protocol with these key characteristics:

- **Type System**: 6 core types (String, Variable Integer, Variable Big Integer, Array, Object, Boolean)
- **Variable-Length Encoding**: Efficient encoding using Protocol Buffers varint format
- **Deterministic Serialization**: Field names are alphabetically sorted for consistency
- **Nested Structure Support**: Recursive encoding/decoding of complex data structures
- **Length Prefixing**: All sections include length prefixes for safe parsing

## Advanced Usage

The toObject function provides a way to deserialize to specific constructor, for such, provide a kindToConstructor function to the toObject function.  

```javascript
class Transaction {
    constructor(data) {
        this.kind = 'TRANSACTION';
        this.amount = data.amount;
    }
    toUint8Array() {
        return new Uint8Array([NET_KINDS.TRANSACTION, ...serialize.fromVarInt(this.amount).value]);
    }
    static fromUint8Array(bytes) {
        return new Transaction({
            amount: deserialize.toVarInt(bytes.subarray(1)).value,
        });
    }
}
const kindToConstructor = (kind) => {
    switch(kind) {
        case 'TRANSACTION':
            return Transaction;
    }
};

const tx = new Transaction({amount: 100});
const serializedTx = serialize.fromObject(tx); // [8, 100]
const deserializedTx = deserialize.toObject(serializedTx.value, kindToConstructor); // Transaction { amount: 100 }
```

## Supporting Utilities

### Type Detection

- `getFieldTypeFromBytes()` - Helper function to identify field types from binary data

### Constants

- `NET_KINDS` - Protocol type constants and mappings

```bash
    UNKNOWN = 0,
    PEER_INFO = 1,
    REQUEST = 2,
    RESPONSE = 3,
    ACKHANDSHAKE = 4,
    EPOCHBLOCK = 5,
    CLUSTERBLOCK = 6,
    HASHPROOF = 7,
    TRANSACTION = 8,
    TRANSITION = 9,
    TRANSFER = 10,
    STATEMENT = 11,
    HANDSHAKE = 12,
    QUORUMDECISION = 13,
    QUORUMDECISIONVOTE = 14,
    RELAYBLOCK = 15,
    VOUCHER = 16,
    ASSET = 17,
    IDENTITY = 18,
    GOVERNANCEPROPOSAL = 19,
    GOVERNANCEVOTE = 20,
    INSTRUCTION = 21,
    RAW = 22,
    PACKEDOBJECT = 23,
    PACKEDARRAY = 24,
```

### Logging

- `llog` - Conditional logging utility (enabled with `VERBOSE_SERIALIZATION=true`)

## License

MIT License - see the [LICENSE](LICENSE) file for details

## Contributing

Contributions are welcome!   
For issues, feature requests, or contributions, please visit the [GitHub repository](https://github.com/Scintilla-Network/serialize).
