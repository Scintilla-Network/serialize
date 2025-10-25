import { describe, it, expect } from '@scintilla-network/litest';
import { toVarBigInt } from './toVarBigInt.js';
import { fromVarBigInt } from '../serialize/fromVarBigInt.js';

describe('toVarBigInt', () => {
    it('should deserialize zero', () => {
        const serialized = fromVarBigInt(0n);
        const result = toVarBigInt(serialized.value);
        expect(result.value).toBe(0n);
        expect(result.length).toBe(serialized.length);
    });

    it('should deserialize small bigints', () => {
        const result1 = fromVarBigInt(1n);
        const deserialized1 = toVarBigInt(result1.value);
        expect(deserialized1.value).toBe(1n);
        expect(deserialized1.length).toBe(1);

        const result127 = fromVarBigInt(127n);
        const deserialized127 = toVarBigInt(result127.value);
        expect(deserialized127.value).toBe(127n);
        expect(deserialized127.length).toBe(1);
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

