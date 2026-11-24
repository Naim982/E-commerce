import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './SignUp.css';

import { AlertCircleIcon, ArrowLeftIcon, EyeOffIcon, EyeOnIcon, LockIcon, MailIcon, UserIcon } from '../assets/icons/icons';
import { register } from './AuthService';
import { checkAccountExists, createNewUser } from '../api/apiManager';

const SignUp = () => {
    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);
    const [showConPassword, setShowConPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const handleFormDataChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError('');
        if (name === 'confirmPassword') {
            setConfirmPasswordError('');
        }
    };

    const passwordRequirements = [
        {
            key: 'minLength',
            text: 'At least 8 characters in length',
            valid: formData.password.length >= 8
        },
        {
            key: 'uppercase',
            text: 'At least one uppercase letter (A–Z)',
            valid: /[A-Z]/.test(formData.password)
        },
        {
            key: 'numberOrSymbol',
            text: 'At least one number (0-9)',
            valid: /\d/.test(formData.password)
        },
        {
            key: 'special',
            text: 'At least one special symbol',
            valid: /[^\w\s]/.test(formData.password)
        }
    ];

    const isPasswordValid = passwordRequirements.every(requirement => requirement.valid);

    const handleConfirmPasswordBlur = () => {
        if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
            setConfirmPasswordError('Passwords do not match.');
        } else {
            setConfirmPasswordError('');
        }
    };

    const handleCreateNewUser = async (e) => {
        e.preventDefault();

        setError('');
        setLoading(true);

        const firstName = formData.firstName.trim();
        const lastName = formData.lastName.trim();
        const email = formData.email.trim().toLowerCase();
        const password = formData.password;

        if (password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            setLoading(false);
            return;
        }

        if (!isPasswordValid) {
            setError('Please meet all password requirements.');
            setLoading(false);
            return;
        }

        try {
            const resultExist = await checkAccountExists(email);
            if (!resultExist.success) {
                setError(resultExist.error || 'Unable to check account.');
                return;
            }
            if (resultExist.exists) {
                setError('An account already exists with this email.');
                return;
            }

            // Register user securely directly with Firebase Auth - no plaintext password in localStorage
            const regResult = await register({
                email,
                password,
                displayName: `${firstName} ${lastName}`.trim()
            });

            if (!regResult.success) {
                setError(regResult.error || 'Unable to complete registration.');
                setLoading(false);
                return;
            }

            // Create backend user record
            const newUserData = {
                profile: {
                    firstName,
                    lastName,
                    email
                },
                firebaseUid: regResult.user.uid
            };
            await createNewUser(newUserData);

            // Clean up any old pending signup storage
            localStorage.removeItem('pendingSignupInfo');

            navigate('/home', { replace: true });
        } catch (error) {
            setError(error?.message || 'Unable to start registration.');
        } finally {
            setLoading(false);
        }
    };

    const handleQuickDemoFill = () => {
        setFormData({
            firstName: 'Naimur',
            lastName: 'Rahman',
            email: 'naim.rahman@example.com',
            password: 'Password!123',
            confirmPassword: 'Password!123'
        });
        setError('');
        setConfirmPasswordError('');
    };

    return (
        <div className="auth-form-scroll-container">
            <div className="signup-top-bar">
                <Link to="/" className="signup-back-link">
                    <ArrowLeftIcon /> <span>Back to Store</span>
                </Link>

                {process.env.NODE_ENV !== 'production' && (
                    <button
                        type="button"
                        className="signup-demo-btn"
                        onClick={handleQuickDemoFill}
                        title="Autofill sample registration details"
                    >
                        <span className="signup-demo-pulse" />
                        <span>Quick Demo Fill</span>
                    </button>
                )}
            </div>

            <div className="signup-card-body">
                <div className="signup-header">
                    <h1 className="signup-title">Create an Account</h1>
                </div>

                <div className="signup-message-slot" aria-live="polite">
                    {error && (
                        <div className="signup-error-banner" role="alert">
                            <AlertCircleIcon size={17} strokeWidth={2.2} /> <span>{error}</span>
                        </div>
                    )}
                </div>

                <form id="register-form" className="signup-form" onSubmit={handleCreateNewUser}>
                    <div className="signup-name-grid">
                        <div className="form-group signup-form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" htmlFor="reg-fname">
                                First Name <span className="required">*</span>
                            </label>
                            <div className="signup-input-wrapper">
                                <span className="signup-input-icon"><UserIcon /></span>
                                <input
                                    type="text"
                                    id="reg-fname"
                                    name="firstName"
                                    className="input signup-input"
                                    placeholder="Naimur"
                                    value={formData.firstName}
                                    onChange={handleFormDataChange}
                                    required
                                    autoComplete="given-name"
                                />
                            </div>
                        </div>

                        <div className="form-group signup-form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" htmlFor="reg-lname">
                                Last Name <span className="required">*</span>
                            </label>
                            <div className="signup-input-wrapper">
                                <span className="signup-input-icon"><UserIcon /></span>
                                <input
                                    type="text"
                                    id="reg-lname"
                                    name="lastName"
                                    className="input signup-input"
                                    placeholder="Rahman"
                                    value={formData.lastName}
                                    onChange={handleFormDataChange}
                                    required
                                    autoComplete="family-name"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-group signup-form-group signup-inline-row">
                        <label className="form-label signup-inline-label" htmlFor="reg-email">
                            Email Address <span className="required">*</span>
                        </label>
                        <div className="signup-input-wrapper signup-inline-input">
                            <span className="signup-input-icon"><MailIcon /></span>
                            <input
                                type="email"
                                id="reg-email"
                                name="email"
                                className="input signup-input"
                                placeholder="user@example.com"
                                value={formData.email}
                                onChange={handleFormDataChange}
                                required
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    <div className="form-group signup-form-group">
                        <div className="signup-inline-row">
                            <label className="form-label signup-inline-label" htmlFor="reg-password">
                                Password <span className="required">*</span>
                            </label>
                            <div className="signup-input-wrapper signup-inline-input">
                                <span className="signup-input-icon"><LockIcon /></span>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="reg-password"
                                    name="password"
                                    className="input signup-input"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleFormDataChange}
                                    required
                                    minLength={8}
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className="signup-password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    title={showPassword ? 'Hide password' : 'Show password'}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOnIcon size={18} /> : <EyeOffIcon size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="signup-requirements-box">
                            <div className="signup-requirements-heading">Password must contain:</div>
                            <ul className="signup-requirements-list">
                                {passwordRequirements.map((requirement) => (
                                    <li
                                        key={requirement.key}
                                        className={`signup-requirement-item ${requirement.valid ? 'valid' : ''}`}
                                    >
                                        <span className="signup-requirement-check" aria-hidden="true">
                                            {requirement.valid ? '✓' : '○'}
                                        </span>
                                        <span className="signup-requirement-text">{requirement.text}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="form-group signup-form-group">
                        <div className="signup-inline-row">
                            <label className="form-label signup-inline-label" htmlFor="reg-confirm-password">
                                Confirm Password <span className="required">*</span>
                            </label>
                            <div className="signup-input-wrapper signup-inline-input">
                                <span className="signup-input-icon"><LockIcon /></span>
                                <input
                                    type={showConPassword ? 'text' : 'password'}
                                    id="reg-confirm-password"
                                    name="confirmPassword"
                                    className={`input signup-input ${confirmPasswordError ? 'has-error' : ''}`}
                                    placeholder="Re-enter password"
                                    value={formData.confirmPassword}
                                    onChange={handleFormDataChange}
                                    onBlur={handleConfirmPasswordBlur}
                                    required
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className="signup-password-toggle"
                                    onClick={() => setShowConPassword(!showConPassword)}
                                    title={showConPassword ? 'Hide password' : 'Show password'}
                                    aria-label={showConPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showConPassword ? <EyeOnIcon size={18} /> : <EyeOffIcon size={18} />}
                                </button>
                            </div>
                        </div>
                        {confirmPasswordError && (
                            <div className="signup-field-error signup-inline-error" role="alert">
                                <AlertCircleIcon size={14} strokeWidth={2} /> <span>{confirmPasswordError}</span>
                            </div>
                        )}
                    </div>

                    <div className="signup-terms-row">
                        <label className="signup-checkbox-label">
                            <input type="checkbox" required />
                            <span>
                                I agree to the{' '}
                                <span className="signup-terms-link">Terms of Service</span> and{' '}
                                <span className="signup-terms-link">Privacy Policy</span>.
                            </span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        id="submit-reg-btn"
                        className="btn btn-lg btn-primary btn-block signup-submit-btn"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="signup-btn-loading">
                                <span className="signup-spinner" /> Creating Account...
                            </span>
                        ) : (
                            <span className="signup-btn-content">Create My Account</span>
                        )}
                    </button>
                </form>

                <div className="signup-footer-signin">
                    Already have an account?{' '}
                    <Link to="/authentication/signin" className="signup-signin-link">
                        Sign in here
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
