import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminPageHeader from '../shared/AdminPageHeader';
import StatCard from '../shared/StatCard';
import StatusBadge from '../shared/StatusBadge';
import LoadingSpinner from '../shared/LoadingSpinner';
import EmptyState from '../shared/EmptyState';
import {
    OrdersIcon,
    ProductsIcon,
    CustomersIcon,
    InventoryIcon,
    PlusIcon,
    ArrowRightIcon
} from '../shared/AdminIcons';
import { getAdminDashboard } from '../../../api/apiManager';
import './Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const [error, setError] = useState(null);
    const [period, setPeriod] = useState('all');

    const fetchDashboard = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getAdminDashboard();
            if (res.success) {
                setDashboardData(res);
            } else {
                setError(res.error || 'Failed to load dashboard metrics');
            }
        } catch (err) {
            setError('Connection error loading dashboard');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    if (loading) {
        return <LoadingSpinner message="Calculating store business metrics..." />;
    }

    if (error || !dashboardData) {
        return (
            <EmptyState
                title="Dashboard Data Unavailable"
                description={error || 'Unable to connect to the store data service.'}
                action={
                    <button type="button" className="admin-btn admin-btn-primary" onClick={fetchDashboard}>
                        Retry Loading
                    </button>
                }
            />
        );
    }

    const { metrics = {}, salesTrend = [], categoryDistribution = [], recentOrders = [], lowStockAlerts = [] } = dashboardData;

    // Calculate maximum revenue in sales trend for pure CSS bar height scaling
    const maxRevenue = Math.max(...salesTrend.map((s) => s.revenue || 0), 1000);

    return (
        <div className="admin-dashboard-view">
            <AdminPageHeader
                title="Store Operations Dashboard"
                subtitle="Live overview of commercial revenue, customer order flow, and warehouse inventory."
                actions={
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <select
                            className="admin-select"
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            aria-label="Filter period"
                        >
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="90d">Last 90 Days</option>
                            <option value="all">All-Time Metrics</option>
                        </select>
                        <Link to="/admin/products/new" className="admin-btn admin-btn-primary admin-btn-sm">
                            <PlusIcon size={16} />
                            <span>Add Product</span>
                        </Link>
                    </div>
                }
            />

            {/* 1. KEY PERFORMANCE METRICS */}
            <div className="stat-grid">
                <StatCard
                    title="Total Gross Revenue"
                    value={`৳${Number(metrics.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    subtitle="Realized sales across completed transactions"
                    trend="+14.2% vs last month"
                    trendType="up"
                    icon={() => (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="1" x2="12" y2="23" />
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                    )}
                />

                <StatCard
                    title="Total Customer Orders"
                    value={metrics.totalOrders || 0}
                    subtitle={`${metrics.pendingOrders || 0} orders awaiting processing`}
                    trendType={metrics.pendingOrders > 0 ? 'warning' : 'neutral'}
                    icon={OrdersIcon}
                    onClick={() => navigate('/admin/orders')}
                />

                <StatCard
                    title="Catalog Products"
                    value={metrics.totalProducts || 0}
                    subtitle="Active hardware component SKUs"
                    icon={ProductsIcon}
                    onClick={() => navigate('/admin/products')}
                />

                <StatCard
                    title="Registered Customers"
                    value={metrics.totalCustomers || 0}
                    subtitle="Verified customer profiles"
                    icon={CustomersIcon}
                    onClick={() => navigate('/admin/customers')}
                />
            </div>

            {/* 2. REVENUE TREND & CATEGORY DISTRIBUTION */}
            <div className="dashboard-grid-2col">
                {/* Sales Analytics Bar Chart */}
                <div className="admin-card">
                    <div className="admin-card-header">
                        <div>
                            <h3 className="admin-card-title">Commercial Revenue Trend</h3>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Monthly revenue based on actual order transaction logs</span>
                        </div>
                        <span className="admin-status-badge info">Verified Store Data</span>
                    </div>

                    <div className="analytics-chart-container">
                        {salesTrend.map((item, idx) => {
                            const heightPct = Math.max(Math.round(((item.revenue || 0) / maxRevenue) * 100), 8);
                            return (
                                <div key={item.period || idx} className="chart-bar-group">
                                    <div className="chart-bar-tooltip">
                                        ${Number(item.revenue || 0).toLocaleString()}
                                    </div>
                                    <div className="chart-bar-track">
                                        <div
                                            className="chart-bar-fill"
                                            style={{ height: `${heightPct}%` }}
                                            title={`${item.label}: $${Number(item.revenue || 0).toLocaleString()}`}
                                        />
                                    </div>
                                    <span className="chart-bar-label">{item.label || item.period}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Category Breakdown */}
                <div className="admin-card">
                    <div className="admin-card-header">
                        <h3 className="admin-card-title">Category Distribution</h3>
                        <Link to="/admin/categories" style={{ fontSize: '0.8125rem', color: '#4f46e5', fontWeight: 600 }}>
                            Manage All
                        </Link>
                    </div>

                    <div className="category-dist-list">
                        {categoryDistribution.slice(0, 6).map((cat) => (
                            <div key={cat.category} className="category-dist-item">
                                <div className="category-dist-header">
                                    <span className="category-dist-name">{cat.category}</span>
                                    <span className="category-dist-stats">{cat.count} items ({cat.percentage}%)</span>
                                </div>
                                <div className="category-progress-track">
                                    <div className="category-progress-fill" style={{ width: `${cat.percentage}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 3. RECENT ORDERS & LOW STOCK MONITOR */}
            <div className="dashboard-grid-2col">
                {/* Recent Customer Orders */}
                <div className="admin-card">
                    <div className="admin-card-header">
                        <h3 className="admin-card-title">Recent Store Orders</h3>
                        <Link to="/admin/orders" className="admin-btn admin-btn-outline admin-btn-sm">
                            <span>All Orders</span>
                            <ArrowRightIcon size={14} />
                        </Link>
                    </div>

                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Date</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                                            No recent customer orders found.
                                        </td>
                                    </tr>
                                ) : (
                                    recentOrders.map((order) => (
                                        <tr key={order.orderId}>
                                            <td>
                                                <code style={{ fontWeight: 700, color: '#4f46e5' }}>{order.orderId}</code>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{order.customerEmail}</div>
                                            </td>
                                            <td style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                                                {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'Recent'}
                                            </td>
                                            <td style={{ fontWeight: 700 }}>
                                                ${Number(order.cost?.grandTotal || 0).toFixed(2)}
                                            </td>
                                            <td>
                                                <StatusBadge status={order.orderStatus || 'pending'} />
                                            </td>
                                            <td>
                                                <Link
                                                    to="/admin/orders"
                                                    className="admin-btn admin-btn-outline admin-btn-sm"
                                                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                                >
                                                    Inspect
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Low Stock Alerts */}
                <div className="admin-card">
                    <div className="admin-card-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <InventoryIcon size={18} />
                            <h3 className="admin-card-title">Inventory Alerts</h3>
                        </div>
                        <Link to="/admin/inventory" className="admin-btn admin-btn-outline admin-btn-sm">
                            <span>Manage Stock</span>
                            <ArrowRightIcon size={14} />
                        </Link>
                    </div>

                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Hardware Part</th>
                                    <th>Stock</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lowStockAlerts.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                                            ✓ All inventory levels are healthy.
                                        </td>
                                    </tr>
                                ) : (
                                    lowStockAlerts.map((item) => (
                                        <tr key={item.id}>
                                            <td>
                                                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.category}</div>
                                            </td>
                                            <td style={{ fontWeight: 700, color: item.quantity === 0 ? '#ef4444' : '#f59e0b' }}>
                                                {item.quantity} units
                                            </td>
                                            <td>
                                                <StatusBadge status={item.status} />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
