import React, { useEffect, useRef } from 'react';
import { Circle, CheckCircle2 } from 'lucide-react';
import { MergeRequest } from '../../types';

interface ReviewSidebarProps {
    mr: MergeRequest;
    currentIndex: number;
    onSelectFile: (index: number) => void;
    width: number;
}

export const ReviewSidebar: React.FC<ReviewSidebarProps> = ({
    mr,
    currentIndex,
    onSelectFile,
    width
}) => {
    const activeFileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (activeFileRef.current) {
            activeFileRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
            });
        }
    }, [currentIndex]);

    return (
        <div style={{
            background: 'var(--bg-app)',
            overflow: 'hidden',
            width: 'var(--file-list-width)',
            flexShrink: 0,
            paddingTop: '60px',
            borderRight: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div style={{
                height: '100%',
                overflowY: 'auto',
                direction: 'rtl',
                scrollbarGutter: 'stable'
            }}>
                <div style={{ direction: 'ltr' }}>
                    {mr.files.map((file, idx) => (
                        <div
                            key={idx}
                            ref={currentIndex === idx ? activeFileRef : null}
                            className={`sidebar-item ${currentIndex === idx ? 'active' : ''}`}
                            onClick={() => onSelectFile(idx)}
                            style={{ margin: '2px 8px' }}
                        >
                            {file.viewed ? <CheckCircle2 size={14} color="#4caf50" /> : <Circle size={14} color="#444" />}
                            <span style={{ fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {file.filename.split('/').pop()}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
