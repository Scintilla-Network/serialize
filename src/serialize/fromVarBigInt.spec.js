import { describe, it, expect } from '@scintilla-network/litest';
import { fromVarBigInt } from './fromVarBigInt.js';
import { toVarBigInt } from '../deserialize/toVarBigInt.js';
import { uint8array } from '@scintilla-network/keys/utils';

describe('fromVarBigInt', () => {
    it('should serialize zero', () => {
        const result = fromVarBigInt(0n);
        expect(result.value).toBeInstanceOf(Uint8Array);
        expect(result.length).toBe(1);
        expect(uint8array.toHex(result.value)).toBe('00');
    });

    it('should serialize small bigints', () => {
        const result1 = fromVarBigInt(1n);
        expect(result1.length).toBe(1);
        expect(uint8array.toHex(result1.value)).toBe('01');

        const result127 = fromVarBigInt(127n);
        expect(result127.length).toBe(1);
        expect(uint8array.toHex(result127.value)).toBe('7f');
    });

    it('should round-trip correctly', () => {
        const testBigInts = [
            0n, 1n, 127n, 128n, 255n, 256n, 
            1000n, 10000n, 100000n, 1000000n,
            BigInt(Number.MAX_SAFE_INTEGER)
        ];
        
        testBigInts.forEach(num => {
            const serialized = fromVarBigInt(num);
            const deserialized = toVarBigInt(serialized.value);
            expect(deserialized.value).toBe(num);
            expect(deserialized.length).toBe(serialized.length);
        });
    });

    it('should handle very large bigints', () => {
        const veryLarge = 100000000000000000000000000n;
        const serialized = fromVarBigInt(veryLarge);
        const deserialized = toVarBigInt(serialized.value);
        expect(deserialized.value).toBe(veryLarge);
    });
});

