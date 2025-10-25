import { llog } from '../llog.js';
import { varint, uint8array } from '@scintilla-network/keys/utils';

function fromVarInt(input) { 
    const rawInputBytes = new Uint8Array([...varint.encodeVarInt(input, 'uint8array')]);
    llog.log(`                     | - serialize.fromVarInt. input: ${input} -> ${uint8array.toHex(rawInputBytes)}`);
    return {
        value: rawInputBytes,
        length: rawInputBytes.length,
    };
}
export { fromVarInt };
export default fromVarInt;