import { describe, it, expect } from '@scintilla-network/litest';
import { toObject } from './toObject.js';
import { fromObject } from '../serialize/fromObject.js';

describe('toObject', () => {
    it('should deserialize an empty object', () => {
        const original = {};
        const serialized = fromObject(original);
        const result = toObject(serialized.value);
        expect(result.value).toEqual(original);
        expect(result.length).toBe(serialized.length);
    });

    it('should deserialize object with string field', () => {
        const original = { name: 'test' };
        const serialized = fromObject(original);
        const result = toObject(serialized.value);
        expect(result.value).toEqual(original);
        expect(result.length).toBe(serialized.length);
    });

    it('should deserialize object with number field', () => {
        const original = { count: 42 };
        const serialized = fromObject(original);
        const result = toObject(serialized.value);
        expect(result.value).toEqual(original);
        expect(result.length).toBe(serialized.length);
    });

    it('should deserialize object with bigint field', () => {
        const original = { amount: 1000n };
        const serialized = fromObject(original);
        const result = toObject(serialized.value);
        expect(result.value).toEqual(original);
        expect(result.length).toBe(serialized.length);
    });

    it('should deserialize object with multiple fields', () => {
        const original = { name: 'test', count: 42, amount: 1000n };
        const serialized = fromObject(original);
        const result = toObject(serialized.value);
        expect(result.value).toEqual(original);
        expect(result.length).toBe(serialized.length);
    });

    it('should deserialize object with array', () => {
        const original = { items: [1, 2, 3] };
        const serialized = fromObject(original);
        const result = toObject(serialized.value);
        expect(result.value).toEqual(original);
        expect(result.length).toBe(serialized.length);
    });

    it('should deserialize nested object', () => {
        const original = { nested: { value: 42 } };
        const serialized = fromObject(original);
        const result = toObject(serialized.value);
        expect(result.value).toEqual(original);
        expect(result.length).toBe(serialized.length);
    });

    it('should deserialize complex nested structure', () => {
        const original = {
            name: 'test',
            data: {
                values: [1, 2, 3],
                meta: { id: 42 }
            }
        };
        const serialized = fromObject(original);
        const result = toObject(serialized.value);
        expect(result.value).toEqual(original);
        expect(result.length).toBe(serialized.length);
    });

    it('should deserialize object with array of objects', () => {
        const original = { items: [{ a: 1 }, { b: 2 }] };
        const serialized = fromObject(original);
        const result = toObject(serialized.value);
        expect(result.value).toEqual(original);
        expect(result.length).toBe(serialized.length);
    });

    it('should deserialize array of objects (the failing case)', () => {
        const original = [{ a: [{ b: 3 }] }];
        const serialized = fromObject(original);
        const result = toObject(serialized.value);
        expect(result.value).toEqual(original);
        expect(result.length).toBe(serialized.length);
    });

    it('should correctly calculate length', () => {
        const original = { a: 1, b: 'test', c: 100n };
        const serialized = fromObject(original);
        const result = toObject(serialized.value);
        
        // The length should match exactly what was serialized
        expect(result.length).toBe(serialized.length);
        expect(result.value).toEqual(original);
        
        // Verify we consumed exactly the right number of bytes
        expect(result.length).toBe(serialized.value.length);
    });

    it('should handle objects with sorted field names', () => {
        // Fields should be sorted alphabetically during serialization
        const original = { z: 1, a: 2, m: 3 };
        const serialized = fromObject(original);
        const result = toObject(serialized.value);
        expect(result.value).toEqual(original);
    });

    it('should deserialize deeply nested structures', () => {
        const original = {
            level1: {
                level2: {
                    level3: {
                        value: 'deep'
                    }
                }
            }
        };
        const serialized = fromObject(original);
        const result = toObject(serialized.value);
        expect(result.value).toEqual(original);
        expect(result.length).toBe(serialized.length);
    });

    it('should deserialize object with boolean fields', () => {
        const original = { isActive: true, isDeleted: false, count: 42 };
        const serialized = fromObject(original);
        const result = toObject(serialized.value);
        expect(result.value.isActive).toBe(true);
        expect(result.value.isDeleted).toBe(false);
        expect(result.value.count).toBe(42);
        expect(result.length).toBe(serialized.length);
    });

    it('should deserialize object with mixed types including booleans', () => {
        const original = {
            name: 'test',
            active: true,
            count: 42,
            amount: 1000n,
            flags: [true, false, true]
        };
        const serialized = fromObject(original);
        const result = toObject(serialized.value);
        expect(result.value.name).toBe('test');
        expect(result.value.active).toBe(true);
        expect(result.value.count).toBe(42);
        expect(result.value.amount).toBe(1000n);
        expect(result.value.flags).toEqual([true, false, true]);
        expect(result.length).toBe(serialized.length);
    });
});

