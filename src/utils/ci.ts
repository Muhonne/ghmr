import { CIStatus, CheckRun } from '../types';

/**
 * Calculates the combined CI status from a list of check runs and workflow runs.
 */
export const calculateCIStatus = (checkRuns: any[]): CIStatus => {
    if (checkRuns.length === 0) {
        return { state: 'success', total_count: 0, success_count: 0, check_runs: [] };
    }

    // Sort by started_at descending (newest first)
    const sortedRuns = [...checkRuns].sort((a, b) =>
        new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    );

    let state: CIStatus['state'] = 'success';
    const hasFailure = sortedRuns.some((cr: CheckRun) =>
        ['failure', 'timed_out', 'action_required', 'cancelled'].includes(cr.conclusion || '')
    );
    const hasPending = sortedRuns.some((cr: CheckRun) =>
        ['queued', 'in_progress', 'waiting', 'pending'].includes(cr.status)
    );

    if (hasFailure) {
        state = 'failure';
    } else if (hasPending) {
        state = 'pending';
    }

    return {
        state,
        total_count: sortedRuns.length,
        success_count: sortedRuns.filter((cr: CheckRun) => cr.conclusion === 'success').length,
        check_runs: sortedRuns
    };
};
