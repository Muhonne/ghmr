import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
    icon: LucideIcon;
    label: string;
    isActive?: boolean;
    isMinified?: boolean;
    onClick: () => void;
    title?: string;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
    icon: Icon,
    label,
    isActive,
    isMinified,
    onClick,
    title
}) => {
    return (
        <div
            className={`sidebar-item ${isActive ? 'active' : ''}`}
            onClick={onClick}
            title={title || label}
        >
            <Icon size={20} />
            {!isMinified && <span>{label}</span>}
        </div>
    );
};
