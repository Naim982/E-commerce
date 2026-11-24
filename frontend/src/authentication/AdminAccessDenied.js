import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from './useAuth';
import { logout } from './AuthService';
import './AdminAuth.css';

const AdminAccessDenied = ({ userEmail, userRole = 'customer' }) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleSwitchAccount = async () => {
        await logout();
        sessionStorage.removeItem('admin_token');
        navigate('/admin/login', { state: { from: { pathname: '/admin' } } });
    };

    const handleQuickAdminDemo = () => {
        sessionStorage.setItem('admin_token', 'dev-lumen-admin-secure-token-2026');
        window.location.reload();
    };

    return (
        <div className="admin-access-denied-root">
            <div className="admin-denied-card">
                <div className="admin-denied-icon-wrap">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                    </svg>
                </div>

                <span className="admin-denied-badge">403 Restricted Area</span>
                <h1 className="admin-denied-title">Administrator Privileges Required</h1>

                <p className="admin-denied-desc">
                    You are currently authenticated as <strong>{userEmail || user?.email || 'a standard customer'}</strong> with role <span className="role-chip">{userRole}</span>.
                    This portal is restricted to authorized LUMEN Hardware operations staff.
                </p>

                <div className="admin-denied-actions">
                    <Link to="/" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                        Return to Storefront
                    </Link>
                    <button type="button" className="btn btn-outline" onClick={handleSwitchAccount}>
                        Sign In as Different User
                    </button>
                </div>

                {process.env.NODE_ENV !== 'production' && (
                    <div className="admin-denied-demo-box">
                        <div className="demo-box-header">Developer / Demo Environment</div>
                        <p className="demo-box-text">
                            To test this administrative dashboard locally, you can activate the development administrator session:
                        </p>
                        <button type="button" className="btn btn-sm btn-ghost demo-switch-btn" onClick={handleQuickAdminDemo}>
                            ⚡ Activate Local Admin Session
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminAccessDenied;
