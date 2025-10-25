import { json, uint8array } from '@scintilla-network/keys/utils';
import { NET_KINDS } from '../NET_KINDS.js';
import { llog } from '../llog.js';
import { fromString } from './fromString.js';

import {fromVarInt} from './fromVarInt.js';
import {fromVarBigInt} from './fromVarBigInt.js';
import {fromBoolean} from './fromBoolean.js';


function sortObjectFieldsByName(fields){
    return fields.sort((a, b) => {
        if(a < b) {
            return -1;
        }
        if(a > b) {
            return 1;
        }
        return 0;
    });
}

function extractObjectFields(input) {
    const fields = Object.keys(input);
    const sortedFields = sortObjectFieldsByName(fields);
    const fieldsTypes = sortedFields.map(field => {
        const type = typeof input[field];

        switch(type){
            case 'boolean':
                return 'boolean';
            case 'bigint':
                return 'bigint';
            case 'object':
                if (Array.isArray(input[field])) {
                    return 'array';
                }
                return 'object';
            case 'number':
                return 'varint';
            default:
                return type;
        }
    });
    const fieldsValues = sortedFields.map(field => input[field]);
    return { fields: sortedFields, fieldsTypes, fieldsValues };
}

function getTypeBytes(type){
    switch(type){
        case "string":
            return new Uint8Array([80]); // 0x50
        case "varint":
            return new Uint8Array([81]); // 0x51
        case "bigint":
            return new Uint8Array([82]); // 0x52
        case "array":
            return new Uint8Array([83]); // 0x53
        case "object":
            return new Uint8Array([84]); // 0x54
        case "boolean":
            return new Uint8Array([85]); // 0x55
        default:
            throw new Error(`Unsupported field type ${type}`);
    }

}


function serializeFields(input){
    llog.log(`   |---| serializeFieldPart. input: ${json.stringify(input)}`);
    const {fields, fieldsTypes, fieldsValues} = extractObjectFields(input);
    const fieldsBytes = [];

    for(let i = 0; i < fields.length; i++){
        const fieldType = fieldsTypes[i];
        const fieldTypeBytes = getTypeBytes(fieldType);
        llog.log(`       |---- serialize.fromObject [fieldTypeBytes: ${uint8array.toHex(fieldTypeBytes)}]`);

        const fieldValue = fieldsValues[i];
        const fieldValueBytes = fromString(fieldValue);
        llog.log(`       |---- serialize.fromObject [fieldValueBytes: ${uint8array.toHex(fieldValueBytes.value)}]`);
        fieldsBytes.push(new Uint8Array([...fieldTypeBytes, ...fieldValueBytes.value]));
    }

    llog.log(`   |---- serialize.fromObject [fieldsBytes: ${uint8array.toHex(fieldsBytes.reduce((acc, value) => acc = new Uint8Array([...acc, ...value]), new Uint8Array()))}]`);
    return fieldsBytes;
}

function serializeFieldValues(input){
    llog.log(`   |---- serialize.fromObject [serializeFieldValues. input: ${json.stringify(input)}]`);
}

/**
 * Internal helper to get field type information for array items
 */
function getFieldTypeBytes(item){
    const result = {
        bytes: new Uint8Array([]),
        length: 0,
        type: null,
    }
    const type = typeof item;
    switch(type){
        case "string":
            result.bytes = new Uint8Array([80]); // 0x50
            result.length = result.bytes.length;
            result.type = "string";
            return result;
        case "varint":
        case "number":
            result.bytes = new Uint8Array([81]); // 0x51
            result.length = result.bytes.length;
            result.type = "varint";
            return result;
        case "bigint":
            result.bytes = new Uint8Array([82]); // 0x52
            result.length = result.bytes.length;
            result.type = "bigint";
            return result;
        case "boolean":
            result.bytes = new Uint8Array([85]); // 0x55
            result.length = result.bytes.length;
            result.type = "boolean";
            return result;
        case "object":
        case "array":
            if (Array.isArray(item)) {
                result.bytes = new Uint8Array([83]); // 0x53
                result.length = result.bytes.length;
                result.type = "array";
                return result;
            }
            result.bytes = new Uint8Array([84]); // 0x54
            result.length = result.bytes.length;
            result.type = "object";
            return result;
        default:
            throw new Error(`Unsupported item type ${type}`);
    }

    return result;
}

