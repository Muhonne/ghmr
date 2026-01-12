import React, { useState, useEffect, useRef } from 'react';

interface BouncingIconProps {
    iconSrc?: string;
    iconSize?: number;
    initialVelocity?: { x: number; y: number };
}

export const BouncingIcon: React.FC<BouncingIconProps> = ({
    iconSrc = '/icon.png',
    iconSize = 50,
    initialVelocity = { x: 1, y: 1 }
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 50, y: 50 });
    const [velocity, setVelocity] = useState(initialVelocity);
    const [hue, setHue] = useState(200);

    useEffect(() => {
        let animationId: number;

        const animate = () => {
            if (!containerRef.current) {
                animationId = requestAnimationFrame(animate);
                return;
            }

            const container = containerRef.current;
            const maxX = container.clientWidth - iconSize;
            const maxY = container.clientHeight - iconSize;

            setPosition(prev => {
                let newX = prev.x + velocity.x;
                let newY = prev.y + velocity.y;
                let newVelX = velocity.x;
                let newVelY = velocity.y;
                let bounced = false;

                if (newX <= 0 || newX >= maxX) {
                    newVelX = -velocity.x;
                    newX = Math.max(0, Math.min(maxX, newX));
                    bounced = true;
                }
                if (newY <= 0 || newY >= maxY) {
                    newVelY = -velocity.y;
                    newY = Math.max(0, Math.min(maxY, newY));
                    bounced = true;
                }

                if (bounced) {
                    setVelocity({ x: newVelX, y: newVelY });
                    setHue(prev => (prev + 60) % 360);
                }

                return { x: newX, y: newY };
            });

            animationId = requestAnimationFrame(animate);
        };

        animationId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationId);
    }, [velocity, iconSize]);

    return (
        <div
            ref={containerRef}
            style={{
                position: 'absolute',
                top: -8,
                left: -8,
                right: -8,
                bottom: -8
            }}
        >
            <img
                src={iconSrc}
                alt="bouncing icon"
                style={{
                    position: 'absolute',
                    left: position.x,
                    top: position.y,
                    width: iconSize,
                    height: iconSize,
                    opacity: 0.7,
                    filter: `hue-rotate(${hue}deg)`,
                    transition: 'filter 0.3s ease'
                }}
            />
        </div>
    );
};
