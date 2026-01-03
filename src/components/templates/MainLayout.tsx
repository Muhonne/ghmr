import React from 'react';
import { Sidebar } from '../organisms/Sidebar';
import { ArrowLeft } from 'lucide-react';
import { User, View, MergeRequest } from '../../types';

interface MainLayoutProps {
    view: View;
    setView: (view: View) => void;
    isSidebarMinified: boolean;
    setIsSidebarMinified: (minified: boolean) => void;
    user: User | null;
    selectedMr: MergeRequest | null;
    error: string | null;
    token: string;
    loading: boolean;
    fetchMrs: () => void;
    onStartReview: () => void;
    children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
    view,
    setView,
    isSidebarMinified,
    setIsSidebarMinified,
    user,
    selectedMr,
    error,
    token,
    loading,
    fetchMrs,
    onStartReview,
    children
}) => {
    return (
        <div className="app-container">
            <Sidebar
                view={view}
                setView={setView}
                isMinified={isSidebarMinified}
                setIsMinified={setIsSidebarMinified}
                user={user}
            />

            <main className="main-content" style={{ position: 'relative' }}>
                {view !== 'list' && (
                    <button
                        onClick={() => setView(view === 'review' ? 'detail' : 'list')}
                        style={{
                            position: 'absolute',
                            top: '12px',
                            left: '12px',
                            zIndex: 100,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                        }}
                        className="back-button"
                        title="Back"
                    >
                        <ArrowLeft size={24} />
                    </button>
                )}

                <div style={{ flexGrow: 1, overflowY: 'auto', position: 'relative', height: '100%' }}>
                    {children}
                </div>
            </main>
        </div>
    );
};
