import React, { useEffect, useRef, useMemo, useState } from 'react';
import { Circle, CheckCircle2, ChevronRight, ChevronDown, Folder } from 'lucide-react';
import { MergeRequest, MRFile } from '../../types';

interface ReviewSidebarProps {
    mr: MergeRequest;
    currentIndex: number;
    onSelectFile: (index: number) => void;
    width: number;
}

interface FileWithIndex {
    file: MRFile;
    index: number;
}

interface GroupedFiles {
    [path: string]: FileWithIndex[];
}

export const ReviewSidebar: React.FC<ReviewSidebarProps> = ({
    mr,
    currentIndex,
    onSelectFile,
    width
}) => {
    const activeFileRef = useRef<HTMLDivElement>(null);
    const [collapsedDirs, setCollapsedDirs] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (activeFileRef.current) {
            activeFileRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
            });
        }
    }, [currentIndex]);

    // Group files by directory
    const groupedFiles = useMemo(() => {
        const groups: GroupedFiles = {};

        mr.files.forEach((file, index) => {
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

    // Auto-expand directory containing current file
    useEffect(() => {
        const currentFile = mr.files[currentIndex];
        if (currentFile) {
            const parts = currentFile.filename.split('/');
            const dirPath = parts.length > 1 ? parts.slice(0, -1).join('/') : '';
            if (collapsedDirs.has(dirPath)) {
                setCollapsedDirs(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(dirPath);
                    return newSet;
                });
            }
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
                    {groupedFiles.sortedKeys.map(dirPath => {
                        const files = groupedFiles.groups[dirPath];
                        const isCollapsed = collapsedDirs.has(dirPath);
                        const isRootLevel = dirPath === '';

                        return (
                            <div key={dirPath || '__root__'}>
                                {!isRootLevel && (
                                    <div
                                        onClick={() => toggleDir(dirPath)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: '6px 8px',
                                            margin: '4px 8px 2px 8px',
                                            cursor: 'pointer',
                                            color: 'var(--text-secondary)',
                                            fontSize: '12px',
                                            borderRadius: '4px',
                                            background: 'rgba(255,255,255,0.02)'
                                        }}
                                    >
                                        {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                                        <Folder size={12} />
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {dirPath}
                                        </span>
                                        <span style={{ marginLeft: 'auto', opacity: 0.5 }}>
                                            {files.length}
                                        </span>
                                    </div>
                                )}
                                {!isCollapsed && files.map(({ file, index }) => (
                                    <div
                                        key={index}
                                        ref={currentIndex === index ? activeFileRef : null}
                                        className={`sidebar-item ${currentIndex === index ? 'active' : ''}`}
                                        onClick={() => onSelectFile(index)}
                                        style={{
                                            margin: '2px 8px',
                                            paddingLeft: isRootLevel ? undefined : '24px'
                                        }}
                                    >
                                        {file.viewed ? <CheckCircle2 size={14} color="#4caf50" /> : <Circle size={14} color="#444" />}
                                        <span style={{ fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {file.filename.split('/').pop()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
