import React from 'react';
import { CIStatus } from '../../types';
import { CheckCircle2, XCircle, Clock, Circle } from 'lucide-react';
import { motion } from 'framer-motion';

interface CIStatusBadgeProps {
    status?: CIStatus;
    showText?: boolean;
}

export const CIStatusBadge: React.FC<CIStatusBadgeProps> = ({ status, showText = false }) => {
    if (!status) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }} title="No checks">
                <Circle size={14} />
                {showText && <span style={{ fontSize: '12px' }}>No checks</span>}
            </div>
        );
    }

    const { state, success_count, total_count } = status;

    const renderIcon = () => {
        switch (state) {
            case 'success':
                return <CheckCircle2 size={14} color="#4caf50" />;
            case 'failure':
                return <XCircle size={14} color="#f44336" />;
            case 'pending':
                return (
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        style={{ display: 'flex' }}
                    >
                        <Clock size={14} color="#ff9800" />
                    </motion.div>
                );
            default:
                return <Circle size={14} color="var(--text-secondary)" />;
        }
    };

    const label = `${success_count}/${total_count} passed`;

    return (
        <div
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            title={label}
        >
            {renderIcon()}
            {showText && (
                <span style={{ fontSize: '12px', fontWeight: 500 }}>
                    {state === 'pending' ? 'Running...' : label}
                </span>
            )}
        </div>
    );
};
