import React, { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import './Account.css';

import AccountDashboard from './AccountDashboard/AccountDashboard';
import MyOrders from './MyOrders/MyOrders';
import ShippingAddress from './ShippingAddress/ShippingAddress';
import PersonalInfo from './PersonalInfo/PersonalInfo';
import MyReview from './MyReview/MyReview';
import Notifications from './Notifications/Notifications';
import PaymentMethod from './PaymentMethod/PaymentMethod';
import PasswordSecurity from './PasswordSecurity/PasswordSecurity';
import HelpSupport from './HelpSupport/HelpSupport';
import OrderDetails from './OrderDetails/OrderDetails';

import { logout } from '../../../authentication/AuthService';
import { getUserData } from '../../../api/apiManager';
import useAuth from '../../../authentication/useAuth';

const Account = () => {
    const { user } = useAuth();
    const userId = user?.uid;

    const navigate = useNavigate();
    const location = useLocation();

    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadUser = async () => {
            if (!userId) return;

            setLoading(true);
            setError('');

            const result = await getUserData(userId);

            if (!result.success) {
                setError(result.error);
                setLoading(false);
                return;
            }

            setUserData(result.user);
            setLoading(false);
        };

        loadUser();
    }, [userId]);

    const handleSignOut = async (e) => {
        if (e) e.preventDefault();
        const result = await logout();
        if (!result.success) {
            console.error(result.error);
        }
        setUserData(null);
        navigate('/');
    };

    if (loading) return <div className="container" style={{ padding: '3rem 0', textAlign: 'center' }}>Loading account details...</div>;
    if (error) return <div className="container" style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--color-error)' }}>{error}</div>;

    const avatarInitials = userData?.profile?.avatarInitials ||
        `${userData?.profile?.firstName?.[0] || ''}${userData?.profile?.lastName?.[0] || ''}`.toUpperCase() || 'LU';

    const fullName = `${userData?.profile?.firstName || ''} ${userData?.profile?.lastName || ''}`.trim() || 'Verified User';
    const userEmail = userData?.profile?.email || '';

    const ordersCount = userData?.ordersSummary?.length || userData?.recentOrdersSummary?.length || 0;
    const addressesCount = userData?.addresses?.length || 0;
    const reviewsCount = userData?.reviewsSummary?.length || 0;
    const notifsCount = userData?.notifications?.length || 0;
    const unreadNotifsCount = userData?.notifications?.filter((n) => !n.isRead)?.length || 0;

    const navItems = [
        {
            path: '/account/dashboard',
            label: 'Dashboard Overview',
            icon: '📊',
            isActive: location.pathname === '/account' || location.pathname === '/account/' || location.pathname.startsWith('/account/dashboard')
        },
        {
            path: '/account/my-orders',
            label: `My Orders (${ordersCount})`,
            icon: '📦',
            isActive: location.pathname.startsWith('/account/my-orders')
        },
        {
            path: '/account/shipping-address',
            label: `Shipping Addresses (${addressesCount})`,
            icon: '📍',
            isActive: location.pathname.startsWith('/account/shipping-address')
        },
        {
            path: '/account/personal-info',
            label: 'Profile & Personal Info',
            icon: '👤',
            isActive: location.pathname.startsWith('/account/personal-info')
        },
        {
            path: '/account/my-reviews',
            label: `My Reviews (${reviewsCount})`,
            icon: '⭐',
            isActive: location.pathname.startsWith('/account/my-reviews')
        },
        {
            path: '/account/notifications',
            label: `Notifications (${notifsCount})`,
            icon: '🔔',
            isActive: location.pathname.startsWith('/account/notifications'),
            badge: unreadNotifsCount > 0 ? `${unreadNotifsCount} new` : null
        },
        {
            path: '/account/payment-methods',
            label: 'Payment Methods',
            icon: '💳',
            isActive: location.pathname.startsWith('/account/payment-methods')
        },
        {
            path: '/account/password-security',
            label: 'Password & Security',
            icon: '🔒',
            isActive: location.pathname.startsWith('/account/password-security')
        },
        {
            path: '/account/help-and-support',
            label: 'Help & Support',
            icon: '💬',
            isActive: location.pathname.startsWith('/account/help-and-support')
        }
    ];

    return (
        <div>
            <main>
                <section className="account-main-section">
                    <div className="container">
                        <div className="account-layout">
                            <aside className="account-sidebar">
                                <div className="account-user-card">
                                    <div className="account-avatar">{avatarInitials}</div>
                                    <div className="account-user-info">
                                        <strong className="account-user-name">{fullName}</strong>
                                        <span className="account-user-email">{userEmail}</span>
                                    </div>
                                </div>

                                <nav className="account-nav-list" aria-label="Account Navigation">
                                    {navItems.map((item) => (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            className={`account-nav-item ${item.isActive ? 'active' : ''}`}
                                            aria-current={item.isActive ? 'page' : undefined}
                                        >
                                            <span className="account-nav-icon">{item.icon}</span>
                                            <span className="account-nav-text">{item.label}</span>
                                            {item.badge && (
                                                <span className="account-nav-badge">{item.badge}</span>
                                            )}
                                        </Link>
                                    ))}

                                    <hr className="divider" style={{ marginBlock: 'var(--space-3)' }} />

                                    <button
                                        type="button"
                                        className="account-nav-item account-logout-btn"
                                        id="account-logout-trigger"
                                        onClick={handleSignOut}
                                    >
                                        <span className="account-nav-icon">🚪</span>
                                        <span>Log Out</span>
                                    </button>
                                </nav>
                            </aside>

                            <div className="account-content-col">
                                <Routes>
                                    <Route index element={<Navigate to="dashboard" replace />} />
                                    <Route path="dashboard" element={<AccountDashboard user={userData} />} />
                                    <Route path="my-orders" element={<MyOrders user={userData} />} />
                                    <Route path="shipping-address" element={<ShippingAddress user={userData} />} />
                                    <Route path="personal-info" element={<PersonalInfo user={userData} />} />
                                    <Route path="my-reviews" element={<MyReview user={userData} />} />
                                    <Route path="notifications" element={<Notifications user={userData} />} />
                                    <Route path="payment-methods" element={<PaymentMethod user={userData} />} />
                                    <Route path="password-security" element={<PasswordSecurity user={userData} />} />
                                    <Route path="help-and-support" element={<HelpSupport user={userData} />} />
                                    <Route path="my-orders/order-details" element={<OrderDetails user={userData} />} />
                                </Routes>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Account;
