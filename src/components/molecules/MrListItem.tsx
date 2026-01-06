import React from 'react';
import { Navigation } from 'lucide-react';
import { MergeRequest } from '../../types';

interface Props {
    mr: MergeRequest;
    onClick: () => void;
    onReviewClick: () => void;
    isSelected?: boolean;
}

export const MrListItem: React.FC<Props> = ({
    mr,
    onClick,
    onReviewClick,
    isSelected
}) => {
    const viewedCount = mr.files.filter(f => f.viewed).length;
    const totalFiles = mr.files.length;
    const progress = (viewedCount / (totalFiles || 1)) * 100;

    return (
        <div
            className="glass"
            style={{
                padding: '16px',
                borderRadius: '12px',
                marginBottom: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                position: 'relative',
                overflow: 'hidden',
                border: isSelected ? '1px solid var(--accent-color)' : '1px solid rgba(255,255,255,0.05)',
                transform: isSelected ? 'scale(1.005)' : 'scale(1)',
                transition: 'all 0.2s ease'
            }}
            onClick={onClick}
        >
            {/* Progress Background */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: '2px',
                width: `${progress}%`,
                background: 'var(--accent-color)',
                opacity: 0.5,
                transition: 'width 0.3s ease'
            }} />

            <div style={{
                width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(0,122,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <Navigation size={20} color="var(--accent-color)" />
            </div>
            <div style={{ flexGrow: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '15px' }}>{mr.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    #{mr.number} opened by {mr.author} • {mr.repository}
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600 }}>{viewedCount} / {totalFiles}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>viewed</div>
                </div>

                <button
                    className="btn-primary"
                    style={{
                        padding: '6px 14px',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onReviewClick();
                    }}
                >
                    Review
                </button>
            </div>
        </div>
    );
};
