import React, { useState } from 'react';
import './ForgotPassword.css';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, LockIcon, ShieldIcon } from '../assets/icons/icons';
import { sendResetEmail } from './AuthService';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSendResetEmail = async (e) => {
        if (e) e.preventDefault();

        if (!email.trim()) {
            setError('Please enter your email address.');
            return;
        }

        setError('');
        setLoading(true);
        const result = await sendResetEmail(email.trim().toLowerCase());

        setLoading(false);
        if (!result.success) {
            setError(result.error || 'Failed to send reset email. Please try again.');
            return;
        }
        setSent(true);
    };

    const handleQuickDemoFill = () => {
        setEmail('customer.support@lumen.com');
        setError('');
    };

    const handleTryAnotherEmail = () => {
        setSent(false);
        setError('');
    };

    return (
        <div className="auth-form-scroll-container">
            <div className="forgot-top-bar">
                <Link to="/" className="forgot-back-link">
                    <ArrowLeftIcon />
                    <span>Back to Store</span>
                </Link>

                {process.env.NODE_ENV !== 'production' && (
                    <button
                        type="button"
                        className="forgot-demo-btn"
                        onClick={handleQuickDemoFill}
                        title="Autofill test recovery email"
                    >
                        <span className="forgot-demo-pulse" />
                        <span>Quick Demo Fill</span>
                    </button>
                )}
            </div>

            <div className="forgot-card-body">
                {!sent ? (
                    <>
                        <div className="forgot-icon-badge">
                            <LockIcon size={24} />
                        </div>

                        <div className="forgot-header">
                            <h1 className="forgot-title">Forgot Password?</h1>
                            <p className="forgot-subtitle">
                                Enter the email address associated with your LUMEN account and we'll send you a secure link to reset your password.
                            </p>
                        </div>

                        <div className="forgot-message-slot" aria-live="polite">
                            {error && (
                                <div className="forgot-error-banner" role="alert">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>

                        <form id="forgot-password-form" className="forgot-form" onSubmit={handleSendResetEmail}>
                            <div className="form-group forgot-form-group">
                                <label className="form-label" htmlFor="recovery-email">
                                    Email Address <span className="required">*</span>
                                </label>
                                <div className="forgot-input-wrapper">
                                    <span className="forgot-input-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="2" y="4" width="20" height="16" rx="2" />
                                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                        </svg>
                                    </span>
                                    <input
                                        type="email"
                                        id="recovery-email"
                                        name="email"
                                        className="input forgot-input"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            <div className="forgot-security-notice">
                                <div className="notice-icon">
                                    <ShieldIcon />
                                </div>
                                <span className="notice-text">
                                    Password reset links are encrypted and expire automatically after 15 minutes.
                                </span>
                            </div>

                            <button
                                type="submit"
                                id="send-reset-btn"
                                className="btn btn-lg btn-primary btn-block forgot-submit-btn"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="forgot-btn-loading">
                                        <span className="forgot-spinner" /> Sending Reset Link...
                                    </span>
                                ) : (
                                    <span className="forgot-btn-content">
                                        Send Password Reset Link
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                            <polyline points="12 5 19 12 12" />
                                        </svg>
                                    </span>
                                )}
                            </button>

                            <div className="forgot-footer-signin">
                                Remember your password?{' '}
                                <Link to="/authentication/signin" className="forgot-signin-link">
                                    Sign in here
                                </Link>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="forgot-success-card">
                        <div className="forgot-success-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>

                        <h1 className="forgot-success-title">Check Your Email</h1>
                        <p className="forgot-success-desc">
                            We've sent a secure password reset link to <strong>{email}</strong>.
                        </p>

                        <div className="forgot-success-instruction">
                            Open the email and follow the link to create a new password. If you don't receive an email within a few minutes, check your spam or junk folder.
                        </div>

                        <div className="forgot-success-actions">
                            <Link to="/authentication/signin" className="btn btn-lg btn-primary btn-block forgot-submit-btn">
                                Return to Sign In
                            </Link>
                            <button
                                type="button"
                                className="forgot-resend-btn"
                                onClick={handleTryAnotherEmail}
                            >
                                Try another email address
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
