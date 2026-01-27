import React, { useMemo, useState } from 'react';
import { MergeRequest, View } from '../../types';
import { GitMerge, GitPullRequestClosed, ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';

interface HistoryListProps {
    mrs: MergeRequest[];
    loading: boolean;
    onRefresh: () => void;
    setView: (view: View) => void;
}

const HistoryListItem: React.FC<{ mr: MergeRequest }> = ({ mr }) => {
    const changes = useMemo(() => {
        if (mr.stats) {
            return mr.stats;
        }
        return mr.files.reduce(
            (acc, file) => ({
                additions: acc.additions + file.additions,
                deletions: acc.deletions + file.deletions
            }),
            { additions: 0, deletions: 0 }
        );
    }, [mr.files, mr.stats]);

    return (
        <div
            className="glass"
            style={{
                padding: '8px 12px',
                borderRadius: '8px',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                border: '1px solid rgba(255,255,255,0.05)',
            }}
        >
            <div style={{
                width: '28px', height: '28px', borderRadius: '6px',
                background: mr.status === 'merged' ? 'rgba(138, 56, 245, 0.1)' : 'rgba(255, 75, 75, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
                {mr.status === 'merged' ? (
                    <GitMerge size={14} color="#8a38f5" />
                ) : (
                    <GitPullRequestClosed size={14} color="#ff4b4b" />
                )}
            </div>

            <div style={{ flexGrow: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {mr.title}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span>#{mr.number}</span>
                    <span>•</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mr.repository}</span>
                </div>
            </div>

            <div style={{ textAlign: 'right', minWidth: '100px', flexShrink: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {changes.additions + changes.deletions} lines
                </div>
                <div style={{ fontSize: '10px', marginTop: '1px', display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                    <span style={{ color: '#4caf50' }}>+{changes.additions}</span>
                    <span style={{ color: '#ff4b4b' }}>-{changes.deletions}</span>
                </div>
            </div>
        </div>
    );
};

export const HistoryList: React.FC<HistoryListProps> = ({
    mrs,
    loading,
    onRefresh,
    setView
}) => {
    // Group MRs by repository
    const groupedMrs = useMemo(() => {
        const groups: Record<string, MergeRequest[]> = {};
        mrs.forEach(mr => {
            if (!groups[mr.repository]) {
                groups[mr.repository] = [];
            }
            groups[mr.repository].push(mr);
        });
        return groups;
    }, [mrs]);

    // Calculate stats for each group
    const groupsWithStats = useMemo(() => {
        return Object.entries(groupedMrs).map(([repo, repoMrs]) => {
            const totalSize = repoMrs.reduce((acc, mr) => {
                const additions = mr.stats?.additions || mr.files.reduce((a, f) => a + f.additions, 0);
                const deletions = mr.stats?.deletions || mr.files.reduce((a, f) => a + f.deletions, 0);
                return acc + additions + deletions;
            }, 0);

            const avgSize = Math.round(totalSize / (repoMrs.length || 1));

            return {
                repo,
                mrs: repoMrs,
                avgSize
            };
        });
    }, [groupedMrs]);

    const [expandedRepos, setExpandedRepos] = useState<Set<string>>(new Set());

    const toggleRepo = (repo: string) => {
        setExpandedRepos(prev => {
            const newSet = new Set(prev);
            if (newSet.has(repo)) {
                newSet.delete(repo);
            } else {
                newSet.add(repo);
            }
            return newSet;
        });
    };

    return (
        <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 600 }}>History</h1>
                <button
                    className={`sidebar-item ${loading ? 'loading' : ''}`}
                    style={{ padding: '6px 16px', margin: 0, background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}
                    onClick={onRefresh}
                    disabled={loading}
                >
                    {loading ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            {loading && mrs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                    <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>Fetching history...</p>
                </div>
            ) : (
                <div style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                    {mrs.length === 0 ? (
                        <div className="glass" style={{ padding: '40px', borderRadius: '16px', textAlign: 'center' }}>
                            <p style={{ color: 'var(--text-secondary)' }}>No merged or closed pull requests found recently.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {groupsWithStats.map(({ repo, mrs, avgSize }) => {
                                const isExpanded = expandedRepos.has(repo);
                                return (
                                    <div key={repo} className="glass" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                                        <div
                                            onClick={() => toggleRepo(repo)}
                                            style={{
                                                padding: '16px',
                                                borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none',
                                                background: 'rgba(255,255,255,0.02)',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                cursor: 'pointer',
                                                transition: 'background 0.2s'
                                            }}
                                            className="accordion-header"
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {isExpanded ? <ChevronDown size={18} color="var(--text-secondary)" /> : <ChevronRight size={18} color="var(--text-secondary)" />}
                                                <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{repo}</h3>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                <div title="Average lines changed per PR">
                                                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{avgSize}</span> lines avg
                                                </div>
                                                <div style={{ width: '1px', height: '12px', background: 'var(--border-color)' }}></div>
                                                <div>
                                                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{mrs.length}</span> PRs
                                                </div>
                                            </div>
                                        </div>
                                        {isExpanded && (
                                            <div style={{ padding: '12px' }}>
                                                {mrs.map(mr => (
                                                    <HistoryListItem key={mr.id} mr={mr} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
