import React, { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion';
import { Play, ExternalLink, FileText, CheckCircle2, Circle, Clock, GitCommit, Folder, ChevronRight, ChevronDown } from 'lucide-react';
import { MergeRequest, Workflow, CIStatus } from '../../types';
import { openUrl } from '../../utils/browser';
import { WorkflowRuns } from './WorkflowRuns';
import { calculateCIStatus } from '../../utils/ci';
import { ReviewStats, useReviewStats } from '../molecules/ReviewStats';

interface MrDetailProps {
    mr: MergeRequest;
    onStartReview: () => void;
    onToggleFileViewed: (mrId: number, filename: string) => void;
    onFileClick: (index: number) => void;
    onTriggerWorkflow?: (mr: MergeRequest, workflowId: number) => void;
    isTriggering?: boolean;
    workflows?: Workflow[];
    octokit: any;
    onUpdateMr: (mr: MergeRequest) => void;
    onUpdateWorkflows: (workflows: Workflow[]) => void;
    pollInterval: number;
    selectedIndex?: number;
    onRefresh?: () => void;
    loading?: boolean;
    onToggleFilesViewed: (mrId: number, filenames: string[], forceStatus?: boolean) => void;
}

export const MrDetail: React.FC<MrDetailProps> = ({
    mr,
    onStartReview,
    onToggleFileViewed,
    onFileClick,
    onTriggerWorkflow,
    isTriggering,
    workflows = [],
    octokit,
    onUpdateMr,
    onUpdateWorkflows,
    pollInterval,
    selectedIndex,
    onRefresh,
    loading,
    onToggleFilesViewed
}) => {
    const mrRef = useRef(mr);
    const workflowsFetchedRef = useRef<string | null>(null);
    const activeItemRef = useRef<HTMLDivElement>(null);
    const commitsRef = useRef<HTMLDivElement>(null);
    const [showCommits, setShowCommits] = useState(false);
    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

    const { additions, deletions } = useReviewStats(mr.files, mr.stats);

    // State for collapsed directories
    const [collapsedDirs, setCollapsedDirs] = useState<Set<string>>(new Set());

    // Group files by directory (same as ReviewSidebar)
    const groupedFiles = useMemo(() => {
        const groups: { [path: string]: { file: any; index: number }[] } = {};

        mr.files.forEach((file: any, index: number) => {
            const parts = file.filename.split('/');
            const dirPath = parts.length > 1 ? parts.slice(0, -1).join('/') : '';

            if (!groups[dirPath]) {
                groups[dirPath] = [];
            }
            groups[dirPath].push({ file, index });
        });

        // Sort directories alphabetically, with root files first
        const sortedKeys = Object.keys(groups).sort((a, b) => {
            if (a === '') return -1;
            if (b === '') return 1;
            return a.localeCompare(b);
        });

        return { groups, sortedKeys };
    }, [mr.files]);

    const toggleDir = (dir: string) => {
        setCollapsedDirs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(dir)) {
                newSet.delete(dir);
            } else {
                newSet.add(dir);
            }
            return newSet;
        });
    };

    useEffect(() => {
        if (selectedIndex !== undefined && activeItemRef.current) {
            activeItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [selectedIndex]);

    useEffect(() => {
        mrRef.current = mr;
    }, [mr]);



    const fetchMrCiStatus = useCallback(async (owner: string, repo: string, headSha: string, headRef: string): Promise<CIStatus | undefined> => {
        if (!octokit) return undefined;
        try {
            const [checksResult, shaRunsResult, branchRunsResult] = await Promise.allSettled([
                octokit.rest.checks.listForRef({ owner, repo, ref: headSha }),
                octokit.rest.actions.listWorkflowRunsForRepo({ owner, repo, head_sha: headSha, per_page: 20 }),
                octokit.rest.actions.listWorkflowRunsForRepo({ owner, repo, branch: headRef.replace('refs/heads/', ''), per_page: 20 })
            ]);

            const checkRuns: any[] = [];
            const seenExternalIds = new Set<string>();

            if (checksResult.status === 'fulfilled') {
                checksResult.value.data.check_runs.forEach((cr: any) => {
                    checkRuns.push({
                        id: cr.id,
                        name: cr.name,
                        status: cr.status as any,
                        conclusion: cr.conclusion as any,
                        html_url: cr.html_url,
                        started_at: cr.started_at,
                        completed_at: cr.completed_at
                    });
                    if (cr.external_id) seenExternalIds.add(cr.external_id);
                    seenExternalIds.add(cr.html_url.split('/').pop() || '');
                });
            }

            const processWorkflowRun = (run: any) => {
                const runIdStr = String(run.id);
                const exists = checkRuns.some((cr: any) =>
                    cr.html_url === run.html_url ||
                    cr.html_url.includes(`/runs/${run.id}`) ||
                    seenExternalIds.has(runIdStr)
                );

                if (!exists) {
                    const startedAt = run.run_started_at || run.created_at;
                    checkRuns.push({
                        id: run.id,
                        name: run.name || 'Workflow Run',
                        status: run.status || 'unknown',
                        conclusion: run.conclusion || null,
                        html_url: run.html_url,
                        started_at: startedAt,
                        completed_at: run.updated_at
                    });
                    seenExternalIds.add(runIdStr);
                }
            };

            if (shaRunsResult.status === 'fulfilled') {
                shaRunsResult.value.data.workflow_runs.forEach(processWorkflowRun);
            }
            if (branchRunsResult.status === 'fulfilled') {
                branchRunsResult.value.data.workflow_runs.forEach(processWorkflowRun);
            }

            return calculateCIStatus(checkRuns);
        } catch (e) {
            console.error('Failed to fetch CI status:', e);
            return { state: 'success', total_count: 0, success_count: 0, check_runs: [] };
        }
    }, [octokit]);

    const fetchWorkflows = useCallback(async (owner: string, repo: string) => {
        if (!octokit) return;
        if (workflowsFetchedRef.current === `${owner}/${repo}`) return;

        try {
            const { data: workflowsData } = await octokit.rest.actions.listRepoWorkflows({ owner, repo });
            const activeOnes = workflowsData.workflows
                .filter((w: any) => w.state === 'active')
                .map((w: any) => ({ id: w.id, name: w.name }));

            onUpdateWorkflows(activeOnes);
            workflowsFetchedRef.current = `${owner}/${repo}`;
        } catch (e) {
            console.error('Failed to fetch workflows:', e);
        }
    }, [octokit, onUpdateWorkflows]);

    useEffect(() => {
        if (!octokit || !mr) return;

        const [owner, repo] = mr.repository.split('/');
        fetchWorkflows(owner, repo);

        const poll = async () => {
            const currentMr = mrRef.current;
            try {
                const status = await fetchMrCiStatus(owner, repo, currentMr.head_sha, currentMr.head_ref);
                if (status) {
                    onUpdateMr({ ...currentMr, ci_status: status });
                }
            } catch (err) {
                console.error('[Polling] Error:', err);
            }
        };

        // Initial poll
        poll();

        const interval = setInterval(poll, pollInterval);
        return () => clearInterval(interval);
    }, [mr.id, mr.repository, octokit, pollInterval, fetchMrCiStatus, fetchWorkflows, onUpdateMr]);

    return (
        <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            style={{ padding: '64px 32px 32px 32px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}
        >
            <div className="glass" style={{ padding: '24px', borderRadius: '16px', marginBottom: '24px' }}>
                {/* Title with GitHub link and refresh */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '24px', margin: 0 }}>{mr.title}</h2>
                    <ExternalLink
                        size={18}
                        color="var(--text-secondary)"
                        style={{ cursor: 'pointer', flexShrink: 0 }}
                        onClick={() => openUrl(`https://github.com/${mr.repository}/pull/${mr.number}`)}
                    />
                    <div style={{ marginLeft: 'auto' }}>
                        {onRefresh && (
                            <button
                                className={`sidebar-item ${loading ? 'loading' : ''}`}
                                style={{ padding: '6px 16px', margin: 0, background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}
                                onClick={onRefresh}
                                disabled={loading}
                            >
                                {loading ? 'Refreshing...' : 'Refresh'}
                            </button>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '24px' }}>
                    {/* Left column: Branch and Actions */}
                    <div style={{ flex: '1', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                        <div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px' }}>Branch</div>
                            <div style={{
                                fontFamily: 'monospace',
                                background: 'rgba(255,255,255,0.05)',
                                padding: '10px 14px',
                                borderRadius: '8px',
                                fontSize: '13px'
                            }}>
                                {mr.base_ref} ← {mr.head_ref}
                            </div>
                            {mr.commits && mr.commits.length > 0 && (
                                <div
                                    ref={commitsRef}
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer' }}
                                    onMouseEnter={() => {
                                        if (commitsRef.current) {
                                            const rect = commitsRef.current.getBoundingClientRect();
                                            setTooltipPos({ top: rect.bottom - 2, left: rect.left });
                                        }
                                        setShowCommits(true);
                                    }}
                                    onMouseLeave={() => setShowCommits(false)}
                                >
                                    <GitCommit size={14} />
                                    <span>
                                        {mr.commits.length} commit{mr.commits.length !== 1 ? 's' : ''}
                                        <span style={{ margin: '0 6px', opacity: 0.5 }}>•</span>
                                        last pushed {new Date(mr.commits[mr.commits.length - 1].date).toLocaleString(undefined, {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                            )}
                            {showCommits && mr.commits && mr.commits.length > 0 && ReactDOM.createPortal(
                                <div
                                    style={{
                                        position: 'fixed',
                                        top: tooltipPos.top,
                                        left: tooltipPos.left,
                                        background: '#1a1a1a',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        padding: '8px 0',
                                        minWidth: '350px',
                                        maxWidth: '500px',
                                        maxHeight: '300px',
                                        overflowY: 'auto',
                                        zIndex: 9999,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                    }}
                                    onMouseEnter={() => setShowCommits(true)}
                                    onMouseLeave={() => setShowCommits(false)}
                                >
                                    {[...mr.commits].reverse().map((commit, idx) => {
                                        const formatCommitDate = (dateStr: string) => {
                                            if (!dateStr) return '';
                                            return new Date(dateStr).toLocaleString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            });
                                        };
                                        return (
                                            <div
                                                key={commit.sha}
                                                style={{
                                                    padding: '8px 12px',
                                                    borderBottom: idx < mr.commits!.length - 1 ? '1px solid var(--border-color)' : 'none',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                    <code
                                                        style={{ color: 'var(--accent-color)', fontSize: '11px', cursor: 'pointer' }}
                                                        onClick={() => openUrl(`https://github.com/${mr.repository}/commit/${commit.sha}`)}
                                                    >{commit.sha.slice(0, 7)}</code>
                                                    <span style={{ color: 'var(--text-secondary)' }}>{commit.author}</span>
                                                    <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)', opacity: 0.7, fontSize: '11px' }}>
                                                        {formatCommitDate(commit.date)}
                                                    </span>
                                                </div>
                                                <div style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {commit.message}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>,
                                document.body
                            )}
                        </div>

                        {/* Spacer to push workflow triggers to bottom */}
                        <div style={{ flexGrow: 1 }} />

                        {/* Workflow trigger buttons - aligned to bottom */}
                        {onTriggerWorkflow && workflows.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
                                {workflows.map(workflow => (
                                    <button
                                        key={workflow.id}
                                        onClick={() => onTriggerWorkflow(mr, workflow.id)}
                                        disabled={isTriggering}
                                        className={!isTriggering ? "hover-accent" : ""}
                                        style={{
                                            background: 'none', border: '1px solid var(--border-color)', borderRadius: '8px',
                                            padding: '8px 14px', color: 'var(--text-secondary)', cursor: isTriggering ? 'not-allowed' : 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s ease', fontSize: '12px', opacity: isTriggering ? 0.6 : 1
                                        }}
                                    >
                                        {isTriggering ? (
                                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'flex' }}>
                                                <Clock size={14} />
                                            </motion.div>
                                        ) : (<Play size={14} />)}
                                        <span>{isTriggering ? 'Dispatching...' : `Run ${workflow.name}`}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right column: Workflow Runs */}
                    <div style={{ flex: '1', minWidth: 0 }}>
                        <WorkflowRuns ciStatus={mr.ci_status} pollInterval={pollInterval} compact />
                    </div>
                </div>
            </div>


            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px' }}>Files Changed ({mr.files.length})</h3>
                <ReviewStats files={mr.files} totalStats={mr.stats} />
            </div>

            <div className="glass" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                {groupedFiles.sortedKeys.map((dirPath, dirIdx) => {
                    const files = groupedFiles.groups[dirPath];
                    const isCollapsed = collapsedDirs.has(dirPath);
                    const isRootLevel = dirPath === '';
                    const isLastDir = dirIdx === groupedFiles.sortedKeys.length - 1;

                    const allViewed = files.every(({ file }) => file.viewed);
                    const someViewed = files.some(({ file }) => file.viewed);

                    return (
                        <div key={dirPath || '__root__'}>
                            {/* Directory header (not shown for root-level files) */}
                            {!isRootLevel && (
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '10px 20px',
                                        cursor: 'pointer',
                                        background: 'rgba(255,255,255,0.03)',
                                        borderBottom: '1px solid var(--border-color)'
                                    }}
                                    className="hover-accent"
                                >
                                    <div
                                        onClick={() => onToggleFilesViewed(mr.id, files.map(f => f.file.filename), !allViewed)}
                                        style={{ display: 'flex', alignItems: 'center', marginRight: '4px', zIndex: 10 }}
                                        title={allViewed ? "Mark folder as unviewed" : "Mark folder as viewed"}
                                    >
                                        {allViewed ? (
                                            <CheckCircle2 size={16} color="#4caf50" />
                                        ) : someViewed ? (
                                            <Circle size={16} color="#4caf50" fill='#4caf50' fillOpacity={0.2} />
                                        ) : (
                                            <Circle size={16} color="#444" />
                                        )}
                                    </div>

                                    <div
                                        onClick={() => toggleDir(dirPath)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', flexGrow: 1 }}
                                    >
                                        {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                                        <Folder size={14} color="#fff" />
                                        <span style={{ fontSize: '13px', color: '#fff' }}>
                                            {dirPath.split('/').slice(0, -1).join('/')}{dirPath.includes('/') ? '/' : ''}
                                            <span style={{ fontWeight: 'bold' }}>{dirPath.split('/').pop()}</span>
                                        </span>
                                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
                                            {files.length} file{files.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Files in this directory */}
                            {!isCollapsed && files.map(({ file, index }, fileIdx) => (
                                <div
                                    key={index}
                                    ref={index === selectedIndex ? activeItemRef : null}
                                    className="sidebar-item"
                                    style={{
                                        margin: 0, borderRadius: 0,
                                        borderBottom: (isLastDir && fileIdx === files.length - 1) ? 'none' : '1px solid var(--border-color)',
                                        padding: '12px 20px',
                                        paddingLeft: isRootLevel ? '20px' : '40px',
                                        cursor: 'pointer',
                                        background: index === selectedIndex ? 'rgba(255,255,255,0.08)' : 'transparent',
                                        borderLeft: index === selectedIndex ? '2px solid var(--accent-color)' : '2px solid transparent'
                                    }}
                                    onClick={() => onFileClick(index)}
                                >
                                    <div
                                        onClick={(e) => { e.stopPropagation(); onToggleFileViewed(mr.id, file.filename); }}
                                        style={{ display: 'flex', alignItems: 'center', padding: '4px' }}
                                    >
                                        {file.viewed ? <CheckCircle2 size={18} color="#4caf50" /> : <Circle size={18} color="#444" />}
                                    </div>
                                    <FileText size={16} color={index === selectedIndex ? '#f9a8d4' : 'var(--text-secondary)'} />
                                    <span style={{
                                        flexGrow: 1,
                                        ...(index === selectedIndex ? {
                                            background: 'linear-gradient(90deg, #f9a8d4, #a78bfa, #60a5fa, #34d399)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            backgroundClip: 'text',
                                            fontWeight: 500
                                        } : {})
                                    }}>{file.filename.split('/').pop()}</span>
                                    <div style={{ display: 'flex', gap: '4px', fontSize: '12px' }}>
                                        <span style={{ color: '#4caf50' }}>+{file.additions}</span>
                                        <span style={{ color: '#f44336' }}>-{file.deletions}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
};
