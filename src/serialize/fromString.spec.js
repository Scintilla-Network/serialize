import { describe, it, expect } from '@scintilla-network/litest';
import { fromString } from './fromString.js';
import { toString } from '../deserialize/toString.js';
import { uint8array } from '@scintilla-network/keys/utils';

describe('fromString', () => {
    it('should serialize an empty string', () => {
        const result = fromString('');
        expect(result.value).toBeInstanceOf(Uint8Array);
        expect(result.length).toBe(1);
        expect(uint8array.toHex(result.value)).toBe('00');
    });

    it('should serialize a single character', () => {
        const result = fromString('a');
        expect(result.length).toBe(2); // 1 byte length + 1 byte char
        expect(uint8array.toHex(result.value)).toBe('0161');
    });

    it('should serialize a simple string', () => {
        const result = fromString('hello');
        expect(result.length).toBe(6); // 1 byte length + 5 bytes
        expect(uint8array.toHex(result.value)).toBe('0568656c6c6f');
    });

    it('should serialize a string with unicode', () => {
        const result = fromString('hello🌟');
        expect(result.value).toBeInstanceOf(Uint8Array);
        expect(result.length).toBe(result.value.length);
    });

    it('should round-trip correctly', () => {
        const testStrings = ['', 'a', 'hello', 'test123', 'Hello World!', '🌟🎉'];
        
        testStrings.forEach(str => {
            const serialized = fromString(str);
            const deserialized = toString(serialized.value);
            expect(deserialized.value).toBe(str);
            expect(deserialized.length).toBe(serialized.length);
        });
    });

    it('should handle long strings', () => {
        const longString = 'a'.repeat(1000);
        const serialized = fromString(longString);
        const deserialized = toString(serialized.value);
        expect(deserialized.value).toBe(longString);
    });
});

