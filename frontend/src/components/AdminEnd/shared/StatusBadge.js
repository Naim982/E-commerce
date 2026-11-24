import React from 'react';
import './shared.css';

const StatusBadge = ({ status = 'active', text, type }) => {
    const normalizedStatus = String(status).toLowerCase();

    // Map common status values to badge style type
    let badgeType = type;
    if (!badgeType) {
        if (['active', 'delivered', 'approved', 'paid', 'in_stock', 'resolved'].includes(normalizedStatus)) {
            badgeType = 'success';
        } else if (['pending', 'processing', 'low_stock', 'in_progress', 'draft'].includes(normalizedStatus)) {
            badgeType = 'warning';
        } else if (['cancelled', 'out_of_stock', 'rejected', 'failed', 'closed', 'urgent'].includes(normalizedStatus)) {
            badgeType = 'danger';
        } else if (['shipped', 'open', 'high'].includes(normalizedStatus)) {
            badgeType = 'info';
        } else {
            badgeType = 'neutral';
        }
    }

    const displayText = text || status.replace(/_/g, ' ');

    return (
        <span className={`admin-status-badge ${badgeType}`}>
            <span className="badge-dot" />
            <span>{displayText}</span>
        </span>
    );
};

export default StatusBadge;
