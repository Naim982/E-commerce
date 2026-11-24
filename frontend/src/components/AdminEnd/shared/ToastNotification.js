import React, { useEffect } from 'react';
import { AlertCircleIcon, CheckIcon, InfoIcon } from '../../../assets/icons/icons';
import './shared.css';

const ToastNotification = ({ toasts = [], onDismiss }) => {
    useEffect(() => {
        if (toasts.length === 0) return;

        const timers = toasts.map((toast) => {
            return setTimeout(() => {
                onDismiss(toast.id);
            }, toast.duration || 3500);
        });

        return () => {
            timers.forEach(clearTimeout);
        };
    }, [toasts, onDismiss]);

    if (!toasts || toasts.length === 0) return null;

    return (
        <div className="admin-toast-container">
            {toasts.map((toast) => (
                <div key={toast.id} className={`admin-toast ${toast.type || 'info'}`}>
                    {toast.type === 'success' && <CheckIcon size={18} strokeWidth={2.5} />}
                    {toast.type === 'error' && <AlertCircleIcon size={18} />}
                    {(!toast.type || toast.type === 'info') && <InfoIcon size={18} />}
                    <div style={{ flexGrow: 1 }}>
                        {toast.title && <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{toast.title}</div>}
                        <div style={{ fontSize: '0.8125rem', opacity: 0.9 }}>{toast.message}</div>
                    </div>
                    <button
                        type="button"
                        onClick={() => onDismiss(toast.id)}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem', padding: 0 }}
                    >
                        &times;
                    </button>
                </div>
            ))}
        </div>
    );
};

export default ToastNotification;
