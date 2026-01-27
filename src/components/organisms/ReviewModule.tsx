import React, { useMemo, useEffect, useState, useRef, useCallback } from 'react';
import { Copy, Check, Search, X, ArrowUp, ArrowDown } from 'lucide-react';
import { DiffView, DiffModeEnum } from '@git-diff-view/react';
import { DiffFile, generateDiffFile } from '@git-diff-view/file';
import '@git-diff-view/react/styles/diff-view.css';
import { motion } from 'framer-motion';
import { ReviewSidebar } from '../molecules/ReviewSidebar';
import { ReviewStats } from '../molecules/ReviewStats';
import { MergeRequest } from '../../types';
import { openUrl } from '../../utils/browser';
import { parsePatch } from '../../utils/patch';

interface ReviewModuleProps {
    mr: MergeRequest;
    currentIndex: number;
    setCurrentIndex: (index: number) => void;
    fileListWidth: number;
    isResizing: boolean;
    startResizing: (e: React.MouseEvent) => void;
    scrollRef: React.RefObject<HTMLDivElement | null>;
    octokit: any;
    onToggleFilesViewed: (mrId: number, filenames: string[], forceStatus?: boolean) => void;
}

export const ReviewModule: React.FC<ReviewModuleProps> = ({
    mr,
    currentIndex,
    setCurrentIndex,
    fileListWidth,
    isResizing,
    startResizing,
    scrollRef,
    octokit,
    onToggleFilesViewed
}) => {
    const [extraContent, setExtraContent] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loadingContent, setLoadingContent] = useState(false);
    const currentFile = mr.files[currentIndex];

    const isImage = useMemo(() => {
        if (!currentFile?.filename) return false;
        const ext = currentFile.filename.split('.').pop()?.toLowerCase();
        return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'bmp'].includes(ext || '');
    }, [currentFile]);

    useEffect(() => {
        setExtraContent(null);
        setImageUrl(null);
        setLoadingContent(false);
    }, [currentIndex]);

    const handleFetchContent = async () => {
        if (!octokit || !currentFile) return;
        setLoadingContent(true);
        try {
            const [owner, repo] = mr.repository.split('/');
            const { data: contentData } = await octokit.rest.repos.getContent({
                owner,
                repo,
                path: currentFile.filename,
                ref: mr.head_sha
            });

            if ('content' in contentData) {
                if (isImage) {
                    if (contentData.download_url) {
                        setImageUrl(contentData.download_url);
                    } else {
                        const ext = currentFile.filename.split('.').pop()?.toLowerCase();
                        const mimeType = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
                        setImageUrl(`data:${mimeType};base64,${contentData.content.replace(/\n/g, '')}`);
                    }
                } else {
                    const decoded = atob(contentData.content.replace(/\n/g, ''));
                    // We don't need to synthetically create a patch anymore for the new diff viewer
                    // just set it as extra content if we want, but actually parsePatch handles it
                    // if we pass it as the "patch" but it's not a patch...
                    // Wait, parsePatch expects a patch string.
                    // If we fetch full content, we should just use it as newValue.
                    // But current logic uses parsePatch on `currentFile.patch || extraContent`.
                    // Let's just store the content and use it directly.
                    setExtraContent(decoded);
                }
            }
        } catch (error) {
            console.error("Failed to fetch full file content:", error);
        } finally {
            setLoadingContent(false);
        }
    };

    useEffect(() => {
        if (isImage && !imageUrl && !loadingContent) {
            handleFetchContent();
        }
    }, [isImage, currentIndex, imageUrl, loadingContent, octokit, currentFile]);

    // Scroll to top when file changes
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
    }, [currentIndex, scrollRef]);

    // Handle PageUp/PageDown
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!scrollRef.current) return;

            if (e.key === 'PageUp') {
                e.preventDefault();
                scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            } else if (e.key === 'PageDown') {
                e.preventDefault();
                scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [scrollRef]);

    // Parse patch to get content
    const { oldValue, newValue, isEmpty } = useMemo(() => {
        // If extraContent is set (from "Show Content"), it's likely the full file content (not a patch)
        // If it's a patch, parsePatch handles it.
        // If it's full content, we might need to handle it differently?
        // Actually parsePatch logic:
        /*
            lines.forEach((line) => {
                if (line.startsWith('@@')) ...
                else if (line.startsWith('+')) ...
            })
        */
        // If we pass raw content to parsePatch, it won't parse correctly as it expects diff markers.
        // So we should construct the diff file manually if we fetched full content.

        if (extraContent && !extraContent.startsWith('@@')) {
            return { oldValue: '', newValue: extraContent, isEmpty: false };
        }

        return parsePatch(currentFile?.patch || extraContent || undefined);
    }, [currentFile?.patch, extraContent]);

    const getFileLanguage = (filename: string): string => {
        const ext = filename.split('.').pop()?.toLowerCase() || '';
        const langMap: Record<string, string> = {
            'ts': 'typescript',
            'tsx': 'typescript',
            'js': 'javascript',
            'jsx': 'javascript',
            'py': 'python',
            'rb': 'ruby',
            'go': 'go',
            'rs': 'rust',
            'java': 'java',
            'c': 'cpp',
            'cpp': 'cpp',
            'h': 'cpp',
            'hpp': 'cpp',
            'cs': 'csharp',
            'sh': 'bash',
            'bash': 'bash',
            'zsh': 'bash',
            'yml': 'yaml',
            'yaml': 'yaml',
            'toml': 'toml',
            'xml': 'xml',
            'sql': 'sql',
            'json': 'json',
            'md': 'markdown',
            'css': 'css',
            'html': 'html'
        };
        return langMap[ext] || 'plaintext';
    };

    // Create DiffFile instance
    const diffFile = useMemo(() => {
        if (!currentFile) return null;

        // If there's no content to diff, return null
        if (!oldValue && !newValue) return null;

        const fileName = currentFile.filename;
        const lang = getFileLanguage(fileName);

        try {
            const file = generateDiffFile(
                fileName,
                oldValue,
                fileName,
                newValue,
                lang,
                lang
            );

            // Initialize theme and build lines
            file.init();
            file.buildSplitDiffLines();

            return file;
        } catch (error) {
            console.error('Failed to generate diff file:', error);
            return null;
        }
    }, [currentFile, oldValue, newValue]);

    const [isCopying, setIsCopying] = useState(false);
    const [hasCopied, setHasCopied] = useState(false);

    const handleCopyRaw = async () => {
        if (!octokit || !currentFile) return;
        setIsCopying(true);
        try {
            const [owner, repo] = mr.repository.split('/');
            const { data } = await octokit.rest.repos.getContent({
                owner,
                repo,
                path: currentFile.filename,
                ref: mr.head_sha
            });

            if ('content' in data) {
                const content = atob(data.content.replace(/\n/g, ''));
                await navigator.clipboard.writeText(content);
                setHasCopied(true);
                setTimeout(() => setHasCopied(false), 2000);
            }
        } catch (error) {
            console.error("Failed to copy raw content:", error);
        } finally {
            setIsCopying(false);
        }
    };


    // Search functionality
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [searchMatchIndex, setSearchMatchIndex] = useState(0);
    const [searchMatchCount, setSearchMatchCount] = useState(0);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchMatchesRef = useRef<HTMLElement[]>([]);
    const diffContainerRef = useRef<HTMLDivElement>(null);

    // Helper to safely restore styles
    const restoreElementStyle = useCallback((el: HTMLElement) => {
        if (el.dataset.originalBg !== undefined) {
            el.style.backgroundColor = el.dataset.originalBg;
            delete el.dataset.originalBg;
        }

        if (el.dataset.originalTransition !== undefined) {
            el.style.transition = el.dataset.originalTransition;
            delete el.dataset.originalTransition;
        }
    }, []);

    // Helper to apply highlight while saving original style
    const highlightElementStyle = useCallback((el: HTMLElement, color: string) => {
        if (el.dataset.originalBg === undefined) {
            el.dataset.originalBg = el.style.backgroundColor;
        }
        if (el.dataset.originalTransition === undefined) {
            el.dataset.originalTransition = el.style.transition;
        }
        el.style.backgroundColor = color;
        el.style.transition = 'background-color 0.2s';
    }, []);

    const clearHighlights = useCallback(() => {
        if (searchMatchesRef.current) {
            searchMatchesRef.current.forEach(el => {
                restoreElementStyle(el);
                Array.from(el.children).forEach(child => {
                    if (child instanceof HTMLElement) {
                        restoreElementStyle(child);
                    }
                });
            });
        }
        searchMatchesRef.current = [];
        setSearchMatchCount(0);
        setSearchMatchIndex(0);
    }, [restoreElementStyle]);

    const closeSearch = useCallback(() => {
        setIsSearchVisible(false);
        setSearchValue('');
        clearHighlights();
    }, [clearHighlights]);

    useEffect(() => {
        closeSearch();
    }, [currentIndex, closeSearch]);

    const highlightMatch = useCallback((index: number, matches: HTMLElement[]) => {
        matches.forEach((el, idx) => {
            // Restore everyone first to ensure clean slate if they were highlighted
            restoreElementStyle(el);
            Array.from(el.children).forEach(child => {
                if (child instanceof HTMLElement) {
                    restoreElementStyle(child);
                }
            });

            // Define colors - more subtle
            // Active: Distinct but translucent yellow/orange
            const activeColor = 'rgba(210, 150, 20, 0.35)';
            // Inactive: Very subtle yellow tint
            const inactiveColor = 'rgba(210, 150, 20, 0.1)';

            const colorToApply = idx === index ? activeColor : inactiveColor;

            highlightElementStyle(el, colorToApply);

            // Also highlight children to ensure visibility over cell backgrounds
            Array.from(el.children).forEach(child => {
                if (child instanceof HTMLElement) {
                    highlightElementStyle(child, colorToApply);
                }
            });

            if (idx === index) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    }, [highlightElementStyle, restoreElementStyle]);

    const performSearch = useCallback((text: string) => {
        // Clear previous highlights first only if we are re-searching
        // We do this by manually resetting styles on known refs, but strictly speaking
        // finding new matches overlaps.

        // Reset old matches styles
        searchMatchesRef.current.forEach(el => {
            restoreElementStyle(el);
            Array.from(el.children).forEach(child => {
                if (child instanceof HTMLElement) {
                    restoreElementStyle(child);
                }
            });
        });

        if (!text || !diffContainerRef.current) {
            searchMatchesRef.current = [];
            setSearchMatchCount(0);
            return;
        }

        // We search in TR elements of the diff viewer
        const rows = Array.from(diffContainerRef.current.querySelectorAll('tr'));
        const lowerText = text.toLowerCase();

        const matches = rows.filter(row => {
            return row.textContent?.toLowerCase().includes(lowerText);
        });

        searchMatchesRef.current = matches;
        setSearchMatchCount(matches.length);

        if (matches.length > 0) {
            setSearchMatchIndex(0);
            highlightMatch(0, matches);
        } else {
            setSearchMatchIndex(0);
        }
    }, [highlightMatch]);

    const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchValue(e.target.value);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchValue.length >= 3) {
                performSearch(searchValue);
            } else {
                performSearch('');
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchValue, performSearch]);

    const navigateSearch = (direction: 'next' | 'prev') => {
        if (searchMatchesRef.current.length === 0) return;

        let newIndex = direction === 'next' ? searchMatchIndex + 1 : searchMatchIndex - 1;
        if (newIndex >= searchMatchesRef.current.length) newIndex = 0;
        if (newIndex < 0) newIndex = searchMatchesRef.current.length - 1;

        setSearchMatchIndex(newIndex);
        highlightMatch(newIndex, searchMatchesRef.current);
    };

    const onSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            navigateSearch(e.shiftKey ? 'prev' : 'next');
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
                e.preventDefault();
                setIsSearchVisible(true);
            }

            if (isSearchVisible) {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                    closeSearch();
                }
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    navigateSearch(e.shiftKey ? 'prev' : 'next');
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown, { capture: true });
        return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
    }, [isSearchVisible, closeSearch, navigateSearch]);

    useEffect(() => {
        if (isSearchVisible && searchInputRef.current) {
            searchInputRef.current.focus();
            searchInputRef.current.select();
        } else if (!isSearchVisible) {
            // When closing, return focus to container? Optionally.
        }
    }, [isSearchVisible]);


    // Click handler for line numbers - copies filename:line content
    const handleLineNumberClick = useCallback((e: Event) => {
        if (!currentFile) return;

        const target = e.currentTarget as HTMLElement;
        const lineNumber = target.textContent?.trim();

        if (!lineNumber || !/^\d+$/.test(lineNumber)) return;

        // Find the parent row and get the content from the new side
        const row = target.closest('tr');
        if (!row) return;

        // Find the content cell - it's the sibling with class containing 'content' or the last cell
        const contentCell = row.querySelector('.diff-line-new-content, .diff-line-content-new') as HTMLElement;
        const lineContent = contentCell?.textContent || '';

        const formattedContent = `${currentFile.filename}:${lineNumber} ${lineContent.trim()}`;

        navigator.clipboard.writeText(formattedContent).then(() => {
            // Visual feedback - briefly change background color
            const originalBg = target.style.backgroundColor;
            target.style.backgroundColor = '#2ea04366';
            setTimeout(() => {
                target.style.backgroundColor = originalBg;
            }, 300);
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    }, [currentFile]);

    // Attach click handlers to new line number elements after render
    useEffect(() => {
        const container = diffContainerRef.current;
        if (!container) return;

        // Small delay to ensure the diff viewer has rendered
        const timeoutId = setTimeout(() => {
            const lineNumbers = container.querySelectorAll('.diff-line-new-num');
            lineNumbers.forEach(el => {
                el.addEventListener('click', handleLineNumberClick);
                (el as HTMLElement).style.cursor = 'pointer';
            });
        }, 100);

        return () => {
            clearTimeout(timeoutId);
            const lineNumbers = container.querySelectorAll('.diff-line-new-num');
            lineNumbers.forEach(el => {
                el.removeEventListener('click', handleLineNumberClick);
            });
        };
    }, [diffFile, handleLineNumberClick]);

    return (
        <motion.div
            key="review"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        >
            <div style={{
                flexGrow: 1,
                display: 'flex',
                background: 'var(--border-color)',
                height: 'calc(100% - 40px)',
                overflow: 'hidden',
                position: 'relative'
            }}>
                {isSearchVisible && (
                    <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '40px', // Adjusted to not overlap with standard scrollbars too much or header actions
                        zIndex: 100,
                        background: '#1c2128',
                        border: '1px solid #30363d',
                        borderRadius: '6px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '4px',
                        gap: '8px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px', gap: '8px' }}>
                            <Search size={14} color="#8b949e" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchValue}
                                onChange={onSearchChange}
                                onKeyDown={onSearchKeyDown}
                                placeholder="Find..."
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'white',
                                    outline: 'none',
                                    fontSize: '13px',
                                    width: '160px'
                                }}
                            />
                            <span style={{ fontSize: '12px', color: '#8b949e', minWidth: '40px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                                {searchMatchCount > 0 ? `${searchMatchIndex + 1}/${searchMatchCount}` : searchValue ? '0/0' : ''}
                            </span>
                        </div>
                        <div style={{ height: '20px', width: '1px', background: '#30363d' }} />
                        <div style={{ display: 'flex' }}>
                            <button onClick={() => navigateSearch('prev')} style={{ padding: '4px', color: '#c9d1d9' }} title="Previous match (Shift+Enter)">
                                <ArrowUp size={14} />
                            </button>
                            <button onClick={() => navigateSearch('next')} style={{ padding: '4px', color: '#c9d1d9' }} title="Next match (Enter)">
                                <ArrowDown size={14} />
                            </button>
                            <button onClick={closeSearch} style={{ padding: '4px', color: '#c9d1d9' }} title="Close (Esc)">
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                )}

                <ReviewSidebar
                    mr={mr}
                    currentIndex={currentIndex}
                    onSelectFile={setCurrentIndex}
                    width={fileListWidth}
                    onToggleFilesViewed={onToggleFilesViewed}
                />

                {/* Resizer Handle */}
                <div
                    className={`resizer ${isResizing ? 'resizing' : ''}`}
                    onMouseDown={startResizing}
                />

                <div style={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: '#0d1117' }}>
                    <div style={{
                        padding: '16px 20px 12px 20px',
                        borderBottom: '1px solid #30363d',
                        display: 'flex',
                        alignItems: 'center',
                        background: '#0d1117',
                        zIndex: 10
                    }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <ReviewStats files={mr.files} compact />
                        </div>
                        <code style={{ color: 'white', fontSize: '16px', fontWeight: 500, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentFile?.filename}</code>
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                                onClick={handleCopyRaw}
                                disabled={isCopying}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid #30363d',
                                    borderRadius: '4px',
                                    padding: '4px 8px',
                                    color: hasCopied ? '#4caf50' : 'var(--text-secondary)',
                                    fontSize: '11px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    cursor: isCopying ? 'wait' : 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {hasCopied ? <Check size={12} /> : <Copy size={12} />}
                                {hasCopied ? 'Copied!' : 'Copy raw file'}
                            </button>
                        </div>
                    </div>

                    <div ref={scrollRef} style={{ overflowY: 'auto', overflowX: 'hidden', padding: '20px', flexGrow: 1 }}>
                        <div style={{ minWidth: '800px' }}>
                            {imageUrl ? (
                                <div style={{
                                    background: '#0d1117',
                                    borderRadius: '8px',
                                    padding: '40px',
                                    textAlign: 'center',
                                    border: '1px solid #30363d'
                                }}>
                                    <img
                                        src={imageUrl}
                                        alt={currentFile.filename}
                                        style={{ maxWidth: '100%', maxHeight: '70vh', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', borderRadius: '4px' }}
                                    />
                                    <p style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                        Previewing {currentFile.filename}
                                    </p>
                                </div>
                            ) : isEmpty ? (
                                <div style={{
                                    background: '#0d1117',
                                    borderRadius: '8px',
                                    padding: '60px',
                                    textAlign: 'center',
                                    border: '1px solid #30363d',
                                    color: 'var(--text-secondary)'
                                }}>
                                    <p style={{ marginBottom: '16px', fontSize: '14px' }}>
                                        {isImage ? 'Image file' : 'No content changes in this file (likely renamed or binary).'}
                                    </p>
                                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                        <button
                                            onClick={handleFetchContent}
                                            disabled={loadingContent}
                                            style={{
                                                background: 'var(--accent-color)',
                                                border: 'none',
                                                padding: '8px 16px',
                                                borderRadius: '6px',
                                                color: 'white',
                                                cursor: loadingContent ? 'not-allowed' : 'pointer',
                                                fontSize: '12px',
                                                fontWeight: 600
                                            }}
                                        >
                                            {loadingContent ? 'Loading...' : isImage ? 'Show Image' : 'Show Content'}
                                        </button>
                                        <button
                                            onClick={() => openUrl(`https://github.com/${mr.repository}/blob/${mr.head_sha}/${currentFile.filename}`)}
                                            style={{
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid #30363d',
                                                padding: '8px 16px',
                                                borderRadius: '6px',
                                                color: 'var(--text-primary)',
                                                cursor: 'pointer',
                                                fontSize: '12px'
                                            }}
                                        >
                                            View on GitHub
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    ref={diffContainerRef}
                                    className="diff-viewer"
                                    style={{
                                        background: '#0d1117',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        border: '1px solid #30363d',
                                        '--diff-add-line-bg-color': '#0e1c14',
                                        '--diff-add-line-num-bg-color': '#0f1e16',
                                        '--diff-del-line-bg-color': '#1c1215',
                                        '--diff-del-line-num-bg-color': '#1d1316',
                                        '--diff-add-content-highlight-bg-color': '#11231a',
                                        '--diff-del-content-highlight-bg-color': '#22151a',
                                        '--diff-bg-color': '#0d1117',
                                        // '--diff-gutter-bg-color': '#0d1117', // Attempt to match gutter
                                        '--diff-line-num-bg-color': '#0d1117',
                                        '--diff-line-num-color': '#8b949e',
                                        '--diff-content-color': '#c9d1d9',
                                        '--diff-border-color': '#30363d',
                                        fontSize: 'var(--app-font-size)',
                                    } as React.CSSProperties}
                                >
                                    {diffFile && (
                                        <DiffView
                                            diffFile={diffFile}
                                            diffViewMode={DiffModeEnum.Split}
                                            diffViewTheme="dark"
                                            diffViewHighlight
                                            diffViewWrap
                                            diffViewFontSize={14}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <footer style={{
                height: '40px',
                background: 'var(--bg-sidebar)',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 20px',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                gap: '20px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <kbd style={{ background: '#333', padding: '1px 5px', borderRadius: '3px' }}>Arrows</kbd>
                    <span>Navigate</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <kbd style={{ background: '#333', padding: '1px 5px', borderRadius: '3px' }}>Enter</kbd>
                    <span>Next</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <kbd style={{ background: '#333', padding: '1px 5px', borderRadius: '3px' }}>Backspace</kbd>
                    <span>Back</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <kbd style={{ background: '#333', padding: '1px 5px', borderRadius: '3px' }}>Esc</kbd>
                    <span>Exit</span>
                </div>
            </footer>
        </motion.div>
    );
};
