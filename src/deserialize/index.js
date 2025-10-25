import {toString} from "./toString.js";
import {toVarInt} from "./toVarInt.js";
import {toVarBigInt} from "./toVarBigInt.js";
import {toBoolean} from "./toBoolean.js";
import {toObject} from "./toObject.js";

const deserialize = {
    toString,
    toVarInt,
    toVarBigInt,
    toBoolean,
    toObject,
}

export { deserialize };
export default deserialize; 