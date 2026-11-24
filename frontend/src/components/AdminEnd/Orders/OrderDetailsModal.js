import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Modal from '../shared/Modal';
import { updateAdminOrderStatus } from '../../../api/apiManager';
import { useAdminToast } from '../Layout/AdminLayout';

const OrderDetailsModal = ({ isOpen, onClose, order, onOrderUpdated }) => {
    const { showToast } = useAdminToast();
    const [status, setStatus] = useState('processing');
    const [paymentStatus, setPaymentStatus] = useState('pending');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [adminNotes, setAdminNotes] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (order) {
            setStatus(order.orderStatus || 'processing');
            setPaymentStatus(order.payment?.status || 'pending');
            setTrackingNumber(order.delivery?.trackingNumber || '');
            setAdminNotes(order.adminNotes || '');
        }
    }, [order]);

    if (!order) return null;

    const items = order.items || [];
    const address = order.address || {};
    const cost = order.cost || {};
    const payment = order.payment || {};
    const delivery = order.delivery || {};

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await updateAdminOrderStatus(order.orderId, {
                orderStatus: status,
                paymentStatus,
                trackingNumber,
                adminNotes
            });

            if (res.success) {
                showToast({
                    title: 'Order Updated',
                    message: `Order #${order.orderId} status set to ${status}.`,
                    type: 'success'
                });
                onOrderUpdated();
                onClose();
            } else {
                showToast({ title: 'Update Failed', message: res.error || 'Could not update order.', type: 'error' });
            }
        } catch (err) {
            showToast({ title: 'Connection Error', message: 'Failed to update order on backend', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Order Fulfillment: #${order.orderId}`}
            size="large"
            footer={
                <>
                    {order && (
                        <Link
                            to={`/admin/orders/${order.orderId}`}
                            className="admin-btn admin-btn-outline"
                            style={{ textDecoration: 'none' }}
                            onClick={onClose}
                        >
                            📄 Open Dedicated Page
                        </Link>
                    )}
                    <button type="button" className="admin-btn admin-btn-outline" onClick={onClose}>
                        Close
                    </button>
                    <button
                        type="button"
                        className="admin-btn admin-btn-primary"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Update Order Status'}
                    </button>
                </>
            }
        >
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
                {/* Left: Items & Financial Breakdown */}
                <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
                        Purchased Hardware Items ({items.length})
                    </h4>

                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', marginBottom: '20px' }}>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Qty</th>
                                    <th>Price</th>
                                    <th style={{ textAlign: 'right' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => {
                                    const unitPrice = Number(item.price || item.pricing?.current || item.unitPrice || 0);
                                    const qty = Number(item.quantity || 1);
                                    return (
                                        <tr key={index}>
                                            <td>
                                                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                                    {item.name || item.title || item.id}
                                                </div>
                                                {item.variant && item.variant.length > 0 && (
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                        Variant: {Array.isArray(item.variant) ? item.variant.join(', ') : String(item.variant)}
                                                    </div>
                                                )}
                                            </td>
                                            <td>{qty}</td>
                                            <td>৳{unitPrice.toFixed(2)}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                                ৳{(unitPrice * qty).toFixed(2)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Financial Summary */}
                    <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.875rem' }}>
                            <span style={{ color: '#64748b' }}>Subtotal:</span>
                            <span>৳{Number(cost.subtotal || 0).toFixed(2)}</span>
                        </div>
                        {cost.discount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.875rem', color: '#16a34a' }}>
                                <span>Discount:</span>
                                <span>-৳{Number(cost.discount || 0).toFixed(2)}</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.875rem' }}>
                            <span style={{ color: '#64748b' }}>Sales Tax (8%):</span>
                            <span>৳{Number(cost.tax || 0).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.875rem' }}>
                            <span style={{ color: '#64748b' }}>Delivery Fee:</span>
                            <span>৳{Number(delivery.price || 0).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '8px', fontWeight: 700, fontSize: '1.1rem', color: '#0f172a' }}>
                            <span>Grand Total:</span>
                            <span>৳{Number(cost.grandTotal || 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Right: Customer Info, Shipping Address & Status Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Customer Info Card */}
                    <div style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: '8px' }}>
                            Customer Profile
                        </h4>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{order.customerName}</div>
                        <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>{order.customerEmail}</div>
                        {order.customerPhone && (
                            <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>📞 {order.customerPhone}</div>
                        )}
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                            User ID: <code>{order.userId}</code>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: '8px' }}>
                            Shipping Destination
                        </h4>
                        <div style={{ fontSize: '0.875rem', color: '#334155', lineHeight: '1.4' }}>
                            <div>{address.fullName || order.customerName}</div>
                            <div>{address.address || address.street || 'Address on file'}</div>
                            <div>
                                {address.city && `${address.city}, `}
                                {address.state || address.district || ''} {address.zip || address.zipCode || ''}
                            </div>
                            <div style={{ color: '#64748b', fontSize: '0.8125rem', marginTop: '4px' }}>
                                Shipping Method: <strong>{delivery.name || 'Express Dispatch'}</strong>
                            </div>
                        </div>
                    </div>

                    {/* Order Status Modifier Form */}
                    <div style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
                            Fulfillment Status Control
                        </h4>

                        <div className="admin-form-group">
                            <label className="admin-form-label">Order Fulfillment Status</label>
                            <select
                                className="admin-select"
                                style={{ width: '100%' }}
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <option value="pending">Pending Review</option>
                                <option value="processing">Processing in Warehouse</option>
                                <option value="shipped">Shipped & In Transit</option>
                                <option value="delivered">Delivered to Customer</option>
                                <option value="cancelled">Cancelled / Voided</option>
                            </select>
                        </div>

                        <div className="admin-form-group">
                            <label className="admin-form-label">Payment Status</label>
                            <select
                                className="admin-select"
                                style={{ width: '100%' }}
                                value={paymentStatus}
                                onChange={(e) => setPaymentStatus(e.target.value)}
                            >
                                <option value="pending">Pending Payment</option>
                                <option value="paid">Payment Captured (Paid)</option>
                                <option value="refunded">Refunded</option>
                            </select>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                                Method: <strong>{payment.method?.toUpperCase() || 'COD'}</strong> (Txn: {payment.transaction || 'N/A'})
                            </div>
                        </div>

                        <div className="admin-form-group">
                            <label className="admin-form-label">Carrier Tracking Number</label>
                            <input
                                type="text"
                                className="admin-input"
                                placeholder="e.g. 1Z9999999999999999"
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                            />
                        </div>

                        <div className="admin-form-group" style={{ marginBottom: 0 }}>
                            <label className="admin-form-label">Internal Operations Notes</label>
                            <textarea
                                className="admin-textarea"
                                style={{ minHeight: '60px' }}
                                placeholder="Special warehouse handling, packaging notes..."
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default OrderDetailsModal;
