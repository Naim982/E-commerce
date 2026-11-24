import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminBreadcrumbs from './AdminBreadcrumbs';
import { ExternalLinkIcon } from '../shared/AdminIcons';
import useAuth from '../../../authentication/useAuth';
import { logout } from '../../../authentication/AuthService';
import './AdminLayout.css';

const AdminTopbar = ({ onToggleMobile, onToggleCollapse, isCollapsed }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        sessionStorage.removeItem('admin_token');
        await logout();
        navigate('/admin/login', { replace: true });
    };

    return (
        <header className="admin-topbar">
            <div className="admin-topbar-left">
                {/* Mobile Hamburger Toggle */}
                <button
                    type="button"
                    className="admin-icon-btn menu-toggle"
                    onClick={onToggleMobile}
                    aria-label="Toggle mobile menu"
                    style={{ display: 'none' }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>

                {/* Desktop Collapse Toggle */}
                <button
                    type="button"
                    className="admin-icon-btn desktop-collapse-btn"
                    onClick={onToggleCollapse}
                    title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    aria-label="Toggle sidebar collapse"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                        <line x1="9" y1="3" x2="9" y2="21" />
                        {isCollapsed ? (
                            <polyline points="13 9 16 12 13 15" />
                        ) : (
                            <polyline points="16 9 13 12 16 15" />
                        )}
                    </svg>
                </button>

                <AdminBreadcrumbs />
            </div>

            <div className="admin-topbar-right">
                <Link
                    to="/"
                    target="_blank"
                    rel="noreferrer"
                    className="admin-btn admin-btn-outline admin-btn-sm"
                    title="Open customer storefront in a new tab"
                >
                    <span>View Store</span>
                    <ExternalLinkIcon size={14} />
                </Link>

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '4px 8px',
                        backgroundColor: '#f1f5f9',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: '#334155'
                    }}
                >
                    <div
                        style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: '#4f46e5',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem'
                        }}
                    >
                        {(user?.email?.charAt(0) || 'A').toUpperCase()}
                    </div>
                    <span>{user?.displayName || (user?.email ? user.email.split('@')[0] : 'Admin')}</span>
                </div>

                <button
                    type="button"
                    onClick={handleLogout}
                    className="admin-btn admin-btn-outline admin-btn-sm"
                    style={{ color: '#dc2626' }}
                    title="Sign Out"
                >
                    Sign Out
                </button>
            </div>
        </header>
    );
};

export default AdminTopbar;
