import React, { useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
    DashboardIcon,
    ProductsIcon,
    CategoriesIcon,
    InventoryIcon,
    OrdersIcon,
    CustomersIcon,
    CouponsIcon,
    ReviewsIcon,
    SupportIcon,
    ContentIcon,
    StoreSettingsIcon,
    CloseIcon
} from '../shared/AdminIcons';
import useAuth from '../../../authentication/useAuth';
import { logout } from '../../../authentication/AuthService';
import './AdminLayout.css';

const AdminMobileSidebar = ({ isOpen, onClose, counts = {} }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleLogout = async () => {
        sessionStorage.removeItem('admin_token');
        await logout();
        onClose();
        navigate('/authentication/signin', { replace: true });
    };

    const navLinks = [
        { type: 'header', label: 'Main' },
        { to: '/admin', label: 'Dashboard', icon: DashboardIcon, exact: true },

        { type: 'header', label: 'Store Management' },
        { to: '/admin/products', label: 'Products', icon: ProductsIcon },
        { to: '/admin/categories', label: 'Categories', icon: CategoriesIcon },
        { to: '/admin/inventory', label: 'Inventory', icon: InventoryIcon, badge: counts.lowStock > 0 ? `${counts.lowStock}` : null, badgeColor: '#ef4444' },
        { to: '/admin/orders', label: 'Orders', icon: OrdersIcon, badge: counts.pendingOrders > 0 ? `${counts.pendingOrders}` : null, badgeColor: '#4f46e5' },
        { to: '/admin/customers', label: 'Customers', icon: CustomersIcon },

        { type: 'header', label: 'Marketing' },
        { to: '/admin/coupons', label: 'Coupons & Promos', icon: CouponsIcon },
        { to: '/admin/reviews', label: 'Reviews', icon: ReviewsIcon },

        { type: 'header', label: 'Communication' },
        { to: '/admin/support', label: 'Support Tickets', icon: SupportIcon, badge: counts.openTickets > 0 ? `${counts.openTickets}` : null, badgeColor: '#f59e0b' },

        { type: 'header', label: 'Website' },
        { to: '/admin/content', label: 'Content Management', icon: ContentIcon },
        { to: '/admin/settings', label: 'Store Settings', icon: StoreSettingsIcon }
    ];

    return (
        <>
            <div className="admin-mobile-backdrop" onClick={onClose} />
            <div className="admin-mobile-drawer">
                <div className="admin-brand" style={{ justifyContent: 'space-between' }}>
                    <Link to="/admin" className="admin-brand-link" onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                        <span>LUMEN</span>
                        <span className="admin-brand-tag">ADMIN</span>
                    </Link>
                    <button type="button" className="admin-icon-btn" onClick={onClose} style={{ border: 'none', background: 'transparent', color: '#94a3b8' }}>
                        <CloseIcon size={20} />
                    </button>
                </div>

                <nav className="admin-nav">
                    {navLinks.map((item, index) => {
                        if (item.type === 'header') {
                            return (
                                <div key={`mob-header-${index}`} className="admin-nav-header">
                                    {item.label}
                                </div>
                            );
                        }

                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={`mob-${item.to}`}
                                to={item.to}
                                end={item.exact}
                                className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                                onClick={onClose}
                            >
                                <span className="nav-icon"><Icon size={19} /></span>
                                <span>{item.label}</span>
                                {item.badge && (
                                    <span className="admin-nav-badge" style={{ backgroundColor: item.badgeColor || '#334155' }}>
                                        {item.badge}
                                    </span>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="admin-user-footer">
                    <div className="admin-user-avatar">
                        {(user?.email?.charAt(0) || 'A').toUpperCase()}
                    </div>
                    <div className="admin-user-info">
                        <span className="admin-user-name">{user?.displayName || user?.email || 'Operations Lead'}</span>
                        <span className="admin-user-role">Administrator</span>
                    </div>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="admin-icon-btn"
                        title="Sign Out"
                        style={{ border: 'none', background: 'transparent', color: '#94a3b8' }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                    </button>
                </div>
            </div>
        </>
    );
};

export default AdminMobileSidebar;
