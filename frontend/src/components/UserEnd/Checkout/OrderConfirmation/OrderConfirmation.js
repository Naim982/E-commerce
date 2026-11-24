import React, { useEffect, useState } from 'react';
import './OrderConfirmation.css';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const OrderConfirmation = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [orderData, setOrderData] = useState(null);

    useEffect(() => {
        const order = location.state?.order;

        if (!order || !order.items || !order.items.length) {
            navigate('/product-delivery', { replace: true });
            return;
        }

        setOrderData(order);
    }, [location.state, navigate]);

    const formatPrice = (price) => {
        return `৳${Number(price || 0).toFixed(2)}`;
    };

    const getEstimatedDelivery = () => {
        const baseDate = new Date(orderData?.orderDate || Date.now());
        const startDate = new Date(baseDate);
        const endDate = new Date(baseDate);

        const deliveryName = orderData?.delivery?.name?.toLowerCase() || '';

        if (deliveryName.includes('same-day')) {
            startDate.setDate(startDate.getDate());
            endDate.setDate(endDate.getDate());
        } else if (deliveryName.includes('express')) {
            startDate.setDate(startDate.getDate() + 1);
            endDate.setDate(endDate.getDate() + 2);
        } else {
            startDate.setDate(startDate.getDate() + 3);
            endDate.setDate(endDate.getDate() + 5);
        }

        const formatDate = (date) => {
            return date.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
        };

        return `${formatDate(startDate)} – ${formatDate(endDate)}`;
    };

    if (!orderData) {
        return (
            <main className="confirmation-main-content">
                <div className="container">
                    <p>Loading order confirmation...</p>
                </div>
            </main>
        );
    }

    const orderId = orderData.orderId;
    const items = orderData.items || [];
    const address = orderData.address || {};
    const delivery = orderData.delivery || {};
    const cost = orderData.cost || {};
    const payment = orderData.payment || {};

    const subtotal = Number(cost.subtotal) || 0;
    const discount = Number(cost.discount) || 0;
    const shippingCost = Number(delivery.price) || 0;
    const tax = Number(cost.tax) || 0;
    const grandTotal = Number(cost.grandTotal) || 0;

    const paymentStatus = payment.status || 'pending';
    const paymentMethod = payment.method || 'cod';
    const cardLast4 = payment.card?.last4 || '';
    const transactionRef = payment.transaction || 'N/A';

    const paymentLabel = {
        card: 'Credit / Debit Card',
        cod: 'Cash on Delivery',
        wallet: 'Digital Mobile Wallet'
    };

    const estimatedDelivery = getEstimatedDelivery();

    const handleCopyOrderNumber = async () => {
        try {
            await navigator.clipboard.writeText(orderId);
        } catch (error) {
            console.error('Failed to copy order number:', error);
        }
    };

    return (
        <main className="confirmation-main-content">
            <div className="container">
                <div className="checkout-progress-bar">
                    <div className="checkout-progress-step completed" id="prog-step-1">
                        <div className="checkout-step-circle">✓</div>
                        <span>Delivery</span>
                    </div>
                    <div className="checkout-progress-line completed" />

                    <div className="checkout-progress-step completed" id="prog-step-2">
                        <div className="checkout-step-circle">✓</div>
                        <span>Review Order</span>
                    </div>
                    <div className="checkout-progress-line completed" />

                    <div className="checkout-progress-step completed" id="prog-step-3">
                        <div className="checkout-step-circle">✓</div>
                        <span>Payment</span>
                    </div>
                    <div className="checkout-progress-line completed" />

                    <div className="checkout-progress-step completed active" id="prog-step-4">
                        <div className="checkout-step-circle">✓</div>
                        <span>Confirmation</span>
                    </div>
                </div>

                <div className="confirmation-card">
                    <div className="confirmation-hero-banner">
                        <div className="confirmation-check-circle">✓</div>
                        <h1 className="confirmation-title">Thank You For Your Purchase!</h1>
                        <p className="confirmation-subtitle">
                            We've received your order and recorded the details successfully.
                        </p>

                        <div className="confirmation-order-tag-strip">
                            <div className="confirmation-tag-item">
                                <small>ORDER NUMBER</small>
                                <div className="conf-order-id-row">
                                    <strong id="conf-order-id">{orderId}</strong>
                                    <button
                                        type="button"
                                        className="conf-copy-btn"
                                        onClick={handleCopyOrderNumber}
                                        title="Copy Order ID"
                                    >
                                        📋 Copy
                                    </button>
                                </div>
                            </div>

                            <div className="confirmation-tag-item">
                                <small>ORDER DATE</small>
                                <strong>
                                    {new Date(orderData.orderDate || Date.now()).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </strong>
                            </div>

                            <div className="confirmation-tag-item">
                                <small>PAYMENT STATUS</small>
                                <strong className={`conf-status-tag ${paymentStatus === 'paid' ? 'paid' : 'pending'}`}>
                                    {paymentStatus === 'paid'
                                        ? `PAID IN FULL (${formatPrice(grandTotal)})`
                                        : `PAYMENT PENDING (${formatPrice(grandTotal)})`}
                                </strong>
                            </div>
                        </div>
                    </div>

                    <div className="confirmation-timeline-card">
                        <h3 className="confirmation-section-heading">Fulfillment Progress</h3>
                        <div className="confirmation-timeline">
                            <div className="conf-step active">
                                <div className="conf-step-circle">✓</div>
                                <span>Order Placed</span>
                                <small>Confirmed</small>
                            </div>
                            <div className="conf-timeline-bar active" />

                            <div className="conf-step active">
                                <div className="conf-step-circle">2</div>
                                <span>Processing</span>
                                <small>Inventory Allocated</small>
                            </div>
                            <div className="conf-timeline-bar" />

                            <div className="conf-step">
                                <div className="conf-step-circle">3</div>
                                <span>Shipped</span>
                                <small>Pending Carrier</small>
                            </div>
                            <div className="conf-timeline-bar" />

                            <div className="conf-step">
                                <div className="conf-step-circle">4</div>
                                <span>Delivered</span>
                                <small>{estimatedDelivery}</small>
                            </div>
                        </div>
                    </div>

                    <div className="confirmation-details-grid">
                        <div className="conf-detail-card">
                            <h3 className="confirmation-subheading">Shipping Destination</h3>
                            <strong className="conf-info-name">{address.name}</strong>
                            <p className="conf-info-text">
                                {(address.apartment || address.suite) && (
                                    <span>{address.apartment || address.suite}<br /></span>
                                )}
                                <strong>{address.street}</strong><br />
                                {[address.villageArea || address.city, address.thana ? `Thana: ${address.thana}` : (address.state && address.state !== 'Bangladesh' ? address.state : '')].filter(Boolean).join(', ')}<br />
                                {[address.district || (address.country !== 'Bangladesh' ? address.country : 'Dhaka'), address.postalCode || address.postal || address.zipCode].filter(Boolean).join(' - ')}, Bangladesh
                            </p>
                            <p className="conf-info-phone">Phone: {address.phone}</p>

                            <hr className="divider" style={{ marginBlock: 'var(--space-3)' }} />

                            <h3 className="confirmation-subheading">Shipping Method</h3>
                            <strong className="conf-info-delivery">{delivery.name}</strong>
                            <p className="conf-info-sub">
                                Estimated Delivery: <strong>{estimatedDelivery}</strong>
                            </p>
                        </div>

                        <div className="conf-detail-card">
                            <h3 className="confirmation-subheading">Payment Authorization</h3>
                            <div className="conf-pay-info-row">
                                <span>Method:</span>
                                <strong>{paymentLabel[paymentMethod] || paymentMethod}</strong>
                            </div>

                            {paymentMethod === 'card' && cardLast4 && (
                                <div className="conf-pay-info-row">
                                    <span>Card Number:</span>
                                    <strong>•••• •••• •••• {cardLast4}</strong>
                                </div>
                            )}

                            <div className="conf-pay-info-row">
                                <span>Status:</span>
                                <strong className={`conf-status-pill ${paymentStatus === 'paid' ? 'paid' : 'pending'}`}>
                                    {paymentStatus.toUpperCase()}
                                </strong>
                            </div>

                            <hr className="divider" style={{ marginBlock: 'var(--space-3)' }} />

                            <h3 className="confirmation-subheading">Transaction Reference</h3>
                            <p className="conf-info-text">
                                Safe Token: <code>{transactionRef}</code>
                            </p>
                            <small className="conf-info-sub">
                                A digital invoice and receipt have been dispatched to your email.
                            </small>
                        </div>

                        <div className="conf-detail-card">
                            <h3 className="confirmation-subheading">Order Price Summary</h3>
                            <div className="conf-price-row">
                                <span>Items Subtotal:</span>
                                <strong>{formatPrice(subtotal)}</strong>
                            </div>

                            {discount > 0 && (
                                <div className="conf-price-row discount">
                                    <span>Discount:</span>
                                    <strong>-{formatPrice(discount)}</strong>
                                </div>
                            )}

                            <div className="conf-price-row">
                                <span>Shipping:</span>
                                <strong>{shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}</strong>
                            </div>

                            <div className="conf-price-row">
                                <span>Estimated Tax:</span>
                                <strong>{formatPrice(tax)}</strong>
                            </div>

                            <hr className="divider" style={{ marginBlock: 'var(--space-3)' }} />

                            <div className="conf-price-row total">
                                <span>Grand Total:</span>
                                <strong className="conf-total-val">{formatPrice(grandTotal)}</strong>
                            </div>
                        </div>
                    </div>

                    <div className="confirmation-items-card">
                        <h3 className="confirmation-section-heading">
                            Ordered Components ({items.length} {items.length === 1 ? 'Item' : 'Items'})
                        </h3>

                        <div className="confirmation-items-list">
                            {items.map((item, index) => {
                                const quantity = Number(item.quantity || 1);
                                const variantsText = (item.variants || []).map(v => v.name).join(' • ');

                                return (
                                    <div key={item.productId || index} className="conf-item-row">
                                        <div className="conf-item-img-wrap">
                                            <div className="conf-item-placeholder-img">🖥️</div>
                                        </div>

                                        <div className="conf-item-info">
                                            <strong className="conf-item-name">
                                                {item.productId ? `Hardware Component (${item.productId})` : 'Component Item'}
                                            </strong>

                                            {variantsText && (
                                                <span className="conf-item-variants">{variantsText}</span>
                                            )}

                                            <div className="conf-item-warranty">
                                                🛡️ 3-Year Official Manufacturer Warranty
                                            </div>
                                        </div>

                                        <div className="conf-item-qty">
                                            Qty: <strong>{quantity}</strong>
                                        </div>

                                        <strong className="conf-item-price">
                                            {formatPrice(item.totalPrice)}
                                        </strong>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="confirmation-actions-row">
                        <Link to="/account/my-orders" className="btn btn-lg btn-primary">
                            <span>📦 View All My Orders &rarr;</span>
                        </Link>

                        <Link to="/account/my-orders" className="btn btn-lg btn-outline">
                            <span>View Order History</span>
                        </Link>

                        <Link to="/shop" className="btn btn-lg btn-secondary">
                            <span>Continue Shopping</span>
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default OrderConfirmation;
