import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    getAdminCoupons,
    createAdminCoupon,
    updateAdminCoupon,
    deleteAdminCoupon
} from '../../../api/apiManager';
import AdminPageHeader from '../shared/AdminPageHeader';
import StatCard from '../shared/StatCard';
import Modal from '../shared/Modal';
import ConfirmationDialog from '../shared/ConfirmationDialog';
import LoadingSpinner from '../shared/LoadingSpinner';
import EmptyState from '../shared/EmptyState';
import { useAdminToast } from '../Layout/AdminLayout';
import {
    TagIcon,
    PlusIcon,
    SearchIcon,
    EditIcon,
    TrashIcon,
    DollarIcon
} from '../shared/AdminIcons';

const initialForm = {
    code: '',
    discountType: 'percentage',
    discountValue: '',
    description: '',
    minSpend: '0',
    maxUses: '100',
    expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    active: true
};

const Coupons = () => {
    const { addToast } = useAdminToast();
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
    const [formData, setFormData] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formErrors, setFormErrors] = useState({});

    // Delete dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [couponToDelete, setCouponToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Fetch coupons
    const fetchCoupons = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAdminCoupons();
            if (res.success) {
                setCoupons(res.coupons);
            } else {
                addToast(res.error || 'Failed to load coupons', 'error');
            }
        } catch (err) {
            console.error(err);
            addToast('Error loading coupons', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchCoupons();
    }, [fetchCoupons]);

    // Filtered coupons
    const filteredCoupons = useMemo(() => {
        return coupons.filter(c => {
            const matchesSearch = !search ||
                c.code?.toLowerCase().includes(search.toLowerCase()) ||
                c.description?.toLowerCase().includes(search.toLowerCase());

            const isExpired = c.expiryDate && new Date(c.expiryDate) < new Date();
            let matchesStatus = true;
            if (filterStatus === 'active') {
                matchesStatus = c.active && !isExpired;
            } else if (filterStatus === 'inactive') {
                matchesStatus = !c.active;
            } else if (filterStatus === 'expired') {
                matchesStatus = isExpired;
            }

            return matchesSearch && matchesStatus;
        });
    }, [coupons, search, filterStatus]);

    // Metrics
    const metrics = useMemo(() => {
        const total = coupons.length;
        const activeCount = coupons.filter(c => c.active && (!c.expiryDate || new Date(c.expiryDate) >= new Date())).length;
        const totalRedeemed = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);
        return { total, activeCount, totalRedeemed };
    }, [coupons]);

    // Open create modal
    const handleOpenCreate = () => {
        setFormData(initialForm);
        setFormErrors({});
        setEditingId(null);
        setModalMode('create');
        setModalOpen(true);
    };

    // Open edit modal
    const handleOpenEdit = (c) => {
        setFormData({
            code: c.code || '',
            discountType: c.discountType || 'percentage',
            discountValue: c.discountValue ?? '',
            description: c.description || '',
            minSpend: c.minSpend ?? '0',
            maxUses: c.maxUses ?? '100',
            expiryDate: c.expiryDate || '',
            active: c.active !== undefined ? c.active : true
        });
        setFormErrors({});
        setEditingId(c.id);
        setModalMode('edit');
        setModalOpen(true);
    };

    // Form change
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    // Form submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        const errors = {};
        if (!formData.code.trim()) errors.code = 'Coupon code is required';
        if (!formData.discountValue || parseFloat(formData.discountValue) <= 0) {
            errors.discountValue = 'Valid discount value is required';
        }
        if (formData.discountType === 'percentage' && parseFloat(formData.discountValue) > 100) {
            errors.discountValue = 'Percentage discount cannot exceed 100%';
        }
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setSaving(true);
        try {
            const payload = {
                code: formData.code.trim().toUpperCase(),
                discountType: formData.discountType,
                discountValue: parseFloat(formData.discountValue),
                description: formData.description.trim(),
                minSpend: parseFloat(formData.minSpend || 0),
                maxUses: parseInt(formData.maxUses || 100, 10),
                expiryDate: formData.expiryDate,
                active: formData.active
            };

            let res;
            if (modalMode === 'create') {
                res = await createAdminCoupon(payload);
            } else {
                res = await updateAdminCoupon(editingId, payload);
            }

            if (res.success) {
                addToast(
                    modalMode === 'create' ? `Coupon "${payload.code}" created!` : `Coupon "${payload.code}" updated!`,
                    'success'
                );
                setModalOpen(false);
                fetchCoupons();
            } else {
                addToast(res.error || 'Failed to save coupon', 'error');
            }
        } catch (err) {
            console.error(err);
            addToast('An unexpected error occurred', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Quick toggle active
    const handleToggleActive = async (coupon) => {
        try {
            const updatedActive = !coupon.active;
            const res = await updateAdminCoupon(coupon.id, { active: updatedActive });
            if (res.success) {
                setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, active: updatedActive } : c));
                addToast(`Coupon "${coupon.code}" ${updatedActive ? 'activated' : 'deactivated'}`, 'info');
            } else {
                addToast(res.error || 'Failed to toggle status', 'error');
            }
        } catch (err) {
            console.error(err);
            addToast('Error updating coupon', 'error');
        }
    };

    // Delete
    const handleConfirmDelete = async () => {
        if (!couponToDelete) return;
        setDeleting(true);
        try {
            const res = await deleteAdminCoupon(couponToDelete.id);
            if (res.success) {
                addToast(`Coupon "${couponToDelete.code}" deleted successfully`, 'success');
                setCoupons(prev => prev.filter(c => c.id !== couponToDelete.id));
                setDeleteDialogOpen(false);
            } else {
                addToast(res.error || 'Failed to delete coupon', 'error');
            }
        } catch (err) {
            console.error(err);
            addToast('Error deleting coupon', 'error');
        } finally {
            setDeleting(false);
            setCouponToDelete(null);
        }
    };

    return (
        <div className="admin-page">
            <AdminPageHeader
                title="Coupons & Promotions"
                description="Create discount codes, set spending rules, and monitor promotional campaign usage."
            >
                <button
                    type="button"
                    className="admin-btn admin-btn-primary"
                    onClick={handleOpenCreate}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <PlusIcon /> Create Coupon
                </button>
            </AdminPageHeader>

            {/* Metrics */}
            <div className="admin-stats-grid">
                <StatCard
                    title="Active Promotions"
                    value={metrics.activeCount}
                    icon={TagIcon}
                    color="primary"
                />
                <StatCard
                    title="Total Coupons"
                    value={metrics.total}
                    icon={TagIcon}
                    color="info"
                />
                <StatCard
                    title="Total Redemptions"
                    value={metrics.totalRedeemed}
                    icon={DollarIcon}
                    color="success"
                />
            </div>

            {/* Table Card */}
            <div className="admin-card">
                <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--admin-border)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '16px',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ position: 'relative', width: '320px' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)', display: 'flex' }}>
                            <SearchIcon />
                        </span>
                        <input
                            type="text"
                            placeholder="Search coupon code or description..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="admin-input"
                            style={{ paddingLeft: '38px', width: '100%' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        {['all', 'active', 'inactive', 'expired'].map(status => (
                            <button
                                key={status}
                                type="button"
                                className={`admin-btn admin-btn-sm ${filterStatus === status ? 'admin-btn-primary' : 'admin-btn-outline'}`}
                                onClick={() => setFilterStatus(status)}
                                style={{ textTransform: 'capitalize' }}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <LoadingSpinner text="Loading coupons..." />
                ) : filteredCoupons.length === 0 ? (
                    <EmptyState
                        icon={TagIcon}
                        title="No coupons found"
                        description={search ? `No promotions match "${search}".` : "No coupons created yet. Click Create Coupon to add one."}
                        action={
                            <button type="button" className="admin-btn admin-btn-primary" onClick={handleOpenCreate}>
                                <PlusIcon /> Create Coupon
                            </button>
                        }
                    />
                ) : (
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Coupon Code</th>
                                    <th>Discount</th>
                                    <th>Min Spend</th>
                                    <th>Usage</th>
                                    <th>Expires</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCoupons.map((c) => {
                                    const isExpired = c.expiryDate && new Date(c.expiryDate) < new Date();
                                    const usagePct = c.maxUses ? Math.min(100, Math.round(((c.usedCount || 0) / c.maxUses) * 100)) : 0;

                                    return (
                                        <tr key={c.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{
                                                        fontFamily: 'monospace',
                                                        fontWeight: '700',
                                                        fontSize: '0.9375rem',
                                                        padding: '4px 10px',
                                                        borderRadius: '6px',
                                                        backgroundColor: 'var(--admin-primary-light, #e0e7ff)',
                                                        color: 'var(--admin-primary)',
                                                        letterSpacing: '0.05em'
                                                    }}>
                                                        {c.code}
                                                    </span>
                                                </div>
                                                {c.description && (
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: '4px' }}>
                                                        {c.description}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <span style={{ fontWeight: '700', color: 'var(--admin-text-main)' }}>
                                                    {c.discountType === 'percentage'
                                                        ? `${c.discountValue}% OFF`
                                                        : `৳${Number(c.discountValue).toFixed(2)} OFF`}
                                                </span>
                                            </td>
                                            <td style={{ color: 'var(--admin-text-muted)' }}>
                                                {c.minSpend && c.minSpend > 0 ? `৳${Number(c.minSpend).toFixed(2)}` : 'None'}
                                            </td>
                                            <td>
                                                <div style={{ fontSize: '0.8125rem', fontWeight: '500' }}>
                                                    {c.usedCount || 0} / {c.maxUses || '∞'}
                                                </div>
                                                <div style={{
                                                    width: '80px',
                                                    height: '5px',
                                                    backgroundColor: 'var(--admin-border)',
                                                    borderRadius: '3px',
                                                    overflow: 'hidden',
                                                    marginTop: '4px'
                                                }}>
                                                    <div style={{
                                                        width: `${usagePct}%`,
                                                        height: '100%',
                                                        backgroundColor: usagePct > 80 ? 'var(--admin-danger)' : 'var(--admin-primary)'
                                                    }} />
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontSize: '0.8125rem', color: isExpired ? 'var(--admin-danger)' : 'var(--admin-text-main)' }}>
                                                    {c.expiryDate || 'No expiry'}
                                                </div>
                                                {isExpired && (
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--admin-danger)', fontWeight: '600' }}>
                                                        Expired
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleActive(c)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        padding: 0
                                                    }}
                                                    title="Click to toggle status"
                                                >
                                                    <span style={{
                                                        fontSize: '0.75rem',
                                                        fontWeight: '600',
                                                        padding: '3px 8px',
                                                        borderRadius: '6px',
                                                        textTransform: 'capitalize',
                                                        backgroundColor: c.active ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                                        color: c.active ? '#059669' : '#dc2626'
                                                    }}>
                                                        {c.active ? 'Active' : 'Disabled'}
                                                    </span>
                                                </button>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'inline-flex', gap: '6px' }}>
                                                    <button
                                                        type="button"
                                                        className="admin-btn admin-btn-ghost admin-btn-sm"
                                                        onClick={() => handleOpenEdit(c)}
                                                        title="Edit coupon"
                                                    >
                                                        <EditIcon />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="admin-btn admin-btn-ghost admin-btn-sm"
                                                        onClick={() => {
                                                            setCouponToDelete(c);
                                                            setDeleteDialogOpen(true);
                                                        }}
                                                        style={{ color: 'var(--admin-danger)' }}
                                                        title="Delete coupon"
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create / Edit Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={modalMode === 'create' ? 'Create Promotional Coupon' : `Edit Coupon: ${formData.code}`}
                size="md"
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="admin-form-group">
                        <label className="admin-label">Coupon Code *</label>
                        <input
                            type="text"
                            name="code"
                            value={formData.code}
                            onChange={handleChange}
                            placeholder="e.g. SUMMER25"
                            className={`admin-input ${formErrors.code ? 'admin-input-error' : ''}`}
                            style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: '600' }}
                            required
                        />
                        {formErrors.code && <div className="admin-error-text">{formErrors.code}</div>}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="admin-form-group">
                            <label className="admin-label">Discount Type *</label>
                            <select
                                name="discountType"
                                value={formData.discountType}
                                onChange={handleChange}
                                className="admin-select"
                            >
                                <option value="percentage">Percentage (%)</option>
                                <option value="fixed">Fixed Amount ($)</option>
                            </select>
                        </div>
                        <div className="admin-form-group">
                            <label className="admin-label">
                                {formData.discountType === 'percentage' ? 'Percentage Value (%) *' : 'Discount Amount ($) *'}
                            </label>
                            <input
                                type="number"
                                name="discountValue"
                                value={formData.discountValue}
                                onChange={handleChange}
                                placeholder={formData.discountType === 'percentage' ? '15' : '20.00'}
                                step="any"
                                min="0.01"
                                className={`admin-input ${formErrors.discountValue ? 'admin-input-error' : ''}`}
                                required
                            />
                            {formErrors.discountValue && <div className="admin-error-text">{formErrors.discountValue}</div>}
                        </div>
                    </div>

                    <div className="admin-form-group">
                        <label className="admin-label">Description</label>
                        <input
                            type="text"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="e.g. 15% off graphics cards orders over ৳2,000"
                            className="admin-input"
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="admin-form-group">
                            <label className="admin-label">Minimum Spend ($)</label>
                            <input
                                type="number"
                                name="minSpend"
                                value={formData.minSpend}
                                onChange={handleChange}
                                placeholder="0"
                                step="any"
                                min="0"
                                className="admin-input"
                            />
                        </div>
                        <div className="admin-form-group">
                            <label className="admin-label">Usage Limit (Max Uses)</label>
                            <input
                                type="number"
                                name="maxUses"
                                value={formData.maxUses}
                                onChange={handleChange}
                                placeholder="100"
                                min="1"
                                className="admin-input"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="admin-form-group">
                            <label className="admin-label">Expiry Date</label>
                            <input
                                type="date"
                                name="expiryDate"
                                value={formData.expiryDate}
                                onChange={handleChange}
                                className="admin-input"
                            />
                        </div>
                        <div className="admin-form-group" style={{ display: 'flex', alignItems: 'center', paddingTop: '28px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '500' }}>
                                <input
                                    type="checkbox"
                                    name="active"
                                    checked={formData.active}
                                    onChange={handleChange}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                Enable this coupon immediately
                            </label>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--admin-border)' }}>
                        <button
                            type="button"
                            className="admin-btn admin-btn-outline"
                            onClick={() => setModalOpen(false)}
                            disabled={saving}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="admin-btn admin-btn-primary"
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : (modalMode === 'create' ? 'Create Coupon' : 'Save Changes')}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmationDialog
                isOpen={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Promotion"
                message={`Are you sure you want to permanently delete coupon "${couponToDelete?.code}"? Customers will no longer be able to use it at checkout.`}
                confirmText={deleting ? 'Deleting...' : 'Delete Coupon'}
                isDestructive={true}
            />
        </div>
    );
};

export default Coupons;
