import React, { useEffect, useMemo, useState } from 'react';
import './MyOrders.css';
import { Link } from 'react-router-dom';
import { getProductDataById } from '../../../../api/apiManager';

const MyOrders = ({ user }) => {
    const orders = useMemo(() => user?.ordersSummary || [], [user?.ordersSummary]);

    const [products, setProducts] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [activeStatus, setActiveStatus] = useState('all');
    const [loadingProducts, setLoadingProducts] = useState(true);

    useEffect(() => {
        const loadOrderProducts = async () => {
            setLoadingProducts(true);

            try {
                const productIds = [
                    ...new Set(
                        orders.flatMap((order) =>
                            (order.items || []).map((item) => item.productId)
                        )
                    )
                ];

                if (!productIds.length) {
                    setProducts({});
                    setLoadingProducts(false);
                    return;
                }

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

        loadOrderProducts();
    }, [orders]);

    const counts = useMemo(() => {
        return {
            all: orders.length,
            processing: orders.filter((order) => order.orderStatus === 'processing').length,
            shipped: orders.filter((order) => order.orderStatus === 'shipped').length,
            delivered: orders.filter((order) => order.orderStatus === 'delivered').length,
            cancelled: orders.filter((order) => order.orderStatus === 'cancelled').length
        };
    }, [orders]);

    const formatPrice = (price) => {
        return `৳${Number(price || 0).toFixed(2)}`;
    };

    const formatOrderDate = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
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
        if (!status) return '';
        const normalizedStatus = status.toLowerCase();
        const capitalized = normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);

        if (normalizedStatus === 'processing') {
            return `${capitalized} in Warehouse`;
        }
        if (normalizedStatus === 'shipped') {
            return `${capitalized} • Out for Delivery`;
        }
        return capitalized;
    };

    const filteredOrders = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return orders.filter((order) => {
            const status = order.orderStatus?.toLowerCase() || '';
            const matchesStatus = activeStatus === 'all' || status === activeStatus;

            if (!matchesStatus) return false;
            if (!query) return true;

            const matchesOrderId = order.orderId?.toLowerCase().includes(query);
            const matchesProduct = (order.items || []).some((item) => {
                const product = products[item.productId];
                return (
                    product?.name?.toLowerCase().includes(query) ||
                    product?.title?.toLowerCase().includes(query) ||
                    item.productId?.toLowerCase().includes(query)
                );
            });

            return matchesOrderId || matchesProduct;
        });
    }, [orders, products, searchQuery, activeStatus]);

    const handleBuyAgain = (order) => {
        console.log('Buy Again:', order);
    };

    return (
        <div>
            <div className="account-card-section">
                <div className="account-section-header" style={{ marginBottom: 'var(--space-4)' }}>
                    <h1 className="account-section-title" style={{ fontSize: '1.5rem' }}>Order History</h1>
                </div>

                <div className="orders-filter-toolbar">
                    <div className="orders-search-box">
                        <input
                            type="search"
                            className="input input-sm"
                            placeholder="Search by Order ID or Product Name..."
                            aria-label="Search orders"
                            id="orders-search-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="orders-status-tabs" id="orders-status-tabs">
                        <button
                            type="button"
                            className={`orders-tab-btn ${activeStatus === 'all' ? 'active' : ''}`}
                            data-status="all"
                            onClick={() => setActiveStatus('all')}
                        >
                            All ({counts.all})
                        </button>
                        <button
                            type="button"
                            className={`orders-tab-btn ${activeStatus === 'processing' ? 'active' : ''}`}
                            data-status="processing"
                            onClick={() => setActiveStatus('processing')}
                        >
                            Processing ({counts.processing})
                        </button>
                        <button
                            type="button"
                            className={`orders-tab-btn ${activeStatus === 'shipped' ? 'active' : ''}`}
                            data-status="shipped"
                            onClick={() => setActiveStatus('shipped')}
                        >
                            Shipped ({counts.shipped})
                        </button>
                        <button
                            type="button"
                            className={`orders-tab-btn ${activeStatus === 'delivered' ? 'active' : ''}`}
                            data-status="delivered"
                            onClick={() => setActiveStatus('delivered')}
                        >
                            Delivered ({counts.delivered})
                        </button>
                        <button
                            type="button"
                            className={`orders-tab-btn ${activeStatus === 'cancelled' ? 'active' : ''}`}
                            data-status="cancelled"
                            onClick={() => setActiveStatus('cancelled')}
                        >
                            Cancelled ({counts.cancelled})
                        </button>
                    </div>
                </div>

                <div className="orders-cards-list" id="orders-cards-list">
                    {loadingProducts && orders.length > 0 && (
                        <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
                            Loading your orders...
                        </p>
                    )}

                    {!loadingProducts && filteredOrders.map((order) => {
                        const status = order.orderStatus || 'processing';
                        const orderTotal = Number(order.cost?.grandTotal) || 0;
                        const items = order.items || [];

                        return (
                            <div key={order.orderId} className="order-summary-card" data-status={status}>
                                <div className="order-card-header">
                                    <div>
                                        <span className="order-id-label">Order #{order.orderId}</span>
                                        <span className="order-date-label">Placed {formatOrderDate(order.orderDate)}</span>
                                    </div>

                                    <span className={`badge ${getStatusBadgeClass(status)}`}>
                                        {getStatusText(status)}
                                    </span>
                                </div>

                                <div className="order-card-body">
                                    <div className="order-card-items-preview">
                                        {items.map((item) => {
                                            const product = products[item.productId];
                                            const productName = product?.title || product?.name || item.productId;
                                            const productImage = product?.mainImage || '';
                                            const quantity = Number(item.quantity) || 0;
                                            const itemPrice = Number(item.totalPrice) || 0;

                                            return (
                                                <div key={`${order.orderId}-${item.productId}`} className="order-item-snippet">
                                                    {productImage && (
                                                        <img src={productImage} alt={productName} />
                                                    )}
                                                    <div>
                                                        <strong>{productName}</strong>
                                                        <div className="order-item-snippet-meta">
                                                            <span className="order-item-qty-tag">
                                                                Qty: <strong>{quantity}</strong>
                                                            </span>
                                                            <span className="order-item-meta-divider">|</span>
                                                            <span className="order-item-price-tag">
                                                                Price: <strong>{formatPrice(itemPrice)}</strong>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="order-card-footer">
                                    <div>
                                        <span className="order-total-label">Total Amount:</span>
                                        <strong className="order-total-price">{formatPrice(orderTotal)}</strong>
                                    </div>

                                    <div className="order-card-actions">
                                        {status === 'shipped' && (
                                            <Link
                                                to={`/account/my-orders/order-details?orderId=${order.orderId}`}
                                                state={{ order }}
                                                className="btn btn-sm btn-primary"
                                            >
                                                Track Package
                                            </Link>
                                        )}

                                        <Link
                                            to={`/account/my-orders/order-details?orderId=${order.orderId}`}
                                            state={{ order }}
                                            className="btn btn-sm btn-outline"
                                        >
                                            Details
                                        </Link>

                                        {status === 'delivered' && (
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-primary"
                                                onClick={() => handleBuyAgain(order)}
                                            >
                                                Buy Again
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {!loadingProducts && orders.length > 0 && filteredOrders.length === 0 && (
                        <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
                            No orders match your search or selected status.
                        </p>
                    )}

                    {!loadingProducts && orders.length === 0 && (
                        <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
                            You haven't placed any orders yet.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyOrders;
