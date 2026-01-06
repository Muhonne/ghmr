import React, { useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, ExternalLink, FileText, CheckCircle2, Circle, Clock } from 'lucide-react';
import { MergeRequest, MRFile, Workflow, CIStatus, CheckRun } from '../../types';
import { openUrl } from '../../utils/browser';
import { WorkflowRuns } from './WorkflowRuns';
import { calculateCIStatus } from '../../utils/ci';

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
}) => {
    const mrRef = useRef(mr);
    const workflowsFetchedRef = useRef<string | null>(null);
    const activeItemRef = useRef<HTMLDivElement>(null);

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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div>
                        <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>{mr.title}</h2>
                        <div style={{ display: 'flex', gap: '12px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                            <span>#{mr.number}</span>
                            <span>•</span>
                            <span>{mr.author}</span>
                            <span>•</span>
                            <span>{mr.repository}</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="btn-primary" onClick={onStartReview} style={{ padding: '10px 20px' }}>
                            Review
                        </button>
                        <button
                            onClick={() => openUrl(`https://github.com/${mr.repository}/pull/${mr.number}`)}
                            className="btn-secondary"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px' }}
                        >
                            <ExternalLink size={16} />
                            <span>GitHub</span>
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                    <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Branch</div>
                        <div style={{ fontFamily: 'monospace', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>
                            {mr.base_ref} ← {mr.head_ref}
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {onTriggerWorkflow && workflows.map(workflow => (
                            <button
                                key={workflow.id}
                                onClick={() => onTriggerWorkflow(mr, workflow.id)}
                                disabled={isTriggering}
                                className={!isTriggering ? "hover-accent" : ""}
                                style={{
                                    background: 'none', border: '1px solid var(--border-color)', borderRadius: '8px',
                                    padding: '6px 12px', color: 'var(--text-secondary)', cursor: isTriggering ? 'not-allowed' : 'pointer',
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
                </div>
            </div>

            <WorkflowRuns ciStatus={mr.ci_status} pollInterval={pollInterval} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px' }}>Files Changed ({mr.files.length})</h3>
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    {mr.files.filter((f: MRFile) => f.viewed).length} of {mr.files.length} reviewed
                </div>
            </div>

            <div className="glass" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                {mr.files.map((file: any, idx: number) => (
                    <div
                        key={idx}
                        ref={idx === selectedIndex ? activeItemRef : null}
                        className="sidebar-item"
                        style={{
                            margin: 0, borderRadius: 0, borderBottom: idx === mr.files.length - 1 ? 'none' : '1px solid var(--border-color)',
                            padding: '12px 20px', cursor: 'pointer',
                            background: idx === selectedIndex ? 'rgba(255,255,255,0.08)' : 'transparent',
                            borderLeft: idx === selectedIndex ? '2px solid var(--accent-color)' : '2px solid transparent'
                        }}
                        onClick={() => onFileClick(idx)}
                    >
                        <div
                            onClick={(e) => { e.stopPropagation(); onToggleFileViewed(mr.id, file.filename); }}
                            style={{ display: 'flex', alignItems: 'center', padding: '4px' }}
                        >
                            {file.viewed ? <CheckCircle2 size={18} color="#4caf50" /> : <Circle size={18} color="#444" />}
                        </div>
                        <FileText size={16} color="var(--text-secondary)" />
                        <span style={{ flexGrow: 1 }}>{file.filename}</span>
                        <div style={{ display: 'flex', gap: '4px', fontSize: '12px' }}>
                            <span style={{ color: '#4caf50' }}>+{file.additions}</span>
                            <span style={{ color: '#f44336' }}>-{file.deletions}</span>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};