/**
 * Internal array serialization - keeps array logic separate but within fromObject
 */
function serializeArray(input) {
    if(!Array.isArray(input)) {
        throw new Error('Input is not an array');
    }

     // Set kind for all array's bytes
    let kindBytes = new Uint8Array([NET_KINDS.PACKEDARRAY]);
    const kindLength = kindBytes.length;

     // How many items
    let itemsAmountBytes = new Uint8Array([fromVarInt(input.length).value]);
    const itemsAmountBytesLength = itemsAmountBytes.length;

    llog.log(`  |---- serialize.serializeArray [input length: ${input.length}] -- ${(json.stringify(input))}`);

    let itemsBytes = [];
    for(let item of input) {
        let itemBytes;

         const {bytes: fieldType, length: fieldTypeLength, type: fieldTypeType} = getFieldTypeBytes(item);
            llog.log(`  |---- serialize.serializeArray [fieldType: ${fieldTypeType} - ${uint8array.toHex(fieldType)}]`)

        if(item && item.kind){
            const primitivesBytes = item.toUint8Array();
            itemBytes = new Uint8Array([...primitivesBytes]);
        } else {
            switch(fieldTypeType){
                case "string":
                    itemBytes = new Uint8Array([...fieldType, ...fromString(item).value]);
                    break;
                case "varint":
                    itemBytes = new Uint8Array([...fieldType, ...fromVarInt(item).value]);
                    break;
                case "bigint":
                case "varbigint":
                    itemBytes = new Uint8Array([...fieldType, ...fromVarBigInt(item).value]);
                    break;
                case "boolean":
                    itemBytes = new Uint8Array([...fieldType, ...fromBoolean(item).value]);
                    break;
                case "array":
                    itemBytes = new Uint8Array([...fieldType, ...serializeArray(item).value]);
                    break;
                case "object":
                    itemBytes = new Uint8Array([...fieldType, ...serializeObject(item).value]);
                    break;
            }
        }

        llog.log(`  |---- serialize.serializeArray [itemBytes: ${uint8array.toHex(itemBytes)}]`)
        itemsBytes.push(itemBytes);
    }

    llog.log(`  |---- serialize.serializeArray [itemsBytes: ${uint8array.toHex(itemsBytes.reduce((acc, value) => acc = new Uint8Array([...acc, ...value]), new Uint8Array()))}]`)

    itemsBytes = itemsBytes.reduce((acc, value) => acc = new Uint8Array([...acc, ...value]), new Uint8Array());
    // Announce how many bytes long will itemsBytes be
    const itemBytesLengthBytes = fromVarInt(itemsBytes.length).value;
    const resultBytes = new Uint8Array([...kindBytes, ...itemsAmountBytes, ...itemBytesLengthBytes,...itemsBytes]);
    llog.log(`  |---- serialize.serializeArray [resultBytes: ${uint8array.toHex(resultBytes)}] - length: ${resultBytes.length}`)
    return {
        value: resultBytes,
        length: resultBytes.length,
    };
}

/**
 * Internal object serialization - keeps object logic separate but within fromObject
 */
