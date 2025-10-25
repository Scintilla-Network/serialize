import fromString from "./fromString.js";
import fromVarInt from "./fromVarInt.js";
import fromVarBigInt from "./fromVarBigInt.js";
import fromBoolean from "./fromBoolean.js";
import fromObject from "./fromObject.js";

const serialize = {
    fromString,
    fromVarInt,
    fromVarBigInt,
    fromBoolean,
    fromObject,
}

export { serialize };
export default serialize;