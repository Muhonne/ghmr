import React from 'react';
import { Keyboard } from 'lucide-react';

const kbdStyle: React.CSSProperties = {
    background: 'var(--bg-active)',
    padding: '4px 8px',
    borderRadius: '4px',
    border: '1px solid var(--border-color)',
    fontSize: '11px',
    whiteSpace: 'nowrap'
};

const rowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
};

export const KeyboardShortcutsContent: React.FC = () => (
    <>
        {/* Global shortcuts */}
        <div style={{ marginBottom: '16px' }}>
            <h4 style={{ fontSize: '12px', color: 'var(--accent-color)', marginBottom: '8px' }}>Global</h4>
            <div style={{ display: 'grid', gap: '4px', fontSize: '11px' }}>
                <div style={rowStyle}>
                    <span style={{ color: 'var(--text-secondary)' }}>Font size +/-</span>
                    <kbd style={kbdStyle}>⌘ +/-</kbd>
                </div>
                <div style={rowStyle}>
                    <span style={{ color: 'var(--text-secondary)' }}>Go back</span>
                    <kbd style={kbdStyle}>Esc</kbd>
                </div>
            </div>
        </div>

        {/* List view shortcuts */}
        <div style={{ marginBottom: '16px' }}>
            <h4 style={{ fontSize: '12px', color: 'var(--accent-color)', marginBottom: '8px' }}>List View</h4>
            <div style={{ display: 'grid', gap: '4px', fontSize: '11px' }}>
                <div style={rowStyle}>
                    <span style={{ color: 'var(--text-secondary)' }}>Navigate</span>
                    <kbd style={kbdStyle}>↑↓ / j k</kbd>
                </div>
                <div style={rowStyle}>
                    <span style={{ color: 'var(--text-secondary)' }}>Open MR</span>
                    <kbd style={kbdStyle}>Enter</kbd>
                </div>
                <div style={rowStyle}>
                    <span style={{ color: 'var(--text-secondary)' }}>Refresh</span>
                    <kbd style={kbdStyle}>⌘ R</kbd>
                </div>
            </div>
        </div>

        {/* Detail view shortcuts */}
        <div style={{ marginBottom: '16px' }}>
            <h4 style={{ fontSize: '12px', color: 'var(--accent-color)', marginBottom: '8px' }}>Detail View</h4>
            <div style={{ display: 'grid', gap: '4px', fontSize: '11px' }}>
                <div style={rowStyle}>
                    <span style={{ color: 'var(--text-secondary)' }}>Navigate files</span>
                    <kbd style={kbdStyle}>↑↓ / j k</kbd>
                </div>
                <div style={rowStyle}>
                    <span style={{ color: 'var(--text-secondary)' }}>Scroll view</span>
                    <kbd style={kbdStyle}>PgUp/Dn</kbd>
                </div>
                <div style={rowStyle}>
                    <span style={{ color: 'var(--text-secondary)' }}>Open in review</span>
                    <kbd style={kbdStyle}>Enter</kbd>
                </div>
                <div style={rowStyle}>
                    <span style={{ color: 'var(--text-secondary)' }}>Refresh</span>
                    <kbd style={kbdStyle}>⌘ R</kbd>
                </div>
            </div>
        </div>

        {/* Review view shortcuts */}
        <div>
            <h4 style={{ fontSize: '12px', color: 'var(--accent-color)', marginBottom: '8px' }}>Review View</h4>
            <div style={{ display: 'grid', gap: '4px', fontSize: '11px' }}>
                <div style={rowStyle}>
                    <span style={{ color: 'var(--text-secondary)' }}>Next/prev file</span>
                    <kbd style={kbdStyle}>←→ / j k</kbd>
                </div>
                <div style={rowStyle}>
                    <span style={{ color: 'var(--text-secondary)' }}>Scroll</span>
                    <kbd style={kbdStyle}>↑↓</kbd>
                </div>
                <div style={rowStyle}>
                    <span style={{ color: 'var(--text-secondary)' }}>Top/bottom</span>
                    <kbd style={kbdStyle}>PgUp/Dn</kbd>
                </div>
                <div style={rowStyle}>
                    <span style={{ color: 'var(--text-secondary)' }}>Mark & next</span>
                    <kbd style={kbdStyle}>Enter / Space</kbd>
                </div>
                <div style={rowStyle}>
                    <span style={{ color: 'var(--text-secondary)' }}>Unmark & back</span>
                    <kbd style={kbdStyle}>Backspace</kbd>
                </div>
                <div style={rowStyle}>
                    <span style={{ color: 'var(--text-secondary)' }}>Copy file:line</span>
                    <kbd style={kbdStyle}>Click line #</kbd>
                </div>
            </div>
        </div>
    </>
);

interface KeyboardShortcutsPopoverProps {
    isMinified: boolean;
}

export const KeyboardShortcutsPopover: React.FC<KeyboardShortcutsPopoverProps> = ({ isMinified }) => {
    const [isHovered, setIsHovered] = React.useState(false);

    return (
        <div
            style={{ position: 'relative' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isMinified ? 'center' : 'flex-start',
                    gap: '12px',
                    padding: '10px 16px',
                    color: 'var(--text-secondary)',
                    cursor: 'default',
                    transition: 'all 0.2s ease',
                    background: isHovered ? 'rgba(255,255,255,0.05)' : 'transparent'
                }}
            >
                <Keyboard size={18} />
                {!isMinified && <span>Shortcuts</span>}
            </div>

            {isHovered && (
                <div
                    style={{
                        position: 'absolute',
                        left: '100%',
                        top: 0,
                        background: 'var(--bg-sidebar)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '16px',
                        width: '280px',
                        zIndex: 1000,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <Keyboard size={16} color="var(--accent-color)" />
                        <span style={{ fontWeight: 600, fontSize: '13px' }}>Keyboard Shortcuts</span>
                    </div>
                    <KeyboardShortcutsContent />
                </div>
            )}
        </div>
    );
};
