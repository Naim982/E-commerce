import React from 'react';
import './shared.css';

const AdminPageHeader = ({ title, subtitle, children, actions }) => {
    return (
        <div className="admin-page-header">
            <div className="admin-header-titles">
                <h1>{title}</h1>
                {subtitle && <p>{subtitle}</p>}
                {children}
            </div>
            {actions && <div className="admin-header-actions">{actions}</div>}
        </div>
    );
};

export default AdminPageHeader;
