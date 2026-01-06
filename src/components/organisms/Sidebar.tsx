import React from 'react';
import {
    List,
    Settings,
    PanelLeftOpen,
    PanelLeftClose
} from 'lucide-react';
import { SidebarItem } from '../molecules/SidebarItem';
import { User, View } from '../../types';

import pkg from '../../../package.json';

interface SidebarProps {
    view: View;
    setView: (view: View) => void;
    isMinified: boolean;
    setIsMinified: (minified: boolean) => void;
    user: User | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
    view,
    setView,
    isMinified,
    setIsMinified,
    user
}) => {
    return (
        <aside className={`sidebar ${isMinified ? 'minified' : ''}`}>
            <div style={{
                padding: '24px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: isMinified ? 'center' : 'flex-start'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '18px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div style={{
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 50,
                            height: 50,
                            borderRadius: '8px',
                            overflow: 'hidden',
                            backgroundColor: 'transparent'
                        }}>
                            <img
                                src="/icon.png"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                alt="ghmr"
                            />
                        </div>
                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 'normal', lineHeight: 1 }}>v{pkg.version}</span>
                    </div>
                    {!isMinified && <span>ghmr</span>}
                </div>
            </div>

            <nav style={{ flexGrow: 1, padding: '12px 0' }}>
                <SidebarItem
                    icon={List}
                    label="My Merge Requests"
                    isActive={view === 'list'}
                    isMinified={isMinified}
                    onClick={() => setView('list')}
                />

                <SidebarItem
                    icon={Settings}
                    label="Settings"
                    isActive={view === 'settings'}
                    isMinified={isMinified}
                    onClick={() => setView('settings')}
                />
            </nav>

            <div style={{ padding: '12px 0', borderTop: '1px solid var(--border-color)' }}>
                <SidebarItem
                    icon={isMinified ? PanelLeftOpen : PanelLeftClose}
                    label="Collapse Sidebar"
                    isMinified={isMinified}
                    onClick={() => setIsMinified(!isMinified)}
                    title={isMinified ? "Expand" : "Collapse"}
                />
            </div>

            <div style={{ padding: isMinified ? '16px 0' : '16px', borderTop: '1px solid var(--border-color)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMinified ? 'center' : 'flex-start', gap: '8px' }}>
                    {user ? (
                        <>
                            <img src={user.avatar_url} style={{ width: 24, height: 24, borderRadius: '50%' }} alt="" title={`Connected as @${user.login}`} />
                            {!isMinified && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>@{user.login}</span>}
                        </>
                    ) : (
                        <>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff4b4b' }}></div>
                            {!isMinified && <span>Not connected</span>}
                        </>
                    )}
                </div>
            </div>
        </aside>
    );
};
