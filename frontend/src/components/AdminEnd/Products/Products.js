import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminPageHeader from '../shared/AdminPageHeader';
import StatusBadge from '../shared/StatusBadge';
import Pagination from '../shared/Pagination';
import LoadingSpinner from '../shared/LoadingSpinner';
import EmptyState from '../shared/EmptyState';
import ConfirmationDialog from '../shared/ConfirmationDialog';
import ProductDetailsModal from './ProductDetailsModal';
import { useAdminToast } from '../Layout/AdminLayout';
import {
    PlusIcon,
    EditIcon,
    TrashIcon,
    EyeIcon,
    ProductsIcon,
    SearchIcon
} from '../shared/AdminIcons';
import {
    getAdminProducts,
    deleteAdminProduct,
    BACKEND_ROOT
} from '../../../api/apiManager';
import { exportToCSV } from '../shared/exportUtils';
import './Products.css';

const Products = () => {
    const navigate = useNavigate();
    const { showToast } = useAdminToast();

    // Data state
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);

    // Filter & Search state
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [sortBy, setSortBy] = useState('name_asc');

    // Modals state
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAdminProducts({
                page: currentPage,
                limit: 15,
                search: searchTerm,
                category: selectedCategory,
                status: selectedStatus,
                sort: sortBy
            });

            if (res.success) {
                setProducts(res.products || []);
                setTotalItems(res.total || 0);
                setTotalPages(res.totalPages || 1);
                if (res.categories && res.categories.length > 0) {
                    setCategories(res.categories);
                }
            } else {
                showToast({ title: 'Error', message: res.error || 'Failed to fetch catalog', type: 'error' });
            }
        } catch (err) {
            showToast({ title: 'Connection Error', message: 'Unable to reach backend server', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchTerm, selectedCategory, selectedStatus, sortBy, showToast]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedCategory, selectedStatus, sortBy]);

    // Handle Delete confirmation
    const handleDeleteConfirm = async () => {
        if (!productToDelete) return;
        setDeleteLoading(true);
        try {
            const res = await deleteAdminProduct(productToDelete.id);
            if (res.success) {
                showToast({
                    title: 'Product Deleted',
                    message: `${productToDelete.name} was removed from the store catalog.`,
                    type: 'success'
                });
                setProductToDelete(null);
                fetchProducts();
            } else {
                showToast({ title: 'Delete Failed', message: res.error || 'Could not delete product.', type: 'error' });
            }
        } catch (err) {
            showToast({ title: 'Error', message: 'Failed to communicate with backend.', type: 'error' });
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleExportCSV = () => {
        if (!products.length) {
            showToast({ title: 'Export', message: 'No products available to export.', type: 'info' });
            return;
        }
        const exportData = products.map((p) => ({
            ID: p.id,
            Name: p.name,
            Brand: p.brand || 'LUMEN',
            Category: p.category,
            CurrentPrice: Number(p.pricing?.current || 0).toFixed(2),
            OldPrice: p.pricing?.old ? Number(p.pricing.old).toFixed(2) : '',
            StockQuantity: p.stock?.quantity || 0,
            StockStatus: p.stock?.status || 'In Stock',
            Badge: p.badge?.text || ''
        }));
        exportToCSV(exportData, `lumen-catalog-${new Date().toISOString().split('T')[0]}.csv`);
    };

    return (
        <div className="admin-products-view">
            <AdminPageHeader
                title="Catalog & Product Inventory"
                subtitle={`Managing ${totalItems} hardware products across ${categories.length} store categories.`}
                actions={
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" className="admin-btn admin-btn-outline" onClick={handleExportCSV}>
                            📥 Export Catalog CSV
                        </button>
                        <Link to="/admin/products/new" className="admin-btn admin-btn-primary">
                            <PlusIcon size={16} />
                            <span>Add New Product</span>
                        </Link>
                    </div>
                }
            />

            {/* Filter and Search Bar */}
            <div className="admin-card">
                <div className="products-toolbar">
                    <div className="products-filters-group">
                        <div className="admin-search-wrapper">
                            <span className="admin-search-icon"><SearchIcon size={16} /></span>
                            <input
                                type="text"
                                className="admin-search-input"
                                placeholder="Search by name, ID, or brand..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>

                        <select
                            className="admin-select"
                            value={selectedCategory}
                            onChange={(e) => {
                                setSelectedCategory(e.target.value);
                                setCurrentPage(1);
                            }}
                            aria-label="Filter by category"
                        >
                            <option value="all">All Categories</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>

                        <select
                            className="admin-select"
                            value={selectedStatus}
                            onChange={(e) => {
                                setSelectedStatus(e.target.value);
                                setCurrentPage(1);
                            }}
                            aria-label="Filter by status"
                        >
                            <option value="all">All Stock Statuses</option>
                            <option value="in_stock">In Stock (> 5)</option>
                            <option value="low_stock">Low Stock (1 - 5)</option>
                            <option value="out_of_stock">Out of Stock (0)</option>
                        </select>

                        <select
                            className="admin-select"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            aria-label="Sort products"
                        >
                            <option value="name_asc">Sort: Name (A-Z)</option>
                            <option value="name_desc">Sort: Name (Z-A)</option>
                            <option value="price_asc">Sort: Price (Low to High)</option>
                            <option value="price_desc">Sort: Price (High to Low)</option>
                            <option value="stock_asc">Sort: Stock (Ascending)</option>
                            <option value="stock_desc">Sort: Stock (Descending)</option>
                        </select>
                    </div>

                    <button
                        type="button"
                        className="admin-btn admin-btn-outline admin-btn-sm"
                        onClick={fetchProducts}
                        title="Reload product list"
                    >
                        Refresh List
                    </button>
                </div>

                {/* Table Content */}
                {loading ? (
                    <LoadingSpinner message="Querying hardware catalog..." />
                ) : products.length === 0 ? (
                    <EmptyState
                        icon={ProductsIcon}
                        title="No Products Match Your Criteria"
                        description="Try modifying your search keywords or clearing active category filters."
                        action={
                            <button
                                type="button"
                                className="admin-btn admin-btn-outline"
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedCategory('all');
                                    setSelectedStatus('all');
                                }}
                            >
                                Reset All Filters
                            </button>
                        }
                    />
                ) : (
                    <>
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Product / Hardware</th>
                                        <th>Category</th>
                                        <th>Price</th>
                                        <th>Stock</th>
                                        <th>Status</th>
                                        <th>Rating</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((product) => {
                                        const imageUrl = product.mainImage || '/images/banners/banner-1.jpg';
                                        const displayImg = imageUrl.startsWith('http')
                                            ? imageUrl
                                            : `${BACKEND_ROOT}${imageUrl.replace(/^\//, '')}`;

                                        return (
                                            <tr key={product.id}>
                                                <td>
                                                    <div className="table-product-cell">
                                                        <img
                                                            src={displayImg}
                                                            alt={product.name}
                                                            className="table-product-thumb"
                                                            onError={(e) => {
                                                                e.target.src = 'https://placehold.co/100x100?text=HW';
                                                            }}
                                                        />
                                                        <div className="table-product-info">
                                                            <span className="table-product-title" title={product.name}>
                                                                {product.name}
                                                            </span>
                                                            <span className="table-product-id">
                                                                {product.brand && `${product.brand} • `}{product.id}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{ fontSize: '0.8125rem', color: '#475569' }}>
                                                        {product.category}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 700, color: '#0f172a' }}>
                                                        ${Number(product.currentPrice || 0).toFixed(2)}
                                                    </div>
                                                    {product.oldPrice && (
                                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                                                            ${Number(product.oldPrice).toFixed(2)}
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    <span style={{ fontWeight: 600, color: '#334155' }}>
                                                        {product.stockQuantity || 0} units
                                                    </span>
                                                </td>
                                                <td>
                                                    <StatusBadge status={product.stockStatus || 'in_stock'} />
                                                </td>
                                                <td>
                                                    <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                                                        ⭐ {product.rating ? Number(product.rating).toFixed(1) : '5.0'}
                                                        <span style={{ fontSize: '0.75rem', opacity: 0.8 }}> ({product.reviewCount || 0})</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="table-actions-group" style={{ justifyContent: 'flex-end' }}>
                                                        <button
                                                            type="button"
                                                            className="admin-icon-btn"
                                                            title="Inspect Full Specifications"
                                                            onClick={() => {
                                                                setSelectedProduct(product);
                                                                setIsDetailsOpen(true);
                                                            }}
                                                        >
                                                            <EyeIcon size={16} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="admin-icon-btn"
                                                            title="Edit Product"
                                                            onClick={() => navigate(`/admin/products/${product.id}/edit`)}
                                                        >
                                                            <EditIcon size={16} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="admin-icon-btn danger"
                                                            title="Delete Product"
                                                            onClick={() => setProductToDelete(product)}
                                                        >
                                                            <TrashIcon size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Bar */}
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={totalItems}
                            limit={15}
                            onPageChange={(p) => setCurrentPage(p)}
                        />
                    </>
                )}
            </div>

            {/* Product Details Modal */}
            <ProductDetailsModal
                isOpen={isDetailsOpen}
                onClose={() => {
                    setIsDetailsOpen(false);
                    setSelectedProduct(null);
                }}
                product={selectedProduct}
                onEdit={(prodId) => navigate(`/admin/products/${prodId}/edit`)}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmationDialog
                isOpen={Boolean(productToDelete)}
                onClose={() => setProductToDelete(null)}
                onConfirm={handleDeleteConfirm}
                title="Delete Catalog Product"
                message={`Are you sure you want to permanently delete "${productToDelete?.name}" (${productToDelete?.id})? This will immediately remove it from all storefront catalog pages.`}
                confirmText="Yes, Delete Product"
                loading={deleteLoading}
            />
        </div>
    );
};

export default Products;
