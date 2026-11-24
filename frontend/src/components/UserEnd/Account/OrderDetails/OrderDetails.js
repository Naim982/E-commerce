import React, { useEffect, useState } from 'react';
import './OrderDetails.css';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getProductDataById, addProductToCartlist, cancelUserOrder } from '../../../../api/apiManager';

const OrderDetails = ({ user }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [products, setProducts] = useState({});
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [copied, setCopied] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Order cancellation state
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('Found a better price or changed my mind');
    const [isCancelling, setIsCancelling] = useState(false);
    const [cancelFeedback, setCancelFeedback] = useState({ type: '', message: '' });

    useEffect(() => {
        const orderData = location.state?.order;

        if (orderData && orderData.items && orderData.items.length) {
            setOrder(orderData);
            try {
                sessionStorage.setItem('lumen_viewed_order', JSON.stringify(orderData));
            } catch (e) {
                // Ignore storage error
            }
            return;
        }

        const searchParams = new URLSearchParams(location.search);
        const orderId = searchParams.get('orderId');

        if (orderId && user?.ordersSummary?.length) {
            const matched = user.ordersSummary.find((o) => o.orderId === orderId);
            if (matched) {
                setOrder(matched);
                return;
            }
        }

        try {
            const cached = sessionStorage.getItem('lumen_viewed_order');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed && (!orderId || parsed.orderId === orderId)) {
                    setOrder(parsed);
                    return;
                }
            }
        } catch (e) {
            // Ignore parse error
        }

        if (!user) return;

        navigate('/account/my-orders', { replace: true });
    }, [location.state, location.search, user, navigate]);

    useEffect(() => {
        const loadProducts = async () => {
            if (!order?.items?.length) return;

            setLoadingProducts(true);

            try {
                const productIds = [
                    ...new Set(order.items.map((item) => item.productId))
                ];

                const results = await Promise.all(
                    productIds.map(async (productId) => {
                        const result = await getProductDataById(productId);
                        return {
                            productId,
                            product: result.success ? result.product : null
                        };
                    })
                );

                const productMap = {};
                results.forEach(({ productId, product }) => {
                    productMap[productId] = product;
                });

                setProducts(productMap);
            } catch (error) {
                console.error('Failed to load order products:', error);
            } finally {
                setLoadingProducts(false);
            }
        };

        loadProducts();
    }, [order]);

    const formatPrice = (price) => {
        return `৳${Number(price || 0).toFixed(2)}`;
    };

    const formatDate = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatDateTime = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    };

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
        if (!status) return 'Unknown';
        const normalizedStatus = status.toLowerCase();

        if (normalizedStatus === 'processing') return 'Processing';
        if (normalizedStatus === 'shipped') return 'Shipped';
        return normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);
    };

    const paymentLabels = {
        card: 'Credit / Debit Card',
        cod: 'Cash on Delivery',
        wallet: 'Digital Mobile Wallet'
    };

    const getEstimatedDelivery = () => {
        const baseDate = new Date(order?.orderDate || order?.placedAt || Date.now());
        const startDate = new Date(baseDate);
        const endDate = new Date(baseDate);
        const deliveryName = order?.delivery?.name?.toLowerCase() || '';

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

        const formatDeliveryDate = (date) => {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        };

        return `${formatDeliveryDate(startDate)} – ${formatDeliveryDate(endDate)}`;
    };

    const handleCopyOrderNumber = async () => {
        const orderId = order.orderId || order.orderNumber || order.id;

        try {
            await navigator.clipboard.writeText(orderId);
            setCopied(true);
            setTimeout(() => {
                setCopied(false);
            }, 2000);
        } catch (error) {
            console.error('Failed to copy order number:', error);
        }
    };

    const handleBuyAgain = async () => {
        const currentUserId = user?.id || user?.uid;
        if (!currentUserId) {
            navigate('/authentication/signin', { state: { from: location } });
            return;
        }
        const orderItems = order?.items || [];

        if (!orderItems.length) return;

        setActionLoading(true);

        try {
            for (const item of orderItems) {
                await addProductToCartlist(
                    currentUserId,
                    item.productId,
                    Number(item.quantity) || 1,
                    item.variants || item.variant || []
                );
            }
            navigate('/cart');
        } catch (err) {
            console.error('Failed to repurchase items:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleTrackPackage = () => {
        const timelineElem = document.getElementById('order-fulfillment-section');
        if (timelineElem) {
            timelineElem.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    };

    const handleCancelOrderSubmit = async (e) => {
        if (e) e.preventDefault();
        setIsCancelling(true);
        setCancelFeedback({ type: '', message: '' });

        const currentUserId = user?.id || user?.uid;
        const currentOrderId = order?.orderId || order?.orderNumber || order?.id;

        if (!currentUserId) {
            setCancelFeedback({ type: 'error', message: 'Authentication required. Please sign in to manage orders.' });
            setIsCancelling(false);
            return;
        }

        try {
            const res = await cancelUserOrder(currentUserId, currentOrderId, cancelReason);
            if (res.success) {
                setOrder((prev) => ({ ...prev, orderStatus: 'cancelled' }));
                setShowCancelModal(false);
                setCancelFeedback({ type: 'success', message: `Order #${currentOrderId} has been cancelled.` });
            } else {
                setCancelFeedback({
                    type: 'error',
                    message: res.error || `Cancellation service is pending backend deployment. Please contact support with Order #${currentOrderId} to finalize cancellation.`
                });
            }
        } catch (err) {
            setCancelFeedback({
                type: 'error',
                message: 'Unable to process cancellation request. Please contact LUMEN customer support.'
            });
        } finally {
            setIsCancelling(false);
        }
    };

    if (!order) {
        return (
            <main className="order-details-main-content">
                <div className="container">
                    <p>Loading order details...</p>
                </div>
            </main>
        );
    }

    const items = order.items || [];
    const address = order.address || {};
    const delivery = order.delivery || {};
    const cost = order.cost || {};
    const payment = order.payment || {};

    const subtotal = Number(cost.subtotal) || 0;
    const discount = Number(cost.discount) || 0;
    const shippingCost = Number(delivery.price) || 0;
    const tax = Number(cost.tax) || 0;
    const grandTotal = Number(cost.grandTotal ?? order.totalAmount ?? 0);

    const paymentStatus = payment.status || 'pending';
    const paymentMethod = payment.method || 'cod';
    const cardLast4 = payment.card?.last4 || '';
    const transactionRef = payment.transaction || 'N/A';

    const itemCount = items.reduce(
        (total, item) => total + (Number(item.quantity) || 0),
        0
    );

    const estimatedDelivery = getEstimatedDelivery();
    const orderId = order.orderId || order.orderNumber || order.id;

    return (
        <main className="order-details-main-content">
            <div className="container">
                <div className="order-details-page-header">
                    <h1 className="order-details-title">Order Details</h1>
                    <div className="order-details-header-status">
                        <span className={`badge ${getStatusBadgeClass(order.orderStatus)}`}>
                            {getStatusText(order.orderStatus)}
                        </span>
                    </div>
                </div>

                <div className="order-details-summary-card">
                    <div className="order-details-summary-item">
                        <small>ORDER NUMBER</small>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <strong>{orderId}</strong>
                            <button
                                type="button"
                                className="btn btn-xs btn-outline order-details-copy-btn"
                                onClick={handleCopyOrderNumber}
                                title="Copy Order Number"
                            >
                                {copied ? 'Copied! ✓' : 'Copy'}
                            </button>
                        </div>
                    </div>

                    <div className="order-details-summary-separator">|</div>

                    <div className="order-details-summary-item">
                        <small>ORDER DATE</small>
                        <strong>{formatDate(order.orderDate || order.placedAt)}</strong>
                    </div>

                    <div className="order-details-summary-separator">|</div>

                    <div className="order-details-summary-item">
                        <small>ITEMS</small>
                        <strong>{itemCount} {itemCount === 1 ? 'Item' : 'Items'}</strong>
                    </div>

                    <div className="order-details-summary-separator">|</div>

                    <div className="order-details-summary-item">
                        <small>ORDER TOTAL</small>
                        <strong>{formatPrice(grandTotal)}</strong>
                    </div>
                </div>

                <section className="order-details-card order-details-progress-card" id="order-fulfillment-section">
                    <div className="order-details-card-header">
                        <h2 className="order-details-section-title">Fulfillment Progress</h2>
                        <span className="order-details-delivery-tag">{estimatedDelivery}</span>
                    </div>

                    <div className="order-details-timeline">
                        <div className={`order-details-timeline-step ${['processing', 'shipped', 'delivered'].includes(order.orderStatus) ? 'completed' : 'active'}`}>
                            <div className="order-details-timeline-circle">✓</div>
                            <strong>Order Placed</strong>
                            <small>{formatDateTime(order.orderDate || order.placedAt)}</small>
                        </div>

                        <div className={`order-details-timeline-line ${['processing', 'shipped', 'delivered'].includes(order.orderStatus) ? 'completed' : ''}`}></div>

                        <div className={`order-details-timeline-step ${['shipped', 'delivered'].includes(order.orderStatus) ? 'completed' : order.orderStatus === 'processing' ? 'active' : ''}`}>
                            <div className="order-details-timeline-circle">2</div>
                            <strong>Warehouse Allocation</strong>
                            <small>
                                {order.orderStatus === 'processing'
                                    ? 'In Progress'
                                    : order.orderStatus === 'shipped' || order.orderStatus === 'delivered'
                                        ? 'Completed'
                                        : 'Pending'}
                            </small>
                        </div>

                        <div className={`order-details-timeline-line ${['shipped', 'delivered'].includes(order.orderStatus) ? 'completed' : ''}`}></div>

                        <div className={`order-details-timeline-step ${order.orderStatus === 'delivered' ? 'completed' : order.orderStatus === 'shipped' ? 'active' : ''}`}>
                            <div className="order-details-timeline-circle">3</div>
                            <strong>Carrier Dispatch</strong>
                            <small>
                                {order.orderStatus === 'delivered'
                                    ? 'Completed'
                                    : order.orderStatus === 'shipped'
                                        ? 'Out for Delivery'
                                        : 'Pending Carrier'}
                            </small>
                        </div>

                        <div className={`order-details-timeline-line ${order.orderStatus === 'delivered' ? 'completed' : ''}`}></div>

                        <div className={`order-details-timeline-step ${order.orderStatus === 'delivered' ? 'completed' : ''}`}>
                            <div className="order-details-timeline-circle">
                                {order.orderStatus === 'delivered' ? '✓' : '4'}
                            </div>
                            <strong>Delivered</strong>
                            <small className="order-details-single-line">
                                {order.orderStatus === 'delivered' ? 'Delivered' : estimatedDelivery}
                            </small>
                        </div>
                    </div>
                </section>

                <section className="order-details-card">
                    <div className="order-details-card-header">
                        <h2 className="order-details-section-title">Ordered Items</h2>
                        <span>{itemCount} {itemCount === 1 ? 'Item' : 'Items'}</span>
                    </div>

                    <div className="order-details-items-list">
                        {loadingProducts ? (
                            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
                                Loading product details...
                            </p>
                        ) : (
                            items.map((item) => {
                                const product = products[item.productId];
                                const productName = product?.title || product?.name || item.productId;
                                const quantity = Number(item.quantity) || 0;
                                const totalPrice = Number(item.totalPrice) || 0;
                                const unitPrice = Number(item.unitPrice) || 0;

                                const rawVariants = item.variants || item.variant || [];
                                const variantItems = rawVariants
                                    .map((v) => (typeof v === 'string' ? v : v.name || v.value || v.label))
                                    .filter(Boolean);

                                return (
                                    <div className="order-details-item" key={item.productId}>
                                        <Link
                                            to={`/product-details/${item.productId}/${encodeURIComponent(productName)}`}
                                            className="order-details-item-image"
                                            title={productName}
                                        >
                                            {product?.mainImage ? (
                                                <img src={product.mainImage} alt={productName} />
                                            ) : (
                                                <div>No Image</div>
                                            )}
                                        </Link>

                                        <div className="order-details-item-info">
                                            <Link
                                                to={`/product-details/${item.productId}/${encodeURIComponent(productName)}`}
                                                className="order-details-item-title-link"
                                            >
                                                <strong>{productName}</strong>
                                            </Link>

                                            {variantItems.length > 0 && (
                                                <div className="order-details-item-variants">
                                                    {variantItems.map((vName, vIdx) => (
                                                        <span key={vIdx} className="order-details-variant-pill">
                                                            {vName}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            <span className="order-details-item-unit-price">
                                                Unit Price: <strong>{formatPrice(unitPrice)}</strong>
                                            </span>
                                        </div>

                                        <div className="order-details-item-quantity">
                                            <span>Quantity</span>
                                            <strong>{quantity}</strong>
                                        </div>

                                        <div className="order-details-item-price">
                                            <span>Item Total</span>
                                            <strong>{formatPrice(totalPrice)}</strong>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>

                <div className="order-details-two-column">
                    <section className="order-details-card">
                        <div className="order-details-card-header">
                            <h2 className="order-details-section-title">Shipping Information</h2>
                        </div>

                        <div className="order-details-info-content">
                            <h3>Delivery Address</h3>
                            <p><strong>{address.name || address.recipientName || 'Recipient'}</strong></p>

                            {(address.apartment || address.suite) && (
                                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.84rem' }}>
                                    {address.apartment || address.suite}
                                </p>
                            )}

                            <p style={{ fontWeight: 600 }}>{address.street}</p>

                            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.84rem' }}>
                                {[
                                    address.villageArea || address.city,
                                    address.thana ? `Thana: ${address.thana}` : (address.state && address.state !== 'Bangladesh' ? address.state : '')
                                ].filter(Boolean).join(', ')}
                            </p>

                            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.84rem' }}>
                                {[
                                    address.district || (address.country !== 'Bangladesh' ? address.country : 'Dhaka'),
                                    address.postalCode || address.postal || address.zipCode
                                ].filter(Boolean).join(' - ')}, Bangladesh
                            </p>

                            <p>Phone: {address.phone}</p>

                            <hr className="divider" style={{ marginBlock: 'var(--space-4)' }} />

                            <h3>Delivery Method</h3>
                            <p><strong>{delivery.name || 'Standard Courier Delivery'}</strong></p>
                            <p>Delivery Cost: {shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}</p>
                            <p>Estimated Delivery: {estimatedDelivery}</p>
                        </div>
                    </section>

                    <section className="order-details-card">
                        <div className="order-details-card-header">
                            <h2 className="order-details-section-title">Payment Information</h2>
                        </div>

                        <div className="order-details-info-content">
                            <h3>Payment Method</h3>
                            <p><strong>{paymentLabels[paymentMethod] || 'Payment'}</strong></p>

                            {paymentMethod === 'card' && cardLast4 && (
                                <p>Card ending in •••• {cardLast4}</p>
                            )}

                            <p>
                                Payment Status:{' '}
                                <strong style={{ color: paymentStatus === 'paid' ? 'var(--color-success)' : 'var(--color-warning)' }}>
                                    {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
                                </strong>
                            </p>

                            <p>Transaction Ref: {transactionRef}</p>

                            <hr className="divider" style={{ marginBlock: 'var(--space-4)' }} />

                            <h3>Billing Address</h3>
                            <p>Same as shipping address</p>
                        </div>
                    </section>
                </div>

                <section className="order-details-card order-details-pricing-card">
                    <div className="order-details-card-header">
                        <h2 className="order-details-section-title">Pricing Details</h2>
                    </div>

                    <div className="order-details-price-summary">
                        <div className="order-details-price-row">
                            <span>Items Subtotal</span>
                            <strong>{formatPrice(subtotal)}</strong>
                        </div>

                        {discount > 0 && (
                            <div className="order-details-price-row" style={{ color: 'var(--color-success)' }}>
                                <span>Promotion Discount</span>
                                <strong>-{formatPrice(discount)}</strong>
                            </div>
                        )}

                        <div className="order-details-price-row">
                            <span>Delivery</span>
                            <strong>{shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}</strong>
                        </div>

                        <div className="order-details-price-row">
                            <span>Estimated Tax</span>
                            <strong>{formatPrice(tax)}</strong>
                        </div>

                        <hr className="divider" style={{ marginBlock: 'var(--space-3)' }} />

                        <div className="order-details-price-total">
                            <span>Grand Total</span>
                            <strong>{formatPrice(grandTotal)}</strong>
                        </div>
                    </div>
                </section>

                {cancelFeedback.message && (
                    <div style={{
                        padding: '14px 18px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        backgroundColor: cancelFeedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
                        color: cancelFeedback.type === 'success' ? '#047857' : '#b91c1c',
                        border: `1px solid ${cancelFeedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                        fontWeight: 600,
                        fontSize: '0.9rem'
                    }}>
                        {cancelFeedback.type === 'success' ? '✓ ' : '⚠ '}
                        {cancelFeedback.message}
                    </div>
                )}

                <div className="order-details-actions no-print">
                    <Link to="/account/my-orders" className="btn btn-lg btn-outline">
                        &larr; Back to My Orders
                    </Link>

                    <button
                        type="button"
                        className="btn btn-lg btn-outline"
                        onClick={() => window.print()}
                        title="Print Official Order Invoice & Summary"
                    >
                        🖨️ Print Invoice
                    </button>

                    {['pending', 'processing'].includes(order.orderStatus?.toLowerCase()) && (
                        <button
                            type="button"
                            className="btn btn-lg btn-outline"
                            style={{ color: '#ef4444', borderColor: '#fca5a5' }}
                            onClick={() => setShowCancelModal(true)}
                        >
                            ✕ Cancel Order
                        </button>
                    )}

                    {order.orderStatus === 'delivered' && (
                        <button
                            type="button"
                            className="btn btn-lg btn-primary"
                            onClick={handleBuyAgain}
                            disabled={actionLoading}
                        >
                            {actionLoading ? 'Adding to Cart...' : 'Buy Again'}
                        </button>
                    )}

                    {order.orderStatus === 'shipped' && (
                        <button
                            type="button"
                            className="btn btn-lg btn-primary"
                            onClick={handleTrackPackage}
                        >
                            Track Package
                        </button>
                    )}
                </div>

                {/* Customer Order Cancellation Modal */}
                {showCancelModal && (
                    <div className="order-cancel-modal-backdrop" onClick={() => !isCancelling && setShowCancelModal(false)}>
                        <div className="order-cancel-modal" onClick={(e) => e.stopPropagation()}>
                            <h3 className="order-cancel-modal-title">Cancel Order #{orderId}</h3>
                            <p className="order-cancel-modal-desc">
                                Are you sure you wish to cancel this order? Once requested, pending items will be deallocated and payment processing will cease.
                            </p>

                            <form onSubmit={handleCancelOrderSubmit}>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                                        Reason for Cancellation
                                    </label>
                                    <select
                                        className="select"
                                        style={{ width: '100%', padding: '10px 12px' }}
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        disabled={isCancelling}
                                    >
                                        <option value="Found a better price or changed my mind">Found a better price or changed my mind</option>
                                        <option value="Ordered incorrect hardware model or variant">Ordered incorrect hardware model or variant</option>
                                        <option value="Shipping time is longer than anticipated">Shipping time is longer than anticipated</option>
                                        <option value="Need to change billing or delivery address">Need to change billing or delivery address</option>
                                        <option value="Other reason">Other reason</option>
                                    </select>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        onClick={() => setShowCancelModal(false)}
                                        disabled={isCancelling}
                                    >
                                        Keep Order
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        style={{ backgroundColor: '#ef4444', borderColor: '#ef4444', color: '#ffffff' }}
                                        disabled={isCancelling}
                                    >
                                        {isCancelling ? 'Processing...' : 'Confirm Cancellation'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
};

export default OrderDetails;
