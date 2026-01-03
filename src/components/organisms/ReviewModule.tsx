import React from 'react';
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

interface ReviewModuleProps {
    mr: MergeRequest;
    currentIndex: number;
    setCurrentIndex: (index: number) => void;
    fileListWidth: number;
    isResizing: boolean;
    startResizing: (e: React.MouseEvent) => void;
    scrollRef: React.RefObject<HTMLDivElement>;
}

const parsePatch = (patch?: string) => {
    if (!patch) return { oldValue: '', newValue: '' };

    const lines = patch.split('\n');
    const oldLines: string[] = [];
    const newLines: string[] = [];

    lines.forEach((line) => {
        if (line.startsWith('@@')) {
            // Add a visual break between hunks if needed, but for now just skip header content
            // or push an empty line to maintain some separation
            if (oldLines.length > 0) {
                oldLines.push(' ');
                newLines.push(' ');
            }
        } else if (line.startsWith('-')) {
            oldLines.push(line.substring(1));
        } else if (line.startsWith('+')) {
            newLines.push(line.substring(1));
        } else if (line.startsWith(' ') || line === '') {
            const content = line.startsWith(' ') ? line.substring(1) : line;
            oldLines.push(content);
            newLines.push(content);
        }
    });

    return {
        oldValue: oldLines.join('\n'),
        newValue: newLines.join('\n'),
    };
};

export const ReviewModule: React.FC<ReviewModuleProps> = ({
    mr,
    currentIndex,
    setCurrentIndex,
    fileListWidth,
    isResizing,
    startResizing,
    scrollRef
}) => {
    const currentFile = mr.files[currentIndex];
    const { oldValue, newValue } = parsePatch(currentFile?.patch);

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
                        <code style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{currentFile?.filename}</code>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <kbd style={{ background: '#333', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>Enter</kbd>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>to mark viewed</span>
                        </div>
                    </div>

                    <div ref={scrollRef} style={{ overflowY: 'auto', overflowX: 'hidden', padding: '20px', flexGrow: 1 }}>
                        <div style={{ minWidth: '800px' }}>
                            {/* Diff Preview */}
                            <div style={{ background: '#0d1117', borderRadius: '8px', overflow: 'hidden', border: '1px solid #30363d' }}>
                                <ReactDiffViewer
                                    oldValue={oldValue}
                                    newValue={newValue}
                                    splitView={true}
                                    useDarkTheme={true}
                                    compareMethod={DiffMethod.WORDS}
                                    hideLineNumbers={false}
                                    renderContent={highlightSyntax}
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
                                                addedBackground: '#2ea04326',
                                                addedGutterBackground: '#2ea0434d',
                                                removedBackground: '#f8514926',
                                                removedGutterBackground: '#f851494d',
                                                wordAddedBackground: '#2ea04366',
                                                wordRemovedBackground: '#f8514966',
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
