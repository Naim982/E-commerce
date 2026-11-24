import React, { useEffect, useMemo, useState } from 'react';
import './CheckoutPayment.css';
import { Link, useNavigate } from 'react-router-dom';
import { createOrder, getProductDataById, clearCart } from '../../../../api/apiManager';
import { useCheckout } from '../../../../context/CheckoutContext';
import useAuth from '../../../../authentication/useAuth';

const CheckoutPayment = () => {
    const { user } = useAuth();
    const user_id = user?.uid;
    const navigate = useNavigate();

    const { checkout, clearCheckout } = useCheckout();

    const checkoutItems = useMemo(() => checkout.checkoutItems || [], [checkout.checkoutItems]);
    const checkoutSource = checkout.source || 'cart';
    const selectedAddress = checkout.address || null;
    const delivery = checkout.delivery || null;

    const [products, setProducts] = useState({});
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [cardHolder, setCardHolder] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiration, setCardExpiration] = useState('');
    const [cardCvv, setCardCvv] = useState('');

    const [loading, setLoading] = useState(true);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadPaymentData = async () => {
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
                console.error('Failed to load products:', err);
                setError('Unable to load products for payment.');
            } finally {
                setLoading(false);
            }
        };

        loadPaymentData();
    }, [checkoutItems]);

    const getItemUnitPrice = (item) => {
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
    };

    const getSubtotal = () => {
        return checkoutItems.reduce((total, item) => {
            const unitPrice = getItemUnitPrice(item);
            return total + unitPrice * Number(item.quantity || 0);
        }, 0);
    };

    const getShippingCost = () => {
        return Number(delivery?.price) || 0;
    };

    const getDiscount = () => {
        return Number(checkout?.discount) || 0;
    };

    const getTax = () => {
        const currentSubtotal = getSubtotal();
        const currentDiscount = getDiscount();
        return (currentSubtotal - currentDiscount) * 0.08;
    };

    const getGrandTotal = () => {
        const currentSubtotal = getSubtotal();
        const currentDiscount = getDiscount();
        const currentShippingCost = getShippingCost();
        const currentTax = getTax();

        return currentSubtotal - currentDiscount + currentShippingCost + currentTax;
    };

    const formatPrice = (price) => {
        return `৳${Number(price || 0).toFixed(2)}`;
    };

    const handleCardNumberChange = (e) => {
        let value = e.target.value.replace(/\D/g, '').slice(0, 16);
        value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
        setCardNumber(value);
    };

    const handleExpirationChange = (e) => {
        let value = e.target.value.replace(/\D/g, '').slice(0, 4);
        if (value.length >= 3) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        }
        setCardExpiration(value);
    };

    const validateCardPayment = () => {
        const cleanCardNumber = cardNumber.replace(/\s/g, '');

        if (!cardHolder.trim()) {
            setError('Please enter the cardholder name.');
            return false;
        }

        if (cleanCardNumber.length !== 16) {
            setError('Please enter a valid 16-digit card number.');
            return false;
        }

        if (!/^\d{2}\/\d{2}$/.test(cardExpiration)) {
            setError('Please enter a valid expiration date.');
            return false;
        }

        if (!/^\d{3,4}$/.test(cardCvv)) {
            setError('Please enter a valid security code.');
            return false;
        }

        return true;
    };

    const handleSubmitPayment = () => {
        setError('');

        if (!user_id) {
            setError('You must be signed in to place an order.');
            return;
        }
        if (!checkoutItems.length) {
            setError('No products found for this checkout.');
            return;
        }
        if (!selectedAddress) {
            setError('Shipping address is missing.');
            return;
        }
        if (!delivery) {
            setError('Delivery information is missing.');
            return;
        }
        if (paymentMethod === 'card') {
            if (!validateCardPayment()) {
                return;
            }
        }

        setProcessingPayment(true);
        setTimeout(async () => {
            try {
                const orderItems = checkoutItems.map((item) => {
                    const product = products[item.id];
                    const basePrice = Number(product?.price?.current) || 0;
                    const variantPrice = (item.variant || []).reduce(
                        (total, variant) => total + (Number(variant.priceModifier) || 0),
                        0
                    );
                    const unitPrice = basePrice + variantPrice;
                    const quantity = Number(item.quantity) || 0;

                    return {
                        productId: item.id,
                        quantity,
                        variants: item.variant || [],
                        unitPrice,
                        totalPrice: unitPrice * quantity
                    };
                });

                const subtotal = getSubtotal();
                const discount = getDiscount();
                const shippingCost = getShippingCost();
                const tax = (subtotal - discount) * 0.08;
                const grandTotal = subtotal - discount + shippingCost + tax;
                const cardLast4 = paymentMethod === 'card' ? cardNumber.replace(/\s/g, '').slice(-4) : '';

                const orderData = {
                    items: orderItems,
                    address: selectedAddress,
                    delivery: {
                        name: delivery.name,
                        price: shippingCost
                    },
                    cost: {
                        subtotal,
                        discount,
                        tax,
                        grandTotal
                    },
                    payment: {
                        method: paymentMethod,
                        status: paymentMethod === 'cod' ? 'pending' : 'paid',
                        ...(paymentMethod === 'card' ? { card: { last4: cardLast4 } } : {})
                    }
                };

                const result = await createOrder(user_id, orderData);
                if (!result.success) {
                    setProcessingPayment(false);
                    setError(result.error || 'Unable to create your order.');
                    return;
                }

                try {
                    await clearCart(user_id);
                } catch (clearErr) {
                    console.warn('Cart clear warning:', clearErr);
                }

                clearCheckout();
                navigate('/order-confirmation', { state: { order: result.order } });
            } catch (error) {
                console.error('Failed to create order:', error);
                setProcessingPayment(false);
                setError('Unable to complete your order. Please try again.');
            }
        }, 2000);
    };

    if (loading) {
        return (
            <main className="checkout-main-content">
                <div className="container">
                    <p>Loading payment information...</p>
                </div>
            </main>
        );
    }

    if (error && !checkoutItems.length) {
        return (
            <main className="checkout-main-content">
                <div className="container">
                    <div className="checkout-card-section">
                        <h2 className="checkout-section-heading">Unable to Continue Checkout</h2>
                        <p>{error}</p>
                        <Link to="/product-delivery" className="btn btn-outline">
                            &larr; Back to Delivery
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    const subtotal = getSubtotal();
    const discount = getDiscount();
    const shippingCost = getShippingCost();
    const tax = getTax();
    const grandTotal = getGrandTotal();

    return (
        <div>
            <main className="checkout-main-content">
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

                        <div className="checkout-progress-step active" id="prog-step-3">
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
                                    <div className="checkout-step-indicator">3</div>
                                    <div>
                                        <h1 className="checkout-section-heading">
                                            Payment Method & Authorization
                                        </h1>
                                        <span className="checkout-section-hint">
                                            Select how you would like to pay for your order
                                        </span>
                                    </div>
                                </div>

                                <div className="checkout-payment-tabs">
                                    <label className={`checkout-pay-tab ${paymentMethod === 'card' ? 'active' : ''}`}>
                                        <input
                                            type="radio"
                                            name="payment-method"
                                            value="card"
                                            checked={paymentMethod === 'card'}
                                            onChange={() => {
                                                setPaymentMethod('card');
                                                setError('');
                                            }}
                                        />
                                        <span>💳 Credit / Debit Card</span>
                                    </label>

                                    <label className={`checkout-pay-tab ${paymentMethod === 'cod' ? 'active' : ''}`}>
                                        <input
                                            type="radio"
                                            name="payment-method"
                                            value="cod"
                                            checked={paymentMethod === 'cod'}
                                            onChange={() => {
                                                setPaymentMethod('cod');
                                                setError('');
                                            }}
                                        />
                                        <span>💵 Cash on Delivery</span>
                                    </label>

                                    <label className={`checkout-pay-tab ${paymentMethod === 'wallet' ? 'active' : ''}`}>
                                        <input
                                            type="radio"
                                            name="payment-method"
                                            value="wallet"
                                            checked={paymentMethod === 'wallet'}
                                            onChange={() => {
                                                setPaymentMethod('wallet');
                                                setError('');
                                            }}
                                        />
                                        <span>📱 Digital Mobile Wallet</span>
                                    </label>
                                </div>

                                {paymentMethod === 'card' && (
                                    <div className="checkout-pay-panel" id="panel-card-payment">
                                        <div className="form-group">
                                            <label className="form-label" htmlFor="chk-card-holder">
                                                Cardholder Name *
                                            </label>
                                            <input
                                                type="text"
                                                id="chk-card-holder"
                                                className="input"
                                                placeholder="Alexander Rahman"
                                                value={cardHolder}
                                                onChange={(e) => setCardHolder(e.target.value)}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label" htmlFor="chk-card-num">
                                                Card Number *
                                            </label>
                                            <div className="checkout-input-with-icon">
                                                <span className="checkout-input-icon">💳</span>
                                                <input
                                                    type="text"
                                                    id="chk-card-num"
                                                    className="input"
                                                    placeholder="4242 4242 4242 4242"
                                                    value={cardNumber}
                                                    onChange={handleCardNumberChange}
                                                    maxLength="19"
                                                />
                                            </div>
                                        </div>

                                        <div className="checkout-form-row">
                                            <div className="form-group">
                                                <label className="form-label" htmlFor="chk-card-exp">
                                                    Expiration Date (MM/YY) *
                                                </label>
                                                <input
                                                    type="text"
                                                    id="chk-card-exp"
                                                    className="input"
                                                    placeholder="12/28"
                                                    value={cardExpiration}
                                                    onChange={handleExpirationChange}
                                                    maxLength="5"
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label" htmlFor="chk-card-cvv">
                                                    Security Code (CVV) *
                                                </label>
                                                <input
                                                    type="password"
                                                    id="chk-card-cvv"
                                                    className="input"
                                                    placeholder="382"
                                                    value={cardCvv}
                                                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                                    maxLength="4"
                                                />
                                            </div>
                                        </div>

                                        <div className="checkout-security-box">
                                            🔒 <strong>Safe Demo Validation:</strong> We use safe tokenization simulation. No actual bank charges occur.
                                        </div>
                                    </div>
                                )}

                                {paymentMethod === 'cod' && (
                                    <div className="checkout-pay-panel" id="panel-cod-payment">
                                        <div className="checkout-cod-notice">
                                            <div className="checkout-cod-icon">💵</div>
                                            <div>
                                                <strong style={{ fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>
                                                    Pay Upon Arrival
                                                </strong>
                                                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                                                    You will pay in cash or via handheld card reader directly to the delivery courier.
                                                </p>
                                                <div style={{ marginTop: '6px', fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 700 }}>
                                                    ✓ Additional COD Fee: ৳0.00 (FREE)
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {paymentMethod === 'wallet' && (
                                    <div className="checkout-pay-panel" id="panel-wallet-payment">
                                        <div className="checkout-wallet-options">
                                            <button
                                                type="button"
                                                className="btn btn-block btn-outline"
                                                style={{ padding: '12px', marginBottom: '8px' }}
                                                onClick={() => setError('Apple Pay demo authorization is not available yet.')}
                                            >
                                                 Authorize with Apple Pay
                                            </button>

                                            <button
                                                type="button"
                                                className="btn btn-block btn-outline"
                                                style={{ padding: '12px', marginBottom: '8px' }}
                                                onClick={() => setError('Google Pay demo authorization is not available yet.')}
                                            >
                                                <span style={{ color: '#0086ff', fontWeight: 800 }}>G</span> Pay with Google Pay
                                            </button>

                                            <button
                                                type="button"
                                                className="btn btn-block btn-outline"
                                                style={{ padding: '12px' }}
                                                onClick={() => setError('bKash / Nagad demo authorization is not available yet.')}
                                            >
                                                <span style={{ color: '#d12053', fontWeight: 800 }}>bKash</span> / Nagad Instant Mobile Pay
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <p style={{ color: 'var(--color-danger)', marginTop: 'var(--space-3)' }}>
                                        {error}
                                    </p>
                                )}

                                <div className="checkout-step-footer flex-between" style={{ marginTop: 'var(--space-6)' }}>
                                    <Link to="/product-review" className="btn btn-outline">
                                        &larr; Back to Order Review
                                    </Link>

                                    <button
                                        type="button"
                                        className="btn btn-lg btn-primary"
                                        id="btn-submit-payment"
                                        onClick={handleSubmitPayment}
                                        disabled={processingPayment}
                                    >
                                        <span>
                                            {processingPayment
                                                ? 'Processing Payment...'
                                                : paymentMethod === 'cod'
                                                    ? `Place Order ${formatPrice(grandTotal)} →`
                                                    : `Pay ${formatPrice(grandTotal)} & Complete Order →`}
                                        </span>
                                    </button>
                                </div>
                            </section>
                        </div>

                        <aside className="checkout-summary-col" aria-label="Order Summary">
                            <div className="checkout-summary-card">
                                <h3 className="checkout-summary-title">Final Total</h3>
                                <span className="checkout-summary-sub" id="checkout-flow-label">
                                    {checkoutSource === 'direct'
                                        ? 'Buy Now Flow (1 Item)'
                                        : `Cart Flow (${checkoutItems.length} ${checkoutItems.length === 1 ? 'Item' : 'Items'})`}
                                </span>

                                <div className="checkout-cart-items-preview" id="checkout-cart-items-preview">
                                    {checkoutItems.map((item) => {
                                        const product = products[item.id];
                                        if (!product) return null;

                                        const unitPrice = getItemUnitPrice(item);
                                        const quantity = Number(item.quantity || 0);

                                        return (
                                            <div className="checkout-cart-preview-item" key={item.id}>
                                                <img src={product.mainImage} alt={product.title} />
                                                <div>
                                                    <strong>{product.title}</strong>
                                                    <small>Qty: {quantity}</small>
                                                </div>
                                                <strong>{formatPrice(unitPrice * quantity)}</strong>
                                            </div>
                                        );
                                    })}
                                </div>

                                <hr className="divider" style={{ marginBlock: 'var(--space-4)' }} />

                                <div className="checkout-pricing-table">
                                    <div className="checkout-price-row">
                                        <span>Items Subtotal:</span>
                                        <strong>{formatPrice(subtotal)}</strong>
                                    </div>

                                    {discount > 0 && (
                                        <div className="checkout-price-row" style={{ color: 'var(--color-success)' }}>
                                            <span>Promotion Discount:</span>
                                            <strong>-{formatPrice(discount)}</strong>
                                        </div>
                                    )}

                                    <div className="checkout-price-row">
                                        <span>Delivery / Shipping:</span>
                                        <strong>{shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}</strong>
                                    </div>

                                    <div className="checkout-price-row">
                                        <span>Estimated Tax (8%):</span>
                                        <strong>{formatPrice(tax)}</strong>
                                    </div>

                                    <hr className="divider" style={{ marginBlock: 'var(--space-3)' }} />

                                    <div className="checkout-price-total-row">
                                        <span>Grand Total:</span>
                                        <strong className="checkout-grand-total">{formatPrice(grandTotal)}</strong>
                                    </div>
                                </div>

                                <div className="checkout-summary-guarantees" style={{ marginTop: 'var(--space-5)' }}>
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

            {processingPayment && (
                <div className="checkout-modal-backdrop" id="payment-processing-modal">
                    <div className="checkout-processing-box">
                        <div className="checkout-spinner" />
                        <h3 className="checkout-processing-title">Authorizing Payment...</h3>
                        <p className="checkout-processing-desc">
                            Connecting with secure payment gateway. Please do not refresh or close this browser window.
                        </p>
                        <div className="checkout-progress-strip">
                            <div className="checkout-progress-fill" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CheckoutPayment;
