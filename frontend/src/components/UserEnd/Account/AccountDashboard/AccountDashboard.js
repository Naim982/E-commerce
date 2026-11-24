import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './AccountDashboard.css';
import { getWishListByUser, getCartByUser } from '../../../../api/apiManager';

const AccountDashboard = ({ user }) => {
    const orders = user?.ordersSummary || [];
    const recentOrders = orders.slice(0, 3);

    const defaultAddress = user?.addresses?.find((address) => address.isDefault) || user?.addresses?.[0];

    const [wishlistCount, setWishlistCount] = useState(user?.wishlist?.length || 0);
    const [cartCount, setCartCount] = useState(
        user?.cartList?.reduce((total, item) => total + (Number(item.quantity) || 1), 0) ||
        user?.cartList?.length || 0
    );

    useEffect(() => {
        const userId = user?.id;
        if (!userId) return;

        let isMounted = true;

        const fetchLiveCounts = async () => {
            try {
                const [wishlistResult, cartResult] = await Promise.all([
                    getWishListByUser(userId),
                    getCartByUser(userId)
                ]);

                if (isMounted) {
                    if (wishlistResult.success && Array.isArray(wishlistResult.wishList)) {
                        setWishlistCount(wishlistResult.wishList.length);
                    }
                    if (cartResult.success && Array.isArray(cartResult.cartList)) {
                        const totalQuantity = cartResult.cartList.reduce(
                            (total, item) => total + (Number(item.quantity) || 1),
                            0
                        );
                        setCartCount(totalQuantity);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch live dashboard stats:', error);
            }
        };

        fetchLiveCounts();

        return () => {
            isMounted = false;
        };
    }, [user?.id, user?.wishlist, user?.cartList]);

    const getStatusBadgeClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'processing':
                return 'badge-warning';
            case 'shipped':
                return 'badge-info';
            case 'delivered':
                return 'badge-success';
            case 'cancelled':
                return 'badge-error';
            default:
                return 'badge-secondary';
        }
    };

    const getStatusText = (status) => {
        if (!status) return '';
        const normalizedStatus = status.toLowerCase();
        if (normalizedStatus === 'processing') return 'Processing';
        if (normalizedStatus === 'shipped') return 'Shipped';
        if (normalizedStatus === 'delivered') return 'Delivered';
        if (normalizedStatus === 'cancelled') return 'Cancelled';
        return normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);
    };

    const formatPrice = (price) => {
        return `৳${Number(price || 0).toFixed(2)}`;
    };

    const formatOrderDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div>
            <div className="account-welcome-card">
                <h1 className="account-welcome-title">
                    Welcome back, {user?.profile?.firstName || 'Valued Customer'}!
                </h1>
                <div className="account-member-badge">
                    <span>🛡️ LUMEN Pro Member</span>
                </div>
            </div>

            <div className="account-stats-grid">
                <Link to="/account/my-orders" className="account-stat-card">
                    <div className="account-stat-icon">📦</div>
                    <div className="account-stat-number">{orders.length}</div>
                    <div className="account-stat-label">Total Orders</div>
                </Link>

                <Link to="/wishlist" className="account-stat-card">
                    <div className="account-stat-icon">💙</div>
                    <div className="account-stat-number">{wishlistCount}</div>
                    <div className="account-stat-label">Wishlist Items</div>
                </Link>

                <Link to="/cart" className="account-stat-card">
                    <div className="account-stat-icon">🛒</div>
                    <div className="account-stat-number">{cartCount}</div>
                    <div className="account-stat-label">Cart Items</div>
                </Link>

                <Link to="/account/shipping-address" className="account-stat-card">
                    <div className="account-stat-icon">📍</div>
                    <div className="account-stat-number">{user?.addresses?.length || 0}</div>
                    <div className="account-stat-label">Saved Addresses</div>
                </Link>

                <Link to="/account/my-reviews" className="account-stat-card">
                    <div className="account-stat-icon">⭐</div>
                    <div className="account-stat-number">{user?.reviewsSummary?.length || 0}</div>
                    <div className="account-stat-label">Product Reviews</div>
                </Link>
            </div>

            <div className="account-card-section">
                <div className="account-section-header">
                    <div>
                        <h2 className="account-section-title">Recent Hardware Orders</h2>
                        <span className="account-section-subtitle">
                            Showing latest {Math.min(orders.length, 3)} orders from your history
                        </span>
                    </div>

                    <Link to="/account/my-orders" className="home-view-all-link">
                        View All Orders &rarr;
                    </Link>
                </div>

                {orders.length === 0 ? (
                    <div className="account-empty-state-box">
                        <p className="account-empty-state-text">No recent orders found.</p>
                    </div>
                ) : (
                    <div className="account-orders-table-wrapper">
                        <table className="account-orders-table">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Date Placed</th>
                                    <th>Items</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.map((order) => {
                                    const orderId = order.orderId || order.orderNumber || order.id;
                                    const orderDate = order.orderDate || order.placedAt;
                                    const grandTotal = order.cost?.grandTotal ?? order.totalAmount ?? 0;
                                    const orderStatus = order.orderStatus || order.status;

                                    const totalItems = order.items?.reduce(
                                        (total, item) => total + (Number(item.quantity) || 0),
                                        0
                                    ) || order.itemPreviews?.length || 0;

                                    return (
                                        <tr key={orderId}>
                                            <td><strong>#{orderId}</strong></td>
                                            <td>{formatOrderDate(orderDate)}</td>
                                            <td>{totalItems} Hardware Item{totalItems !== 1 && 's'}</td>
                                            <td><strong>{formatPrice(grandTotal)}</strong></td>
                                            <td>
                                                <span className={`badge ${getStatusBadgeClass(orderStatus)}`}>
                                                    {getStatusText(orderStatus)}
                                                </span>
                                            </td>
                                            <td>
                                                <Link
                                                    to={`/account/my-orders/order-details?orderId=${orderId}`}
                                                    state={{ order }}
                                                    className="btn btn-xs btn-outline"
                                                >
                                                    {orderStatus === 'shipped' ? 'Track Order' : 'View Order'}
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="account-snapshot-grid">
                <div className="account-snapshot-card">
                    <div className="account-snapshot-header">
                        <h3 className="account-snapshot-title">Personal Profile</h3>
                        <Link to="/account/personal-info" className="btn btn-xs btn-outline">
                            Edit
                        </Link>
                    </div>

                    <div className="account-snapshot-content">
                        <p><strong>Name:</strong> {user?.profile?.firstName} {user?.profile?.lastName}</p>
                        <p><strong>Email:</strong> {user?.profile?.email}</p>
                        <p><strong>Phone:</strong> {user?.profile?.phone || 'Not provided'}</p>
                        <p><strong>Currency Preference:</strong> {user?.preferences?.currency || 'USD ($)'}</p>
                        <p>
                            <strong>Account Status:</strong>
                            <span
                                className={`badge ${user?.accountStatus === 'active' ? 'badge-success' : 'badge-warning'}`}
                                style={{ marginLeft: '8px' }}
                            >
                                {user?.accountStatus === 'active' ? 'Active & Verified' : 'Pending Verification'}
                            </span>
                        </p>
                    </div>
                </div>

                <div className="account-snapshot-card">
                    <div className="account-snapshot-header">
                        <h3 className="account-snapshot-title">Default Shipping Address</h3>
                        <Link to="/account/shipping-address" className="btn btn-xs btn-outline">
                            Manage
                        </Link>
                    </div>

                    <div className="account-snapshot-content">
                        {defaultAddress ? (
                            <>
                                <p>
                                    <strong>
                                        {defaultAddress.label || 'Primary Address'}{' '}
                                        {defaultAddress.isDefault && '(Default)'}
                                    </strong>
                                </p>
                                <p style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                    {defaultAddress.recipientName}
                                </p>
                                {(defaultAddress.apartment || defaultAddress.suite) && (
                                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.84rem' }}>
                                        {defaultAddress.apartment || defaultAddress.suite}
                                    </p>
                                )}
                                <p style={{ fontWeight: 600 }}>{defaultAddress.street}</p>
                                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.84rem' }}>
                                    {[
                                        defaultAddress.villageArea || defaultAddress.city,
                                        defaultAddress.thana ? `Thana: ${defaultAddress.thana}` : (defaultAddress.state && defaultAddress.state !== 'Bangladesh' ? defaultAddress.state : '')
                                    ].filter(Boolean).join(', ')}
                                </p>
                                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.84rem' }}>
                                    {[
                                        defaultAddress.district || (defaultAddress.country !== 'Bangladesh' ? defaultAddress.country : 'Dhaka'),
                                        defaultAddress.postalCode || defaultAddress.zipCode || defaultAddress.postal
                                    ].filter(Boolean).join(' - ')}, Bangladesh
                                </p>
                                <p style={{ marginTop: '4px' }}>
                                    <strong>Phone:</strong> {defaultAddress.phone}
                                </p>
                            </>
                        ) : (
                            <div className="account-empty-state-box">
                                <p className="account-empty-state-text">No default shipping address saved.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="account-quick-actions-bar">
                <span className="account-actions-label">Quick Actions:</span>
                <Link to="/account/my-orders" className="btn btn-sm btn-secondary">
                    Track Orders
                </Link>
                <Link to="/account/shipping-address" className="btn btn-sm btn-secondary">
                    Add New Address
                </Link>
                <Link to="/account/password-security" className="btn btn-sm btn-secondary">
                    Change Password
                </Link>
                <Link to="/account/help-and-support" className="btn btn-sm btn-secondary">
                    Contact Tech Support
                </Link>
            </div>
        </div>
    );
};

export default AccountDashboard;
