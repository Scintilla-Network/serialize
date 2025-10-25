import { llog } from '../llog.js';

/**
 * Deserializes a Uint8Array to a boolean value
 * Format: single byte - 0x00 for false, 0x01 for true
 * 
 * @param {Uint8Array} input - The byte array to deserialize
 * @returns {{value: boolean, length: number}} The deserialized boolean and bytes consumed
 */
function toBoolean(input) {
    const booleanValue = input[0] !== 0x00;
    llog.log(`                     | - deserialize.toBoolean: ${input[0].toString(16).padStart(2, '0')}(len: 1) -> ${booleanValue}`);
    return {
        value: booleanValue,
        length: 1,
    };
}

export { toBoolean };
export default toBoolean;

