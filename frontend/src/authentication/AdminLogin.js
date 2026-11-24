import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { login } from './AuthService';
import { getAuthMe } from '../api/apiManager';
import './AdminLogin.css';

const AdminLogin = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const from = location.state?.from?.pathname || '/admin';

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const cleanEmail = email.trim();
            const cleanPass = password;

            const res = await login({ method: 'email', email: cleanEmail, password: cleanPass });
            if (!res.success) {
                setError(res.error || 'Authentication failed. Please verify credentials.');
                setLoading(false);
                return;
            }

            // Verify role with backend
            const authMe = await getAuthMe();
            if (authMe?.role === 'admin' || authMe?.user?.role === 'admin') {
                navigate(from, { replace: true });
            } else {
                setError('Access Denied: This account does not possess administrator privileges.');
                setLoading(false);
            }
        } catch (err) {
            console.error(err);
            setError('A network or server error occurred during authentication.');
            setLoading(false);
        }
    };

    const handleAutofillAdmin = () => {
        setEmail('admin@lumen.com');
        setPassword('Admin.123');
        setError('');
    };

    return (
        <div className="admin-login-stage">
            <div className="admin-login-card">
                <div style={{ textAlign: 'center' }}>
                    <div className="admin-login-brand">
                        <div className="admin-login-brand-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                            </svg>
                        </div>
                        <span>LUMEN <span className="admin-login-tag">Admin</span></span>
                    </div>
                    <div className="admin-login-caption">
                        Restricted hardware store operations console.
                    </div>
                </div>

                {error && (
                    <div className="admin-login-error">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="admin-login-group">
                        <label className="admin-login-label">Admin Email</label>
                        <input
                            type="email"
                            className="admin-login-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@lumen.com"
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="admin-login-group">
                        <label className="admin-login-label">Password</label>
                        <input
                            type="password"
                            className="admin-login-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="admin-login-btn"
                        disabled={loading}
                    >
                        {loading ? 'Authenticating Console...' : 'Authenticate to Console →'}
                    </button>
                </form>

                {process.env.NODE_ENV !== 'production' && (
                    <div className="admin-login-demo-bar">
                        <button
                            type="button"
                            className="admin-demo-autofill-btn"
                            onClick={handleAutofillAdmin}
                        >
                            ⚡ Autofill Registered Admin (admin@lumen.com / Admin.123)
                        </button>
                    </div>
                )}

                <div style={{ textAlign: 'center' }}>
                    <Link to="/" className="admin-login-back-link">
                        ← Back to Customer Storefront
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
