import React, { useEffect, useState } from 'react';
import './ShippingAddress.css';
import {
    addShippingAddress,
    updateShippingAddress,
    setDefaultShippingAddress,
    deleteShippingAddress
} from '../../../../api/apiManager';
import { BANGLADESH_DISTRICTS } from '../../../../data/bangladeshDistricts';

const ShippingAddress = ({ user }) => {
    const [addresses, setAddresses] = useState([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);

    const [selectedLabel, setSelectedLabel] = useState('Home');
    const [editLabel, setEditLabel] = useState('Home');
    const [isSaving, setIsSaving] = useState(false);
    const [actionMessage, setActionMessage] = useState('');

    useEffect(() => {
        setAddresses(user?.addresses || []);
    }, [user]);

    const showTemporaryMessage = (msg) => {
        setActionMessage(msg);
        setTimeout(() => {
            setActionMessage('');
        }, 3000);
    };

    const handleOpenEditModal = (address) => {
        setEditingAddress(address);
        setEditLabel(address.label || 'Home');
        setIsEditModalOpen(true);
    };

    const handleAddAddress = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        const form = e.currentTarget;
        const apartmentVal = form.apartment.value.trim();
        const streetVal = form.street.value.trim();
        const villageAreaVal = form.villageArea.value.trim();
        const thanaVal = form.thana.value.trim();
        const postalCodeVal = form.postalCode.value.trim();
        const districtVal = form.district.value;

        const newAddress = {
            label: selectedLabel || 'Home',
            recipientName: form.recipientName.value.trim(),
            phone: form.phone.value.trim(),
            apartment: apartmentVal,
            suite: apartmentVal,
            street: streetVal,
            villageArea: villageAreaVal,
            city: villageAreaVal,
            thana: thanaVal,
            state: thanaVal,
            postalCode: postalCodeVal,
            zipCode: postalCodeVal,
            postal: postalCodeVal,
            district: districtVal,
            country: 'Bangladesh',
            instructions: form.instructions ? form.instructions.value.trim() : '',
            isDefault: Boolean(form.isDefault?.checked)
        };

        const result = await addShippingAddress(user.id, newAddress);
        setIsSaving(false);

        if (result.success) {
            setAddresses(result.user?.addresses || []);
            setIsAddModalOpen(false);
            setSelectedLabel('Home');
            form.reset();
            showTemporaryMessage('Shipping address added successfully!');
        } else {
            console.error(result.error);
            alert(result.error || 'Failed to add shipping address');
        }
    };

    const handleUpdateAddress = async (e) => {
        e.preventDefault();
        if (!editingAddress) return;
        setIsSaving(true);

        const form = e.currentTarget;
        const apartmentVal = form.apartment.value.trim();
        const streetVal = form.street.value.trim();
        const villageAreaVal = form.villageArea.value.trim();
        const thanaVal = form.thana.value.trim();
        const postalCodeVal = form.postalCode.value.trim();
        const districtVal = form.district.value;

        const updated = {
            label: editLabel || 'Home',
            recipientName: form.recipientName.value.trim(),
            phone: form.phone.value.trim(),
            apartment: apartmentVal,
            suite: apartmentVal,
            street: streetVal,
            villageArea: villageAreaVal,
            city: villageAreaVal,
            thana: thanaVal,
            state: thanaVal,
            postalCode: postalCodeVal,
            zipCode: postalCodeVal,
            postal: postalCodeVal,
            district: districtVal,
            country: 'Bangladesh',
            instructions: form.instructions ? form.instructions.value.trim() : '',
            isDefault: Boolean(form.isDefault?.checked)
        };

        const result = await updateShippingAddress(user.id, editingAddress.id, updated);
        setIsSaving(false);

        if (result.success) {
            setAddresses(result.user?.addresses || []);
            setIsEditModalOpen(false);
            setEditingAddress(null);
            showTemporaryMessage('Shipping address updated successfully!');
        } else {
            console.error(result.error);
            alert(result.error || 'Failed to update shipping address');
        }
    };

    const handleSetDefault = async (addressId) => {
        const result = await setDefaultShippingAddress(user.id, addressId);
        if (result.success) {
            setAddresses(result.user?.addresses || []);
            showTemporaryMessage('Default shipping address updated!');
        } else {
            console.error(result.error);
        }
    };

    const handleDeleteAddress = async (addressId) => {
        if (!window.confirm('Are you sure you want to delete this address?')) return;

        const result = await deleteShippingAddress(user.id, addressId);
        if (result.success) {
            setAddresses(result.user?.addresses || []);
            showTemporaryMessage('Shipping address deleted!');
        } else {
            console.error(result.error);
        }
    };

    return (
        <div className="account-content-col">
            <div className="account-card-section">
                <div className="account-section-header">
                    <div>
                        <h1 className="account-section-title" style={{ fontSize: '1.35rem' }}>Saved Shipping Addresses</h1>
                        <span className="account-section-subtitle" style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                            Manage your delivery destinations across Bangladesh
                        </span>
                    </div>

                    <button
                        className="btn btn-primary"
                        id="add-address-trigger-btn"
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        + Add New Address
                    </button>
                </div>

                {actionMessage && (
                    <div style={{
                        background: '#ecfdf5',
                        color: '#065f46',
                        border: '1px solid #a7f3d0',
                        borderRadius: 'var(--radius-md)',
                        padding: '10px 16px',
                        marginBottom: 'var(--space-4)',
                        fontSize: '0.875rem',
                        fontWeight: 600
                    }}>
                        ✓ {actionMessage}
                    </div>
                )}

                {addresses.length > 0 ? (
                    <div className="addresses-grid-list" id="addresses-cards-list">
                        {addresses.map((address) => {
                            const apt = address.apartment || address.suite;
                            const street = address.street;
                            const area = address.villageArea || address.city;
                            const thana = address.thana || (address.state && address.state !== 'Bangladesh' ? address.state : '');
                            const district = address.district || (address.country !== 'Bangladesh' ? address.country : 'Dhaka');
                            const postal = address.postalCode || address.zipCode || address.postal;

                            return (
                                <div
                                    key={address.id}
                                    className={`address-card ${address.isDefault ? 'default-address' : ''}`}
                                    id={address.id}
                                >
                                    <div className="address-card-header">
                                        <div className="address-card-header-left" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <strong className="address-label">{address.label || 'Home'}</strong>
                                            {address.isDefault && <span className="badge badge-success">DEFAULT</span>}
                                        </div>
                                    </div>

                                    <div className="address-card-body">
                                        <p className="address-recipient">
                                            <strong>{address.recipientName}</strong>
                                        </p>

                                        {apt && (
                                            <p className="address-unit" style={{ color: 'var(--color-text-secondary)', fontSize: '0.84rem' }}>
                                                {apt}
                                            </p>
                                        )}

                                        <p className="address-street" style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                            {street}
                                        </p>

                                        <p className="address-area-thana" style={{ color: 'var(--color-text-secondary)', fontSize: '0.84rem' }}>
                                            {[area, thana ? `Thana: ${thana}` : ''].filter(Boolean).join(', ')}
                                        </p>

                                        <p className="address-district-zip" style={{ color: 'var(--color-text-secondary)', fontSize: '0.84rem' }}>
                                            {[district, postal].filter(Boolean).join(' - ')}, Bangladesh
                                        </p>

                                        <p className="address-phone" style={{ marginTop: 'var(--space-2)', fontSize: '0.8125rem' }}>
                                            <strong>Phone:</strong> {address.phone}
                                        </p>
                                    </div>

                                    <div className="address-card-footer">
                                        <button
                                            type="button"
                                            className="btn btn-xs btn-outline edit-address-btn"
                                            onClick={() => handleOpenEditModal(address)}
                                        >
                                            Edit
                                        </button>

                                        {!address.isDefault && (
                                            <>
                                                <button
                                                    type="button"
                                                    className="btn btn-xs btn-ghost text-muted set-default-btn"
                                                    onClick={() => handleSetDefault(address.id)}
                                                >
                                                    Set Default
                                                </button>

                                                <button
                                                    type="button"
                                                    className="btn btn-xs btn-ghost text-error delete-address-btn"
                                                    onClick={() => handleDeleteAddress(address.id)}
                                                >
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="empty-address-box" id="empty-address-box">
                        <div className="empty-address-icon-circle">
                            <span className="empty-address-pin">📍</span>
                        </div>
                        <h3 className="empty-address-title">No Shipping Address Added</h3>
                        <p className="empty-address-desc">
                            You haven't saved any delivery addresses yet.
                            Add your address to enable fast, one-click checkout on your hardware orders.
                        </p>
                        <button
                            type="button"
                            className="btn btn-primary empty-address-btn"
                            onClick={() => setIsAddModalOpen(true)}
                        >
                            + Add New Address
                        </button>
                    </div>
                )}
            </div>

            {isAddModalOpen && (
                <div
                    className="address-modal-backdrop"
                    id="add-address-modal-backdrop"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setIsAddModalOpen(false);
                    }}
                >
                    <div className="address-modal-box" role="dialog" aria-modal="true">
                        <div className="address-modal-header">
                            <div className="address-modal-header-info">
                                <h2 className="address-modal-title">Add New Shipping Address</h2>
                                <span className="address-modal-subtitle">
                                    Enter delivery location details (small unit to district)
                                </span>
                            </div>
                            <button
                                type="button"
                                className="address-modal-close-btn"
                                onClick={() => setIsAddModalOpen(false)}
                                aria-label="Close dialog"
                            >
                                &times;
                            </button>
                        </div>

                        <form className="address-modal-form" onSubmit={handleAddAddress}>
                            <div className="address-modal-body">
                                <div>
                                    <label className="form-label">
                                        Address Label / Type <span className="required">*</span>
                                    </label>
                                    <div className="address-label-pills">
                                        {['Home', 'Office', 'Lab / Studio', 'Warehouse'].map((label) => (
                                            <button
                                                key={label}
                                                type="button"
                                                className={`address-type-pill ${selectedLabel === label ? 'active' : ''}`}
                                                onClick={() => setSelectedLabel(label)}
                                            >
                                                {label === 'Home' && '🏠 '}
                                                {label === 'Office' && '🏢 '}
                                                {label === 'Lab / Studio' && '🔬 '}
                                                {label === 'Warehouse' && '📦 '}
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        className="input"
                                        value={selectedLabel}
                                        onChange={(e) => setSelectedLabel(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="address-form-row-2">
                                    <div>
                                        <label className="form-label">
                                            Recipient Full Name <span className="required">*</span>
                                        </label>
                                        <input
                                            name="recipientName"
                                            type="text"
                                            className="input"
                                            placeholder="e.g. Alexander Rahman"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="form-label">
                                            Contact Phone Number <span className="required">*</span>
                                        </label>
                                        <input
                                            name="phone"
                                            type="tel"
                                            className="input"
                                            placeholder="+880 1XXX XXXXXX"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="form-label">Apartment, Unit (Optional)</label>
                                    <input
                                        name="apartment"
                                        type="text"
                                        className="input"
                                        placeholder="e.g. Apt 4B, Flat 3A, Level 2, Holding 15"
                                    />
                                </div>

                                <div>
                                    <label className="form-label">
                                        Street Address <span className="required">*</span>
                                    </label>
                                    <input
                                        name="street"
                                        type="text"
                                        className="input"
                                        placeholder="e.g. Road 12, House 45 / Main Avenue"
                                        required
                                    />
                                </div>

                                <div className="address-form-row-2">
                                    <div>
                                        <label className="form-label">
                                            Village / Area <span className="required">*</span>
                                        </label>
                                        <input
                                            name="villageArea"
                                            type="text"
                                            className="input"
                                            placeholder="e.g. Sector 4, Uttara / Nagua"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="form-label">
                                            Police Station (Thana) <span className="required">*</span>
                                        </label>
                                        <input
                                            name="thana"
                                            type="text"
                                            className="input"
                                            placeholder="e.g. Uttara West / Kishoreganj Sadar"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="address-form-row-2">
                                    <div>
                                        <label className="form-label">
                                            Postal Code <span className="required">*</span>
                                        </label>
                                        <input
                                            name="postalCode"
                                            type="text"
                                            className="input"
                                            placeholder="e.g. 1230, 2300"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="form-label">
                                            District <span className="required">*</span>
                                        </label>
                                        <select
                                            name="district"
                                            className="select"
                                            defaultValue="Dhaka"
                                            required
                                        >
                                            {BANGLADESH_DISTRICTS.map((dist) => (
                                                <option key={dist} value={dist}>{dist}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="form-label">Delivery Instructions (Optional)</label>
                                    <textarea
                                        name="instructions"
                                        rows="2"
                                        className="input"
                                        placeholder="e.g. Leave with building security guard"
                                    ></textarea>
                                </div>

                                <label className="address-checkbox-wrapper">
                                    <input
                                        type="checkbox"
                                        name="isDefault"
                                        defaultChecked={addresses.length === 0}
                                    />
                                    <div className="address-checkbox-label">
                                        <strong>Set as default shipping address</strong>
                                        <span>This address will be pre-selected for instant checkout on future orders</span>
                                    </div>
                                </label>
                            </div>

                            <div className="address-modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setIsAddModalOpen(false)}
                                    disabled={isSaving}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Saving...' : 'Save Address'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isEditModalOpen && editingAddress && (
                <div
                    className="address-modal-backdrop"
                    id="edit-address-modal-backdrop"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setIsEditModalOpen(false);
                            setEditingAddress(null);
                        }
                    }}
                >
                    <div className="address-modal-box" role="dialog" aria-modal="true">
                        <div className="address-modal-header">
                            <div className="address-modal-header-info">
                                <h2 className="address-modal-title">Edit Shipping Address</h2>
                                <span className="address-modal-subtitle">
                                    Update delivery location details (small unit to district)
                                </span>
                            </div>
                            <button
                                type="button"
                                className="address-modal-close-btn"
                                onClick={() => {
                                    setIsEditModalOpen(false);
                                    setEditingAddress(null);
                                }}
                                aria-label="Close dialog"
                            >
                                &times;
                            </button>
                        </div>

                        <form className="address-modal-form" onSubmit={handleUpdateAddress}>
                            <div className="address-modal-body">
                                <div>
                                    <label className="form-label">
                                        Address Label / Type <span className="required">*</span>
                                    </label>
                                    <div className="address-label-pills">
                                        {['Home', 'Office', 'Lab / Studio', 'Warehouse'].map((label) => (
                                            <button
                                                key={label}
                                                type="button"
                                                className={`address-type-pill ${editLabel === label ? 'active' : ''}`}
                                                onClick={() => setEditLabel(label)}
                                            >
                                                {label === 'Home' && '🏠 '}
                                                {label === 'Office' && '🏢 '}
                                                {label === 'Lab / Studio' && '🔬 '}
                                                {label === 'Warehouse' && '📦 '}
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        className="input"
                                        value={editLabel}
                                        onChange={(e) => setEditLabel(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="address-form-row-2">
                                    <div>
                                        <label className="form-label">
                                            Recipient Full Name <span className="required">*</span>
                                        </label>
                                        <input
                                            name="recipientName"
                                            type="text"
                                            className="input"
                                            defaultValue={editingAddress.recipientName || ''}
                                            placeholder="e.g. Alexander Rahman"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="form-label">
                                            Contact Phone Number <span className="required">*</span>
                                        </label>
                                        <input
                                            name="phone"
                                            type="tel"
                                            className="input"
                                            defaultValue={editingAddress.phone || ''}
                                            placeholder="+880 1XXX XXXXXX"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="form-label">Apartment, Unit (Optional)</label>
                                    <input
                                        name="apartment"
                                        type="text"
                                        className="input"
                                        defaultValue={editingAddress.apartment || editingAddress.suite || ''}
                                        placeholder="e.g. Apt 4B, Flat 3A, Level 2, Holding 15"
                                    />
                                </div>

                                <div>
                                    <label className="form-label">
                                        Street Address <span className="required">*</span>
                                    </label>
                                    <input
                                        name="street"
                                        type="text"
                                        className="input"
                                        defaultValue={editingAddress.street || ''}
                                        placeholder="e.g. Road 12, House 45 / Main Avenue"
                                        required
                                    />
                                </div>

                                <div className="address-form-row-2">
                                    <div>
                                        <label className="form-label">
                                            Village / Area <span className="required">*</span>
                                        </label>
                                        <input
                                            name="villageArea"
                                            type="text"
                                            className="input"
                                            defaultValue={editingAddress.villageArea || editingAddress.city || ''}
                                            placeholder="e.g. Sector 4, Uttara / Nagua"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="form-label">
                                            Police Station (Thana) <span className="required">*</span>
                                        </label>
                                        <input
                                            name="thana"
                                            type="text"
                                            className="input"
                                            defaultValue={editingAddress.thana || (editingAddress.state && editingAddress.state !== 'Bangladesh' ? editingAddress.state : '') || ''}
                                            placeholder="e.g. Uttara West / Kishoreganj Sadar"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="address-form-row-2">
                                    <div>
                                        <label className="form-label">
                                            Postal Code <span className="required">*</span>
                                        </label>
                                        <input
                                            name="postalCode"
                                            type="text"
                                            className="input"
                                            defaultValue={editingAddress.postalCode || editingAddress.zipCode || editingAddress.postal || ''}
                                            placeholder="e.g. 1230, 2300"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="form-label">
                                            District <span className="required">*</span>
                                        </label>
                                        <select
                                            name="district"
                                            className="select"
                                            defaultValue={
                                                editingAddress.district ||
                                                (BANGLADESH_DISTRICTS.includes(editingAddress.state) ? editingAddress.state : 'Dhaka')
                                            }
                                            required
                                        >
                                            {BANGLADESH_DISTRICTS.map((dist) => (
                                                <option key={dist} value={dist}>{dist}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="form-label">Delivery Instructions (Optional)</label>
                                    <textarea
                                        name="instructions"
                                        rows="2"
                                        className="input"
                                        defaultValue={editingAddress.instructions || ''}
                                        placeholder="e.g. Leave with building security guard"
                                    ></textarea>
                                </div>

                                <label className="address-checkbox-wrapper">
                                    <input
                                        type="checkbox"
                                        name="isDefault"
                                        defaultChecked={editingAddress.isDefault}
                                    />
                                    <div className="address-checkbox-label">
                                        <strong>Set as default shipping address</strong>
                                        <span>This address will be pre-selected for instant checkout on future orders</span>
                                    </div>
                                </label>
                            </div>

                            <div className="address-modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setIsEditModalOpen(false);
                                        setEditingAddress(null);
                                    }}
                                    disabled={isSaving}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Updating...' : 'Update Address'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShippingAddress;
