import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReviewCompleteModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Color palette matching the app icon's rainbow gradient
const sparkleColors = [
    '#a78bfa', // violet
    '#818cf8', // indigo
    '#60a5fa', // blue
    '#22d3ee', // cyan
    '#34d399', // emerald
    '#fbbf24', // amber
    '#fb923c', // orange
    '#f472b6', // pink
    '#c084fc', // purple
];

// Small sparkle particle component
const Sparkle: React.FC<{
    delay: number;
    x: number;
    y: number;
    size: number;
    color: string;
    duration: number;
}> = ({ delay, x, y, size, color, duration }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
        animate={{
            opacity: [0, 1, 1, 0],
            scale: [0, 1, 0.8, 0],
            x: x,
            y: y,
        }}
        transition={{
            duration: duration,
            delay: delay,
            ease: 'easeOut',
        }}
        style={{
            position: 'absolute',
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '50%',
            background: color,
            boxShadow: `0 0 ${size * 2}px ${size / 2}px ${color}40`,
        }}
    />
);

// Star sparkle for variety
const StarSparkle: React.FC<{
    delay: number;
    x: number;
    y: number;
    size: number;
    color: string;
    duration: number;
}> = ({ delay, x, y, size, color, duration }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0, x: 0, y: 0, rotate: 0 }}
        animate={{
            opacity: [0, 1, 1, 0],
            scale: [0, 1.2, 0.6, 0],
            x: x,
            y: y,
            rotate: 180,
        }}
        transition={{
            duration: duration,
            delay: delay,
            ease: 'easeOut',
        }}
        style={{
            position: 'absolute',
            fontSize: `${size}px`,
            color: color,
            textShadow: `0 0 ${size}px ${color}`,
        }}
    >
        ✦
    </motion.div>
);

// Generate many small sparkles
const generateSparkles = (count: number) => {
    return Array.from({ length: count }, (_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const distance = 50 + Math.random() * 180;
        return {
            id: i,
            delay: Math.random() * 0.8,
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance,
            size: 2 + Math.random() * 4,
            color: sparkleColors[Math.floor(Math.random() * sparkleColors.length)],
            duration: 1 + Math.random() * 0.8,
            isStar: Math.random() > 0.7,
        };
    });
};

export const ReviewCompleteModal: React.FC<ReviewCompleteModalProps> = ({ isOpen, onClose }) => {
    const [sparkles, setSparkles] = useState(generateSparkles(60));

    // Regenerate sparkles periodically while open
    useEffect(() => {
        if (!isOpen) return;

        const interval = setInterval(() => {
            setSparkles(generateSparkles(60));
        }, 1200);

        return () => clearInterval(interval);
    }, [isOpen]);

    // Close on Escape or Enter
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' || e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                    }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: -20 }}
                        transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'var(--bg-sidebar)',
                            borderRadius: '16px',
                            padding: '48px 64px',
                            border: '1px solid var(--border-color)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
                            position: 'relative',
                            overflow: 'visible',
                            textAlign: 'center',
                        }}
                    >
                        {/* Sparkles container */}
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            pointerEvents: 'none',
                        }}>
                            {sparkles.map((sparkle) =>
                                sparkle.isStar ? (
                                    <StarSparkle
                                        key={sparkle.id}
                                        delay={sparkle.delay}
                                        x={sparkle.x}
                                        y={sparkle.y}
                                        size={sparkle.size * 3}
                                        color={sparkle.color}
                                        duration={sparkle.duration}
                                    />
                                ) : (
                                    <Sparkle
                                        key={sparkle.id}
                                        delay={sparkle.delay}
                                        x={sparkle.x}
                                        y={sparkle.y}
                                        size={sparkle.size}
                                        color={sparkle.color}
                                        duration={sparkle.duration}
                                    />
                                )
                            )}
                        </div>

                        {/* Title with gradient matching icon colors */}
                        <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            style={{
                                fontSize: '26px',
                                fontWeight: 700,
                                marginBottom: '12px',
                                background: 'linear-gradient(135deg, #a78bfa, #60a5fa, #22d3ee, #34d399)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            Review Complete!
                        </motion.h2>

                        {/* Subtitle */}
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            style={{
                                color: 'var(--text-secondary)',
                                fontSize: '14px',
                                marginBottom: '24px',
                            }}
                        >
                            All files have been reviewed.
                        </motion.p>

                        {/* Close hint */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                color: 'var(--text-secondary)',
                                fontSize: '11px',
                            }}
                        >
                            <span>Press</span>
                            <kbd style={{
                                background: 'var(--bg-active)',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                border: '1px solid var(--border-color)',
                            }}>
                                Enter
                            </kbd>
                            <span>or</span>
                            <kbd style={{
                                background: 'var(--bg-active)',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                border: '1px solid var(--border-color)',
                            }}>
                                Esc
                            </kbd>
                            <span>to close</span>
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
