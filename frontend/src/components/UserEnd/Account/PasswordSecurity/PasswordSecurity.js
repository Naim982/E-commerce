import React, { useState } from 'react';
import './PasswordSecurity.css';
import { changeAccountPassword } from '../../../../authentication/AuthService';

const PasswordSecurity = ({ user }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showCurrentPass, setShowCurrentPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', message: '' });

    const showToast = (type, message) => {
        setFeedback({ type, message });
        setTimeout(() => {
            setFeedback({ type: '', message: '' });
        }, 4500);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFeedback({ type: '', message: '' });

        if (!currentPassword) {
            showToast('error', 'Please enter your current password.');
            return;
        }

        if (!newPassword) {
            showToast('error', 'Please enter a new password.');
            return;
        }

        if (newPassword.length < 6) {
            showToast('error', 'New password must be at least 6 characters long.');
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast('error', 'New passwords do not match. Please recheck.');
            return;
        }

        if (currentPassword === newPassword) {
            showToast('error', 'New password must be different from your current password.');
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await changeAccountPassword(currentPassword, newPassword);
            setIsSubmitting(false);

            if (res.success) {
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                showToast('success', 'Your password has been updated successfully!');
            } else {
                showToast('error', res.error || 'Failed to update password.');
            }
        } catch (err) {
            setIsSubmitting(false);
            console.error('Password update error:', err);
            showToast('error', 'An unexpected error occurred while updating your password.');
        }
    };

    return (
        <div className="account-card-section password-security-container">
            <div className="account-section-header">
                <div>
                    <h2 className="account-section-title" style={{ fontSize: '1.35rem' }}>Change Password</h2>
                    <span className="account-section-subtitle" style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                        Ensure your account is using a strong password with letters, numbers, and symbols
                    </span>
                </div>
            </div>

            {feedback.message && (
                <div className={`password-feedback-alert ${feedback.type}`}>
                    {feedback.type === 'success' && '✓ '}
                    {feedback.type === 'error' && '⚠ '}
                    {feedback.message}
                </div>
            )}

            <form className="password-form-grid" onSubmit={handleSubmit}>
                <div className="form-group password-input-wrapper" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label" htmlFor="prof-cur-pass">Current Password</label>
                    <div className="password-field-row">
                        <input
                            type={showCurrentPass ? 'text' : 'password'}
                            id="prof-cur-pass"
                            className="input"
                            placeholder="Enter your current password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                            disabled={isSubmitting}
                        />
                        <button
                            type="button"
                            className="password-toggle-visibility-btn"
                            onClick={() => setShowCurrentPass(!showCurrentPass)}
                            tabIndex={-1}
                            title={showCurrentPass ? 'Hide password' : 'Show password'}
                        >
                            {showCurrentPass ? '👁️' : '👁️‍🗨️'}
                        </button>
                    </div>
                </div>

                <div className="form-group password-input-wrapper">
                    <label className="form-label" htmlFor="prof-new-pass">New Password</label>
                    <div className="password-field-row">
                        <input
                            type={showNewPass ? 'text' : 'password'}
                            id="prof-new-pass"
                            className="input"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                            disabled={isSubmitting}
                        />
                        <button
                            type="button"
                            className="password-toggle-visibility-btn"
                            onClick={() => setShowNewPass(!showNewPass)}
                            tabIndex={-1}
                            title={showNewPass ? 'Hide password' : 'Show password'}
                        >
                            {showNewPass ? '👁️' : '👁️‍🗨️'}
                        </button>
                    </div>
                </div>

                <div className="form-group password-input-wrapper">
                    <label className="form-label" htmlFor="prof-conf-pass">Confirm New Password</label>
                    <div className="password-field-row">
                        <input
                            type={showConfirmPass ? 'text' : 'password'}
                            id="prof-conf-pass"
                            className="input"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                            disabled={isSubmitting}
                        />
                        <button
                            type="button"
                            className="password-toggle-visibility-btn"
                            onClick={() => setShowConfirmPass(!showConfirmPass)}
                            tabIndex={-1}
                            title={showConfirmPass ? 'Hide password' : 'Show password'}
                        >
                            {showConfirmPass ? '👁️' : '👁️‍🗨️'}
                        </button>
                    </div>
                </div>

                <div className="security-rules-box" style={{ gridColumn: 'span 2' }}>
                    <div className="security-rules-heading">Password Requirements:</div>
                    <div className="security-rules-item">✓ Minimum 6 characters (8+ recommended for security)</div>
                    <div className="security-rules-item">✓ Include a combination of letters, numbers, and special characters</div>
                    <div className="security-rules-item">✓ Never share your account credentials with anyone</div>
                </div>

                <div style={{ gridColumn: 'span 2', marginTop: 'var(--space-2)' }}>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isSubmitting}
                        id="update-password-submit-btn"
                    >
                        {isSubmitting ? 'Updating Password...' : 'Update Password'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PasswordSecurity;
