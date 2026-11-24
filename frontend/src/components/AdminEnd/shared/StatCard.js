import React from 'react';
import './shared.css';

const StatCard = ({ title, value, icon, subtitle, trend, trendType = 'neutral', color, onClick }) => {
    const renderIcon = () => {
        if (!icon) return null;
        if (React.isValidElement(icon)) {
            return icon;
        }
        if (typeof icon === 'function') {
            const IconComponent = icon;
            return <IconComponent size={20} />;
        }
        return null;
    };

    const colorStyles = {
        primary: { backgroundColor: '#eef2ff', color: '#4f46e5' },
        success: { backgroundColor: '#ecfdf5', color: '#10b981' },
        warning: { backgroundColor: '#fffbeb', color: '#f59e0b' },
        danger: { backgroundColor: '#fef2f2', color: '#ef4444' },
        info: { backgroundColor: '#eff6ff', color: '#3b82f6' }
    };

    return (
        <div className="admin-stat-card" onClick={onClick} style={onClick ? { cursor: 'pointer' } : {}}>
            <div className="admin-stat-top">
                <span className="admin-stat-title">{title}</span>
                {icon && (
                    <div
                        className="admin-stat-icon-wrap"
                        style={color && colorStyles[color] ? colorStyles[color] : {}}
                    >
                        {renderIcon()}
                    </div>
                )}
            </div>
            <div className="admin-stat-value">{value}</div>
            {(subtitle || trend) && (
                <div className="admin-stat-subtitle">
                    {trend && (
                        <span style={{
                            fontWeight: 600,
                            color: trendType === 'up' ? '#10b981' : trendType === 'down' ? '#ef4444' : '#64748b'
                        }}>
                            {trendType === 'up' ? '↑ ' : trendType === 'down' ? '↓ ' : ''}{trend}
                        </span>
                    )}
                    {subtitle && <span>{subtitle}</span>}
                </div>
            )}
        </div>
    );
};

export default StatCard;
