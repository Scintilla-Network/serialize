import { llog } from '../llog.js';
import { varbigint, uint8array } from '@scintilla-network/keys/utils';

function fromVarBigInt(input) { 
    const rawInputBytes = new Uint8Array([...varbigint.encodeVarBigInt(input, 'uint8array')]);
    llog.log(`                     | - serialize.fromVarInt. input: ${input} -> ${uint8array.toHex(rawInputBytes)}`);
    return {
        value: rawInputBytes,
        length: rawInputBytes.length,
    };
}
export { fromVarBigInt };
export default fromVarBigInt;