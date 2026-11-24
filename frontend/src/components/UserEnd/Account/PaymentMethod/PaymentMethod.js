import React, { useEffect, useState } from 'react';
import './PaymentMethod.css';
import { addPaymentMethod, deletePaymentMethod, setDefaultPaymentMethod } from '../../../../api/apiManager';

const PaymentMethod = ({ user }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [cardBrand, setCardBrand] = useState('VISA');
    const [cardNumber, setCardNumber] = useState('');
    const [cardName, setCardName] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [paymentMethods, setPaymentMethods] = useState([]);

    useEffect(() => {
        setPaymentMethods(user?.paymentMethods || []);
    }, [user]);

    const handleFormSubmit = async (e) => {
        e.preventDefault();

        const cleanedCardNumber = cardNumber.replace(/\s+/g, '');

        const newPaymentMethod = {
            provider: cardBrand,
            brandColor:
                cardBrand === 'VISA'
                    ? '#1A1F71'
                    : cardBrand === 'Mastercard'
                        ? '#EB001B'
                        : cardBrand === 'AMEX'
                            ? '#2E77BC'
                            : '#F76F00',
            lastFour: cleanedCardNumber.slice(-4),
            expMonth: expiry.split('/')[0]?.trim(),
            expYear: expiry.split('/')[1]?.trim(),
            cardholderName: cardName.trim(),
            isDefault: document.getElementById('payment-is-default').checked
        };

        const result = await addPaymentMethod(user.id, newPaymentMethod);

        if (result.success) {
            setPaymentMethods(result.user.paymentMethods || []);
            setIsAddModalOpen(false);

            setCardNumber('');
            setCardName('');
            setExpiry('');
            setCvv('');
            setCardBrand('VISA');
        } else {
            console.error(result.error);
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            setIsAddModalOpen(false);
        }
    };

    const handleSetDefault = async (methodId) => {
        const result = await setDefaultPaymentMethod(user.id, methodId);
        if (result.success) {
            setPaymentMethods(result.user.paymentMethods || []);
        } else {
            console.error(result.error);
        }
    };

    const handleDeleteMethod = async (methodId) => {
        const result = await deletePaymentMethod(user.id, methodId);
        if (result.success) {
            setPaymentMethods(result.user.paymentMethods || []);
        } else {
            console.error(result.error);
        }
    };

    const formatCardDisplay = (num) => {
        if (!num || !num.trim()) return '•••• •••• •••• ••••';
        const cleaned = num.replace(/\s+/g, '');
        const chunks = cleaned.match(/.{1,4}/g);
        return chunks ? chunks.join(' ') : num;
    };

    return (
        <div>
            <div className="account-card-section">
                <div className="account-section-header">
                    <div>
                        <h2 className="account-section-title" style={{ fontSize: '1.35rem' }}>Saved Payment Methods</h2>
                        <span className="account-section-subtitle">Manage credit cards and payment options for quick hardware checkout</span>
                    </div>
                    <button
                        className="btn btn-primary"
                        id="add-payment-trigger-btn"
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        + Add Payment Method
                    </button>
                </div>

                {paymentMethods.length > 0 ? (
                    <div className="payments-cards-grid" id="payments-cards-list">
                        {paymentMethods.map((method) => (
                            <div key={method.id} className={`payment-card-box ${method.isDefault ? 'default' : ''}`}>
                                <div className="payment-card-top">
                                    <span className="home-payment-badge" style={{ background: method.brandColor, color: '#ffffff' }}>
                                        {method.provider}
                                    </span>
                                    {method.isDefault && <span className="badge badge-success">Default Method</span>}
                                </div>
                                <div className="payment-card-number">•••• •••• •••• {method.lastFour}</div>
                                <div className="payment-card-bottom">
                                    <div>
                                        <small>Expires</small>
                                        <strong>{method.expMonth} / {method.expYear}</strong>
                                    </div>
                                    {method.isDefault ? (
                                        <div>
                                            <small>Cardholder</small>
                                            <strong>{method.cardholderName}</strong>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button
                                                className="btn btn-xs btn-outline"
                                                onClick={() => handleSetDefault(method.id)}
                                            >
                                                Set Default
                                            </button>
                                            <button
                                                className="btn btn-xs btn-ghost text-error"
                                                title="Delete payment method"
                                                onClick={() => handleDeleteMethod(method.id)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-payment-box" id="empty-payment-box">
                        <div className="empty-payment-icon-circle">
                            <span className="empty-payment-icon">💳</span>
                        </div>
                        <h3 className="empty-payment-title">No Payment Methods Saved</h3>
                        <p className="empty-payment-desc">
                            You haven't saved any credit cards or payment methods yet. Save a card to enable secure, 1-click checkout for your hardware purchases.
                        </p>
                        <button
                            type="button"
                            className="btn btn-primary empty-payment-btn"
                            onClick={() => setIsAddModalOpen(true)}
                        >
                            + Add Payment Method
                        </button>
                    </div>
                )}
            </div>

            {isAddModalOpen && (
                <div
                    className="payment-modal-backdrop"
                    id="add-payment-modal-backdrop"
                    onClick={handleBackdropClick}
                >
                    <div
                        className="payment-modal-box"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="add-payment-modal-title"
                    >
                        <div className="payment-modal-header">
                            <div className="payment-modal-header-info">
                                <h2 className="payment-modal-title" id="add-payment-modal-title">Add Payment Method</h2>
                                <span className="payment-modal-subtitle">Save a credit or debit card for secure 1-click checkout</span>
                            </div>
                            <button
                                type="button"
                                className="payment-modal-close-btn"
                                onClick={() => setIsAddModalOpen(false)}
                                aria-label="Close dialog"
                            >
                                &times;
                            </button>
                        </div>

                        <form className="payment-modal-form" onSubmit={handleFormSubmit}>
                            <div className="payment-modal-body">
                                <div className="virtual-card-preview">
                                    <div className="virtual-card-top">
                                        <div className="virtual-card-chip"></div>
                                        <span className="virtual-card-brand">{cardBrand}</span>
                                    </div>
                                    <div className="virtual-card-number">
                                        {formatCardDisplay(cardNumber)}
                                    </div>
                                    <div className="virtual-card-bottom">
                                        <div>
                                            <span className="virtual-card-label">CARDHOLDER</span>
                                            <strong className="virtual-card-val">
                                                {cardName.trim() ? cardName.toUpperCase() : 'YOUR NAME'}
                                            </strong>
                                        </div>
                                        <div>
                                            <span className="virtual-card-label">EXPIRES</span>
                                            <strong className="virtual-card-val">
                                                {expiry.trim() ? expiry : 'MM/YY'}
                                            </strong>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="form-label">Card Network</label>
                                    <div className="payment-brand-pills">
                                        {['VISA', 'Mastercard', 'AMEX', 'Discover'].map((brand) => (
                                            <button
                                                key={brand}
                                                type="button"
                                                className={`payment-brand-pill ${cardBrand === brand ? 'active' : ''}`}
                                                onClick={() => setCardBrand(brand)}
                                            >
                                                {brand === 'VISA' && '💳 '}
                                                {brand === 'Mastercard' && '🔴 '}
                                                {brand === 'AMEX' && '🟦 '}
                                                {brand === 'Discover' && '🟧 '}
                                                {brand}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="form-label" htmlFor="cardholder-name">
                                        Cardholder Name <span className="required">*</span>
                                    </label>
                                    <input
                                        id="cardholder-name"
                                        type="text"
                                        className="input"
                                        placeholder="Full name as printed on card"
                                        value={cardName}
                                        onChange={(e) => setCardName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="form-label" htmlFor="card-number">
                                        Card Number <span className="required">*</span>
                                    </label>
                                    <div className="card-input-wrapper">
                                        <input
                                            id="card-number"
                                            type="text"
                                            className="input card-number-input"
                                            placeholder="1234 5678 9012 3456"
                                            maxLength="19"
                                            value={cardNumber}
                                            onChange={(e) => setCardNumber(e.target.value)}
                                            required
                                        />
                                        <span className="card-input-icon">🔒</span>
                                    </div>
                                </div>

                                <div className="payment-form-row-2">
                                    <div>
                                        <label className="form-label" htmlFor="card-expiry">
                                            Expiration Date <span className="required">*</span>
                                        </label>
                                        <input
                                            id="card-expiry"
                                            type="text"
                                            className="input"
                                            placeholder="MM / YY"
                                            maxLength="5"
                                            value={expiry}
                                            onChange={(e) => setExpiry(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label" htmlFor="card-cvv">
                                            Security Code (CVV) <span className="required">*</span>
                                        </label>
                                        <div className="cvv-input-wrapper">
                                            <input
                                                id="card-cvv"
                                                type="password"
                                                className="input"
                                                placeholder="3 or 4 digits"
                                                maxLength="4"
                                                value={cvv}
                                                onChange={(e) => setCvv(e.target.value)}
                                                required
                                            />
                                            <span className="cvv-hint" title="3 digits on back of card, 4 digits on front of AMEX">ℹ️</span>
                                        </div>
                                    </div>
                                </div>

                                <label className="payment-checkbox-wrapper" htmlFor="payment-is-default">
                                    <input type="checkbox" id="payment-is-default" />
                                    <div className="payment-checkbox-label">
                                        <strong>Set as default payment method</strong>
                                        <span>Pre-selected for fast one-click checkout on upcoming orders</span>
                                    </div>
                                </label>

                                <div className="payment-security-notice">
                                    <span className="security-icon">🛡️</span>
                                    <span>PCI-DSS compliant 256-bit SSL encryption. We never store full card CVV codes.</span>
                                </div>
                            </div>

                            <div className="payment-modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setIsAddModalOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Save Payment Method
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentMethod;
