import { llog } from '../llog.js';
import { uint8array } from '@scintilla-network/keys/utils';

/**
 * Serializes a boolean value to a Uint8Array
 * Format: single byte - 0x00 for false, 0x01 for true
 * 
 * @param {boolean} input - The boolean to serialize
 * @returns {{value: Uint8Array, length: number}} The serialized boolean
 */
function fromBoolean(input) {
    const booleanByte = input ? 0x01 : 0x00;
    const rawInputBytes = new Uint8Array([booleanByte]);
    llog.log(`                     | - serialize.fromBoolean. input: ${input} -> ${uint8array.toHex(rawInputBytes)}`);
    return {
        value: rawInputBytes,
        length: rawInputBytes.length,
    };
}

export { fromBoolean };
export default fromBoolean;

