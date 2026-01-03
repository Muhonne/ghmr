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

export type View = 'list' | 'detail' | 'review' | 'settings'


