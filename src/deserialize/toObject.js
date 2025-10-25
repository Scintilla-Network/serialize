import { uint8array, varint, json } from '@scintilla-network/keys/utils';

import { NET_KINDS, NET_KINDS_ARRAY } from '../NET_KINDS.js';
import { toString } from './toString.js';
import { llog } from '../llog.js';
import {toVarInt} from './toVarInt.js';
import {toVarBigInt} from './toVarBigInt.js';
import {toBoolean} from './toBoolean.js';
import { getFieldTypeFromBytes } from './getFieldTypeFromBytes.js';

/**
 * Converts a type byte to its string representation
 * Type bytes as defined in fromObject.js:
 * - 0x50 (80 decimal) = string
 * - 0x51 (81 decimal) = varint
 * - 0x52 (82 decimal) = bigint
 * - 0x53 (83 decimal) = array
 * - 0x54 (84 decimal) = object
 * - 0x55 (85 decimal) = boolean
 */
function fromTypeBytes(typeByte) {
    switch (typeByte) {
        case 0x50: // 80 decimal
            return 'string';
        case 0x51: // 81 decimal
            return 'varint';
        case 0x52: // 82 decimal
            return 'bigint';
        case 0x53: // 83 decimal
            return 'array';
        case 0x54: // 84 decimal
            return 'object';
        case 0x55: // 85 decimal
            return 'boolean';
        default:
            throw new Error(`Unsupported field type byte: 0x${typeByte.toString(16)} (${typeByte} decimal)`);
    }
}

/**
 * Internal array deserialization - keeps array logic separate but within toObject
 */
function deserializeArray(bytes, kindToConstructor) {
    llog.log(`  |---- deserialize.deserializeArray [bytes: ${uint8array.toHex(bytes)}]`)

    let offset = 0;

    // Kind 
    const {value: kindValue, length: kindValueLength} = varint.decodeVarInt(bytes.subarray(0));
    const kind = NET_KINDS_ARRAY[kindValue];
    offset += kindValueLength;
    llog.log(`  |---- deserialize.deserializeArray [kind: ${kind} - ${kindValue} - ${kindValueLength}]`)
    if(kind !== 'PACKEDARRAY') {
        throw new Error(`Invalid kind: ${kind} - Expected: PACKEDARRAY`);
    }
    const {value: itemsAmount, length: itemsAmountLength} = varint.decodeVarInt(bytes.subarray(offset));
    offset += itemsAmountLength;
    llog.log(`  |---- deserialize.deserializeArray [itemsAmount: ${itemsAmount} - ${itemsAmountLength}]`)

    // How many bytes long will the itemsBytes be
    const {value: itemsBytesLength, length: itemsBytesLengthLength} = varint.decodeVarInt(bytes.subarray(offset));
    offset += itemsBytesLengthLength;
    llog.log(`  |---- deserialize.deserializeArray [itemsBytesLength: ${itemsBytesLength} - ${itemsBytesLengthLength}]`)

    // Items
    const items = [];
    for(let i = 0; i < itemsAmount; i++) {
        const fieldType = getFieldTypeFromBytes(bytes.subarray(offset, offset + 1));
        offset += 1;
        
        let fieldValue = null;
        let fieldValueBytesLength = 0;

        switch(fieldType){
            case "string":
                ({value: fieldValue, length: fieldValueBytesLength} = toString(bytes.subarray(offset)));
                offset += fieldValueBytesLength;
                break;
            case "varint":
                ({value: fieldValue, length: fieldValueBytesLength} = toVarInt(bytes.subarray(offset)));
                offset += fieldValueBytesLength;
                break;
            case "bigint":
                ({value: fieldValue, length: fieldValueBytesLength} = toVarBigInt(bytes.subarray(offset)));
                offset += fieldValueBytesLength;
                break;
            case "boolean":
                ({value: fieldValue, length: fieldValueBytesLength} = toBoolean(bytes.subarray(offset)));
                offset += fieldValueBytesLength;
                break;
            case "array":
                ({value: fieldValue, length: fieldValueBytesLength} = deserializeArray(bytes.subarray(offset), kindToConstructor));
                offset += fieldValueBytesLength;
                break;
            case "object":
                ({value: fieldValue, length: fieldValueBytesLength} = deserializeObject(bytes.subarray(offset), kindToConstructor));
                offset += fieldValueBytesLength;
                break;
            default:
                if(!kindToConstructor) {
                    throw new Error(`kindToConstructor is required for primitive types`);
                }
                // Then fieldtype is a constructor
                const constructor = kindToConstructor(fieldType);
                if(!constructor) {
                    throw new Error(`Unsupported field type ${fieldType} - ${fieldType} is not a constructor`);
                }
                offset -= 1;
                fieldValue = constructor.fromUint8Array(bytes.subarray(offset));
                fieldValueBytesLength = fieldValue.toUint8Array().length;
                offset += fieldValueBytesLength;
                break;
        }
        llog.log(`  |---- deserialize.deserializeArray [fieldType: ${fieldType} - ${fieldValue}]`)
        items.push(fieldValue);
    }

    llog.log(`  |---- deserialize.deserializeArray [items: ${items}]`)
    return {
        value: items,
        length: offset,
    };
}

