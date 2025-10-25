import { varint, uint8array } from '@scintilla-network/keys/utils';
import llog from '../llog.js';

function toVarInt(rawInputBytes) { 
    if(!rawInputBytes) {
        throw new Error('rawInputBytes is required - Current input is empty');
    }

    const {value: inputBytes, length: inputBytesLength} = varint.decodeVarInt(rawInputBytes.subarray(0));

    llog.log(`                     | - deserialize.toVarInt: ${uint8array.toHex(rawInputBytes)}(len: ${inputBytesLength}) -> ${inputBytes}`);
    return {value: inputBytes, length: inputBytesLength };
}

export { toVarInt };
export default toVarInt;