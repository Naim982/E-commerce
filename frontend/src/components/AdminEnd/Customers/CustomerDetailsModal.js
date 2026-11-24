import React from 'react';
import Modal from '../shared/Modal';
import StatusBadge from '../shared/StatusBadge';

const CustomerDetailsModal = ({ isOpen, onClose, customer }) => {
    if (!customer) return null;

    const p = customer.profile || {};
    const addresses = customer.addresses || [];
    const orders = customer.orders || [];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Customer Profile: ${p.firstName || ''} ${p.lastName || ''}`}
            size="large"
            footer={
                <button type="button" className="admin-btn admin-btn-outline" onClick={onClose}>
                    Close
                </button>
            }
        >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'start' }}>
                {/* Left: Profile Summary Card */}
                <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div
                            style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                backgroundColor: '#4f46e5',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.1rem',
                                fontWeight: 700
                            }}
                        >
                            {(p.firstName?.charAt(0) || customer.name?.charAt(0) || 'U').toUpperCase()}
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>
                                {p.firstName} {p.lastName}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{p.email}</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                        <div>
                            <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>ACCOUNT ROLE</span>
                            <span className="role-chip" style={{ display: 'inline-block', marginTop: '2px' }}>
                                {customer.role || 'customer'}
                            </span>
                        </div>
                        <div>
                            <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>TELEPHONE</span>
                            <span style={{ fontWeight: 500 }}>{p.phone || 'None provided'}</span>
                        </div>
                        <div>
                            <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>MEMBER SINCE</span>
                            <span>{p.joinedDate || '2026'}</span>
                        </div>
                        <div>
                            <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>LIFETIME VALUE</span>
                            <span style={{ fontWeight: 700, fontSize: '1.2rem', color: '#16a34a' }}>
                                ${Number(customer.totalSpent || 0).toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Saved Addresses */}
                    <div style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
                        <h5 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: '8px' }}>
                            Saved Addresses ({addresses.length})
                        </h5>
                        {addresses.length === 0 ? (
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No saved addresses</div>
                        ) : (
                            addresses.map((addr, i) => (
                                <div key={i} style={{ fontSize: '0.8rem', padding: '8px', backgroundColor: '#ffffff', borderRadius: '6px', marginBottom: '6px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ fontWeight: 600 }}>{addr.fullName || 'Primary'}</div>
                                    <div style={{ color: '#64748b' }}>{addr.street || addr.address}</div>
                                    <div style={{ color: '#64748b' }}>{addr.city}, {addr.state} {addr.zip}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right: Order History */}
                <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
                        Order History ({orders.length})
                    </h4>

                    {orders.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                            This customer has not placed any orders yet.
                        </div>
                    ) : (
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Date</th>
                                        <th>Items</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((o) => (
                                        <tr key={o.orderId}>
                                            <td>
                                                <code style={{ fontWeight: 700, color: '#4f46e5' }}>{o.orderId}</code>
                                            </td>
                                            <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                {o.orderDate ? new Date(o.orderDate).toLocaleDateString() : 'Recent'}
                                            </td>
                                            <td>{(o.items || []).length} items</td>
                                            <td style={{ fontWeight: 700 }}>
                                                ${Number(o.cost?.grandTotal || 0).toFixed(2)}
                                            </td>
                                            <td>
                                                <StatusBadge status={o.orderStatus || 'processing'} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default CustomerDetailsModal;
