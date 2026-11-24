import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './SignIn.css';

import { EyeOffIcon, EyeOnIcon, AlertCircleIcon, ArrowLeftIcon, InfoIcon, LockIcon, MailIcon } from '../assets/icons/icons';
import { login } from './AuthService';
import { checkAccountExists, getAuthMe } from '../api/apiManager';

const SignIn = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const queryParams = new URLSearchParams(location.search);
    const isSessionExpired = queryParams.get('session_expired') === 'true';

    const from = location.state?.from;
    const redirectTo = from ? `${from.pathname}${from.search || ''}${from.hash || ''}` : '/home';

    const handleLogin = async (method) => {
        setError('');
        setLoading(method);

        if (method === 'email') {
            const resultExist = await checkAccountExists(email);
            if (!resultExist.success) {
                setError(resultExist.error || 'Unable to check account.');
                setLoading(false);
                return;
            }
            if (!resultExist.exists) {
                setError('No account exists with this email.');
                setLoading(false);
                return;
            }
        }

        const result = await login({ method, email, password });

        setLoading(false);
        if (!result.success) {
            setError(result.error);
            return;
        }

        // Check trusted role from backend
        try {
            const authData = await getAuthMe();
            if (authData?.user?.role === 'admin' && (!from || from.pathname === '/home' || from.pathname === '/')) {
                navigate('/admin', { replace: true });
                return;
            }
        } catch (e) {
            console.warn('Role verification deferred:', e);
        }

        navigate(redirectTo, { replace: true });
    };

    const handleDemoCredential = () => {
        setEmail('demo.account@lumen.com');
        setPassword('Demo.Password');
        setError('');
    };

    return (
        <div className="auth-form-scroll-container">
            <div className="signin-top-bar">
                <Link to="/" className="signin-back-link">
                    <ArrowLeftIcon />
                    <span>Back to Store</span>
                </Link>
                {process.env.NODE_ENV !== 'production' && (
                    <button
                        type="button"
                        className="signin-demo-btn"
                        title="Autofill test customer credentials"
                        onClick={handleDemoCredential}
                    >
                        <span className="signin-demo-pulse" />
                        <span>Quick Demo Login</span>
                    </button>
                )}
            </div>

            <div className="signin-card-body">
                <div className="signin-header">
                    <h1 className="signin-title">Welcome Back</h1>
                </div>

                <div className="signin-message-slot" aria-live="polite">
                    {error ? (
                        <div className="signin-error-banner" role="alert">
                            <AlertCircleIcon /> <span>{error}</span>
                        </div>
                    ) : (location.state?.message || isSessionExpired) ? (
                        <div className="signin-info-banner" role="status">
                            <InfoIcon /> <span>{location.state?.message || 'Your session has expired. Please sign in again to continue.'}</span>
                        </div>
                    ) : null}
                </div>

                <form id="login-form" className="signin-form" onSubmit={(e) => { e.preventDefault(); handleLogin('email'); }}>
                    <div className="form-group signin-form-group">
                        <label className="form-label" htmlFor="login-email">
                            Email Address <span className="required">*</span>
                        </label>
                        <div className="signin-input-wrapper">
                            <span className="signin-input-icon"><MailIcon /></span>
                            <input
                                type="email"
                                id="login-email"
                                name="email"
                                className="input signin-input"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    <div className="form-group signin-form-group">
                        <div className="signin-password-label-row">
                            <label className="form-label" htmlFor="login-password">
                                Password <span className="required">*</span>
                            </label>
                            <Link to="/authentication/forgot-password" className="signin-forgot-link">
                                Forgot password?
                            </Link>
                        </div>

                        <div className="signin-input-wrapper">
                            <span className="signin-input-icon"><LockIcon /></span>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="login-password"
                                name="password"
                                className="input signin-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className="signin-password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                title={showPassword ? 'Hide password' : 'Show password'}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOnIcon size={18} /> : <EyeOffIcon size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        id="submit-login-btn"
                        className="btn btn-lg btn-primary btn-block signin-submit-btn"
                        disabled={loading}
                    >
                        {loading === 'email' ? (
                            <span className="signin-btn-loading">
                                <span className="signin-spinner" /> Signing in...
                            </span>
                        ) : (
                            <span className="signin-btn-content">Sign In</span>
                        )}
                    </button>
                </form>

                <div className="auth-divider">
                    <span>OR CONTINUE WITH</span>
                </div>

                <div className="social-login-group">
                    <button
                        type="button"
                        className="social-login-btn google-login"
                        onClick={() => handleLogin('google')}
                        disabled={loading}
                    >
                        <span className="social-icon google-icon">G</span>
                        <span>{loading === 'google' ? 'Signing In with Google...' : 'Continue with Google'}</span>
                    </button>
                    <button
                        type="button"
                        className="social-login-btn facebook-login"
                        onClick={() => handleLogin('facebook')}
                        disabled={loading}
                    >
                        <span className="social-icon facebook-icon">f</span>
                        <span>{loading === 'facebook' ? 'Signing In with Facebook...' : 'Continue with Facebook'}</span>
                    </button>
                </div>

                <div className="signin-footer-register">
                    Don't have an account yet?{' '}
                    <Link to="/authentication/create-new-account" className="signin-register-link">
                        Create an account
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default SignIn;
