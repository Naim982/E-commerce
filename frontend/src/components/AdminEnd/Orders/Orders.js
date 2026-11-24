import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AdminPageHeader from '../shared/AdminPageHeader';
import StatusBadge from '../shared/StatusBadge';
import Pagination from '../shared/Pagination';
import LoadingSpinner from '../shared/LoadingSpinner';
import EmptyState from '../shared/EmptyState';
import OrderDetailsModal from './OrderDetailsModal';
import { useAdminToast } from '../Layout/AdminLayout';
import { exportToCSV } from '../shared/exportUtils';
import {
    OrdersIcon,
    SearchIcon,
    EyeIcon
} from '../shared/AdminIcons';
import { getAdminOrders } from '../../../api/apiManager';

const Orders = () => {
    const { showToast } = useAdminToast();
    const [orders, setOrders] = useState([]);
    const [totalOrders, setTotalOrders] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Selected order for drill-down modal
    const [selectedOrder, setSelectedOrder] = useState(null);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAdminOrders({
                page: currentPage,
                limit: 15,
                search: searchTerm,
                status: statusFilter
            });

            if (res.success) {
                setOrders(res.orders || []);
                setTotalOrders(res.total || 0);
                setTotalPages(res.totalPages || 1);
            } else {
                showToast({ title: 'Error', message: res.error || 'Failed to fetch customer orders', type: 'error' });
            }
        } catch (e) {
            showToast({ title: 'Connection Error', message: 'Unable to reach backend server', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchTerm, statusFilter, showToast]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    const handleExportOrders = () => {
        if (!orders.length) {
            showToast({ title: 'Export', message: 'No orders available to export.', type: 'info' });
            return;
        }
        const exportData = orders.map((o) => ({
            OrderID: o.orderId,
            Customer: o.customerName,
            Email: o.customerEmail,
            Date: o.orderDate,
            ItemsCount: (o.items || []).length,
            Total: Number(o.cost?.grandTotal || 0).toFixed(2),
            PaymentMethod: o.payment?.method || 'COD',
            PaymentStatus: o.payment?.status || 'pending',
            OrderStatus: o.orderStatus || 'processing'
        }));
        exportToCSV(exportData, `lumen-orders-${new Date().toISOString().split('T')[0]}.csv`);
    };

    return (
        <div className="admin-orders-view">
            <AdminPageHeader
                title="Customer Order Management"
                subtitle={`Aggregating ${totalOrders} customer orders across the platform.`}
                actions={
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" className="admin-btn admin-btn-outline" onClick={handleExportOrders}>
                            📥 Export CSV
                        </button>
                        <button type="button" className="admin-btn admin-btn-outline" onClick={fetchOrders}>
                            Refresh Orders
                        </button>
                    </div>
                }
            />

            <div className="admin-card">
                <div className="products-toolbar">
                    <div className="products-filters-group">
                        <div className="admin-search-wrapper">
                            <span className="admin-search-icon"><SearchIcon size={16} /></span>
                            <input
                                type="text"
                                className="admin-search-input"
                                placeholder="Search by Order ID, customer, or email..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {[
                                { key: 'all', label: 'All Orders' },
                                { key: 'processing', label: 'Processing' },
                                { key: 'pending', label: 'Pending' },
                                { key: 'shipped', label: 'Shipped' },
                                { key: 'delivered', label: 'Delivered' },
                                { key: 'cancelled', label: 'Cancelled' }
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    className={`admin-btn admin-btn-sm ${statusFilter === tab.key ? 'admin-btn-primary' : 'admin-btn-outline'}`}
                                    onClick={() => {
                                        setStatusFilter(tab.key);
                                        setCurrentPage(1);
                                    }}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <LoadingSpinner message="Aggregating store orders..." />
                ) : orders.length === 0 ? (
                    <EmptyState
                        icon={OrdersIcon}
                        title="No Customer Orders Found"
                        description="There are currently no customer orders matching the specified filter criteria."
                    />
                ) : (
                    <>
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Customer</th>
                                        <th>Date</th>
                                        <th>Hardware Items</th>
                                        <th>Total Paid</th>
                                        <th>Payment</th>
                                        <th>Order Status</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order) => {
                                        const itemsCount = (order.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
                                        return (
                                            <tr key={order.orderId}>
                                                <td>
                                                    <code style={{ fontWeight: 700, color: '#4f46e5' }}>
                                                        {order.orderId}
                                                    </code>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 600, color: '#0f172a' }}>
                                                        {order.customerName}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                        {order.customerEmail}
                                                    </div>
                                                </td>
                                                <td style={{ fontSize: '0.8125rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                                                    {order.orderDate ? new Date(order.orderDate).toLocaleString() : 'Recent'}
                                                </td>
                                                <td>
                                                    <span style={{ fontWeight: 600, color: '#334155' }}>
                                                        {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                                                        ${Number(order.cost?.grandTotal || 0).toFixed(2)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                                                            {order.payment?.method || 'COD'}
                                                        </span>
                                                        <StatusBadge status={order.payment?.status || 'pending'} />
                                                    </div>
                                                </td>
                                                <td>
                                                    <StatusBadge status={order.orderStatus || 'processing'} />
                                                </td>
                                                <td>
                                                    <div className="table-actions-group" style={{ justifyContent: 'flex-end', gap: '6px' }}>
                                                        <Link
                                                            to={`/admin/orders/${order.orderId}`}
                                                            className="admin-btn admin-btn-outline admin-btn-sm"
                                                            style={{ padding: '6px 10px', textDecoration: 'none' }}
                                                            title="Open Dedicated Order Page"
                                                        >
                                                            Full Page
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            className="admin-btn admin-btn-outline admin-btn-sm"
                                                            style={{ padding: '6px 10px' }}
                                                            onClick={() => setSelectedOrder(order)}
                                                            title="Quick Edit Order"
                                                        >
                                                            <EyeIcon size={14} />
                                                            <span>Manage</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={totalOrders}
                            limit={15}
                            onPageChange={(p) => setCurrentPage(p)}
                        />
                    </>
                )}
            </div>

            {/* Order Details & Fulfillment Modal */}
            <OrderDetailsModal
                isOpen={Boolean(selectedOrder)}
                onClose={() => setSelectedOrder(null)}
                order={selectedOrder}
                onOrderUpdated={fetchOrders}
            />
        </div>
    );
};

export default Orders;
