import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, FileText, ExternalLink } from 'lucide-react';
import { MergeRequest } from '../../types';

interface MrDetailProps {
    mr: MergeRequest;
    onStartReview: () => void;
    onToggleFileViewed: (mrId: number, filename: string) => void;
    onFileClick: (index: number) => void;
}

export const MrDetail: React.FC<MrDetailProps> = ({
    mr,
    onStartReview,
    onToggleFileViewed,
    onFileClick
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
                            Start Review
                        </button>
                        <button
                            onClick={() => {
                                const url = `https://github.com/${mr.repository}/pull/${mr.number}`;
                                window.open(url, '_blank');
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '10px 20px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                color: 'var(--text-primary)',
                                cursor: 'pointer'
                            }}
                        >
                            <ExternalLink size={16} />
                            <span>GitHub</span>
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                    <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Branch</div>
                        <div style={{ fontFamily: 'monospace', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>
                            {mr.base_ref} ← {mr.head_ref}
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px' }}>Files Changed ({mr.files.length})</h3>
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    {mr.files.filter(f => f.viewed).length} of {mr.files.length} reviewed
                </div>
            </div>

            <div className="glass" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                {mr.files.map((file, idx) => (
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
