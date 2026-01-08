import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 as CheckIcon, XCircle as XIcon, Clock as ClockIcon, HelpCircle as HelpIcon, ExternalLink } from 'lucide-react';
import { CIStatus } from '../../types';
import { openUrl } from '../../utils/browser';

interface WorkflowRunsProps {
    ciStatus: CIStatus | undefined;
    pollInterval: number;
    compact?: boolean;
}

export const WorkflowRuns: React.FC<WorkflowRunsProps> = ({ ciStatus, pollInterval, compact = false }) => {
    return (
        <div style={{ marginBottom: compact ? '0' : '24px' }}>
            {!compact && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '18px', margin: 0 }}>Workflow Runs</h3>
                    <div title="Polling for updates..." style={{ display: 'flex', alignItems: 'center' }}>
                        <svg width="14" height="14" viewBox="0 0 14 14">
                            <circle
                                cx="7"
                                cy="7"
                                r="5.5"
                                fill="none"
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth="1.5"
                            />
                            <motion.circle
                                cx="7"
                                cy="7"
                                r="5.5"
                                fill="none"
                                stroke="var(--accent-color, #3b82f6)"
                                strokeWidth="1.5"
                                strokeDasharray="34.5"
                                initial={{ strokeDashoffset: 0 }}
                                animate={{ strokeDashoffset: 34.5 }}
                                transition={{ duration: pollInterval / 1000, repeat: Infinity, ease: "linear" }}
                                style={{ rotate: -90, transformOrigin: 'center' }}
                            />
                        </svg>
                    </div>
                </div>
            )}
            {compact && (
                <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Workflow Runs</span>
                    <svg width="12" height="12" viewBox="0 0 14 14">
                        <circle cx="7" cy="7" r="5.5" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
                        <motion.circle cx="7" cy="7" r="5.5" fill="none" stroke="var(--accent-color, #3b82f6)" strokeWidth="1.5"
                            strokeDasharray="34.5" initial={{ strokeDashoffset: 0 }} animate={{ strokeDashoffset: 34.5 }}
                            transition={{ duration: pollInterval / 1000, repeat: Infinity, ease: "linear" }}
                            style={{ rotate: -90, transformOrigin: 'center' }} />
                    </svg>
                </div>
            )}
            <div className="glass" style={{ borderRadius: '12px', overflow: 'hidden', minHeight: '140px' }}>
                {!ciStatus ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                        <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}>
                            Loading workflows...
                        </motion.div>
                    </div>
                ) : ciStatus.check_runs.length > 0 ? (
                    [...ciStatus.check_runs]
                        .sort((a: any, b: any) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
                        .slice(0, 3)
                        .map((run: any, idx: number) => (
                            <div
                                key={run.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px 20px',
                                    borderBottom: idx === Math.min(ciStatus.check_runs.length, 3) - 1 ? 'none' : '1px solid var(--border-color)',
                                    cursor: 'pointer'
                                }}
                                onClick={() => openUrl(run.html_url)}
                                className="hover-accent"
                            >
                                <div style={{ display: 'flex' }}>
                                    {run.conclusion === 'success' ? <CheckIcon size={16} color="#4caf50" /> :
                                        run.conclusion === 'failure' ? <XIcon size={16} color="#f44336" /> :
                                            ['in_progress', 'queued', 'waiting'].includes(run.status) ?
                                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                                                    <ClockIcon size={16} color="#ff9800" />
                                                </motion.div> :
                                                <HelpIcon size={16} color="var(--text-secondary)" />}
                                </div>
                                <span style={{ fontSize: '14px', fontWeight: 500 }}>{run.name}</span>
                                <div
                                    style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: 'auto' }}
                                    title={run.completed_at && run.status === 'completed' ? `Finished: ${new Date(run.completed_at).toLocaleTimeString()}` : undefined}
                                >
                                    {run.started_at && new Date(run.started_at).toLocaleTimeString()}
                                </div>
                                <ExternalLink size={14} color="var(--text-secondary)" />
                            </div>
                        ))
                ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                        No workflow runs found for this branch.
                    </div>
                )}
            </div>
        </div>
    );
};