/**
 * Internal object deserialization - keeps object logic separate but within toObject
 * 
 * Format:
 * 1. Kind (varint) - NET_KINDS.PACKEDOBJECT or a primitive kind
 * 2. Object total length (varint) - length of remaining data
 * 3. Field names length (varint) - length of field names section
 * 4. Field values length (varint) - length of field values section
 * 5. Field names section:
 *    - Number of fields (varint)
 *    - For each field: field name as string (length-prefixed)
 * 6. Field values section:
 *    - Number of fields (varint)
 *    - For each field value:
 *      - Type byte (0x50-0x55)
 *      - Value bytes (format depends on type)
 * 
 * @param {Uint8Array} inputArray - The byte array to deserialize
 * @returns {{value: Object, length: number}} The deserialized object and total bytes consumed
 */
function deserializeObject(inputArray, kindToConstructor) {
    llog.log(`---| deserialize.deserializeObject. hex: ${uint8array.toHex(inputArray)}`);
    
    let offset = 0;

    // 1. Read kind
    const { value: kindValue, length: kindLength } = toVarInt(inputArray.subarray(offset));
    offset += kindLength;
    llog.log(`   |--- Kind: ${kindValue} (${NET_KINDS_ARRAY[kindValue]}) @ offset: ${offset}`);

    // Verify this is a PACKEDOBJECT
    if (kindValue !== NET_KINDS.PACKEDOBJECT) {
        throw new Error(`Invalid kind: ${kindValue} - Expected PACKEDOBJECT (${NET_KINDS.PACKEDOBJECT}), got ${NET_KINDS_ARRAY[kindValue] || 'UNKNOWN'}`);
    }

    // 2. Read object total length
    const { value: objectTotalLength, length: objectTotalLengthLength } = toVarInt(inputArray.subarray(offset));
    offset += objectTotalLengthLength;
    llog.log(`   |--- Object total length: ${objectTotalLength} @ offset: ${offset}`);

    // 3. Read field names length
    const { value: fieldNamesLength, length: fieldNamesLengthLength } = toVarInt(inputArray.subarray(offset));
    offset += fieldNamesLengthLength;
    llog.log(`   |--- Field names length: ${fieldNamesLength} @ offset: ${offset}`);

    // 4. Read field values length
    const { value: fieldValuesLength, length: fieldValuesLengthLength } = toVarInt(inputArray.subarray(offset));
    offset += fieldValuesLengthLength;
    llog.log(`   |--- Field values length: ${fieldValuesLength} @ offset: ${offset}`);

    // 5. Parse field names section
    const fieldNamesStartOffset = offset;
    
    // Read number of fields
    const { value: fieldsCount, length: fieldsCountLength } = toVarInt(inputArray.subarray(offset));
    offset += fieldsCountLength;
    llog.log(`   |--- Fields count: ${fieldsCount} @ offset: ${offset}`);

    // Read each field name
    const fieldNames = [];
    for (let i = 0; i < fieldsCount; i++) {
        const { value: fieldName, length: fieldNameLength } = toString(inputArray.subarray(offset));
        offset += fieldNameLength;
        fieldNames.push(fieldName);
        llog.log(`       |--- Field name [${i}]: "${fieldName}" @ offset: ${offset}`);
    }

    // Verify we consumed exactly fieldNamesLength bytes
    const actualFieldNamesLength = offset - fieldNamesStartOffset;
    if (actualFieldNamesLength !== fieldNamesLength) {
        throw new Error(`Field names length mismatch: expected ${fieldNamesLength}, got ${actualFieldNamesLength}`);
    }

    // 6. Parse field values section
    const fieldValuesStartOffset = offset;
    
    // Read number of field values (should match fieldsCount)
    const { value: fieldValuesCount, length: fieldValuesCountLength } = toVarInt(inputArray.subarray(offset));
    offset += fieldValuesCountLength;
    llog.log(`   |--- Field values count: ${fieldValuesCount} @ offset: ${offset}`);

    if (fieldValuesCount !== fieldsCount) {
        throw new Error(`Field count mismatch: names=${fieldsCount}, values=${fieldValuesCount}`);
    }

    // Read each field value
    const object = {};
    for (let i = 0; i < fieldsCount; i++) {
        const fieldName = fieldNames[i];
        
        // Read type byte
        const typeByte = inputArray[offset];
        offset += 1;
        const fieldType = fromTypeBytes(typeByte);
        llog.log(`       |--- Field [${i}] "${fieldName}" type: ${fieldType} (0x${typeByte.toString(16)}) @ offset: ${offset}`);

        // Read value based on type
        let fieldValue;
        let valueLength;

        switch (fieldType) {
            case 'string':
                ({ value: fieldValue, length: valueLength } = toString(inputArray.subarray(offset)));
                offset += valueLength;
                break;

            case 'varint':
                ({ value: fieldValue, length: valueLength } = toVarInt(inputArray.subarray(offset)));
                offset += valueLength;
                break;

            case 'bigint':
                ({ value: fieldValue, length: valueLength } = toVarBigInt(inputArray.subarray(offset)));
                offset += valueLength;
                break;

            case 'boolean':
                ({ value: fieldValue, length: valueLength } = toBoolean(inputArray.subarray(offset)));
                offset += valueLength;
                break;

            case 'array':
                // Arrays are prefixed with their length
                const { value: arrayBytesLength, length: arrayLengthPrefixLength } = toVarInt(inputArray.subarray(offset));
                offset += arrayLengthPrefixLength;
                ({ value: fieldValue, length: valueLength } = deserializeArray(inputArray.subarray(offset, offset + arrayBytesLength)));
                offset += valueLength;
                break;

            case 'object':
                // Objects are prefixed with their length
                const { value: objectBytesLength, length: objectLengthPrefixLength } = toVarInt(inputArray.subarray(offset));
                offset += objectLengthPrefixLength;
                ({ value: fieldValue, length: valueLength } = deserializeObject(inputArray.subarray(offset, offset + objectBytesLength)));
                offset += valueLength;
                break;

            default:
                throw new Error(`Unsupported field type: ${fieldType}`);
        }

        object[fieldName] = fieldValue;
        llog.log(`       |--- Field [${i}] "${fieldName}" value: ${json.stringify(fieldValue)} @ offset: ${offset}`);
    }

    // Verify we consumed exactly fieldValuesLength bytes
    const actualFieldValuesLength = offset - fieldValuesStartOffset;
    if (actualFieldValuesLength !== fieldValuesLength) {
        throw new Error(`Field values length mismatch: expected ${fieldValuesLength}, got ${actualFieldValuesLength}`);
    }

    // Calculate total length consumed
    // Total = kind + objectTotalLength prefix + fieldNamesLength prefix + fieldValuesLength prefix + fieldNames + fieldValues
    // Note: objectTotalLength value = fieldNamesLength + fieldValuesLength (doesn't include the length prefixes themselves)
    const totalLength = kindLength + objectTotalLengthLength + fieldNamesLengthLength + fieldValuesLengthLength + fieldNamesLength + fieldValuesLength;

    return {
        value: object,
        length: totalLength,
    };
}

