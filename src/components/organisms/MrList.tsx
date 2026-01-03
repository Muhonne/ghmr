import React from 'react';
import { ShieldCheck, Keyboard } from 'lucide-react';
import { MrListItem } from '../molecules/MrListItem';
import { MergeRequest, View } from '../../types';

interface MrListProps {
    mrs: MergeRequest[];
    loading: boolean;
    token: string;
    onSelectMr: (id: number) => void;
    onReviewMr: (mr: MergeRequest) => void;
    onRefresh: () => void;
    setView: (view: View) => void;
}

export const MrList: React.FC<MrListProps> = ({
    mrs,
    loading,
    token,
    onSelectMr,
    onReviewMr,
    onRefresh,
    setView
}) => {
    return (
        <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
            {token && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 600 }}>My Merge Requests</h1>
                    <button
                        className={`sidebar-item ${loading ? 'loading' : ''}`}
                        style={{ padding: '6px 16px', margin: 0, background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}
                        onClick={onRefresh}
                        disabled={loading}
                    >
                        {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            )}
            {!token && (
                <div className="glass" style={{ padding: '40px', borderRadius: '16px', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', padding: '20px', borderRadius: '50%', background: 'rgba(0,122,255,0.1)', marginBottom: '24px' }}>
                        <ShieldCheck size={48} color="var(--accent-color)" />
                    </div>
                    <h2>Welcome to ghmr</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '12px', marginBottom: '24px' }}>
                        To get started, you need to configure your GitHub Personal Access Token.
                    </p>
                    <button className="btn-primary" onClick={() => setView('settings')}>
                        Configure Settings
                    </button>
                </div>
            )}

            {token && (
                <div>
                    {!loading && mrs.length === 0 ? (
                        <div className="glass" style={{ padding: '40px', borderRadius: '16px', textAlign: 'center' }}>
                            <div style={{ opacity: 0.5, marginBottom: '20px' }}>
                                <Keyboard size={48} />
                            </div>
                            <h3>All Caught Up!</h3>
                            <p style={{ color: 'var(--text-secondary)', marginTop: '8px', marginBottom: '20px' }}>
                                No open merge requests found. Time to grab a coffee?
                            </p>
                            <button
                                style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 16px' }}
                                onClick={() => setView('list')}
                            >
                                Refresh
                            </button>
                        </div>
                    ) : (
                        <div style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                            {mrs.map(mr => (
                                <MrListItem
                                    key={mr.id}
                                    mr={mr}
                                    onClick={() => onSelectMr(mr.id)}
                                    onReviewClick={() => onReviewMr(mr)}
                                />
                            ))}
                        </div>
                    )}

                    {loading && mrs.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                            <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>Fetching Merge Requests...</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
