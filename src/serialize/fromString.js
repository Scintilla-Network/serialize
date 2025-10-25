import { llog } from '../llog.js';
import { utf8, varint, uint8array } from '@scintilla-network/keys/utils';

function fromString(input) { 
    const inputBytes = utf8.toUint8Array(input);
    // FIXME: Here, we assign the input value + we properly send that as encoded
    // So even for returned value its good this way, but do we ant that elsewhere ? This change the normal behavior of others
    const inputBytesLength = varint.encodeVarInt(inputBytes.length, 'uint8array');
    
    const rawInputBytes = new Uint8Array([...inputBytesLength, ...inputBytes]);
    llog.log(`                     | - serialize.fromString. input: ${input} -> ${uint8array.toHex(inputBytes)} (len: ${inputBytesLength}) - result: ${uint8array.stringify(rawInputBytes)} hex:${uint8array.toHex(rawInputBytes)}`);
    return {
        value: rawInputBytes,
        length: rawInputBytes.length,
        varLength: inputBytesLength,
    };
}
export { fromString };
export default fromString;