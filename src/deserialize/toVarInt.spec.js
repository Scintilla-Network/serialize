import { describe, it, expect } from '@scintilla-network/litest';
import { toVarInt } from './toVarInt.js';
import { fromVarInt } from '../serialize/fromVarInt.js';

describe('toVarInt', () => {
    it('should deserialize zero', () => {
        const serialized = fromVarInt(0);
        const result = toVarInt(serialized.value);
        expect(result.value).toBe(0);
        expect(result.length).toBe(serialized.length);
    });

    it('should deserialize small numbers', () => {
        const result1 = fromVarInt(1);
        const deserialized1 = toVarInt(result1.value);
        expect(deserialized1.value).toBe(1);
        expect(deserialized1.length).toBe(1);

        const result127 = fromVarInt(127);
        const deserialized127 = toVarInt(result127.value);
        expect(deserialized127.value).toBe(127);
        expect(deserialized127.length).toBe(1);
    });

    it('should deserialize medium numbers', () => {
        const result128 = fromVarInt(128);
        const deserialized128 = toVarInt(result128.value);
        expect(deserialized128.value).toBe(128);

        const result255 = fromVarInt(255);
        const deserialized255 = toVarInt(result255.value);
        expect(deserialized255.value).toBe(255);
    });

    it('should round-trip correctly', () => {
        const testNumbers = [0, 1, 127, 128, 255, 256, 1000, 10000, 100000, 1000000];
        
        testNumbers.forEach(num => {
            const serialized = fromVarInt(num);
            const deserialized = toVarInt(serialized.value);
            expect(deserialized.value).toBe(num);
            expect(deserialized.length).toBe(serialized.length);
        });
    });

    it('should handle large numbers', () => {
        const largeNum = 2147483647; // max 32-bit signed int
        const serialized = fromVarInt(largeNum);
        const deserialized = toVarInt(serialized.value);
        expect(deserialized.value).toBe(largeNum);
    });
});

