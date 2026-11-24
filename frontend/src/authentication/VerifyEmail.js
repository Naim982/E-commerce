import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './VerifyEmail.css';

import { ArrowLeftIcon, CheckIcon, MailIcon, RefreshIcon, AlertCircleIcon } from '../assets/icons/icons';
import { sendRegisterLink, completePasswordlessSignIn, addAccountPassword, updateNewProfile } from './AuthService';
import useAuth from './useAuth';
import { createNewUser } from '../api/apiManager';

const VerifyEmail = () => {
    const { user } = useAuth();

    const [searchParams] = useSearchParams();

    const hasProcessedRef = useRef(false);

    const [email, setEmail] = useState('');
    const [viewState, setViewState] = useState('processing');
    const [resending, setResending] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (hasProcessedRef.current) {
            return;
        }
        hasProcessedRef.current = true;

        const mode = searchParams.get('mode');
        const oobCode = searchParams.get('oobCode');
        const pendingSignupRaw = localStorage.getItem('pendingSignupInfo');

        let pendingSignupInfo = null;
        if (pendingSignupRaw) {
            try {
                pendingSignupInfo = JSON.parse(pendingSignupRaw);
                if (!pendingSignupInfo) {
                    throw new Error('Registration information is missing.');
                }
            } catch {
                pendingSignupInfo = null;
            }
        }
        localStorage.removeItem('pendingSignupInfo');

        if (user) {
            setEmail(user.email);
            setViewState('email_verified');
            return;
        }

        const completeRegistration = async () => {
            setViewState('processing');
            setError('');
            setStatusMessage('');

            try {
                if (mode !== 'signIn' || !oobCode) {
                    throw new Error('This is not a valid registration link.');
                }

                let signUpEmail = pendingSignupInfo?.email;
                if (!signUpEmail) {
                    signUpEmail = window.prompt('Enter the email address you used to register:');
                }
                if (!signUpEmail) {
                    throw new Error('Email address is required to complete sign in.');
                }
                signUpEmail = signUpEmail.trim().toLowerCase();
                const password = pendingSignupInfo?.password;

                const resultAuth = await completePasswordlessSignIn(signUpEmail);
                if (!resultAuth.success) {
                    throw new Error(resultAuth.error);
                }
                const firebaseUser = resultAuth.user;

                const userFirstName = pendingSignupInfo?.firstName || 'LUMEN';
                const userLastName = pendingSignupInfo?.lastName || 'Member';
                const userEmailVal = pendingSignupInfo?.email || signUpEmail;

                const newUserData = {
                    profile: {
                        firstName: userFirstName,
                        lastName: userLastName,
                        email: userEmailVal
                    },
                    firebaseUid: firebaseUser.uid
                };

                const resultServer = await createNewUser(newUserData);
                if (!resultServer.success) {
                    throw new Error(resultServer.error);
                }

                const displayName = `${userFirstName} ${userLastName}`.trim();
                const resultUpdated = await updateNewProfile({
                    displayName,
                    photoURL: resultServer.user?.profile?.avatarUrl || null
                });
                if (!resultUpdated.success) {
                    throw new Error(resultUpdated.error);
                }

                if (password) {
                    const resultPassword = await addAccountPassword(password);
                    if (!resultPassword.success) {
                        throw new Error(resultPassword.error);
                    }
                }

                setEmail(firebaseUser.email);
                setViewState('email_verified');
            } catch (error) {
                console.error(error);
                setError(error?.message || 'Unable to complete registration.');
                setViewState('email_sent');
            } finally {
                setViewState(prev => prev === 'email_sent' ? prev : 'email_verified');
            }
        };

        if (mode === 'signIn' && oobCode) {
            setEmail(pendingSignupInfo?.email || '');
            completeRegistration();
        } else if (pendingSignupInfo?.email) {
            setEmail(pendingSignupInfo.email);
            setViewState('email_sent');
        } else {
            setViewState('enter_email');
        }
    }, [searchParams, user]);

    const handleResend = async () => {
        if (resending) {
            return;
        }

        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail) {
            setViewState('enter_email');
            return;
        }

        setResending(true);
        setError('');
        setStatusMessage('');

        const result = await sendRegisterLink(normalizedEmail);
        if (!result.success) {
            setError(result.error);
            setResending(false);
            return;
        }

        setStatusMessage('A fresh secure sign-in link has been sent to your inbox.');
        setResending(false);
    };

    const handleQuickDemoFill = () => {
        setEmail('demo.account@lumen.com');
        setError('');
    };

    return (
        <div className="auth-form-scroll-container">
            <div className="verify-top-bar">
                <Link to="/" className="verify-back-link">
                    <ArrowLeftIcon /> <span>Back to Store</span>
                </Link>

                {process.env.NODE_ENV !== 'production' && viewState === 'enter_email' && (
                    <button
                        type="button"
                        className="verify-state-toggle-btn"
                        onClick={handleQuickDemoFill}
                    >
                        <span className="verify-toggle-dot" /> <span>Demo Email</span>
                    </button>
                )}
            </div>

            <div className="verify-card-body">
                {error && (
                    <div className="verify-alert-banner error" role="alert">
                        <AlertCircleIcon /> <span>{error}</span>
                    </div>
                )}

                {statusMessage && viewState === 'email_sent' && (
                    <div className="verify-alert-banner success" role="status">
                        <MailIcon /> <span>{statusMessage}</span>
                    </div>
                )}

                {viewState === 'processing' && (
                    <div className="verify-success-view">
                        <div className="verify-spinner" />
                        <h1 className="verify-success-title">Verifying Your Email</h1>
                        <p className="verify-success-desc">We're completing your secure sign-in.</p>
                    </div>
                )}

                {viewState === 'email_sent' && (
                    <div className="verify-pending-view">
                        <div className="verify-title-row">
                            <div className="verify-icon-badge"> <MailIcon size={24} /> </div>
                            <h1 className="verify-title">Check Your Email</h1>
                        </div>

                        <p className="verify-subtitle">
                            We've sent a secure sign-in link to your email address. Click the link to verify your email and complete your first sign-in.
                        </p>

                        <div className="verify-email-card">
                            <div className="verify-email-content">
                                <div className="verify-email-icon"><MailIcon /></div>
                                <span className="verify-email-text">{email}</span>
                            </div>
                        </div>

                        <div className="verify-actions-group">
                            <button
                                type="button"
                                className="verify-primary-btn"
                                onClick={handleResend}
                                disabled={resending}
                            >
                                {resending ?
                                    <> <span className="verify-spinner" /> Sending... </> :
                                    <> <RefreshIcon /> Resend Secure Link </>
                                }
                            </button>
                        </div>

                        <div className="verify-footer-text">
                            Already completed verification?{' '}
                            <Link to="/authentication/signin" className="verify-accent-link">
                                Sign in here
                            </Link>
                        </div>
                    </div>
                )}

                {viewState === 'email_verified' && (
                    <div className="verify-success-view">
                        <div className="verify-success-icon"><CheckIcon size={34} /></div>
                        <span className="verify-success-badge">Account Activated</span>
                        <h1 className="verify-success-title">Email Verified!</h1>
                        <p className="verify-success-desc">
                            Your email address has been verified and your first sign-in is complete.
                        </p>
                        <div className="verify-actions-group">
                            <Link to="/" className="verify-primary-btn" style={{ padding: '0 30px' }}>
                                Continue to LUMEN
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
