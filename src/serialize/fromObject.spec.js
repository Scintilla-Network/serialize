import { describe, it, expect } from '@scintilla-network/litest';
import { fromObject } from './fromObject.js';

describe('fromObject', () => {
    it('should serialize an empty object', () => {
        const result = fromObject({});
        expect(result.value).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(0);
    });

    it('should serialize object with string field', () => {
        const result = fromObject({ name: 'test' });
        expect(result.value).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(0);
    });

    it('should serialize object with number field', () => {
        const result = fromObject({ count: 42 });
        expect(result.value).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(0);
    });

    it('should serialize object with bigint field', () => {
        const result = fromObject({ amount: 1000n });
        expect(result.value).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(0);
    });

    it('should serialize object with array field', () => {
        const result = fromObject({ items: [1, 2, 3] });
        expect(result.value).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(0);
    });

    it('should serialize object with nested object', () => {
        const result = fromObject({ nested: { value: 42 } });
        expect(result.value).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(0);
    });

    it('should serialize complex nested structure', () => {
        const obj = {
            name: 'test',
            data: {
                values: [1, 2, 3],
                meta: { id: 42 }
            }
        };
        const result = fromObject(obj);
        expect(result.value).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(0);
    });

    it('should serialize object with array of objects', () => {
        const result = fromObject({ items: [{ a: 1 }, { b: 2 }] });
        expect(result.value).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(0);
    });

    it('should serialize array of objects (the failing case)', () => {
        const obj = [{ a: [{ b: 3 }] }];
        const result = fromObject(obj);
        expect(result.value).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(0);
    });

    it('should serialize object with boolean fields', () => {
        const result = fromObject({ isActive: true, isDeleted: false, count: 42 });
        expect(result.value).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(0);
    });

    it('should serialize object with mixed types including booleans', () => {
        const obj = {
            name: 'test',
            active: true,
            count: 42,
            amount: 1000n,
            flags: [true, false, true]
        };
        const result = fromObject(obj);
        expect(result.value).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(0);
    });
});



describe('fromObject with array', () => {
    it('should serialize an empty array', () => {
        const result = fromObject([]);
        expect(result.value).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(0);
    });

    it('should serialize array of numbers', () => {
        const result = fromObject([1, 2, 3]);
        expect(result.value).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(0);
    });

    it('should serialize array of strings', () => {
        const result = fromObject(['a', 'b', 'c']);
        expect(result.value).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(0);
    });

    it('should serialize array of bigints', () => {
        const result = fromObject([1n, 2n, 3n]);
        expect(result.value).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(0);
    });

    it('should serialize mixed type array', () => {
        const result = fromObject([1, 'hello', 100n]);
        expect(result.value).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(0);
    });

    it('should serialize nested arrays', () => {
        const result = fromObject([[1, 2], [3, 4]]);
        expect(result.value).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(0);
    });

    it('should serialize array of objects', () => {
        const result = fromObject([{ a: 1 }, { b: 2 }]);
        expect(result.value).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(0);
    });

    it('should serialize array of booleans', () => {
        const result = fromObject([true, false, true]);
        expect(result.value).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(0);
    });

    it('should serialize mixed array with booleans', () => {
        const result = fromObject([true, 42, 'test', false, 1000n]);
        expect(result.value).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(0);
    });
});
