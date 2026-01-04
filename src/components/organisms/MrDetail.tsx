import React from 'react';
import { motion } from 'framer-motion';
import { Play, CheckCircle2 as CheckIcon, XCircle as XIcon, Clock as ClockIcon, HelpCircle as HelpIcon, ExternalLink, FileText, CheckCircle2, Circle } from 'lucide-react';
import { MergeRequest, MRFile } from '../../types';
import { CIStatusBadge } from '../atoms/CIStatusBadge';
import { openUrl } from '../../utils/browser';

interface MrDetailProps {
    mr: MergeRequest;
    onStartReview: () => void;
    onToggleFileViewed: (mrId: number, filename: string) => void;
    onFileClick: (index: number) => void;
    onTriggerWorkflow?: (mr: MergeRequest) => void;
    isTriggering?: boolean;
    workflowName?: string;
}

export const MrDetail: React.FC<MrDetailProps> = ({
    mr,
    onStartReview,
    onToggleFileViewed,
    onFileClick,
    onTriggerWorkflow,
    isTriggering,
    workflowName
}) => {
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
                        <button
                            className="btn-primary"
                            onClick={onStartReview}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px' }}
                        >
                            Review
                        </button>
                        <button
                            onClick={() => {
                                const url = `https://github.com/${mr.repository}/pull/${mr.number}`;
                                openUrl(url);
                            }}
                            className="btn-secondary"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '10px 20px',
                            }}
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

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {onTriggerWorkflow && (
                            <button
                                onClick={() => onTriggerWorkflow(mr)}
                                disabled={isTriggering}
                                title={isTriggering ? 'Triggering...' : `Run ${workflowName || 'CI'}`}
                                style={{
                                    background: 'none',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    padding: '6px 12px',
                                    color: 'var(--text-secondary)',
                                    cursor: isTriggering ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s ease',
                                    fontSize: '12px',
                                    opacity: isTriggering ? 0.6 : 1
                                }}
                                className={!isTriggering ? "hover-accent" : ""}
                            >
                                {isTriggering ? (
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                        style={{ display: 'flex' }}
                                    >
                                        <ClockIcon size={14} />
                                    </motion.div>
                                ) : (
                                    <Play size={14} />
                                )}
                                <span>{isTriggering ? 'Dispatching...' : (workflowName ? `Run ${workflowName}` : 'Run CI')}</span>
                            </button>
                        )}
                        <CIStatusBadge status={mr.ci_status} showText={true} />
                    </div>
                </div>
            </div>

            {mr.ci_status && mr.ci_status.check_runs.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>Check Runs</h3>
                    <div className="glass" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                        {mr.ci_status.check_runs.map((run: any, idx: number) => (
                            <div
                                key={run.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px 20px',
                                    borderBottom: idx === (mr.ci_status?.check_runs.length || 0) - 1 ? 'none' : '1px solid var(--border-color)',
                                    cursor: 'pointer'
                                }}
                                onClick={() => openUrl(run.html_url)}
                                className="sidebar-item"
                            >
                                <div style={{ display: 'flex' }}>
                                    {run.conclusion === 'success' ? <CheckIcon size={16} color="#4caf50" /> :
                                        run.conclusion === 'failure' ? <XIcon size={16} color="#f44336" /> :
                                            run.status === 'in_progress' ?
                                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                                                    <ClockIcon size={16} color="#ff9800" />
                                                </motion.div> :
                                                <HelpIcon size={16} color="var(--text-secondary)" />}
                                </div>
                                <span style={{ fontSize: '14px', fontWeight: 500 }}>{run.name}</span>
                                <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '12px', flexGrow: 1 }}>
                                    <span>Started: {new Date(run.started_at).toLocaleTimeString()}</span>
                                    {run.completed_at && (
                                        <span>Finished: {new Date(run.completed_at).toLocaleTimeString()}</span>
                                    )}
                                </div>
                                <ExternalLink size={14} color="var(--text-secondary)" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

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
                        className="sidebar-item"
                        style={{
                            margin: 0,
                            borderRadius: 0,
                            borderBottom: idx === mr.files.length - 1 ? 'none' : '1px solid var(--border-color)',
                            padding: '12px 20px',
                            cursor: 'pointer'
                        }}
                        onClick={() => onFileClick(idx)}
                    >
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleFileViewed(mr.id, file.filename);
                            }}
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
