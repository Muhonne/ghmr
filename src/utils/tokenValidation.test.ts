import { describe, it, expect } from 'vitest';
import { validateGitHubToken, sanitizeTokenForLogging } from './tokenValidation';

describe('tokenValidation', () => {
    describe('validateGitHubToken', () => {
        it('returns invalid for empty token', () => {
            expect(validateGitHubToken('')).toEqual({ valid: false, error: 'Token cannot be empty' });
            expect(validateGitHubToken('   ')).toEqual({ valid: false, error: 'Token cannot be empty' });
        });

        it('returns valid for classic tokens (ghp_*)', () => {
            const token = 'ghp_' + 'a'.repeat(36);
            expect(validateGitHubToken(token)).toEqual({ valid: true });
        });

        it('returns valid for fine-grained tokens (github_pat_*)', () => {
            const token = 'github_pat_' + 'a'.repeat(22) + '_' + 'b'.repeat(59);
            expect(validateGitHubToken(token)).toEqual({ valid: true });
        });

        it('returns valid for OAuth tokens (gho_*)', () => {
            const token = 'gho_' + 'a'.repeat(36);
            expect(validateGitHubToken(token)).toEqual({ valid: true });
        });

        it('returns invalid for random strings', () => {
            expect(validateGitHubToken('not_a_token')).toMatchObject({ valid: false });
            expect(validateGitHubToken('ghp_short')).toMatchObject({ valid: false });
        });
    });

    describe('sanitizeTokenForLogging', () => {
        it('masks short tokens completely', () => {
            expect(sanitizeTokenForLogging('12345')).toBe('***');
        });

        it('shows only first and last 4 characters of long tokens', () => {
            const token = 'ghp_1234567890abcdefghijklmnopqrstuvwxyz';
            expect(sanitizeTokenForLogging(token)).toBe('ghp_...wxyz');
        });
    });
});
