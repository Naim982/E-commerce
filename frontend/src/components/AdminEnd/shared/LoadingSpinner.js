import React from 'react';
import './shared.css';

const LoadingSpinner = ({ message = 'Loading data...' }) => {
    return (
        <div className="admin-loading-container">
            <div className="admin-spinner" />
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{message}</span>
        </div>
    );
};

export default LoadingSpinner;
