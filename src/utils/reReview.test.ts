import { describe, it, expect } from 'vitest';
import { isFileViewed, updateViewedState } from './reReview';

describe('Smart Re-review Logic', () => {
    describe('isFileViewed', () => {
        it('returns true (Viewed) when saved SHA matches current SHA [Scenario 1: No change]', () => {
            const savedSha = 'abc12345';
            const currentSha = 'abc12345';
            expect(isFileViewed(savedSha, currentSha)).toBe(true);
        });

        it('returns false (Unviewed) when saved SHA differs from current SHA [Scenario 2: Changed]', () => {
            const savedSha = 'abc12345';
            const currentSha = 'def67890'; // File changed
            expect(isFileViewed(savedSha, currentSha)).toBe(false);
        });

        it('returns false (Unviewed) when there is no saved SHA [Scenario 3: New file/Never reviewed]', () => {
            const savedSha = undefined;
            const currentSha = 'abc12345';
            expect(isFileViewed(savedSha, currentSha)).toBe(false);
        });
    });

    describe('updateViewedState', () => {
        it('adds a file with its SHA when marking as viewed', () => {
            const initialMap = {};
            const filename = 'test.ts';
            const sha = 'sha123';

            const newMap = updateViewedState(initialMap, filename, sha, false);

            expect(newMap).toEqual({
                'test.ts': 'sha123'
            });
        });

        it('removes a file from map when marking as unviewed', () => {
            const initialMap = { 'test.ts': 'sha123' };
            const filename = 'test.ts';
            const sha = 'sha123';

            const newMap = updateViewedState(initialMap, filename, sha, true);

            expect(newMap).toEqual({});
        });

        it('updates SHA if file is marked viewed again (e.g. after change)', () => {
            const initialMap = { 'test.ts': 'old_sha' };
            const filename = 'test.ts';
            const newSha = 'new_sha';

            const newMap = updateViewedState(initialMap, filename, newSha, false);

            expect(newMap).toEqual({
                'test.ts': 'new_sha'
            });
        });
    });
});
