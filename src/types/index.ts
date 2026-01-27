export interface CheckRun {
    id: number;
    name: string;
    status: 'queued' | 'in_progress' | 'completed' | 'waiting';
    conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'timed_out' | 'action_required' | 'skipped' | 'stale' | null;
    html_url: string;
    started_at: string;
    completed_at: string | null;
}

export interface CIStatus {
    state: 'success' | 'failure' | 'pending' | 'unknown';
    total_count: number;
    success_count: number;
    check_runs: CheckRun[];
}

export interface Workflow {
    id: number;
    name: string;
}

export interface Commit {
    sha: string;
    message: string;
    author: string;
    date: string;
}

export interface MergeRequest {
    id: number
    number: number
    title: string
    author: string
    created_at: string
    repository: string
    base_ref: string
    head_ref: string
    head_sha: string
    status: 'open' | 'closed' | 'merged'
    files: MRFile[]
    commits?: Commit[]
    ci_status?: CIStatus
    stats?: {
        additions: number
        deletions: number
    }
}

export interface MRFile {
    filename: string
    status: 'modified' | 'added' | 'removed'
    additions: number
    deletions: number
    patch?: string
    sha: string
    viewed: boolean
}

export interface User {
    login: string
    avatar_url: string
}

export type View = 'list' | 'detail' | 'review' | 'settings' | 'history'


