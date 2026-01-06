import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Settings as SettingsIcon, AlertCircle } from 'lucide-react';
import { validateGitHubToken } from '../../utils/tokenValidation';
import { DiffColors } from '../../utils/secureStorage';

interface SettingsProps {
    token: string;
    setToken: (token: string) => void;
    fontSize: number;
    setFontSize: (size: number) => void;
    pollInterval: number;
    setPollInterval: (interval: number) => void;
    diffColors: DiffColors;
    setDiffColors: (colors: DiffColors) => void;
    onSave: (token?: string, fontSize?: number, width?: number, pollInterval?: number, diffColors?: DiffColors) => void;
}

export const Settings: React.FC<SettingsProps> = ({
    token,
    setToken,
    fontSize,
    setFontSize,
    pollInterval,
    setPollInterval,
    diffColors,
    setDiffColors,
    onSave
}) => {
    const [tokenError, setTokenError] = useState<string>('');

    const handleTokenChange = (newToken: string) => {
        setToken(newToken);
        // Clear error on change
        if (tokenError) setTokenError('');
    };

    const handleSave = () => {
        const validation = validateGitHubToken(token);
        if (!validation.valid) {
            setTokenError(validation.error || 'Invalid token');
            return;
        }
        setTokenError('');
        onSave(token, fontSize, undefined, pollInterval, diffColors);
    };

    const tokenValidation = validateGitHubToken(token);
    const isTokenValid = token === '' || tokenValidation.valid;

    return (
        <motion.div
            key="settings"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', width: '100%' }}
        >
            <div className="glass" style={{ padding: '32px', borderRadius: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <SettingsIcon size={24} color="var(--accent-color)" />
                    <h2 style={{ fontSize: '20px' }}>Application Settings</h2>
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        GitHub Personal Access Token (classic)
                    </label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="password"
                            value={token}
                            onChange={(e) => handleTokenChange(e.target.value)}
                            placeholder="ghp_xxxxxxxxxxxx"
                            style={{
                                width: '100%',
                                background: 'rgba(0,0,0,0.2)',
                                border: `1px solid ${tokenError ? '#f44336' : isTokenValid ? 'var(--border-color)' : '#ff9800'}`,
                                borderRadius: '8px',
                                padding: '12px 16px',
                                paddingRight: '40px',
                                color: 'white',
                                outline: 'none'
                            }}
                        />
                        <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                            {tokenError ? (
                                <AlertCircle size={18} color="#f44336" />
                            ) : isTokenValid && token ? (
                                <ShieldCheck size={18} color="#4caf50" />
                            ) : (
                                <ShieldCheck size={18} color="#444" />
                            )}
                        </div>
                    </div>
                    {tokenError && (
                        <p style={{ fontSize: '12px', color: '#f44336', marginTop: '8px' }}>
                            {tokenError}
                        </p>
                    )}
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '12px', lineHeight: '1.6' }}>
                        Your token needs <strong>'repo'</strong>, <strong>'workflow'</strong>, and <strong>'read:user'</strong> scopes to function fully.
                        It is stored securely using encrypted storage and never sent to any server other than GitHub.
                    </p>
                </div>

                <div style={{ marginBottom: '24px', padding: '16px', borderRadius: '8px', background: 'rgba(255,193,7,0.05)', border: '1px solid rgba(255,193,7,0.2)' }}>
                    <h4 style={{ fontSize: '13px', color: '#ffc107', marginBottom: '8px' }}>How to get a token?</h4>
                    <ol style={{ fontSize: '12px', color: 'var(--text-secondary)', paddingLeft: '20px' }}>
                        <li style={{ marginBottom: '4px' }}>Go to GitHub Settings → Developer settings</li>
                        <li style={{ marginBottom: '4px' }}>Personal access tokens → Tokens (classic)</li>
                        <li style={{ marginBottom: '4px' }}>Generate new token (classic)</li>
                        <li>Select the <strong>'repo'</strong>, <strong>'workflow'</strong>, and <strong>'read:user'</strong> scopes and generate</li>
                    </ol>
                </div>

                <div style={{ marginBottom: '32px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        Preferred Font Size (Cmd/Ctrl +/- to adjust)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <input
                            type="range"
                            min="6"
                            max="20"
                            step="1"
                            value={fontSize}
                            onChange={(e) => {
                                const newSize = parseInt(e.target.value);
                                setFontSize(newSize);
                                document.documentElement.style.setProperty('--app-font-size', `${newSize}px`);
                            }}
                            style={{ flexGrow: 1 }}
                        />
                        <span style={{ fontSize: '14px', width: '40px', textAlign: 'right' }}>{fontSize}px</span>
                    </div>
                </div>

                <div style={{ marginBottom: '32px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        CI Polling Interval (ms)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <input
                            type="number"
                            min="500"
                            max="30000"
                            step="500"
                            value={pollInterval}
                            onChange={(e) => setPollInterval(parseInt(e.target.value) || 1000)}
                            style={{
                                flexGrow: 1,
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                color: 'white',
                                outline: 'none'
                            }}
                        />
                        <span style={{ fontSize: '14px', width: '60px', textAlign: 'right' }}>{pollInterval}ms</span>
                    </div>
                </div>

                <div style={{ marginBottom: '32px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                    <h3 style={{ fontSize: '15px', marginBottom: '16px', color: 'var(--text-primary)' }}>Diff Viewer Colors</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        Customize the colors used in the diff viewer for better readability.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                Added Line Background
                            </label>
                            <input
                                type="color"
                                value={diffColors.addedBackground}
                                onChange={(e) => setDiffColors({ ...diffColors, addedBackground: e.target.value })}
                                style={{ width: '100%', height: '36px', cursor: 'pointer', borderRadius: '4px' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                Added Gutter Background
                            </label>
                            <input
                                type="color"
                                value={diffColors.addedGutterBackground}
                                onChange={(e) => setDiffColors({ ...diffColors, addedGutterBackground: e.target.value })}
                                style={{ width: '100%', height: '36px', cursor: 'pointer', borderRadius: '4px' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                Word Added Background
                            </label>
                            <input
                                type="color"
                                value={diffColors.wordAddedBackground}
                                onChange={(e) => setDiffColors({ ...diffColors, wordAddedBackground: e.target.value })}
                                style={{ width: '100%', height: '36px', cursor: 'pointer', borderRadius: '4px' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                Removed Line Background
                            </label>
                            <input
                                type="color"
                                value={diffColors.removedBackground}
                                onChange={(e) => setDiffColors({ ...diffColors, removedBackground: e.target.value })}
                                style={{ width: '100%', height: '36px', cursor: 'pointer', borderRadius: '4px' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                Removed Gutter Background
                            </label>
                            <input
                                type="color"
                                value={diffColors.removedGutterBackground}
                                onChange={(e) => setDiffColors({ ...diffColors, removedGutterBackground: e.target.value })}
                                style={{ width: '100%', height: '36px', cursor: 'pointer', borderRadius: '4px' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                Word Removed Background
                            </label>
                            <input
                                type="color"
                                value={diffColors.wordRemovedBackground}
                                onChange={(e) => setDiffColors({ ...diffColors, wordRemovedBackground: e.target.value })}
                                style={{ width: '100%', height: '36px', cursor: 'pointer', borderRadius: '4px' }}
                            />
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            setDiffColors({
                                addedBackground: '#0e1c14',
                                addedGutterBackground: '#0f1e16',
                                removedBackground: '#1c1215',
                                removedGutterBackground: '#1d1316',
                                wordAddedBackground: '#11231a',
                                wordRemovedBackground: '#22151a',
                            });
                        }}
                        style={{
                            marginTop: '12px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid #30363d',
                            borderRadius: '4px',
                            padding: '6px 12px',
                            color: 'var(--text-secondary)',
                            fontSize: '11px',
                            cursor: 'pointer'
                        }}
                    >
                        Reset to Defaults
                    </button>
                </div>

                <button
                    className="btn-primary"
                    style={{ width: '100%', padding: '12px' }}
                    onClick={handleSave}
                >
                    Save Configuration
                </button>
            </div>
        </motion.div>
    );
};
