import React from 'react';
import { Copy, Check } from 'lucide-react';
import { DiffView, DiffModeEnum } from '@git-diff-view/react';
import '@git-diff-view/react/styles/diff-view.css';
import { motion } from 'framer-motion';
import { ReviewSidebar } from '../molecules/ReviewSidebar';
import { MergeRequest } from '../../types';
import DOMPurify from 'dompurify';

import { openUrl } from '../../utils/browser';
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
    const [oldFileContent, setOldFileContent] = React.useState<string>('');
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
        setOldFileContent('');
    }, [currentIndex]);

    // Fetch old file content for proper diff comparison
    const fetchOldFileContent = React.useCallback(async () => {
        if (!octokit || !currentFile || !mr.base_ref) return;

        try {
            const [owner, repo] = mr.repository.split('/');
            const { data } = await octokit.rest.repos.getContent({
                owner,
                repo,
                path: currentFile.filename,
                ref: mr.base_ref
            });

            if ('content' in data) {
                const decoded = atob(data.content.replace(/\n/g, ''));
                setOldFileContent(decoded);
            }
        } catch (error) {
            // File might not exist in base branch (new file)
            setOldFileContent('');
        }
    }, [octokit, currentFile, mr.repository, mr.base_ref]);

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

    // Get file extension for language detection
    const getFileLanguage = (filename: string): string => {
        const ext = filename.split('.').pop()?.toLowerCase() || '';
        const langMap: Record<string, string> = {
            'ts': 'typescript',
            'tsx': 'tsx',
            'js': 'javascript',
            'jsx': 'jsx',
            'json': 'json',
            'css': 'css',
            'scss': 'scss',
            'less': 'less',
            'html': 'html',
            'md': 'markdown',
            'markdown': 'markdown',
            'py': 'python',
            'go': 'go',
            'rs': 'rust',
            'java': 'java',
            'rb': 'ruby',
            'sh': 'bash',
            'bash': 'bash',
            'zsh': 'bash',
            'yml': 'yaml',
            'yaml': 'yaml',
            'toml': 'toml',
            'xml': 'xml',
            'sql': 'sql',
        };
        return langMap[ext] || ext;
    };

    const hasPatch = !!(currentFile?.patch || extraContent);

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
                            ) : !hasPatch ? (
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
                                    className="diff-viewer"
                                    style={{
                                        background: '#0d1117',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        border: '1px solid #30363d',
                                        '--diff-add-line-bg-color': diffColors.addedBackground,
                                        '--diff-add-line-num-bg-color': diffColors.addedGutterBackground,
                                        '--diff-del-line-bg-color': diffColors.removedBackground,
                                        '--diff-del-line-num-bg-color': diffColors.removedGutterBackground,
                                        '--diff-add-content-highlight-bg-color': diffColors.wordAddedBackground,
                                        '--diff-del-content-highlight-bg-color': diffColors.wordRemovedBackground,
                                        '--diff-bg-color': '#0d1117',
                                        '--diff-line-num-bg-color': '#0d1117',
                                        '--diff-line-num-color': '#8b949e',
                                        '--diff-content-color': '#c9d1d9',
                                        '--diff-border-color': '#30363d',
                                        fontSize: 'var(--app-font-size)',
                                    } as React.CSSProperties}
                                >
                                    <DiffView
                                        diffViewMode={DiffModeEnum.Split}
                                        diffViewTheme="dark"
                                        diffViewHighlight
                                        diffViewWrap
                                        diffViewFontSize={14}
                                        data={{
                                            oldFile: {
                                                fileName: currentFile.filename,
                                                fileLang: getFileLanguage(currentFile.filename),
                                                content: oldFileContent,
                                            },
                                            newFile: {
                                                fileName: currentFile.filename,
                                                fileLang: getFileLanguage(currentFile.filename),
                                                content: '',
                                            },
                                            hunks: [currentFile.patch || extraContent || ''],
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
