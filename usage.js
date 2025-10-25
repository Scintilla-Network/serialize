import { serialize, deserialize, NET_KINDS, NET_KINDS_ARRAY } from './src/index.js';

const data = { name: 'John', age: 30, items: [1, 2, { name: 'Jane', age: 25, exists: true }] };
const serialized = serialize.fromObject(data);
const deserialized = deserialize.toObject(serialized.value);
console.dir(deserialized, { depth: null });

console.log(NET_KINDS.TRANSACTION); // 8
console.log(NET_KINDS_ARRAY[8]); // 'TRANSACTION'


// Demo of deserializing to a specific constructor
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