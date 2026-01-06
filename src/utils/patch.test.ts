import { describe, it, expect } from 'vitest';
import { parsePatch } from './patch';

describe('patch parsing logic', () => {
    it('returns empty for undefined patch', () => {
        expect(parsePatch(undefined)).toEqual({ oldValue: '', newValue: '', isEmpty: true });
    });

    it('correctly separates added lines', () => {
        const patch = '@@ -1,1 +1,2 @@\n context\n+new line';
        const result = parsePatch(patch);
        expect(result.oldValue).toBe('context');
        expect(result.newValue).toBe('context\nnew line');
    });

    it('correctly separates removed lines', () => {
        const patch = '@@ -1,2 +1,1 @@\n context\n-old line';
        const result = parsePatch(patch);
        expect(result.oldValue).toBe('context\nold line');
        expect(result.newValue).toBe('context');
    });

    it('handles multiple chunks with spacing', () => {
        const patch = '@@ -1,1 +1,1 @@\n line1\n@@ -10,1 +10,1 @@\n line10';
        const result = parsePatch(patch);
        // Should have a space between chunks for visual separation
        expect(result.oldValue).toContain('line1\n \nline10');
        expect(result.newValue).toContain('line1\n \nline10');
    });

    it('handles mixed content changes', () => {
        const patch = `@@ -1,4 +1,4 @@
 context1
-removed
+added
 context2`;
        const result = parsePatch(patch);
        expect(result.oldValue).toBe('context1\nremoved\ncontext2');
        expect(result.newValue).toBe('context1\nadded\ncontext2');
    });
});
