import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Settings as SettingsIcon } from 'lucide-react';

interface SettingsProps {
    token: string;
    setToken: (token: string) => void;
    fontSize: number;
    setFontSize: (size: number) => void;
    onSave: (token?: string, fontSize?: number) => void;
}

export const Settings: React.FC<SettingsProps> = ({
    token,
    setToken,
    fontSize,
    setFontSize,
    onSave
}) => {
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
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="ghp_xxxxxxxxxxxx"
                            style={{
                                width: '100%',
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                padding: '12px 16px',
                                color: 'white',
                                outline: 'none'
                            }}
                        />
                        <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                            <ShieldCheck size={18} color={token ? '#4caf50' : '#444'} />
                        </div>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '12px', lineHeight: '1.6' }}>
                        Your token needs <strong>'repo'</strong> scope to fetch private repositories and pull requests.
                        It is stored locally on your machine and never sent to any server other than GitHub.
                    </p>
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

                <button
                    className="btn-primary"
                    style={{ width: '100%', padding: '12px' }}
                    onClick={() => onSave(token, fontSize)}
                >
                    Save Configuration
                </button>

                <div style={{ marginTop: '24px', padding: '16px', borderRadius: '8px', background: 'rgba(255,193,7,0.05)', border: '1px solid rgba(255,193,7,0.2)' }}>
                    <h4 style={{ fontSize: '13px', color: '#ffc107', marginBottom: '8px' }}>How to get a token?</h4>
                    <ol style={{ fontSize: '12px', color: 'var(--text-secondary)', paddingLeft: '20px' }}>
                        <li style={{ marginBottom: '4px' }}>Go to GitHub Settings → Developer settings</li>
                        <li style={{ marginBottom: '4px' }}>Personal access tokens → Tokens (classic)</li>
                        <li style={{ marginBottom: '4px' }}>Generate new token (classic)</li>
                        <li>Select the 'repo' scope and generate</li>
                    </ol>
                </div>
            </div>
        </motion.div>
    );
};
