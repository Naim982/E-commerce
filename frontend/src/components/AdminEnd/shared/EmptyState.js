import React from 'react';
import './shared.css';

const EmptyState = ({ icon, title = 'No records found', description, action }) => {
    const renderIcon = () => {
        if (!icon) return null;
        if (React.isValidElement(icon)) {
            return icon;
        }
        if (typeof icon === 'function') {
            const IconComponent = icon;
            return <IconComponent size={28} />;
        }
        return null;
    };

    return (
        <div className="admin-empty-state">
            {icon && (
                <div className="admin-empty-icon">
                    {renderIcon()}
                </div>
            )}
            <h4 className="admin-empty-title">{title}</h4>
            {description && <p className="admin-empty-desc">{description}</p>}
            {action && <div>{action}</div>}
        </div>
    );
};

export default EmptyState;
