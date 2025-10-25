import { utf8, varint, uint8array } from '@scintilla-network/keys/utils';
import llog from '../llog.js';

function toString(rawInputBytes) { 
    if(!rawInputBytes) {
        throw new Error('rawInputBytes is required - Current input is empty');
    }
    let offset = 0;
    const {value: inputBytesLength, length: inputBytesLengthLength} = varint.decodeVarInt(rawInputBytes.subarray(offset));
    offset += inputBytesLengthLength;
    llog.log(`---|---- deserialize.toString. inputBytesLength: ${inputBytesLength} @ offset: ${0} [${rawInputBytes.subarray(0)}]`);
    // Use the 
    const inputBytes = rawInputBytes.subarray(offset, offset + inputBytesLength);
    const inputString = utf8.fromUint8Array(inputBytes);
    llog.log(`                     | - deserialize.toString: ${uint8array.toHex(rawInputBytes)} -> (len: ${inputBytesLength}): ${uint8array.toHex(inputBytes)} -> ${inputString} `);
    return { value: inputString, length: offset + inputBytesLength };
}

export { toString };
export default toString;