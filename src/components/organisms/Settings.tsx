import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Settings as SettingsIcon, AlertCircle } from 'lucide-react';
import { validateGitHubToken } from '../../utils/tokenValidation';

interface SettingsProps {
    token: string;
    setToken: (token: string) => void;
    fontSize: number;
    setFontSize: (size: number) => void;
    pollInterval: number;
    setPollInterval: (interval: number) => void;
    onSave: (token?: string, fontSize?: number, width?: number, pollInterval?: number) => void;
}

export const Settings: React.FC<SettingsProps> = ({
    token,
    setToken,
    fontSize,
    setFontSize,
    pollInterval,
    setPollInterval,
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
        onSave(token, fontSize, undefined, pollInterval);
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
                        Preferred Font Size
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
