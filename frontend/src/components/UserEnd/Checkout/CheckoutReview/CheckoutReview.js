import React, { useEffect, useMemo, useCallback, useState } from 'react';
import './CheckoutReview.css';
import { Link, useNavigate } from 'react-router-dom';

import { getProductDataById } from '../../../../api/apiManager';
import { useCheckout } from '../../../../context/CheckoutContext';

const CheckoutReview = () => {
    const navigate = useNavigate();
    const { checkout, setCheckout } = useCheckout();

    const checkoutItems = useMemo(() => checkout.checkoutItems || [], [checkout.checkoutItems]);
    const checkoutSource = checkout.source || 'cart';

    const selectedAddress = checkout.address || null;
    const delivery = checkout.delivery || null;

    const [products, setProducts] = useState({});
    const [agreedToTerms, setAgreedToTerms] = useState(true);
    const [coupon, setCoupon] = useState('');
    const [discount, setDiscount] = useState(0);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadReviewData = async () => {
            setLoading(true);
            setError('');

            if (!checkoutItems.length) {
                setError('No products found for this checkout.');
                setLoading(false);
                return;
            }

            try {
                const productResults = await Promise.all(
                    checkoutItems.map(async (item) => {
                        const result = await getProductDataById(item.id);
                        return {
                            id: item.id,
                            product: result.success ? result.product : null
                        };
                    })
                );

                const productMap = {};
                productResults.forEach(({ id, product }) => {
                    productMap[id] = product;
                });

                setProducts(productMap);
            } catch (err) {
                console.error('Failed to load checkout review:', err);
                setError('Unable to load checkout review.');
            } finally {
                setLoading(false);
            }
        };

        loadReviewData();
    }, [checkoutItems]);

    const getItemUnitPrice = useCallback((item) => {
        const product = products[item.id];
        if (!product) {
            return 0;
        }

        const basePrice = Number(product.price?.current) || 0;
        const variantPrice = (item.variant || []).reduce(
            (total, variant) => total + (Number(variant.priceModifier) || 0),
            0
        );

        return basePrice + variantPrice;
    }, [products]);

    const subtotal = useMemo(() => {
        return checkoutItems.reduce((total, item) => {
            const unitPrice = getItemUnitPrice(item);
            return total + unitPrice * Number(item.quantity || 0);
        }, 0);
    }, [checkoutItems, getItemUnitPrice]);

    const shippingName = delivery?.name || 'Standard Carbon-Neutral Delivery';
    const shippingCost = Number(delivery?.price) || 0;

    const tax = useMemo(() => {
        return (subtotal - discount) * 0.08;
    }, [subtotal, discount]);

    const grandTotal = useMemo(() => {
        return subtotal - discount + shippingCost + tax;
    }, [subtotal, discount, shippingCost, tax]);

    const handleApplyCoupon = () => {
        const code = coupon.trim().toUpperCase();

        if (!code) {
            setDiscount(0);
            setError('');
            return;
        }

        if (code === 'LUMEN10') {
            setDiscount(subtotal * 0.10);
            setError('');
        } else {
            setDiscount(0);
            setError('Invalid coupon code.');
        }
    };

    const handleContinueToPayment = () => {
        setError('');

        if (!selectedAddress) {
            setError('Please select a shipping address.');
            return;
        }

        if (!delivery) {
            setError('Please select a delivery method.');
            return;
        }

        if (!agreedToTerms) {
            setError('Please agree to the Terms of Sale before continuing.');
            return;
        }

        setCheckout({
            source: checkoutSource,
            checkoutItems,
            address: selectedAddress,
            delivery,
            discount,
            couponCode: discount > 0 ? coupon.trim().toUpperCase() : ''
        });

        navigate('/product-payment');
    };

    const formatPrice = (price) => {
        return `৳${Number(price || 0).toFixed(2)}`;
    };

    if (loading) {
        return (
            <main className="checkout-main-content">
                <div className="container">
                    <p>Loading order review...</p>
                </div>
            </main>
        );
    }

    if (error && !checkoutItems.length) {
        return (
            <main className="checkout-main-content">
                <div className="container">
                    <div className="checkout-card-section">
                        <h2 className="checkout-section-heading">Unable to Review Order</h2>
                        <p>{error}</p>
                        <Link to="/product-delivery" className="btn btn-outline">
                            &larr; Back to Delivery
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="checkout-main-content">
            <div className="container">
                <div className="checkout-progress-bar">
                    <div className="checkout-progress-step completed" id="prog-step-1">
                        <div className="checkout-step-circle">✓</div>
                        <span>Delivery</span>
                    </div>
                    <div className="checkout-progress-line completed" />

                    <div className="checkout-progress-step active" id="prog-step-2">
                        <div className="checkout-step-circle">02</div>
                        <span>Review Order</span>
                    </div>
                    <div className="checkout-progress-line" />

                    <div className="checkout-progress-step" id="prog-step-3">
                        <div className="checkout-step-circle">03</div>
                        <span>Payment</span>
                    </div>
                    <div className="checkout-progress-line" />

                    <div className="checkout-progress-step" id="prog-step-4">
                        <div className="checkout-step-circle">04</div>
                        <span>Confirmation</span>
                    </div>
                </div>

                <div className="checkout-layout-grid">
                    <div className="checkout-steps-col">
                        <section className="checkout-card-section">
                            <div className="checkout-section-title-row">
                                <div className="checkout-step-indicator">2</div>
                                <div>
                                    <h1 className="checkout-section-heading">Review Your Hardware Order</h1>
                                    <span className="checkout-section-hint">
                                        Verify your hardware products, delivery destination, and payment preference
                                    </span>
                                </div>
                            </div>

                            <h3 className="checkout-subheading" style={{ marginTop: 'var(--space-4)' }}>
                                Purchased Hardware Components
                            </h3>

                            <div className="checkout-review-items" id="checkout-review-items-container">
                                {checkoutItems.map((item) => {
                                    const product = products[item.id];

                                    if (!product) {
                                        return (
                                            <div key={item.id} className="checkout-review-item-row">
                                                <div className="checkout-review-item-body">
                                                    <strong>Product unavailable</strong>
                                                </div>
                                            </div>
                                        );
                                    }

                                    const unitPrice = getItemUnitPrice(item);
                                    const itemTotal = unitPrice * Number(item.quantity || 0);
                                    const variantText = (item.variant || []).map(variant => variant.name).join(' • ');

                                    return (
                                        <div key={item.id} className="checkout-review-item-row">
                                            <img
                                                src={product.mainImage}
                                                alt={product.title}
                                                className="checkout-review-item-img"
                                            />

                                            <div className="checkout-review-item-body">
                                                <span className="checkout-review-item-brand">
                                                    {product.brandPill || product.brand}
                                                </span>
                                                <h4 className="checkout-review-item-title">
                                                    {product.title}
                                                </h4>

                                                {variantText && (
                                                    <span className="checkout-review-item-variants">
                                                        {variantText}
                                                    </span>
                                                )}

                                                <div className="checkout-review-item-meta">
                                                    <span>Qty: {item.quantity}</span>
                                                    <span>•</span>
                                                    <span>Unit: {formatPrice(unitPrice)}</span>
                                                </div>
                                            </div>

                                            <strong className="checkout-review-item-price">
                                                {formatPrice(itemTotal)}
                                            </strong>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="checkout-review-grid" style={{ marginTop: 'var(--space-5)' }}>
                                <div className="checkout-review-card">
                                    <div className="checkout-review-card-header">
                                        <strong>📍 Destination</strong>
                                        <Link to="/product-delivery" className="checkout-edit-step-btn">
                                            Edit Address
                                        </Link>
                                    </div>

                                    {selectedAddress ? (
                                        <>
                                            <strong style={{ display: 'block', marginBottom: '4px' }}>
                                                {selectedAddress.recipientName}
                                            </strong>
                                            <p className="checkout-review-card-text">
                                                {(selectedAddress.apartment || selectedAddress.suite) && (
                                                    <span>{selectedAddress.apartment || selectedAddress.suite}<br /></span>
                                                )}
                                                <strong>{selectedAddress.street}</strong><br />
                                                {[selectedAddress.villageArea || selectedAddress.city, selectedAddress.thana ? `Thana: ${selectedAddress.thana}` : (selectedAddress.state && selectedAddress.state !== 'Bangladesh' ? selectedAddress.state : '')].filter(Boolean).join(', ')}<br />
                                                {[selectedAddress.district || (selectedAddress.country !== 'Bangladesh' ? selectedAddress.country : 'Dhaka'), selectedAddress.postalCode || selectedAddress.postal || selectedAddress.zipCode].filter(Boolean).join(' - ')}, Bangladesh
                                            </p>
                                            <small style={{ display: 'block', marginTop: '4px', color: 'var(--color-text-muted)' }}>
                                                Phone: {selectedAddress.phone}
                                            </small>
                                        </>
                                    ) : (
                                        <p className="checkout-review-card-text" style={{ color: 'var(--color-error)' }}>
                                            No address selected. Please return to Step 1.
                                        </p>
                                    )}
                                </div>

                                <div className="checkout-review-card">
                                    <div className="checkout-review-card-header">
                                        <strong>🚚 Delivery Method</strong>
                                        <Link to="/product-delivery" className="checkout-edit-step-btn">
                                            Change Speed
                                        </Link>
                                    </div>

                                    {delivery ? (
                                        <>
                                            <strong style={{ display: 'block', marginBottom: '4px' }}>
                                                {shippingName}
                                            </strong>
                                            <p className="checkout-review-card-text">
                                                Cost: {shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}
                                            </p>
                                            <small style={{ display: 'block', marginTop: '4px', color: 'var(--color-text-muted)' }}>
                                                Official hardware transit insurance included.
                                            </small>
                                        </>
                                    ) : (
                                        <p className="checkout-review-card-text" style={{ color: 'var(--color-error)' }}>
                                            No delivery method selected.
                                        </p>
                                    )}
                                </div>

                                <div className="checkout-review-card">
                                    <div className="checkout-review-card-header">
                                        <strong>💳 Payment Preference</strong>
                                        <span className="checkout-edit-step-btn">Step 3</span>
                                    </div>
                                    <p className="checkout-review-card-text">
                                        Payment will be selected and confirmed in the next step (Card, Cash on Delivery, or Digital Wallet).
                                    </p>
                                </div>
                            </div>

                            <div className="checkout-terms-block" style={{ marginTop: 'var(--space-5)' }}>
                                <label className="checkout-checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={agreedToTerms}
                                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                                    />
                                    <span>
                                        I confirm that all product specifications and shipping information are accurate, and I agree to the{' '}
                                        <Link to="/about" style={{ color: 'var(--color-accent)', fontWeight: 700 }}>
                                            Terms of Sale
                                        </Link>
                                        , 30-Day Return Policy, and factory warranty conditions.
                                    </span>
                                </label>
                            </div>

                            {error && (
                                <div className="checkout-field-error" style={{ marginTop: 'var(--space-3)' }} role="alert">
                                    {error}
                                </div>
                            )}

                            <div className="checkout-step-footer flex-between" style={{ marginTop: 'var(--space-6)' }}>
                                <Link to="/product-delivery" className="btn btn-outline">
                                    &larr; Return to Delivery
                                </Link>

                                <button
                                    type="button"
                                    className="btn btn-lg btn-primary"
                                    onClick={handleContinueToPayment}
                                >
                                    Proceed to Payment &rarr;
                                </button>
                            </div>
                        </section>
                    </div>

                    <aside className="checkout-summary-col" aria-label="Order Pricing Summary">
                        <div className="checkout-summary-card">
                            <h3 className="checkout-summary-title">Price Summary</h3>
                            <span className="checkout-summary-sub">
                                Review items & shipping before final payment
                            </span>

                            <div className="checkout-coupon-row">
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Discount code (e.g. LUMEN10)"
                                    value={coupon}
                                    onChange={(e) => setCoupon(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline"
                                    onClick={handleApplyCoupon}
                                >
                                    Apply
                                </button>
                            </div>

                            <div className="checkout-pricing-table">
                                <div className="checkout-price-row">
                                    <span>Items Subtotal:</span>
                                    <strong id="chk-subtotal-val">{formatPrice(subtotal)}</strong>
                                </div>

                                {discount > 0 && (
                                    <div className="checkout-price-row discount">
                                        <span>Promotional Discount:</span>
                                        <strong>-{formatPrice(discount)}</strong>
                                    </div>
                                )}

                                <div className="checkout-price-row">
                                    <span>Shipping ({shippingName}):</span>
                                    <span>{shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}</span>
                                </div>

                                <div className="checkout-price-row">
                                    <span>Estimated Tax (8%):</span>
                                    <span>{formatPrice(tax)}</span>
                                </div>

                                <hr className="divider" style={{ marginBlock: 'var(--space-3)' }} />

                                <div className="checkout-price-total-row">
                                    <span>Grand Total:</span>
                                    <strong className="checkout-grand-total" id="chk-grand-total-val">
                                        {formatPrice(grandTotal)}
                                    </strong>
                                </div>
                            </div>

                            <div className="checkout-summary-guarantees" style={{ marginTop: 'var(--space-4)' }}>
                                <div className="chk-guarantee-item">
                                    ✓ 100% Genuine Hardware with Factory Seal
                                </div>
                                <div className="chk-guarantee-item">
                                    ✓ Full 3-Year Official Manufacturer Warranty
                                </div>
                                <div className="chk-guarantee-item">
                                    ✓ 30-Day Money-Back No-Hassle Returns
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </main>
    );
};

export default CheckoutReview;
