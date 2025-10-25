import { varbigint, uint8array } from '@scintilla-network/keys/utils';
import llog from '../llog.js';

function toVarBigInt(rawInputBytes) { 
    if(!rawInputBytes) {
        throw new Error('rawInputBytes is required - Current input is empty');
    }

    const {value: inputBytes, length: inputBytesLength} = varbigint.decodeVarBigInt(rawInputBytes.subarray(0));

    llog.log(`                     | - deserialize.toVarBigInt: ${uint8array.toHex(rawInputBytes)}(len: ${inputBytesLength}) -> ${inputBytes}`);
    return {value: inputBytes, length: inputBytesLength};
}   

export { toVarBigInt };
export default toVarBigInt;