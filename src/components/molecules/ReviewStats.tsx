import React, { useMemo } from 'react';
import { MRFile } from '../../types';

interface ReviewStatsProps {
    files: MRFile[];
    compact?: boolean;
}

export interface ReviewStatsData {
    additions: number;
    deletions: number;
    viewedAdditions: number;
    viewedDeletions: number;
    viewedPercentage: number;
    viewedFiles: number;
    totalFiles: number;
}

export const useReviewStats = (files: MRFile[]): ReviewStatsData => {
    return useMemo(() => {
        const totals = files.reduce((acc, file) => ({
            additions: acc.additions + (file.additions || 0),
            deletions: acc.deletions + (file.deletions || 0),
            viewedAdditions: acc.viewedAdditions + (file.viewed ? (file.additions || 0) : 0),
            viewedDeletions: acc.viewedDeletions + (file.viewed ? (file.deletions || 0) : 0)
        }), { additions: 0, deletions: 0, viewedAdditions: 0, viewedDeletions: 0 });

        const totalLines = totals.additions + totals.deletions;
        const viewedLines = totals.viewedAdditions + totals.viewedDeletions;
        const viewedPercentage = totalLines > 0 ? Math.round((viewedLines / totalLines) * 100) : 0;
        const viewedFiles = files.filter(f => f.viewed).length;

        return { ...totals, viewedPercentage, viewedFiles, totalFiles: files.length };
    }, [files]);
};

export const ReviewStats: React.FC<ReviewStatsProps> = ({ files, compact = false }) => {
    const stats = useReviewStats(files);

    if (compact) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                    <span>
                        <span style={{ color: '#4caf50' }}>+{stats.viewedAdditions}</span>
                        <span style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>/+{stats.additions}</span>
                    </span>
                    <span>
                        <span style={{ color: '#f44336' }}>-{stats.viewedDeletions}</span>
                        <span style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>/-{stats.deletions}</span>
                    </span>
                </div>
                <div style={{
                    background: 'rgba(255,255,255,0.08)',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontWeight: 600,
                    color: '#ffffff',
                    fontSize: '11px'
                }}>
                    {stats.viewedPercentage}%
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 500 }}>
                    <span style={{ color: '#4caf50' }}>+{stats.viewedAdditions}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>/</span>
                    <span style={{ color: '#4caf50', opacity: 0.6 }}>+{stats.additions}</span>
                </span>
                <span style={{ fontWeight: 500 }}>
                    <span style={{ color: '#f44336' }}>-{stats.viewedDeletions}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>/</span>
                    <span style={{ color: '#f44336', opacity: 0.6 }}>-{stats.deletions}</span>
                </span>
            </div>
            <span>{stats.viewedFiles} of {stats.totalFiles} files</span>
            <div style={{
                background: 'rgba(255,255,255,0.08)',
                padding: '4px 10px',
                borderRadius: '12px',
                fontWeight: 600,
                color: '#ffffff'
            }}>
                {stats.viewedPercentage}% reviewed
            </div>
        </div>
    );
};
