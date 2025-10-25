import { uint8array } from '@scintilla-network/keys/utils';
import { NET_KINDS_ARRAY } from '../NET_KINDS.js';
import { llog } from '../llog.js';

function getFieldTypeFromBytes(bytes){
    switch(uint8array.toHex(bytes)){
        case "50": // 0x50
            return "string";
        case "51": // 0x51
            return "varint";
        case "52": // 0x52
            return "bigint";
        case "53": // 0x53
            return "array";
        case "54": // 0x54
            return "object";
        case "55": // 0x55
            return "boolean";
        default:
            if(NET_KINDS_ARRAY[uint8array.stringify(bytes)]) {
                llog.log(`  |---- deserialize.toArray [NET_KINDS_ARRAY[uint8array.stringify(bytes)]: ${NET_KINDS_ARRAY[uint8array.stringify(bytes)]}]`)
                return NET_KINDS_ARRAY[uint8array.stringify(bytes)];
            }
            throw new Error(`Unsupported field type ${uint8array.stringify(bytes)}`);
    }
}

export { getFieldTypeFromBytes };
export default getFieldTypeFromBytes;