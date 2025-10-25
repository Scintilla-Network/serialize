import { describe, it, expect } from '@scintilla-network/litest';
import { toString } from './toString.js';
import { fromString } from '../serialize/fromString.js';

describe('toString', () => {
    it('should deserialize an empty string', () => {
        const serialized = fromString('');
        const result = toString(serialized.value);
        expect(result.value).toBe('');
        expect(result.length).toBe(serialized.length);
    });

    it('should deserialize a single character', () => {
        const original = 'a';
        const serialized = fromString(original);
        const result = toString(serialized.value);
        expect(result.value).toBe(original);
        expect(result.length).toBe(serialized.length);
    });

    it('should deserialize a simple string', () => {
        const original = 'hello';
        const serialized = fromString(original);
        const result = toString(serialized.value);
        expect(result.value).toBe(original);
        expect(result.length).toBe(serialized.length);
    });

    it('should deserialize a string with spaces', () => {
        const original = 'Hello World!';
        const serialized = fromString(original);
        const result = toString(serialized.value);
        expect(result.value).toBe(original);
        expect(result.length).toBe(serialized.length);
    });

    it('should deserialize a string with unicode', () => {
        const original = 'hello🌟';
        const serialized = fromString(original);
        const result = toString(serialized.value);
        expect(result.value).toBe(original);
        expect(result.length).toBe(serialized.length);
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

