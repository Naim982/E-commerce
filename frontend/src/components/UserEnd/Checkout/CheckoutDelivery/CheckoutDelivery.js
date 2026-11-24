import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './CheckoutDelivery.css';

import { getProductDataById, getUserData, addShippingAddress } from '../../../../api/apiManager';
import useAuth from '../../../../authentication/useAuth';
import { useCheckout } from '../../../../context/CheckoutContext';
import { BANGLADESH_DISTRICTS } from '../../../../data/bangladeshDistricts';

const CheckoutDelivery = () => {
    const { user } = useAuth();
    const user_id = user?.uid;
    const navigate = useNavigate();

    const { checkout, setCheckout } = useCheckout();
    const checkoutItems = checkout.checkoutItems;
    const checkoutSource = checkout.source;

    const [checkout1Items, setCheckout1Items] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState('');
    const [isNewAddressOpen, setIsNewAddressOpen] = useState(false);
    const [shippingMethod, setShippingMethod] = useState(
        checkout.delivery?.name
            ? Object.keys({
                standard: { name: 'Standard Carbon-Neutral Delivery', price: 0 },
                express: { name: 'Express Priority Air (Recommended for GPUs)', price: 14.99 },
                sameday: { name: 'Same-Day Priority Courier (Bay Area Only)', price: 24.99 }
            }).find(key => ({
                standard: 'Standard Carbon-Neutral Delivery',
                express: 'Express Priority Air (Recommended for GPUs)',
                sameday: 'Same-Day Priority Courier (Bay Area Only)'
            })[key] === checkout.delivery.name) || 'standard'
            : 'standard'
    );

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadCheckoutData = async () => {
            setLoading(true);
            setError('');

            if (checkoutItems.length === 0) {
                setError('No items selected for checkout.');
                setLoading(false);
                return;
            }

            try {
                const productResults = await Promise.all(
                    checkoutItems.map(async (item) => {
                        const productResult = await getProductDataById(item.id);
                        if (!productResult.success) {
                            return null;
                        }
                        return {
                            ...item,
                            product: productResult.product
                        };
                    })
                );

                const validItems = productResults.filter(item => item !== null);
                if (validItems.length === 0) {
                    setError('Unable to load checkout products.');
                    setLoading(false);
                    return;
                }

                const userResult = await getUserData(user_id);
                if (!userResult.success) {
                    setError(userResult.error);
                    setLoading(false);
                    return;
                }

                const userAddresses = userResult.user?.addresses || [];
                setCheckout1Items(validItems);
                setAddresses(userAddresses);

                const savedAddress = checkout.address;
                if (savedAddress) {
                    const matchingAddress = userAddresses.find(address => (
                        address.recipientName === savedAddress.name &&
                        address.phone === savedAddress.phone &&
                        address.street === savedAddress.street &&
                        (address.apartment || '') === (savedAddress.apartment || '') &&
                        address.city === savedAddress.city &&
                        address.zipCode === savedAddress.postal
                    ));

                    if (matchingAddress) {
                        setSelectedAddressId(matchingAddress.id);
                    }
                } else {
                    const defaultAddress = userAddresses.find(address => address.isDefault);
                    if (defaultAddress) {
                        setSelectedAddressId(defaultAddress.id);
                    } else if (userAddresses.length > 0) {
                        setSelectedAddressId(userAddresses[0].id);
                    }
                }
            } catch (error) {
                console.error(error);
                setError('Unable to load checkout information.');
            } finally {
                setLoading(false);
            }
        };

        if (user_id) {
            loadCheckoutData();
        }
    }, [checkoutItems, checkout.address, user_id]);

    const selectedAddress = addresses.find(address => address.id === selectedAddressId);

    const shippingMethods = {
        standard: {
            name: 'Standard Carbon-Neutral Delivery',
            description: 'Delivered in 3–5 business days via courier with full transit insurance.',
            estimated: 'Estimated Delivery: 2–3 business days',
            price: 0
        },
        express: {
            name: 'Express Priority Air (Recommended for GPUs)',
            description: 'Delivered in 1–2 business days with signature requirement and tamper-evident seal.',
            estimated: 'Estimated Delivery: Next business day',
            price: 150
        },
        sameday: {
            name: 'Same-Day Priority Courier (Dhaka Metro Only)',
            description: 'Guaranteed direct delivery within 6 hours from our local distribution hub.',
            estimated: 'Estimated Delivery: Today by 7:00 PM',
            price: 300
        }
    };

    const getItemPrice = (item) => {
        const basePrice = Number(item.product?.price?.current) || 0;
        const variantPrice = (item.variant || []).reduce(
            (total, variant) => total + (Number(variant.priceModifier) || 0), 0
        );
        return basePrice + variantPrice;
    };

    const subtotal = checkout1Items.reduce((total, item) => {
        const itemPrice = getItemPrice(item);
        return total + (itemPrice * item.quantity);
    }, 0);

    const selectedShipping = shippingMethods[shippingMethod];
    const shippingPrice = selectedShipping.price;
    const total = subtotal + shippingPrice;

    const [isSavingNewAddr, setIsSavingNewAddr] = useState(false);
    const [newAddrError, setNewAddrError] = useState('');
    const [newAddrLabel, setNewAddrLabel] = useState('Home');

    const handleSaveNewAddress = async (e) => {
        e.preventDefault();
        setNewAddrError('');
        setIsSavingNewAddr(true);

        const form = e.currentTarget;
        const apt = form.apartment.value.trim();
        const street = form.street.value.trim();
        const villageArea = form.villageArea.value.trim();
        const thana = form.thana.value.trim();
        const postalCode = form.postalCode.value.trim();
        const district = form.district.value;

        const payload = {
            label: newAddrLabel || 'Home',
            recipientName: form.recipientName.value.trim(),
            phone: form.phone.value.trim(),
            apartment: apt,
            suite: apt,
            street: street,
            villageArea: villageArea,
            city: villageArea,
            thana: thana,
            state: thana,
            postalCode: postalCode,
            zipCode: postalCode,
            postal: postalCode,
            district: district,
            country: 'Bangladesh',
            isDefault: Boolean(form.isDefault?.checked)
        };

        if (!user_id) {
            const guestAddr = { ...payload, id: `addr_${Date.now()}` };
            setAddresses(prev => [guestAddr, ...prev]);
            setSelectedAddressId(guestAddr.id);
            setIsNewAddressOpen(false);
            setIsSavingNewAddr(false);
            return;
        }

        const result = await addShippingAddress(user_id, payload);
        setIsSavingNewAddr(false);

        if (result.success) {
            const updatedAddresses = result.user?.addresses || [];
            setAddresses(updatedAddresses);
            const created = result.address || updatedAddresses[updatedAddresses.length - 1];
            if (created?.id) {
                setSelectedAddressId(created.id);
            }
            setIsNewAddressOpen(false);
        } else {
            setNewAddrError(result.error || 'Failed to save address. Please try again.');
        }
    };

    const handleContinueToReview = () => {
        if (!selectedAddress) {
            setError('Please select a shipping address.');
            return;
        }

        const addressData = {
            name: selectedAddress.recipientName,
            recipientName: selectedAddress.recipientName,
            phone: selectedAddress.phone,
            apartment: selectedAddress.apartment || selectedAddress.suite || '',
            suite: selectedAddress.apartment || selectedAddress.suite || '',
            street: selectedAddress.street,
            villageArea: selectedAddress.villageArea || selectedAddress.city || '',
            city: selectedAddress.villageArea || selectedAddress.city || '',
            thana: selectedAddress.thana || (selectedAddress.state && selectedAddress.state !== 'Bangladesh' ? selectedAddress.state : ''),
            state: selectedAddress.thana || (selectedAddress.state && selectedAddress.state !== 'Bangladesh' ? selectedAddress.state : ''),
            postalCode: selectedAddress.postalCode || selectedAddress.zipCode || selectedAddress.postal || '',
            zipCode: selectedAddress.postalCode || selectedAddress.zipCode || selectedAddress.postal || '',
            postal: selectedAddress.postalCode || selectedAddress.zipCode || selectedAddress.postal || '',
            district: selectedAddress.district || (selectedAddress.country !== 'Bangladesh' ? selectedAddress.country : 'Dhaka'),
            country: 'Bangladesh'
        };

        const deliveryData = {
            name: selectedShipping.name,
            price: selectedShipping.price
        };

        setCheckout({
            source: checkoutSource,
            checkoutItems: checkoutItems,
            address: addressData,
            delivery: deliveryData
        });

        navigate('/product-review');
    };

    if (loading) {
        return <div className="catalog-state-box">Loading checkout...</div>;
    }
    if (error) {
        return <div className="catalog-state-box">{error}</div>;
    }
    if (checkout1Items.length === 0) {
        return <div className="catalog-state-box">No items selected for checkout.</div>;
    }

    return (
        <div>
            <main className="checkout-main-content">
                <div className="container">
                    <div className="checkout-progress-bar">
                        <div className="checkout-progress-step active" id="prog-step-1">
                            <div className="checkout-step-circle">01</div>
                            <span>Delivery</span>
                        </div>
                        <div className="checkout-progress-line" />
                        <div className="checkout-progress-step" id="prog-step-2">
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
                            <section className="checkout-card-section" id="section-shipping-address">
                                <div className="checkout-section-title-row">
                                    <div className="checkout-step-indicator">1</div>
                                    <h1 className="checkout-section-heading">Shipping Address</h1>
                                </div>

                                {addresses.length > 0 ? (
                                    <div className="checkout-saved-addresses-grid" id="checkout-saved-addresses">
                                        {addresses.map(address => {
                                            const isSelected = selectedAddressId === address.id;
                                            return (
                                                <label key={address.id} className={`checkout-addr-card ${isSelected ? 'selected' : ''}`} data-id={address.id}>
                                                    <div className="checkout-addr-top">
                                                        <input
                                                            type="radio"
                                                            name="shipping-address-choice"
                                                            value={address.id}
                                                            checked={isSelected}
                                                            onChange={() => setSelectedAddressId(address.id)}
                                                        />
                                                        <span className={`badge ${address.isDefault ? 'badge-accent' : 'badge-primary'}`}>
                                                            {address.label}
                                                        </span>
                                                    </div>

                                                    <strong className="checkout-addr-name">{address.recipientName}</strong>
                                                    <span className="checkout-addr-phone">{address.phone}</span>
                                                    <p className="checkout-addr-text">
                                                        {(address.apartment || address.suite) && (
                                                            <span>{address.apartment || address.suite}<br /></span>
                                                        )}
                                                        <strong>{address.street}</strong><br />
                                                        {[address.villageArea || address.city, address.thana ? `Thana: ${address.thana}` : (address.state && address.state !== 'Bangladesh' ? address.state : '')].filter(Boolean).join(', ')}<br />
                                                        {[address.district || (address.country !== 'Bangladesh' ? address.country : 'Dhaka'), address.postalCode || address.zipCode || address.postal].filter(Boolean).join(' - ')}, Bangladesh
                                                    </p>

                                                    <div className="checkout-addr-actions" style={{ marginTop: '6px', display: 'flex', gap: '8px' }}>
                                                        <button
                                                            type="button"
                                                            className="btn btn-xs btn-outline"
                                                            onClick={(e) => { e.preventDefault(); setSelectedAddressId(address.id); }}
                                                        >
                                                            {isSelected ? '✓ Selected' : 'Select'}
                                                        </button>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="catalog-state-box">
                                        No saved shipping addresses found.
                                    </div>
                                )}

                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline"
                                    id="btn-toggle-new-addr"
                                    style={{ marginTop: 'var(--space-4)' }}
                                    onClick={() => setIsNewAddressOpen(prev => !prev)}
                                >
                                    <span>{isNewAddressOpen ? '− Close Address Form' : '+ Add a New Address'}</span>
                                </button>

                                {isNewAddressOpen && (
                                    <form className="checkout-new-addr-form" id="checkout-new-addr-panel" onSubmit={handleSaveNewAddress}>
                                        <h3 className="checkout-subheading" style={{ marginBottom: 'var(--space-3)' }}>
                                            New Shipping Destination
                                        </h3>

                                        {newAddrError && (
                                            <div style={{ color: 'var(--color-error)', background: 'var(--color-error-bg)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-3)', fontSize: '0.8125rem' }}>
                                                {newAddrError}
                                            </div>
                                        )}

                                        <div className="checkout-form-row">
                                            <div className="form-group">
                                                <label className="form-label">Recipient Full Name *</label>
                                                <input
                                                    name="recipientName"
                                                    type="text"
                                                    className="input"
                                                    placeholder="e.g. Alexander Rahman"
                                                    required
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">Mobile Phone Number *</label>
                                                <input
                                                    name="phone"
                                                    type="tel"
                                                    className="input"
                                                    placeholder="+880 1XXX XXXXXX"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="checkout-form-row single-col">
                                            <div className="form-group">
                                                <label className="form-label">Apartment, Unit (Optional)</label>
                                                <input
                                                    name="apartment"
                                                    type="text"
                                                    className="input"
                                                    placeholder="e.g. Apt 4B, Flat 3A, Level 2, Holding 15"
                                                />
                                            </div>
                                        </div>

                                        <div className="checkout-form-row single-col">
                                            <div className="form-group">
                                                <label className="form-label">Street Address *</label>
                                                <input
                                                    name="street"
                                                    type="text"
                                                    className="input"
                                                    placeholder="e.g. Road 12, House 45 / Main Avenue"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="checkout-form-row">
                                            <div className="form-group">
                                                <label className="form-label">Village / Area *</label>
                                                <input
                                                    name="villageArea"
                                                    type="text"
                                                    className="input"
                                                    placeholder="e.g. Sector 4, Uttara / Nagua"
                                                    required
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">Police Station (Thana) *</label>
                                                <input
                                                    name="thana"
                                                    type="text"
                                                    className="input"
                                                    placeholder="e.g. Uttara West / Kishoreganj Sadar"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="checkout-form-row">
                                            <div className="form-group">
                                                <label className="form-label">Postal Code *</label>
                                                <input
                                                    name="postalCode"
                                                    type="text"
                                                    className="input"
                                                    placeholder="e.g. 1230, 2300"
                                                    required
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">District *</label>
                                                <select
                                                    name="district"
                                                    className="select"
                                                    defaultValue="Dhaka"
                                                    required
                                                >
                                                    {BANGLADESH_DISTRICTS.map((dist) => (
                                                        <option key={dist} value={dist}>
                                                            {dist}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="checkout-form-row">
                                            <div className="form-group">
                                                <label className="form-label">Address Label</label>
                                                <select
                                                    name="label"
                                                    className="select"
                                                    value={newAddrLabel}
                                                    onChange={(e) => setNewAddrLabel(e.target.value)}
                                                >
                                                    <option value="Home">Home 🏠</option>
                                                    <option value="Office">Office 🏢</option>
                                                    <option value="Lab / Studio">Lab / Studio 🔬</option>
                                                    <option value="Warehouse">Warehouse 📦</option>
                                                </select>
                                            </div>

                                            <div className="form-group" style={{ justifyContent: 'center' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '18px', fontSize: '0.8125rem' }}>
                                                    <input type="checkbox" name="isDefault" defaultChecked={addresses.length === 0} />
                                                    <span>Set as default shipping address</span>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="checkout-new-addr-actions">
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-secondary"
                                                onClick={() => setIsNewAddressOpen(false)}
                                                disabled={isSavingNewAddr}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="btn btn-sm btn-primary"
                                                disabled={isSavingNewAddr}
                                            >
                                                {isSavingNewAddr ? 'Saving...' : 'Save & Deliver Here'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </section>

                            <section className="checkout-card-section" id="section-delivery-method">
                                <div className="checkout-section-title-row">
                                    <div className="checkout-step-indicator">2</div>
                                    <h2 className="checkout-section-heading">Delivery Method & Packaging</h2>
                                </div>

                                <div className="checkout-delivery-options">
                                    <label className={`checkout-delivery-card ${shippingMethod === 'standard' ? 'selected' : ''}`} data-shipping="0.00">
                                        <div className="checkout-delivery-left">
                                            <input
                                                type="radio"
                                                name="shipping-speed"
                                                value="standard"
                                                checked={shippingMethod === 'standard'}
                                                onChange={() => setShippingMethod('standard')}
                                            />
                                            <div>
                                                <strong>Standard Carbon-Neutral Delivery</strong>
                                                <small className="delivery-est-date">Estimated Delivery: Sep 2 – Sep 4, 2026</small>
                                            </div>
                                        </div>
                                        <div className="checkout-delivery-price free">FREE</div>
                                    </label>

                                    <label className={`checkout-delivery-card ${shippingMethod === 'express' ? 'selected' : ''}`} data-shipping="14.99">
                                        <div className="checkout-delivery-left">
                                            <input
                                                type="radio"
                                                name="shipping-speed"
                                                value="express"
                                                checked={shippingMethod === 'express'}
                                                onChange={() => setShippingMethod('express')}
                                            />
                                            <div>
                                                <strong>Express Priority Air (Recommended for GPUs)</strong>
                                                <small className="delivery-est-date">Estimated Delivery: Aug 30 – Aug 31, 2026</small>
                                            </div>
                                        </div>
                                        <div className="checkout-delivery-price">৳150.00</div>
                                    </label>

                                    <label className={`checkout-delivery-card ${shippingMethod === 'sameday' ? 'selected' : ''}`} data-shipping="300">
                                        <div className="checkout-delivery-left">
                                            <input
                                                type="radio"
                                                name="shipping-speed"
                                                value="sameday"
                                                checked={shippingMethod === 'sameday'}
                                                onChange={() => setShippingMethod('sameday')}
                                            />
                                            <div>
                                                <strong>Same-Day Priority Courier (Dhaka Metro Only)</strong>
                                                <small className="delivery-est-date">Estimated Delivery: Today by 7:00 PM</small>
                                            </div>
                                        </div>
                                        <div className="checkout-delivery-price">৳300.00</div>
                                    </label>
                                </div>

                                <div className="checkout-step-footer flex-between" style={{ marginTop: 'var(--space-6)' }}>
                                    {checkoutSource === 'cart' ? (
                                        <Link to="/cart" className="btn btn-outline">
                                            &larr; Return to Cart
                                        </Link>
                                    ) : (
                                        <button type="button" className="btn btn-outline" onClick={() => window.history.back()}>
                                            &larr; Return
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        className="btn btn-lg btn-primary"
                                        onClick={handleContinueToReview}
                                    >
                                        <span>Continue to Review Order &rarr;</span>
                                    </button>
                                </div>
                            </section>
                        </div>

                        <aside className="checkout-summary-col" aria-label="Delivery Summary">
                            <div className="checkout-summary-card">
                                <h3 className="checkout-summary-title">Delivery Summary</h3>
                                <span className="checkout-summary-sub" id="checkout-flow-label">
                                    {checkoutSource === 'direct'
                                        ? 'Express Buy Flow'
                                        : `Cart Flow (${checkout1Items.length} ${checkout1Items.length === 1 ? 'Item' : 'Items'})`}
                                </span>

                                <div className="checkout-cart-items-preview" id="checkout-cart-items-preview">
                                    {checkout1Items.map(item => {
                                        const product = item.product;
                                        const itemPrice = getItemPrice(item);
                                        const itemTotal = itemPrice * item.quantity;
                                        const variantText = (item.variant || []).map(variant => variant.name).join(' • ');

                                        return (
                                            <div key={item.id} style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                                                <img
                                                    src={product.mainImage}
                                                    alt={product.title}
                                                    style={{ width: '55px', height: '55px', objectFit: 'cover', borderRadius: '6px' }}
                                                />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <strong style={{ display: 'block', fontSize: '0.8rem' }}>
                                                        {product.title}
                                                    </strong>
                                                    {variantText && (
                                                        <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '3px' }}>
                                                            {variantText}
                                                        </span>
                                                    )}
                                                    <span style={{ display: 'block', fontSize: '0.75rem', marginTop: '3px' }}>
                                                        Qty: {item.quantity}
                                                    </span>
                                                </div>

                                                <strong style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                                    ${itemTotal.toFixed(2)}
                                                </strong>
                                            </div>
                                        );
                                    })}
                                </div>

                                <hr className="divider" style={{ marginBlock: 'var(--space-4)' }} />

                                <div className="checkout-delivery-snapshot-box">
                                    <span className="checkout-subheading">DELIVERING TO:</span>
                                    <strong id="deliv-dest-preview">
                                        {selectedAddress?.recipientName || 'Select an address'}
                                    </strong>

                                    {selectedAddress && (
                                        <p id="deliv-addr-preview" style={{ fontSize: '0.775rem', color: 'var(--color-text-secondary)' }}>
                                            {selectedAddress.street},{' '}
                                            {selectedAddress.city},{' '}
                                            {selectedAddress.state}{' '}
                                            {selectedAddress.zipCode},{' '}
                                            {selectedAddress.country}
                                        </p>
                                    )}

                                    <div style={{ marginTop: '6px' }}>
                                        <span className="checkout-subheading">SHIPPING SPEED:</span>
                                        <p id="deliv-speed-preview" style={{ fontSize: '0.775rem', color: 'var(--color-text-primary)', fontWeight: 700 }}>
                                            {selectedShipping.name} {shippingPrice === 0 ? '(FREE)' : `(৳${shippingPrice.toFixed(2)})`}
                                        </p>
                                    </div>
                                </div>

                                <div style={{ marginTop: 'var(--space-4)' }}>
                                    <div className="cart-breakdown-row">
                                        <span>Hardware Subtotal:</span>
                                        <strong>৳{subtotal.toFixed(2)}</strong>
                                    </div>
                                    <div className="cart-breakdown-row">
                                        <span>Promotional Discount:</span>
                                        <span>৳0.00</span>
                                    </div>
                                    <div className="cart-breakdown-row">
                                        <span>Shipping:</span>
                                        <span>{shippingPrice === 0 ? 'FREE' : `৳${shippingPrice.toFixed(2)}`}</span>
                                    </div>

                                    <hr className="divider" style={{ marginBlock: 'var(--space-3)' }} />

                                    <div className="cart-total-row">
                                        <span>Estimated Total:</span>
                                        <strong className="cart-total-amount">৳{total.toFixed(2)}</strong>
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
        </div>
    );
};

export default CheckoutDelivery;
