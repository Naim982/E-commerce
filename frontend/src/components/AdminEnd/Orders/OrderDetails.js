import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAdminOrderById, updateAdminOrderStatus } from '../../../api/apiManager';
import AdminPageHeader from '../shared/AdminPageHeader';
import LoadingSpinner from '../shared/LoadingSpinner';
import EmptyState from '../shared/EmptyState';
import { useAdminToast } from '../Layout/AdminLayout';
import {
    OrdersIcon,
    TruckIcon,
    CheckIcon
} from '../shared/AdminIcons';
import './OrderDetails.css';

const OrderDetails = () => {
    const { orderId } = useParams();
    const { showToast } = useAdminToast();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form fields
    const [orderStatus, setOrderStatus] = useState('processing');
    const [paymentStatus, setPaymentStatus] = useState('pending');
    const [carrier, setCarrier] = useState('Carbon Neutral Express');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [notes, setNotes] = useState('');

    const fetchOrder = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAdminOrderById(orderId);
            if (res.success && res.order) {
                const o = res.order;
                setOrder(o);
                setOrderStatus(o.orderStatus || 'processing');
                setPaymentStatus(o.payment?.status || 'pending');
                setCarrier(o.fulfillment?.carrier || 'Carbon Neutral Express');
                setTrackingNumber(o.fulfillment?.trackingNumber || o.trackingNumber || '');
                setNotes(o.notes || '');
            } else {
                showToast({ title: 'Order Not Found', message: res.error || 'Failed to locate order.', type: 'error' });
            }
        } catch (err) {
            console.error(err);
            showToast({ title: 'Error', message: 'Unable to load order details.', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [orderId, showToast]);

    useEffect(() => {
        fetchOrder();
    }, [fetchOrder]);

    const handleSaveOrder = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                orderStatus,
                paymentStatus,
                carrier,
                trackingNumber: trackingNumber.trim(),
                notes: notes.trim()
            };

            const res = await updateAdminOrderStatus(orderId, payload);
            if (res.success) {
                showToast({ title: 'Order Updated', message: `Order #${orderId} saved successfully.`, type: 'success' });
                fetchOrder();
            } else {
                showToast({ title: 'Update Failed', message: res.error || 'Failed to update order.', type: 'error' });
            }
        } catch (err) {
            console.error(err);
            showToast({ title: 'Error', message: 'Failed to update order.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-page">
                <LoadingSpinner text={`Loading order ${orderId}...`} />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="admin-page">
                <EmptyState
                    icon={OrdersIcon}
                    title="Order Not Found"
                    description={`No sales order matches ID "${orderId}".`}
                    action={
                        <Link to="/admin/orders" className="admin-btn admin-btn-primary">
                            ← Return to Orders List
                        </Link>
                    }
                />
            </div>
        );
    }

    const items = order.items || [];
    const cost = order.cost || {};
    const address = order.address || {};
    const payment = order.payment || {};

    return (
        <div className="admin-page">
            {/* Printable Slip Header (Appears only on print) */}
            <div className="print-only-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>LUMEN Hardware</h1>
                        <p style={{ margin: '4px 0', color: '#555', fontSize: '0.85rem' }}>Precision PC Hardware & High-Performance Rigs</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>PACKING SLIP & INVOICE</h2>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700 }}>{order.orderId}</div>
                        <div style={{ fontSize: '0.85rem', color: '#555' }}>
                            {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Page Header (Hidden on print) */}
            <div className="no-print">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <Link to="/admin/orders" className="admin-btn admin-btn-ghost admin-btn-sm" style={{ paddingLeft: 0 }}>
                        ← Back to Orders List
                    </Link>
                </div>

                <AdminPageHeader
                    title={`Order #${order.orderId}`}
                    description={`Placed on ${order.orderDate ? new Date(order.orderDate).toLocaleString() : 'Recent'} by ${order.customerName || 'Customer'}`}
                >
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            type="button"
                            className="admin-btn admin-btn-outline"
                            onClick={() => window.print()}
                        >
                            🖨️ Print Packing Slip
                        </button>
                        <button
                            type="button"
                            className="admin-btn admin-btn-primary"
                            onClick={handleSaveOrder}
                            disabled={saving}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <CheckIcon /> {saving ? 'Saving Changes...' : 'Save Order Changes'}
                        </button>
                    </div>
                </AdminPageHeader>
            </div>

            {/* Main Layout Grid */}
            <div className="order-details-grid">
                {/* Left Column: Items & Fulfillment */}
                <div>
                    {/* Line Items Card */}
                    <div className="admin-card" style={{ marginBottom: '24px' }}>
                        <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 className="admin-card-title">Purchased Items ({items.length})</h3>
                            <span style={{ fontSize: '0.8125rem', color: 'var(--admin-text-muted)' }}>
                                Subtotal: ${Number(cost.subTotal || 0).toFixed(2)}
                            </span>
                        </div>

                        <div className="admin-table-container">
                            <table className="admin-table order-items-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Unit Price</th>
                                        <th>Quantity</th>
                                        <th style={{ textAlign: 'right' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, idx) => (
                                        <tr key={item.id || item.productId || idx}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <img
                                                        src={item.image || '/images/banners/banner_1.jpeg'}
                                                        alt={item.name}
                                                        className="order-item-img"
                                                        onError={(e) => { e.target.src = 'https://placehold.co/100?text=Hardware'; }}
                                                    />
                                                    <div>
                                                        <div style={{ fontWeight: 600, color: 'var(--admin-text-main)', fontSize: '0.875rem' }}>
                                                            {item.name}
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', fontFamily: 'monospace' }}>
                                                            ID: {item.productId || item.id || 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 500 }}>
                                                ${Number(item.price || item.unitPrice || 0).toFixed(2)}
                                            </td>
                                            <td>
                                                <span style={{
                                                    padding: '3px 8px',
                                                    backgroundColor: 'var(--admin-bg-hover, #f1f5f9)',
                                                    borderRadius: '4px',
                                                    fontWeight: 600
                                                }}>
                                                    &times; {item.quantity || 1}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--admin-text-main)' }}>
                                                ${(Number(item.price || item.unitPrice || 0) * Number(item.quantity || 1)).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Fulfillment & Carrier Tracking Card */}
                    <div className="admin-card no-print" style={{ marginBottom: '24px' }}>
                        <div className="admin-card-header">
                            <h3 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <TruckIcon /> Fulfillment & Carrier Tracking
                            </h3>
                        </div>

                        <div style={{ padding: '24px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div className="admin-form-group">
                                    <label className="admin-label">Shipping Carrier</label>
                                    <select
                                        value={carrier}
                                        onChange={(e) => setCarrier(e.target.value)}
                                        className="admin-select"
                                    >
                                        <option value="Carbon Neutral Express">Carbon Neutral Express (DHL/FedEx)</option>
                                        <option value="USPS Priority Mail">USPS Priority Mail</option>
                                        <option value="UPS Ground">UPS Ground</option>
                                        <option value="DHL Express">DHL Express</option>
                                    </select>
                                </div>

                                <div className="admin-form-group">
                                    <label className="admin-label">Tracking Number</label>
                                    <input
                                        type="text"
                                        value={trackingNumber}
                                        onChange={(e) => setTrackingNumber(e.target.value)}
                                        placeholder="e.g. TRK-98214710US"
                                        className="admin-input"
                                        style={{ fontFamily: 'monospace' }}
                                    />
                                </div>
                            </div>

                            <div className="admin-form-group">
                                <label className="admin-label">Internal Fulfillment Notes</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Warehouse inspection, anti-static seal verification, priority dispatch notes..."
                                    className="admin-textarea"
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Status & Customer & Payment */}
                <div>
                    {/* Status Management Card */}
                    <div className="admin-card no-print" style={{ marginBottom: '24px' }}>
                        <div className="admin-card-header">
                            <h3 className="admin-card-title">Order Processing Status</h3>
                        </div>

                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="admin-form-group">
                                <label className="admin-label">Fulfillment Status</label>
                                <select
                                    value={orderStatus}
                                    onChange={(e) => setOrderStatus(e.target.value)}
                                    className="admin-select"
                                    style={{ fontWeight: 600 }}
                                >
                                    <option value="pending">Pending Review</option>
                                    <option value="processing">Processing & Packaged</option>
                                    <option value="shipped">Shipped & In Transit</option>
                                    <option value="delivered">Delivered to Customer</option>
                                    <option value="cancelled">Cancelled / Refunded</option>
                                </select>
                            </div>

                            <div className="admin-form-group">
                                <label className="admin-label">Payment Status</label>
                                <select
                                    value={paymentStatus}
                                    onChange={(e) => setPaymentStatus(e.target.value)}
                                    className="admin-select"
                                    style={{ fontWeight: 600 }}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="completed">Completed / Paid</option>
                                    <option value="failed">Failed</option>
                                    <option value="refunded">Refunded</option>
                                </select>
                            </div>

                            <button
                                type="button"
                                className="admin-btn admin-btn-primary"
                                onClick={handleSaveOrder}
                                disabled={saving}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                <CheckIcon /> {saving ? 'Saving...' : 'Update Status'}
                            </button>
                        </div>
                    </div>

                    {/* Customer Info Card */}
                    <div className="admin-card" style={{ marginBottom: '24px' }}>
                        <div className="admin-card-header">
                            <h3 className="admin-card-title">Customer Destination</h3>
                        </div>

                        <div style={{ padding: '20px' }}>
                            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--admin-text-main)', marginBottom: '4px' }}>
                                {order.customerName || address.recipientName || 'Valued Customer'}
                            </div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--admin-text-muted)', marginBottom: '16px' }}>
                                {order.customerEmail} {order.customerPhone ? `• ${order.customerPhone}` : ''}
                            </div>

                            <div style={{
                                padding: '14px',
                                backgroundColor: 'var(--admin-bg-hover, #f8fafc)',
                                borderRadius: '8px',
                                border: '1px solid var(--admin-border)',
                                fontSize: '0.875rem',
                                lineHeight: '1.5'
                            }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                                    Shipping Destination
                                </div>
                                <div>{address.street || address.addressLine || 'Address on file'}</div>
                                <div>{address.city ? `${address.city}, ${address.state || ''} ${address.zip || ''}` : ''}</div>
                                <div>{address.country || 'United States'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Summary Card */}
                    <div className="admin-card">
                        <div className="admin-card-header">
                            <h3 className="admin-card-title">Financial Summary</h3>
                        </div>

                        <div style={{ padding: '20px' }}>
                            <div className="order-cost-row">
                                <span>Subtotal:</span>
                                <span>৳{Number(cost.subTotal || 0).toFixed(2)}</span>
                            </div>
                            <div className="order-cost-row">
                                <span>Promotional Discount:</span>
                                <span style={{ color: 'var(--admin-success)' }}>-৳{Number(cost.discount || 0).toFixed(2)}</span>
                            </div>
                            <div className="order-cost-row">
                                <span>Shipping & Handling:</span>
                                <span>৳{Number(cost.shipping || 0).toFixed(2)}</span>
                            </div>
                            <div className="order-cost-row">
                                <span>Estimated Sales Tax:</span>
                                <span>৳{Number(cost.tax || 0).toFixed(2)}</span>
                            </div>

                            <div className="order-cost-total">
                                <span>Total Paid:</span>
                                <span style={{ color: 'var(--admin-primary)' }}>
                                    ৳{Number(cost.grandTotal || 0).toFixed(2)}
                                </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--admin-border)' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                                    Payment Method
                                </span>
                                <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                                    {payment.method || 'Cash on Delivery'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;