/**
 * Main entry point for deserialization - handles both objects and arrays
 * @param {Uint8Array} inputArray - The byte array to deserialize
 * @param {Function} kindToConstructor - The function to convert a kind to a constructor
 * @returns {{value: Object|Array|*, length: number}} The deserialized value and total bytes consumed
 */
function toObject(inputArray, kindToConstructor) {
    llog.log(`---| deserialize.toObject. hex: ${uint8array.toHex(inputArray)}`);
    
    let offset = 0;

    // 1. Read kind to determine what type of data this is
    const { value: kindValue, length: kindLength } = toVarInt(inputArray.subarray(offset));
    llog.log(`   |--- toObject: Kind: ${kindValue} (${NET_KINDS_ARRAY[kindValue]})`);

    // Handle based on kind
    if (kindValue === NET_KINDS.PACKEDARRAY) {
        // It's an array, use internal array deserialization
        return deserializeArray(inputArray, kindToConstructor);
    } else if (kindValue === NET_KINDS.PACKEDOBJECT) {
        // It's an object, use internal object deserialization
        return deserializeObject(inputArray, kindToConstructor);
    } else if (NET_KINDS_ARRAY[kindValue]) {
        if(!kindToConstructor) {
            throw new Error(`kindToConstructor is required for primitive types - ${NET_KINDS_ARRAY[kindValue]}`);
        }
        // It's a primitive with a constructor
        const Constructor = kindToConstructor(NET_KINDS_ARRAY[kindValue]);
        if (Constructor) {
            const primitive = Constructor.fromUint8Array(inputArray);
            const primitiveBytes = primitive.toUint8Array();
            return {
                value: primitive,
                length: primitiveBytes.length,
            };
        }
    }
    
    // Unknown kind
    throw new Error(`Unknown kind: ${kindValue} (${NET_KINDS_ARRAY[kindValue] || 'UNKNOWN'})`);
}

export { toObject };
export default toObject;