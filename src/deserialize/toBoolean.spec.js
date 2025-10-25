import { describe, it, expect } from '@scintilla-network/litest';

import { toBoolean } from './toBoolean.js';
import { fromBoolean } from '../serialize/fromBoolean.js';

describe('toBoolean', () => {
    it('should deserialize false', () => {
        const serialized = fromBoolean(false);
        const result = toBoolean(serialized.value);
        expect(result.value).toBe(false);
        expect(result.length).toBe(1);
    });

    it('should deserialize true', () => {
        const serialized = fromBoolean(true);
        const result = toBoolean(serialized.value);
        expect(result.value).toBe(true);
        expect(result.length).toBe(1);
    });

    it('should round-trip correctly', () => {
        const testBooleans = [false, true];
        
        testBooleans.forEach(bool => {
            const serialized = fromBoolean(bool);
            const deserialized = toBoolean(serialized.value);
            expect(deserialized.value).toBe(bool);
            expect(deserialized.length).toBe(serialized.length);
        });
    });
});

