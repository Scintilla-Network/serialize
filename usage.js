import { serialize, deserialize, NET_KINDS, NET_KINDS_ARRAY } from './src/index.js';

const data = { name: 'John', age: 30, items: [1, 2, { name: 'Jane', age: 25, exists: true }] };
const serialized = serialize.fromObject(data);
const deserialized = deserialize.toObject(serialized.value);
console.dir(deserialized, { depth: null });

console.log(NET_KINDS.TRANSACTION); // 8
console.log(NET_KINDS_ARRAY[8]); // 'TRANSACTION'