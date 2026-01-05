import React from 'react';
import { Copy, Check } from 'lucide-react';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';
import { motion } from 'framer-motion';
import { ReviewSidebar } from '../molecules/ReviewSidebar';
import { MergeRequest } from '../../types';
import DOMPurify from 'dompurify';

import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-go';
import { openUrl } from '../../utils/browser';

import { CIStatusBadge } from '../atoms/CIStatusBadge';

import { parsePatch } from '../../utils/patch';
import { DiffColors } from '../../utils/secureStorage';

interface ReviewModuleProps {
    mr: MergeRequest;
    currentIndex: number;
    setCurrentIndex: (index: number) => void;
    fileListWidth: number;
    isResizing: boolean;
    startResizing: (e: React.MouseEvent) => void;
    scrollRef: React.RefObject<HTMLDivElement | null>;
    octokit: any;
    diffColors: DiffColors;
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
    diffColors
}) => {
    const [extraContent, setExtraContent] = React.useState<string | null>(null);
    const [imageUrl, setImageUrl] = React.useState<string | null>(null);
    const [loadingContent, setLoadingContent] = React.useState(false);
    const currentFile = mr.files[currentIndex];

    const isImage = React.useMemo(() => {
        if (!currentFile?.filename) return false;
        const ext = currentFile.filename.split('.').pop()?.toLowerCase();
        return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'bmp'].includes(ext || '');
    }, [currentFile]);

    React.useEffect(() => {
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
                ref: mr.head_sha // Precise SHA
            });

            if ('content' in contentData) {
                if (isImage) {
                    // For images, we can use the download_url or a data URI
                    if (contentData.download_url) {
                        setImageUrl(contentData.download_url);
                    } else {
                        const ext = currentFile.filename.split('.').pop()?.toLowerCase();
                        const mimeType = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
                        setImageUrl(`data:${mimeType};base64,${contentData.content.replace(/\n/g, '')}`);
                    }
                } else {
                    const decoded = atob(contentData.content.replace(/\n/g, ''));
                    // Create a synthetic patch: all additions
                    const syntheticPatch = `@@ -0,0 +1,${decoded.split('\n').length} @@\n` +
                        decoded.split('\n').map(line => `+${line}`).join('\n');
                    setExtraContent(syntheticPatch);
                }
            }
        } catch (error) {
            console.error("Failed to fetch full file content:", error);
        } finally {
            setLoadingContent(false);
        }
    };

    React.useEffect(() => {
        if (isImage && !imageUrl && !loadingContent) {
            handleFetchContent();
        }
    }, [isImage, currentIndex, imageUrl, loadingContent, octokit, currentFile]);

    const { oldValue, newValue, isEmpty } = parsePatch(currentFile?.patch || extraContent || undefined);

    const [isCopying, setIsCopying] = React.useState(false);
    const [hasCopied, setHasCopied] = React.useState(false);

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

    // State for line number click feedback
    const [clickedLine, setClickedLine] = React.useState<string | null>(null);

    // Handle clicking on line numbers to copy filename:line content
    const handleLineNumberClick = async (lineNumber: number, lineContent: string) => {
        if (!currentFile) return;

        const formatted = `${currentFile.filename}:${lineNumber} ${lineContent}`;

        try {
            await navigator.clipboard.writeText(formatted);

            // Visual feedback
            setClickedLine(String(lineNumber));
            setTimeout(() => {
                setClickedLine(null);
            }, 500);
        } catch (error) {
            console.error('Failed to copy line reference:', error);
        }
    };

    // Custom line number renderer with onClick for incoming changes
    const renderGutter = (options: any) => {
        const { lineNumber, type } = options;

        if (!lineNumber) return <td />;

        // Only make incoming changes (right side, type 1 = added) clickable
        const isClickable = type === 1;
        const isClicked = clickedLine === String(lineNumber);

        if (isClickable) {
            // Get the line content from newValue
            const lines = newValue.split('\n');
            const lineContent = lines[lineNumber - 1] || '';

            return (
                <td
                    onClick={() => handleLineNumberClick(lineNumber, lineContent)}
                    style={{
                        cursor: 'pointer',
                        userSelect: 'none',
                        backgroundColor: isClicked ? '#2ea04366' : undefined,
                        transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        if (!isClicked) {
                            e.currentTarget.style.backgroundColor = 'rgba(46, 160, 67, 0.2)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isClicked) {
                            e.currentTarget.style.backgroundColor = '';
                        }
                    }}
                >
                    {lineNumber}
                </td>
            );
        }

        // For non-clickable lines (deleted/unchanged), render plain line number
        return <td style={{ userSelect: 'none' }}>{lineNumber}</td>;
    };


    const highlightSyntax = (str: string) => {
        if (!currentFile?.filename) return <span style={{ display: 'inline' }}>{str}</span>;

        const ext = currentFile.filename.split('.').pop()?.toLowerCase();
        let lang = 'plaintext';

        if (['ts', 'tsx'].includes(ext || '')) lang = 'typescript';
        else if (['js', 'jsx', 'cjs', 'mjs'].includes(ext || '')) lang = 'javascript';
        else if (ext === 'json') lang = 'json';
        else if (ext === 'css') lang = 'css';
        else if (['md', 'markdown'].includes(ext || '')) lang = 'markdown';
        else if (['sh', 'bash', 'zsh'].includes(ext || '')) lang = 'bash';
        else if (['yml', 'yaml'].includes(ext || '')) lang = 'yaml';
        else if (ext === 'py') lang = 'python';
        else if (ext === 'go') lang = 'go';

        try {
            const grammar = Prism.languages[lang];
            if (grammar) {
                const highlighted = Prism.highlight(str, grammar, lang);
                // Sanitize the highlighted HTML to prevent XSS
                const sanitized = DOMPurify.sanitize(highlighted, {
                    ALLOWED_TAGS: ['span'],
                    ALLOWED_ATTR: ['class', 'style']
                });
                return <span dangerouslySetInnerHTML={{ __html: sanitized }} />;
            }
        } catch (e) {
            // Fallback to plain text on error
        }
        return <span style={{ display: 'inline' }}>{str}</span>;
    };

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
                <ReviewSidebar
                    mr={mr}
                    currentIndex={currentIndex}
                    onSelectFile={setCurrentIndex}
                    width={fileListWidth}
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
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#0d1117',
                        zIndex: 10
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <code style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{currentFile?.filename}</code>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
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
                                <div className="diff-viewer" style={{ background: '#0d1117', borderRadius: '8px', overflow: 'hidden', border: '1px solid #30363d' }}>
                                    <ReactDiffViewer
                                        oldValue={oldValue}
                                        newValue={newValue}
                                        splitView={true}
                                        useDarkTheme={true}
                                        compareMethod={DiffMethod.WORDS}
                                        hideLineNumbers={true}
                                        renderContent={highlightSyntax}
                                        renderGutter={renderGutter}
                                        styles={{
                                            diffContainer: {
                                                lineHeight: 'normal',
                                                tableLayout: 'fixed',
                                                width: '100%',
                                            },
                                            content: {
                                                width: '50%',
                                            },
                                            gutter: {
                                                minWidth: '50px',
                                                width: '50px',
                                                paddingLeft: '10px',
                                                paddingRight: '10px',
                                            },
                                            lineNumber: {
                                                fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace',
                                                fontSize: 'var(--app-font-size)',
                                                lineHeight: 'normal !important',
                                                paddingTop: '2px',
                                                paddingBottom: '2px',
                                                minWidth: '30px',
                                            },
                                            contentText: {
                                                fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace',
                                                fontSize: 'var(--app-font-size)',
                                                lineHeight: 'normal !important',
                                                paddingTop: '2px',
                                                paddingBottom: '2px',
                                                paddingLeft: '10px',
                                                paddingRight: '10px',
                                                wordBreak: 'break-all',
                                                whiteSpace: 'pre-wrap',
                                            },
                                            line: {
                                                marginTop: '0px',
                                                marginBottom: '0px',
                                            },
                                            variables: {
                                                dark: {
                                                    diffViewerBackground: '#0d1117',
                                                    gutterBackground: '#0d1117',
                                                    addedBackground: diffColors.addedBackground,
                                                    addedGutterBackground: diffColors.addedGutterBackground,
                                                    removedBackground: diffColors.removedBackground,
                                                    removedGutterBackground: diffColors.removedGutterBackground,
                                                    wordAddedBackground: diffColors.wordAddedBackground,
                                                    wordRemovedBackground: diffColors.wordRemovedBackground,
                                                    codeFoldGutterBackground: '#161b22',
                                                    codeFoldBackground: '#0d1117',
                                                    emptyLineBackground: '#0d1117',
                                                    gutterColor: '#8b949e',
                                                    codeFoldContentColor: '#8b949e',
                                                    diffViewerTitleBackground: '#161b22',
                                                    diffViewerTitleColor: '#c9d1d9',
                                                }
                                            }
                                        }}
                                    />
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
