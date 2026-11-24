import React from 'react';
import Modal from './Modal';
import './shared.css';

const ConfirmationDialog = ({ isOpen, onClose, onConfirm, title = 'Confirm Action', message, confirmText = 'Confirm Delete', confirmVariant = 'danger', loading = false }) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            footer={
                <>
                    <button type="button" className="admin-btn admin-btn-outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className={`admin-btn ${confirmVariant === 'danger' ? 'admin-btn-danger' : 'admin-btn-primary'}`}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : confirmText}
                    </button>
                </>
            }
        >
            <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.5', margin: 0 }}>
                {message}
            </p>
        </Modal>
    );
};

export default ConfirmationDialog;
