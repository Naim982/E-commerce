import React, { useEffect, useState } from 'react';
import AdminPageHeader from '../shared/AdminPageHeader';
import Modal from '../shared/Modal';
import ConfirmationDialog from '../shared/ConfirmationDialog';
import LoadingSpinner from '../shared/LoadingSpinner';
import EmptyState from '../shared/EmptyState';
import { useAdminToast } from '../Layout/AdminLayout';
import {
    PlusIcon,
    EditIcon,
    TrashIcon,
    CategoriesIcon
} from '../shared/AdminIcons';
import {
    getAdminCategories,
    createAdminCategory,
    updateAdminCategory,
    deleteAdminCategory
} from '../../../api/apiManager';

const Categories = () => {
    const { showToast } = useAdminToast();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [categoryToEdit, setCategoryToEdit] = useState(null);
    const [categoryToDelete, setCategoryToDelete] = useState(null);

    const [formName, setFormName] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await getAdminCategories();
            if (res.success) {
                setCategories(res.categories || []);
            } else {
                showToast({ title: 'Error', message: res.error || 'Failed to fetch categories', type: 'error' });
            }
        } catch (e) {
            showToast({ title: 'Connection Error', message: 'Could not contact server', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (!formName.trim()) {
            setFormError('Category name is required');
            return;
        }

        setFormLoading(true);
        setFormError('');
        try {
            const res = await createAdminCategory({ name: formName.trim() });
            if (res.success) {
                showToast({ title: 'Category Created', message: `Category "${formName}" registered.`, type: 'success' });
                setIsAddOpen(false);
                setFormName('');
                fetchCategories();
            } else {
                setFormError(res.error || 'Failed to create category');
            }
        } catch (err) {
            setFormError('Network error');
        } finally {
            setFormLoading(false);
        }
    };

    const handleUpdateCategory = async (e) => {
        e.preventDefault();
        if (!formName.trim() || !categoryToEdit) {
            setFormError('Category name is required');
            return;
        }

        setFormLoading(true);
        setFormError('');
        try {
            const res = await updateAdminCategory(categoryToEdit.name, { name: formName.trim() });
            if (res.success) {
                showToast({ title: 'Category Renamed', message: res.message, type: 'success' });
                setCategoryToEdit(null);
                setFormName('');
                fetchCategories();
            } else {
                setFormError(res.error || 'Failed to update category');
            }
        } catch (err) {
            setFormError('Network error');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!categoryToDelete) return;
        setFormLoading(true);
        try {
            const res = await deleteAdminCategory(categoryToDelete.name);
            if (res.success) {
                showToast({ title: 'Category Deleted', message: res.message, type: 'success' });
                setCategoryToDelete(null);
                fetchCategories();
            } else {
                showToast({ title: 'Action Prohibited', message: res.error, type: 'error' });
            }
        } catch (err) {
            showToast({ title: 'Error', message: 'Connection failed', type: 'error' });
        } finally {
            setFormLoading(false);
            setCategoryToDelete(null);
        }
    };

    return (
        <div className="admin-categories-view">
            <AdminPageHeader
                title="Hardware Taxonomy & Categories"
                subtitle="Organize store hardware catalog hierarchy, category slugs, and product routing."
                actions={
                    <button
                        type="button" className="admin-btn admin-btn-primary"
                        onClick={() => { setFormName(''); setFormError(''); setIsAddOpen(true); }} 
                    >
                        <PlusIcon size={16} />
                        <span>Add Category</span>
                    </button>
                }
            />

            <div className="admin-card">
                <div className="admin-card-header">
                    <h3 className="admin-card-title">All Active Categories ({categories.length})</h3>
                    <button type="button" className="admin-btn admin-btn-outline admin-btn-sm" onClick={fetchCategories}>
                        Refresh
                    </button>
                </div>

                {loading ? (
                    <LoadingSpinner message="Calculating category product distribution..." />
                ) : categories.length === 0 ? (
                    <EmptyState
                        icon={CategoriesIcon}
                        title="No Categories Available"
                        description="Create your first hardware category to begin organizing products."
                    />
                ) : (
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Category Name</th>
                                    <th>Slug / Route</th>
                                    <th>Assigned Products</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map((cat) => (
                                    <tr key={cat.name}>
                                        <td>
                                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{cat.name}</div>
                                        </td>
                                        <td>
                                            <code style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                /shop?category={encodeURIComponent(cat.name)}
                                            </code>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 700, color: '#334155' }}>
                                                {cat.productCount} products
                                            </span>
                                        </td>
                                        <td>
                                            <span className="admin-status-badge success">Active</span>
                                        </td>
                                        <td>
                                            <div className="table-actions-group" style={{ justifyContent: 'flex-end' }}>
                                                <button
                                                    type="button"
                                                    className="admin-icon-btn"
                                                    title="Rename Category"
                                                    onClick={() => {
                                                        setCategoryToEdit(cat);
                                                        setFormName(cat.name);
                                                        setFormError('');
                                                    }}
                                                >
                                                    <EditIcon size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="admin-icon-btn danger"
                                                    title={cat.productCount > 0 ? 'Cannot delete category with products' : 'Delete Category'}
                                                    onClick={() => {
                                                        if (cat.productCount > 0) {
                                                            showToast({
                                                                title: 'Cannot Delete Category',
                                                                message: `Category "${cat.name}" has ${cat.productCount} products assigned. Reassign or delete them first.`,
                                                                type: 'error'
                                                            });
                                                        } else {
                                                            setCategoryToDelete(cat);
                                                        }
                                                    }}
                                                >
                                                    <TrashIcon size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Category Modal */}
            <Modal
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                title="Create New Category"
                footer={
                    <>
                        <button type="button" className="admin-btn admin-btn-outline" onClick={() => setIsAddOpen(false)}>
                            Cancel
                        </button>
                        <button type="button" className="admin-btn admin-btn-primary" onClick={handleCreateCategory} disabled={formLoading}>
                            {formLoading ? 'Creating...' : 'Create Category'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleCreateCategory}>
                    {formError && (
                        <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '12px', fontWeight: 600 }}>
                            {formError}
                        </div>
                    )}
                    <div className="admin-form-group">
                        <label className="admin-form-label" htmlFor="cat-name">
                            Category Display Name <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            id="cat-name"
                            className="admin-input"
                            placeholder="e.g. Liquid Coolers & AIOs"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            required
                        />
                        <span className="admin-form-hint">
                            Will appear in store navigation, mega menu, and catalog sidebar.
                        </span>
                    </div>
                </form>
            </Modal>

            {/* Edit / Rename Category Modal */}
            <Modal
                isOpen={Boolean(categoryToEdit)}
                onClose={() => setCategoryToEdit(null)}
                title={`Rename Category: ${categoryToEdit?.name}`}
                footer={
                    <>
                        <button type="button" className="admin-btn admin-btn-outline" onClick={() => setCategoryToEdit(null)}>
                            Cancel
                        </button>
                        <button type="button" className="admin-btn admin-btn-primary" onClick={handleUpdateCategory} disabled={formLoading}>
                            {formLoading ? 'Saving...' : 'Update Category'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleUpdateCategory}>
                    {formError && (
                        <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '12px', fontWeight: 600 }}>
                            {formError}
                        </div>
                    )}
                    <div className="admin-form-group">
                        <label className="admin-form-label" htmlFor="cat-edit-name">
                            Updated Category Name <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            id="cat-edit-name"
                            className="admin-input"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            required
                        />
                        <span className="admin-form-hint">
                            Renaming will immediately synchronize all {categoryToEdit?.productCount} associated products in productData.json.
                        </span>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Dialog */}
            <ConfirmationDialog
                isOpen={Boolean(categoryToDelete)}
                onClose={() => setCategoryToDelete(null)}
                onConfirm={handleDeleteConfirm}
                title="Delete Empty Category"
                message={`Are you sure you want to remove the category "${categoryToDelete?.name}"?`}
                confirmText="Yes, Delete Category"
                loading={formLoading}
            />
        </div>
    );
};

export default Categories;
