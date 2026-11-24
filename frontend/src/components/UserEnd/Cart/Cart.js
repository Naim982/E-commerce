import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    getCartByUser,
    clearCart,
    getProductDataById,
    moveCartItemToWishlist,
    removeProductFromCartlist,
    updateCartItemQuantity
} from '../../../api/apiManager';
import { useCheckout } from '../../../context/CheckoutContext';
import useAuth from '../../../authentication/useAuth';
import './Cart.css';

const Cart = () => {
    const { user } = useAuth();
    const user_id = user?.uid;

    const [cartList, setCartList] = useState([]);
    const [products, setProducts] = useState({});

    const { setCheckout } = useCheckout();

    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');

    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState('');
    const [discountAmount, setDiscountAmount] = useState(0);
    const [couponError, setCouponError] = useState('');

    const handleApplyCoupon = (e) => {
        if (e) e.preventDefault();
        const code = couponCode.trim().toUpperCase();
        if (!code) {
            setAppliedCoupon('');
            setDiscountAmount(0);
            setCouponError('');
            return;
        }

        if (code === 'LUMEN10') {
            setAppliedCoupon('LUMEN10');
            setDiscountAmount(cartSubtotal * 0.10);
            setCouponError('');
        } else {
            setAppliedCoupon('');
            setDiscountAmount(0);
            setCouponError('Invalid coupon code.');
        }
    };

    useEffect(() => {
        const loadCart = async () => {
            if (!user_id) {
                return;
            }

            setLoading(true);
            setError('');

            const result = await getCartByUser(user_id);
            if (!result.success) {
                setError(result.error);
                setLoading(false);
                return;
            }

            setCartList(result.cartList);

            const productResults = await Promise.all(
                result.cartList.map(async item => {
                    const productResult = await getProductDataById(item.id);
                    return {
                        id: item.id,
                        product: productResult.success ? productResult.product : null
                    };
                })
            );

            const productMap = {};
            productResults.forEach(item => {
                productMap[item.id] = item.product;
            });

            setProducts(productMap);
            setLoading(false);
        };

        loadCart();
    }, [user_id]);

    const getItemPrice = useCallback((item) => {
        const product = products[item.id];
        if (!product) {
            return 0;
        }

        const basePrice = product.price?.current || 0;
        const variantPrice = (item.variant || []).reduce(
            (total, variant) => total + (Number(variant.priceModifier) || 0),
            0
        );

        return basePrice + variantPrice;
    }, [products]);

    const cartSubtotal = useMemo(() => {
        return cartList.reduce((total, item) => {
            const itemPrice = getItemPrice(item);
            return total + (itemPrice * item.quantity);
        }, 0);
    }, [cartList, getItemPrice]);

    const handleQuantityChange = async (productId, quantity) => {
        if (quantity < 1 || actionLoading) {
            return;
        }

        setActionLoading(true);
        setError('');

        const result = await updateCartItemQuantity(user_id, productId, quantity);
        if (!result.success) {
            setError(result.error);
            setActionLoading(false);
            return;
        }

        setCartList(prevCartList =>
            prevCartList.map(item => item.id === productId ? { ...item, quantity } : item)
        );

        setActionLoading(false);
    };

    const handleRemoveItem = async (productId) => {
        if (actionLoading) {
            return;
        }

        setActionLoading(true);
        setError('');

        const result = await removeProductFromCartlist(user_id, productId);
        if (!result.success) {
            setError(result.error);
            setActionLoading(false);
            return;
        }

        setCartList(prevCartList => prevCartList.filter(item => item.id !== productId));
        setActionLoading(false);
    };

    const handleMoveToWishlist = async (productId) => {
        if (actionLoading) {
            return;
        }

        setActionLoading(true);
        setError('');

        const result = await moveCartItemToWishlist(user_id, productId);
        if (!result.success) {
            setError(result.error);
            setActionLoading(false);
            return;
        }

        setCartList(prevCartList =>
            prevCartList.filter(item => item.id !== productId)
        );

        setActionLoading(false);
    };

    const handleClearCart = async () => {
        if (cartList.length === 0 || actionLoading) {
            return;
        }

        setActionLoading(true);
        setError('');

        const result = await clearCart(user_id);
        if (!result.success) {
            setError(result.error);
            setActionLoading(false);
            return;
        }

        setCartList([]);
        setActionLoading(false);
    };

    if (loading) {
        return <div className="catalog-state-box">Loading cart...</div>;
    }

    if (error) {
        return <div className="catalog-state-box">{error}</div>;
    }

    if (cartList.length === 0) {
        return (
            <main>
                <section className="cart-main-section">
                    <div className="container">
                        <div className="catalog-state-box cart-empty-state" id="cart-empty-box">
                            <div className="catalog-state-icon">🛒</div>
                            <h3 className="catalog-state-title">Your Shopping Cart is Empty</h3>
                            <p className="catalog-state-desc">
                                Looks like you haven't added any PC components or peripherals to your cart yet.
                            </p>
                            <div className="flex gap-3 justify-center" style={{ marginTop: 'var(--space-4)' }}>
                                <Link to="/shop" className="btn btn-primary">Browse Hardware Catalog</Link>
                                <Link to="/shop?sort=discount" className="btn btn-secondary">Explore Hardware Deals</Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        );
    }

    return (
        <main>
            <section className="cart-main-section">
                <div className="container">
                    <div className="cart-layout" id="cart-main-layout">
                        {/* Left Column: Items */}
                        <div className="cart-items-col">
                            <div className="cart-items-header">
                                <h1 className="cart-items-title">Shopping Cart ({cartList.length} items)</h1>
                                <span className="cart-header-dispatch">All items allocated in warehouse</span>
                            </div>

                            <div className="cart-items-list" id="cart-items-list">
                                {cartList.map(item => {
                                    const product = products[item.id];
                                    if (!product) {
                                        return null;
                                    }

                                    const itemPrice = getItemPrice(item);
                                    const variantText = (item.variant || []).map(v => v.name).join(' • ');

                                    return (
                                        <div className="cart-item-row" key={item.id}>
                                            <div className="cart-item-img">
                                                <Link to={`/product-details/${product.id}`}>
                                                    <img src={product.mainImage} alt={product.name} />
                                                </Link>
                                            </div>

                                            <div className="cart-item-details">
                                                <div className="cart-item-brand">{product.brandPill}</div>
                                                <h2 className="cart-item-title">
                                                    <Link to={`/product-details/${product.id}`}>{product.title}</Link>
                                                </h2>
                                                <div className="cart-item-specs">
                                                    {variantText ? (
                                                        item.variant.map((v, index) => (
                                                            <span key={index}>{v.name}</span>
                                                        ))
                                                    ) : (
                                                        <span>Default configuration</span>
                                                    )}
                                                </div>

                                                <div className="cart-stock-alert in-stock">✓ In Stock</div>

                                                <div className="cart-item-actions-mobile">
                                                    <button
                                                        className="cart-action-link remove-btn"
                                                        onClick={() => handleRemoveItem(item.id)}
                                                        disabled={actionLoading}
                                                    >
                                                        Remove
                                                    </button>
                                                    <span className="cart-action-sep">•</span>
                                                    <button
                                                        className="cart-action-link save-wishlist-btn"
                                                        onClick={() => handleMoveToWishlist(item.id)}
                                                        disabled={actionLoading}
                                                    >
                                                        Move to Wishlist
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="cart-item-quantity">
                                                <div className="details-quantity-control">
                                                    <button
                                                        className="details-qty-btn cart-qty-minus"
                                                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                                        disabled={actionLoading || item.quantity <= 1}
                                                    >
                                                        −
                                                    </button>

                                                    <input
                                                        type="number"
                                                        className="cart-qty-input"
                                                        value={item.quantity}
                                                        min="1"
                                                        max="5"
                                                        aria-label="Item quantity"
                                                        onChange={(e) => {
                                                            const value = Number(e.target.value);
                                                            if (value >= 1 && value <= 5) {
                                                                handleQuantityChange(item.id, value);
                                                            }
                                                        }}
                                                    />

                                                    <button
                                                        className="details-qty-btn cart-qty-plus"
                                                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                                        disabled={actionLoading || item.quantity >= 5}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="cart-item-price-col">
                                                <div className="cart-item-price">
                                                    ৳{(itemPrice * item.quantity).toFixed(2)}
                                                </div>
                                                <div className="cart-item-unit-price">
                                                    ৳{itemPrice.toFixed(2)} each
                                                </div>
                                                <button
                                                    className="cart-action-link remove-btn desktop-only"
                                                    style={{ marginTop: '8px' }}
                                                    onClick={() => handleRemoveItem(item.id)}
                                                    disabled={actionLoading}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="cart-nav-actions">
                                <Link to="/shop" className="cart-continue-link">← Continue Shopping Hardware</Link>
                                <button
                                    className="cart-clear-btn"
                                    id="cart-clear-all-btn"
                                    onClick={handleClearCart}
                                    disabled={actionLoading}
                                >
                                    Clear Cart
                                </button>
                            </div>
                        </div>

                        {/* Right Column: Order Summary */}
                        <div className="cart-summary-col">
                            <div className="cart-summary-card">
                                <h2 className="cart-summary-title">Order Summary</h2>

                                <div className="cart-coupon-box">
                                    <form className="cart-coupon-input-group" onSubmit={handleApplyCoupon}>
                                        <input
                                            type="text"
                                            className="input input-sm"
                                            placeholder="Coupon code (e.g. LUMEN10)"
                                            aria-label="Promo code"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value)}
                                        />
                                        <button type="submit" className="btn btn-sm btn-primary">Apply</button>
                                    </form>
                                    {couponError && <div style={{ color: 'var(--color-error)', fontSize: '0.8rem', marginTop: '4px' }}>{couponError}</div>}
                                    {appliedCoupon && <div style={{ color: 'var(--color-success)', fontSize: '0.8rem', marginTop: '4px' }}>✓ Coupon {appliedCoupon} applied (10% OFF)!</div>}
                                </div>

                                <div className="cart-summary-breakdown">
                                    <div className="cart-breakdown-row">
                                        <span>Hardware Subtotal:</span>
                                        <strong>৳{cartSubtotal.toFixed(2)}</strong>
                                    </div>
                                    <div className="cart-breakdown-row">
                                        <span>Promotional Discount:</span>
                                        <span className="cart-discount-val">{discountAmount > 0 ? `-৳${discountAmount.toFixed(2)}` : '৳0.00'}</span>
                                    </div>
                                    <div className="cart-breakdown-row">
                                        <span>Estimated Shipping:</span>
                                        <span className="cart-free-shipping">FREE (Express Tracked)</span>
                                    </div>
                                    <div className="cart-breakdown-row">
                                        <span>Estimated Sales Tax:</span>
                                        <span>৳0.00</span>
                                    </div>

                                    <hr className="divider" style={{ marginBlock: 'var(--space-4)' }} />

                                    <div className="cart-total-row">
                                        <span>Estimated Total:</span>
                                        <strong className="cart-total-amount">৳{(cartSubtotal - discountAmount).toFixed(2)}</strong>
                                    </div>
                                </div>

                                <Link
                                    to="/product-delivery"
                                    onClick={() => {
                                        setCheckout({
                                            source: 'cart',
                                            checkoutItems: cartList,
                                            address: null,
                                            delivery: null,
                                            discount: discountAmount,
                                            couponCode: appliedCoupon
                                        });
                                    }}
                                    className="btn btn-lg btn-primary btn-block cart-checkout-btn"
                                >
                                    <span>Proceed to Secure Checkout →</span>
                                </Link>

                                <div className="cart-trust-badges">
                                    <div className="cart-trust-item">🔒 256-Bit SSL Encrypted Checkout</div>
                                    <div className="cart-trust-item">🛡️ 30-Day Money-Back Guarantee</div>
                                    <div className="cart-trust-item">📜 Official Manufacturer Warranty</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default Cart;
