import React, { useState, useEffect, useCallback } from 'react';
import { getAdminSettings, updateAdminSettings } from '../../../api/apiManager';
import AdminPageHeader from '../shared/AdminPageHeader';
import LoadingSpinner from '../shared/LoadingSpinner';
import { useAdminToast } from '../Layout/AdminLayout';
import {
    SettingsIcon,
    DollarIcon,
    TruckIcon,
    AlertIcon,
    CheckIcon
} from '../shared/AdminIcons';

const Settings = () => {
    const { addToast } = useAdminToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        store: {
            name: '',
            legalName: '',
            tagline: '',
            email: '',
            phone: '',
            supportHours: '',
            address: '',
            city: '',
            state: '',
            zip: '',
            country: ''
        },
        commerce: {
            currency: 'BDT',
            currencySymbol: '৳',
            taxRate: 8.0,
            pricesIncludeTax: false,
            allowGuestCheckout: false
        },
        shipping: {
            standardRate: 0.0,
            expressRate: 14.99,
            priorityRate: 24.99,
            freeShippingThreshold: 75.0,
            defaultOriginState: 'CA'
        },
        inventory: {
            lowStockThreshold: 5,
            hideOutOfStock: false,
            notifyAdminOnLowStock: true,
            adminAlertEmail: ''
        }
    });

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAdminSettings();
            if (res.success && res.settings) {
                setFormData(prev => ({
                    store: { ...prev.store, ...(res.settings.store || {}) },
                    commerce: { ...prev.commerce, ...(res.settings.commerce || {}) },
                    shipping: { ...prev.shipping, ...(res.settings.shipping || {}) },
                    inventory: { ...prev.inventory, ...(res.settings.inventory || {}) }
                }));
            } else {
                addToast(res.error || 'Failed to load settings', 'error');
            }
        } catch (err) {
            console.error(err);
            addToast('Error loading store settings', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    // Input handlers
    const handleNestedChange = (section, field, value) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    // Save handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                store: { ...formData.store },
                commerce: {
                    ...formData.commerce,
                    taxRate: parseFloat(formData.commerce.taxRate || 0)
                },
                shipping: {
                    ...formData.shipping,
                    standardRate: parseFloat(formData.shipping.standardRate || 0),
                    expressRate: parseFloat(formData.shipping.expressRate || 0),
                    priorityRate: parseFloat(formData.shipping.priorityRate || 0),
                    freeShippingThreshold: parseFloat(formData.shipping.freeShippingThreshold || 0)
                },
                inventory: {
                    ...formData.inventory,
                    lowStockThreshold: parseInt(formData.inventory.lowStockThreshold || 5, 10)
                }
            };

            const res = await updateAdminSettings(payload);
            if (res.success) {
                addToast('Store settings saved successfully!', 'success');
            } else {
                addToast(res.error || 'Failed to save settings', 'error');
            }
        } catch (err) {
            console.error(err);
            addToast('Error saving settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-page">
                <AdminPageHeader title="Store Settings" description="Loading store configurations..." />
                <LoadingSpinner text="Loading settings..." />
            </div>
        );
    }

    return (
        <div className="admin-page">
            <form onSubmit={handleSubmit}>
                <AdminPageHeader
                    title="Store Settings & Configuration"
                    description="Configure legal store information, taxation, fulfillment fees, and inventory thresholds."
                >
                    <button
                        type="submit"
                        className="admin-btn admin-btn-primary"
                        disabled={saving}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <CheckIcon /> {saving ? 'Saving Changes...' : 'Save All Settings'}
                    </button>
                </AdminPageHeader>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* SECTION 1: STORE PROFILE */}
                    <div className="admin-card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <div style={{ color: 'var(--admin-primary)' }}><SettingsIcon /></div>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--admin-text-main)', margin: 0 }}>
                                Store Profile & Business Identity
                            </h3>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            <div className="admin-form-group">
                                <label className="admin-label">Store Brand Name *</label>
                                <input
                                    type="text"
                                    value={formData.store.name}
                                    onChange={(e) => handleNestedChange('store', 'name', e.target.value)}
                                    className="admin-input"
                                    required
                                />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-label">Legal Entity Name</label>
                                <input
                                    type="text"
                                    value={formData.store.legalName}
                                    onChange={(e) => handleNestedChange('store', 'legalName', e.target.value)}
                                    className="admin-input"
                                />
                            </div>
                        </div>

                        <div className="admin-form-group" style={{ marginBottom: '16px' }}>
                            <label className="admin-label">Storefront Tagline</label>
                            <input
                                type="text"
                                value={formData.store.tagline}
                                onChange={(e) => handleNestedChange('store', 'tagline', e.target.value)}
                                className="admin-input"
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            <div className="admin-form-group">
                                <label className="admin-label">Customer Support Email *</label>
                                <input
                                    type="email"
                                    value={formData.store.email}
                                    onChange={(e) => handleNestedChange('store', 'email', e.target.value)}
                                    className="admin-input"
                                    required
                                />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-label">Toll-Free Phone</label>
                                <input
                                    type="text"
                                    value={formData.store.phone}
                                    onChange={(e) => handleNestedChange('store', 'phone', e.target.value)}
                                    className="admin-input"
                                />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-label">Support Hours</label>
                                <input
                                    type="text"
                                    value={formData.store.supportHours}
                                    onChange={(e) => handleNestedChange('store', 'supportHours', e.target.value)}
                                    className="admin-input"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '16px' }}>
                            <div className="admin-form-group">
                                <label className="admin-label">Street Address</label>
                                <input
                                    type="text"
                                    value={formData.store.address}
                                    onChange={(e) => handleNestedChange('store', 'address', e.target.value)}
                                    className="admin-input"
                                />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-label">City</label>
                                <input
                                    type="text"
                                    value={formData.store.city}
                                    onChange={(e) => handleNestedChange('store', 'city', e.target.value)}
                                    className="admin-input"
                                />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-label">State</label>
                                <input
                                    type="text"
                                    value={formData.store.state}
                                    onChange={(e) => handleNestedChange('store', 'state', e.target.value)}
                                    className="admin-input"
                                />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-label">Zip Code</label>
                                <input
                                    type="text"
                                    value={formData.store.zip}
                                    onChange={(e) => handleNestedChange('store', 'zip', e.target.value)}
                                    className="admin-input"
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: COMMERCE & TAX */}
                    <div className="admin-card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <div style={{ color: 'var(--admin-success)' }}><DollarIcon /></div>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--admin-text-main)', margin: 0 }}>
                                Pricing & Taxation
                            </h3>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            <div className="admin-form-group">
                                <label className="admin-label">Primary Currency</label>
                                <select
                                    value={formData.commerce.currency}
                                    onChange={(e) => handleNestedChange('commerce', 'currency', e.target.value)}
                                    className="admin-select"
                                >
                                    <option value="USD">USD - US Dollar ($)</option>
                                    <option value="CAD">CAD - Canadian Dollar (CA$)</option>
                                    <option value="EUR">EUR - Euro (€)</option>
                                    <option value="GBP">GBP - British Pound (£)</option>
                                </select>
                            </div>

                            <div className="admin-form-group">
                                <label className="admin-label">Default Sales Tax Rate (%)</label>
                                <input
                                    type="number"
                                    value={formData.commerce.taxRate}
                                    onChange={(e) => handleNestedChange('commerce', 'taxRate', e.target.value)}
                                    className="admin-input"
                                    step="0.01"
                                    min="0"
                                    max="50"
                                />
                            </div>

                            <div className="admin-form-group" style={{ display: 'flex', alignItems: 'center', paddingTop: '28px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '500' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.commerce.pricesIncludeTax}
                                        onChange={(e) => handleNestedChange('commerce', 'pricesIncludeTax', e.target.checked)}
                                        style={{ width: '18px', height: '18px' }}
                                    />
                                    Product prices already include tax
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: SHIPPING & FULFILLMENT */}
                    <div className="admin-card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <div style={{ color: 'var(--admin-info, #0ea5e9)' }}><TruckIcon /></div>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--admin-text-main)', margin: 0 }}>
                                Shipping Rates & Thresholds
                            </h3>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                            <div className="admin-form-group">
                                <label className="admin-label">Free Shipping Minimum ($)</label>
                                <input
                                    type="number"
                                    value={formData.shipping.freeShippingThreshold}
                                    onChange={(e) => handleNestedChange('shipping', 'freeShippingThreshold', e.target.value)}
                                    className="admin-input"
                                    step="any"
                                    min="0"
                                />
                            </div>

                            <div className="admin-form-group">
                                <label className="admin-label">Standard Ground Fee ($)</label>
                                <input
                                    type="number"
                                    value={formData.shipping.standardRate}
                                    onChange={(e) => handleNestedChange('shipping', 'standardRate', e.target.value)}
                                    className="admin-input"
                                    step="any"
                                    min="0"
                                />
                            </div>

                            <div className="admin-form-group">
                                <label className="admin-label">Express 2-Day Fee ($)</label>
                                <input
                                    type="number"
                                    value={formData.shipping.expressRate}
                                    onChange={(e) => handleNestedChange('shipping', 'expressRate', e.target.value)}
                                    className="admin-input"
                                    step="any"
                                    min="0"
                                />
                            </div>

                            <div className="admin-form-group">
                                <label className="admin-label">Priority Overnight Fee ($)</label>
                                <input
                                    type="number"
                                    value={formData.shipping.priorityRate}
                                    onChange={(e) => handleNestedChange('shipping', 'priorityRate', e.target.value)}
                                    className="admin-input"
                                    step="any"
                                    min="0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 4: INVENTORY ALERTS */}
                    <div className="admin-card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <div style={{ color: 'var(--admin-warning)' }}><AlertIcon /></div>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--admin-text-main)', margin: 0 }}>
                                Inventory Alerts & Stock Thresholds
                            </h3>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            <div className="admin-form-group">
                                <label className="admin-label">Low Stock Warning Threshold (Units)</label>
                                <input
                                    type="number"
                                    value={formData.inventory.lowStockThreshold}
                                    onChange={(e) => handleNestedChange('inventory', 'lowStockThreshold', e.target.value)}
                                    className="admin-input"
                                    min="1"
                                    max="100"
                                />
                                <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: '4px' }}>
                                    Products with available stock at or below this number trigger low-stock alerts on the dashboard and inventory list.
                                </div>
                            </div>

                            <div className="admin-form-group">
                                <label className="admin-label">Admin Alert Email</label>
                                <input
                                    type="email"
                                    value={formData.inventory.adminAlertEmail}
                                    onChange={(e) => handleNestedChange('inventory', 'adminAlertEmail', e.target.value)}
                                    className="admin-input"
                                    placeholder="admin@lumenhardware.com"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '24px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '500' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.inventory.notifyAdminOnLowStock}
                                    onChange={(e) => handleNestedChange('inventory', 'notifyAdminOnLowStock', e.target.checked)}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                Email administrator when items reach critical stock
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '500' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.inventory.hideOutOfStock}
                                    onChange={(e) => handleNestedChange('inventory', 'hideOutOfStock', e.target.checked)}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                Automatically hide out-of-stock items from storefront search
                            </label>
                        </div>
                    </div>

                    {/* Bottom Save Bar */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                        <button
                            type="submit"
                            className="admin-btn admin-btn-primary"
                            disabled={saving}
                            style={{ minWidth: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            <CheckIcon /> {saving ? 'Saving...' : 'Save All Settings'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default Settings;
