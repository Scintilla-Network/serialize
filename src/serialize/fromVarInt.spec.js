import { describe, it, expect } from '@scintilla-network/litest';
import { fromVarInt } from './fromVarInt.js';
import { toVarInt } from '../deserialize/toVarInt.js';
import { uint8array } from '@scintilla-network/keys/utils';

describe('fromVarInt', () => {
    it('should serialize zero', () => {
        const result = fromVarInt(0);
        expect(result.value).toBeInstanceOf(Uint8Array);
        expect(result.length).toBe(1);
        expect(uint8array.toHex(result.value)).toBe('00');
    });

    it('should serialize small numbers', () => {
        const result1 = fromVarInt(1);
        expect(result1.length).toBe(1);
        expect(uint8array.toHex(result1.value)).toBe('01');

        const result127 = fromVarInt(127);
        expect(result127.length).toBe(1);
        expect(uint8array.toHex(result127.value)).toBe('7f');
    });

    it('should serialize medium numbers', () => {
        const result128 = fromVarInt(128);
        expect(result128.length).toBe(1); // 0x80
        
        const result252 = fromVarInt(252);
        expect(result252.length).toBe(1); // 0xFC
        
        const result253 = fromVarInt(253);
        expect(result253.length).toBe(3); // 0xFD + 2 bytes
        
        const result255 = fromVarInt(255);
        expect(result255.length).toBe(3); // 0xFD + 2 bytes
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