function serializeObject(input) {
    // Set kind for all object`s bytes
    let kindBytes = new Uint8Array([NET_KINDS.PACKEDOBJECT]);
    const kindLength = kindBytes.length;

    // We say how many bytes long it will be
    // const {value: objectByteTotalLengthBytes} = fromVarInt(0);
    // objectBytes = new Uint8Array([...objectBytes, ...objectByteTotalLengthBytes]);
    // Size of object bytes
    // Number of field in object


    // How many fields
    // For each field: 
        // Field name length 
        // Field name

    // Size of upcomming field value bytes
    // For each field value
        // field value type
        // field value bytes
    // Total length
    // Result
    
    const { fields, fieldsTypes, fieldsValues } = extractObjectFields(input);
    // We start the names bytes by how many fiels they are
    let fieldNamesBytes = new Uint8Array([fromVarInt(fields.length).value]);
    let fieldOffset = 0;
    for(let fieldName of fields){
        const {value: fieldNameBytes, length: fieldNameBytesLength} = fromString(fieldName);
        llog.log(` ---| serialize.fromObject [field: ${fieldName}]: fieldNameBytes: ${uint8array.toHex(fieldNameBytes)} - ${uint8array.stringify(fieldNameBytes)}]`)
        fieldOffset += fieldNameBytesLength;
        fieldNamesBytes = new Uint8Array([...fieldNamesBytes, ...fieldNameBytes]);
    }

    // We start the values bytes by how many fiels they are
    let fieldValuesBytes = new Uint8Array([fromVarInt(fields.length).value]);
    fieldOffset = 0;
    let i = 0;
    for(let fieldValue of fieldsValues){
        let fieldValueBytes = new Uint8Array([]);
        switch(fieldsTypes[i]){
            case 'string':
               fieldValueBytes = fromString(fieldValue).value;
                break;
            case 'bigint':
                fieldValueBytes = fromVarBigInt(fieldValue).value;
                break;
            case 'varint':
                fieldValueBytes = fromVarInt(fieldValue).value;
                break;
            case 'boolean':
                fieldValueBytes = fromBoolean(fieldValue).value;
                break;
            case 'array':
                const {value: arrayBytes, length: arrayBytesLength} = serializeArray(fieldValue)
                fieldValueBytes = [...fromVarInt(arrayBytesLength).value, ...arrayBytes];
                break;
            case 'object':
                const {value: objectBytes, length: objectBytesLength} = serializeObject(fieldValue)
                fieldValueBytes = [...fromVarInt(objectBytesLength).value, ...objectBytes];
                break;
            default:
                throw new Error(`Unsupported field type ${fieldsTypes[i]}`);
        }

        fieldValuesBytes = new Uint8Array([...fieldValuesBytes, ...getTypeBytes(fieldsTypes[i]), ...fieldValueBytes]);
        i++;
    }

    const {value: fieldNamesLengthBytes} = fromVarInt(fieldNamesBytes.length);
    const {value: fieldValuesLengthBytes} = fromVarInt(fieldValuesBytes.length);
    const {value: objectBytesLengthBytes} = fromVarInt(fieldNamesBytes.length + fieldValuesBytes.length);

    const objectBytesLength = kindLength + objectBytesLengthBytes.length + fieldNamesLengthBytes.length + fieldValuesLengthBytes.length + fieldNamesBytes.length + fieldValuesBytes.length;
    const totalLength = objectBytesLength;
    const objectBytes = new Uint8Array(totalLength);

    let offset = 0;
    // We start an object with the kind of packed object
    objectBytes.set(kindBytes, offset);
    offset += kindLength;
    // How long will the object total be?
    objectBytes.set(objectBytesLengthBytes, offset);
    offset += objectBytesLengthBytes.length;
    // How long will the field names be
    objectBytes.set(fieldNamesLengthBytes, offset);
    offset += fieldNamesLengthBytes.length;
    // How long will the field values be
    objectBytes.set(fieldValuesLengthBytes, offset);
    offset += fieldValuesLengthBytes.length;
    // The field names bytes starting with how many fields
    objectBytes.set(fieldNamesBytes, offset);
    offset += fieldNamesBytes.length;

    // The field values bytes starting with how many fields
    objectBytes.set(fieldValuesBytes, offset);
    offset += fieldValuesBytes.length;

    return {
        value: objectBytes,
        length: objectBytes.length,
    }
}

/**
 * Main entry point for serialization - handles both objects and arrays
 * @param {Object|Array} input - The object or array to serialize
 * @returns {{value: Uint8Array, length: number}}
 */
function fromObject(input) {
    llog.log(`---| serialize.fromObject [input: ${json.stringify(input)}]`);
    
    // If input is a primitive with a kind property, use its toUint8Array method
    if(input && input.kind){
        const primitivesBytes = input.toUint8Array();
        return {
            value: primitivesBytes,
            length: primitivesBytes.length,
        }
    }
    
    // If input is an array, use internal array serialization
    if (Array.isArray(input)) {
        return serializeArray(input);
    }

    // Otherwise, serialize as object
    return serializeObject(input);
}

export { fromObject }
export default fromObject