import { describe, it, expect } from '@scintilla-network/litest';
import { fromBoolean } from './fromBoolean.js';
import { toBoolean } from '../deserialize/toBoolean.js';
import { uint8array } from '@scintilla-network/keys/utils';

describe('fromBoolean', () => {
    it('should serialize false', () => {
        const result = fromBoolean(false);
        expect(result.value).toBeInstanceOf(Uint8Array);
        expect(result.length).toBe(1);
        expect(uint8array.toHex(result.value)).toBe('00');
    });

    it('should serialize true', () => {
        const result = fromBoolean(true);
        expect(result.value).toBeInstanceOf(Uint8Array);
        expect(result.length).toBe(1);
        expect(uint8array.toHex(result.value)).toBe('01');
    });

    it('should round-trip false', () => {
        const serialized = fromBoolean(false);
        const deserialized = toBoolean(serialized.value);
        expect(deserialized.value).toBe(false);
        expect(deserialized.length).toBe(serialized.length);
    });

    it('should round-trip true', () => {
        const serialized = fromBoolean(true);
        const deserialized = toBoolean(serialized.value);
        expect(deserialized.value).toBe(true);
        expect(deserialized.length).toBe(serialized.length);
    });
});