describe('toObject with array', () => {
    it('should deserialize an empty array', () => {
        const serialized = fromObject([]);
        const result = toObject(serialized.value);
        expect(result.value).toBeInstanceOf(Array);
        expect(result.value.length).toBe(0);
        expect(result.length).toBe(serialized.length);
    });

    it('should deserialize array of numbers', () => {
        const original = [1, 2, 3];
        const serialized = fromObject(original);
        const result = toObject(serialized.value);
        expect(result.value).toEqual(original);
        expect(result.length).toBe(serialized.length);
    });

    it('should deserialize array of strings', () => {
        const original = ['hello', 'world', 'test'];
        const serialized = fromObject(original);
        const result = toObject(serialized.value);
        expect(result.value).toEqual(original);
        expect(result.length).toBe(serialized.length);
    });

    it('should deserialize array of bigints', () => {
        const original = [1n, 100n, 10000n];
        const serialized = fromObject(original);
        const result = toObject(serialized.value);
        expect(result.value).toEqual(original);
        expect(result.length).toBe(serialized.length);
    });

    it('should deserialize mixed type array', () => {
        const original = [42, 'test', 100n];
        const serialized = fromObject(original);
        const result = toObject(serialized.value);
        expect(result.value).toEqual(original);
        expect(result.length).toBe(serialized.length);
    });

    it('should deserialize nested arrays', () => {
        const original = [[1, 2], [3, 4]];
        const serialized = fromObject(original);
        const result = toObject(serialized.value);
        expect(result.value).toEqual(original);
        expect(result.length).toBe(serialized.length);
    });

    it('should deserialize deeply nested arrays', () => {
        const original = [[[1, 2]], [[3, 4]]];
        const serialized = fromObject(original);
        const result = toObject(serialized.value);
        expect(result.value).toEqual(original);
        expect(result.length).toBe(serialized.length);
    });

    it('should deserialize array with single element', () => {
        const original = [42];
        const serialized = fromObject(original);
        const result = toObject(serialized.value);
        expect(result.value).toEqual(original);
        expect(result.length).toBe(serialized.length);
    });

    it('should deserialize array of objects', () => {
        const original = [{ a: 1 }, { b: 2 }];
        const serialized = fromObject(original);
        const result = toObject(serialized.value);
        expect(result.value).toEqual(original);
        expect(result.length).toBe(serialized.length);
    });

    it('should deserialize array with nested objects', () => {
        const original = [{ nested: { value: 42 } }];
        const serialized = fromObject(original);
        const result = toObject(serialized.value);
        expect(result.value).toEqual(original);
        expect(result.length).toBe(serialized.length);
    });

    it('should deserialize array with mixed nested structures', () => {
        const original = [
            { a: 1 },
            [2, 3],
            'string',
            100n,
            { nested: [4, 5] }
        ];
        const serialized = fromObject(original);
        const result = toObject(serialized.value);
        expect(result.value).toEqual(original);
        expect(result.length).toBe(serialized.length);
    });

    it('should deserialize large array', () => {
        const original = Array.from({ length: 100 }, (_, i) => i);
        const serialized = fromObject(original);
        const result = toObject(serialized.value);
        expect(result.value).toEqual(original);
        expect(result.length).toBe(serialized.length);
    });

    it('should deserialize array with empty strings', () => {
        const original = ['', 'test', ''];
        const serialized = fromObject(original);
        const result = toObject(serialized.value);
        expect(result.value).toEqual(original);
        expect(result.length).toBe(serialized.length);
    });

    it('should deserialize array with zero values', () => {
        const original = [0, 0n, 1, 2];
        const serialized = fromObject(original);
        const result = toObject(serialized.value);
        expect(result.value).toEqual(original);
        expect(result.length).toBe(serialized.length);
    });

    it('should deserialize complex nested structure (the original failing case)', () => {
        const original = [{ a: [{ b: 3 }] }];
        const serialized = fromObject(original);
        const result = toObject(serialized.value);
        expect(result.value).toEqual(original);
        expect(result.length).toBe(serialized.length);
    });

    it('should correctly calculate length for nested structures', () => {
        const original = [[1, 2, 3], [4, 5, 6]];
        const serialized = fromObject(original);
        const result = toObject(serialized.value);
        
        // The length should match exactly what was serialized
        expect(result.length).toBe(serialized.length);
        expect(result.value).toEqual(original);
        
        // Verify we consumed exactly the right number of bytes
        expect(result.length).toBe(serialized.value.length);
    });

    it('should handle array with multiple object types', () => {
        const original = [
            { id: 1, name: 'first' },
            { id: 2, name: 'second', extra: 'field' },
            { id: 3 }
        ];
        const serialized = fromObject(original);
        const result = toObject(serialized.value);
        expect(result.value).toEqual(original);
        expect(result.length).toBe(serialized.length);
    });

    it('should deserialize array of booleans', () => {
        const original = [true, false, true, false];
        const serialized = fromObject(original);
        const result = toObject(serialized.value);
        expect(result.value).toEqual(original);
        expect(result.length).toBe(serialized.length);
    });

    it('should deserialize mixed array with booleans', () => {
        const original = [true, 42, 'test', false, 1000n, [true, false]];
        const serialized = fromObject(original);
        const result = toObject(serialized.value);
        expect(result.value).toEqual(original);
        expect(result.length).toBe(serialized.length);
    });
});



