import { describe, it, expect } from 'vitest';
import { calculateCIStatus } from './ci';

describe('CI logic', () => {
    it('returns success for empty check runs', () => {
        const result = calculateCIStatus([]);
        expect(result.state).toBe('success');
        expect(result.total_count).toBe(0);
    });

    it('returns failure if any run has failed', () => {
        const runs = [
            { id: 1, name: 'Tests', status: 'completed', conclusion: 'success', started_at: '2023-01-01T10:00:00Z' },
            { id: 2, name: 'Lint', status: 'completed', conclusion: 'failure', started_at: '2023-01-01T10:01:00Z' }
        ];
        const result = calculateCIStatus(runs);
        expect(result.state).toBe('failure');
        expect(result.total_count).toBe(2);
        expect(result.success_count).toBe(1);
    });

    it('returns pending if any run is in progress and none failed', () => {
        const runs = [
            { id: 1, name: 'Tests', status: 'completed', conclusion: 'success', started_at: '2023-01-01T10:00:00Z' },
            { id: 2, name: 'Lint', status: 'in_progress', conclusion: null, started_at: '2023-01-01T10:01:00Z' }
        ];
        const result = calculateCIStatus(runs);
        expect(result.state).toBe('pending');
    });

    it('prioritizes failure over pending', () => {
        const runs = [
            { id: 1, name: 'Tests', status: 'completed', conclusion: 'failure', started_at: '2023-01-01T10:00:00Z' },
            { id: 2, name: 'Lint', status: 'in_progress', conclusion: null, started_at: '2023-01-01T10:01:00Z' }
        ];
        const result = calculateCIStatus(runs);
        expect(result.state).toBe('failure');
    });

    it('sorts runs by started_at descending', () => {
        const runs = [
            { id: 1, name: 'Old', status: 'completed', conclusion: 'success', started_at: '2023-01-01T10:00:00Z' },
            { id: 2, name: 'New', status: 'completed', conclusion: 'success', started_at: '2023-01-01T11:00:00Z' }
        ];
        const result = calculateCIStatus(runs);
        expect(result.check_runs[0].name).toBe('New');
        expect(result.check_runs[1].name).toBe('Old');
    });
});
