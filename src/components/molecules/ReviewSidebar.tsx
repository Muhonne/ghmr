import React, { useEffect, useRef, useMemo, useState } from 'react';
import { Circle, CheckCircle2, ChevronRight, ChevronDown, Folder } from 'lucide-react';
import { MergeRequest, MRFile } from '../../types';

interface ReviewSidebarProps {
    mr: MergeRequest;
    currentIndex: number;
    onSelectFile: (index: number) => void;
    width: number;
    onToggleFilesViewed: (mrId: number, filenames: string[], forceStatus?: boolean) => void;
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
    width,
    onToggleFilesViewed
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

        // Use all files
        const filesToGroup = mr.files.map((file, index) => ({ file, index }));

        filesToGroup.forEach(({ file, index }) => {
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
            paddingTop: '0',
            borderRight: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div style={{
                height: '100%',
                overflowY: 'auto',
                direction: 'rtl',
                scrollbarGutter: 'stable',
                paddingTop: '10px'
            }}>
                <div style={{ direction: 'ltr' }}>
                    {groupedFiles.sortedKeys.map(dirPath => {
                        const files = groupedFiles.groups[dirPath];
                        const isCollapsed = collapsedDirs.has(dirPath);
                        const isRootLevel = dirPath === '';

                        // Check status of files in this folder
                        const allViewed = files.every(({ file }) => file.viewed);
                        const someViewed = files.some(({ file }) => file.viewed);

                        return (
                            <div key={dirPath || '__root__'}>
                                {!isRootLevel && (
                                    <div
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
                                        <div
                                            onClick={() => onToggleFilesViewed(mr.id, files.map(f => f.file.filename), !allViewed)}
                                            style={{ display: 'flex', alignItems: 'center', marginRight: '4px' }}
                                            title={allViewed ? "Mark folder as unviewed" : "Mark folder as viewed"}
                                        >
                                            {allViewed ? (
                                                <CheckCircle2 size={12} color="#4caf50" />
                                            ) : someViewed ? (
                                                <Circle size={12} color="#4caf50" fill='#4caf50' fillOpacity={0.2} />
                                            ) : (
                                                <Circle size={12} color="#444" />
                                            )}
                                        </div>

                                        <div
                                            onClick={() => toggleDir(dirPath)}
                                            style={{ display: 'flex', alignItems: 'center', gap: '4px', flexGrow: 1, overflow: 'hidden' }}
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
                                        {/* Use existing toggle logic? ReviewModule doesn't pass individual toggle here, but app has global toggle via context or props? 
                                            Actually ReviewSidebarItem click is just selection. 
                                            The individual toggle is inside the item or handled by keyboard in App.tsx. 
                                            But wait, look at ReviewSidebar.tsx original code.
                                            It renders CheckCircle/Circle but no onClick handler for it!
                                            The user can only toggle via keyboard (Enter) or maybe clicking the icon?
                                            Original:
                                            {file.viewed ? <CheckCircle2 size={14} color="#4caf50" /> : <Circle size={14} color="#444" />}
                                            It seems it wasn't clickable in the sidebar before? Assuming yes based on code.
                                            Wait, MrDetail had a clickable toggle. ReviewSidebar did not.
                                            Let's make it clickable here too if we can, or just stick to folder toggle. 
                                            App.tsx passes `toggleFileViewed`? No, ReviewSidebar only gets `onSelectFile`.
                                            So individual toggle in sidebar is not requested, but folder toggle is.
                                            However, `onToggleFilesViewed` can be used for single file too.
                                        */}
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onToggleFilesViewed(mr.id, [file.filename]);
                                            }}
                                            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                                        >
                                            {file.viewed ? <CheckCircle2 size={14} color="#4caf50" /> : <Circle size={14} color="#444" />}
                                        </div>
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
