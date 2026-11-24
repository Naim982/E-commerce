import React, { useState, useEffect } from 'react';
import './ResetPassword.css';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, EyeOffIcon, EyeOnIcon, LockIcon } from '../assets/icons/icons';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '../Firebase/firebase.config';

const ResetPassword = () => {
    const [oobCode, setOobCode] = useState('');
    const [, setEmail] = useState('');
    const [checkingCode, setCheckingCode] = useState(true);

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const mode = params.get('mode');
        const code = params.get('oobCode');

        if (mode !== 'resetPassword' || !code) {
            setError('Invalid or missing password reset link.');
            setCheckingCode(false);
            return;
        }

        setOobCode(code);

        verifyPasswordResetCode(auth, code)
            .then((userEmail) => {
                setEmail(userEmail);
            })
            .catch((error) => {
                console.error('Reset code verification failed:', error);
                setError('This password reset link is invalid or has expired.');
            })
            .finally(() => {
                setCheckingCode(false);
            });
    }, []);

    const passwordRequirements = [
        {
            key: 'length',
            text: 'At least 8 characters in length',
            valid: password.length >= 8
        },
        {
            key: 'uppercase',
            text: 'At least one uppercase letter (A–Z)',
            valid: /[A-Z]/.test(password)
        },
        {
            key: 'number',
            text: 'At least one number (0–9)',
            valid: /[0-9]/.test(password)
        },
        {
            key: 'special',
            text: 'At least one special symbol',
            valid: /[^\w\s]/.test(password)
        }
    ];

    const isPasswordValid = passwordRequirements.every((req) => req.valid);

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (!isPasswordValid) {
            setError('Please satisfy all password requirements before continuing.');
            return;
        }

        try {
            setLoading(true);
            await confirmPasswordReset(auth, oobCode, password);
            setSuccess(true);
        } catch (error) {
            console.error('Password reset failed:', error);
            switch (error.code) {
                case 'auth/expired-action-code':
                    setError('This password reset link has expired. Please request a new one.');
                    break;
                case 'auth/invalid-action-code':
                    setError('This password reset link is invalid or has already been used.');
                    break;
                case 'auth/weak-password':
                    setError('The password is too weak.');
                    break;
                default:
                    setError('Unable to reset password. Please try requesting a new link.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-form-scroll-container">
            <div className="reset-top-bar">
                <Link to="/" className="reset-back-link">
                    <ArrowLeftIcon />
                    <span>Back to Store</span>
                </Link>
            </div>

            <div className="reset-card-body">
                {checkingCode ? (
                    <div className="reset-checking-state">
                        <div className="reset-spinner" />
                        <h2 className="reset-checking-title">Verifying security token...</h2>
                        <p className="reset-checking-desc">Checking the validity of your password reset link.</p>
                    </div>
                ) : !success ? (
                    <>
                        <div className="reset-icon-badge">
                            <LockIcon size={24} />
                        </div>

                        <div className="reset-header">
                            <h1 className="reset-title">Create New Password</h1>
                            <p className="reset-subtitle">
                                Enter and confirm your new secure password for your LUMEN account.
                            </p>
                        </div>

                        <div className="reset-message-slot" aria-live="polite">
                            {error && (
                                <div className="reset-error-banner" role="alert">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>

                        <form id="reset-password-form" className="reset-form" onSubmit={handleResetPassword}>
                            <div className="form-group reset-form-group">
                                <label className="form-label" htmlFor="reset-new-password">
                                    New Password <span className="required">*</span>
                                </label>
                                <div className="reset-input-wrapper">
                                    <span className="reset-input-icon"><LockIcon /></span>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="reset-new-password"
                                        className="input reset-input"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={8}
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        className="reset-password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                        title={showPassword ? 'Hide password' : 'Show password'}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOnIcon size={18} /> : <EyeOffIcon size={18} />}
                                    </button>
                                </div>

                                <div className="reset-requirements-box">
                                    <div className="reset-requirements-heading">Password must contain:</div>
                                    <ul className="reset-requirements-list">
                                        {passwordRequirements.map((req) => (
                                            <li key={req.key} className={`reset-req-item ${req.valid ? 'valid' : ''}`}>
                                                <span className="reset-req-dot" aria-hidden="true">{req.valid ? '✓' : '○'}</span>
                                                <span>{req.text}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div className="form-group reset-form-group">
                                <label className="form-label" htmlFor="reset-confirm-password">
                                    Confirm New Password <span className="required">*</span>
                                </label>
                                <div className="reset-input-wrapper">
                                    <span className="reset-input-icon"><LockIcon /></span>
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        id="reset-confirm-password"
                                        className="input reset-input"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        className="reset-password-toggle"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showConfirmPassword ? <EyeOnIcon size={18} /> : <EyeOffIcon size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                id="submit-reset-btn"
                                className="btn btn-lg btn-primary btn-block reset-submit-btn"
                                disabled={loading || !oobCode}
                            >
                                {loading ? (
                                    <span className="reset-btn-loading">
                                        <span className="reset-spinner" /> Updating Password...
                                    </span>
                                ) : (
                                    <span className="reset-btn-content">Save New Password</span>
                                )}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="reset-success-card">
                        <div className="reset-success-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>

                        <h1 className="reset-success-title">Password Reset Complete!</h1>
                        <p className="reset-success-desc">
                            Your password has been changed successfully. You can now use your new password to sign in.
                        </p>

                        <div className="reset-success-actions">
                            <Link to="/authentication/signin" className="btn btn-lg btn-primary btn-block reset-submit-btn">
                                Proceed to Sign In
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
