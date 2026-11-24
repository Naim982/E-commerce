import React, { useEffect, useState, useCallback } from 'react';
import AdminPageHeader from '../shared/AdminPageHeader';
import StatCard from '../shared/StatCard';
import StatusBadge from '../shared/StatusBadge';
import LoadingSpinner from '../shared/LoadingSpinner';
import EmptyState from '../shared/EmptyState';
import { useAdminToast } from '../Layout/AdminLayout';
import {
    InventoryIcon,
    SearchIcon,
    CheckIcon
} from '../shared/AdminIcons';
import {
    getAdminInventory,
    updateAdminStock,
    BACKEND_ROOT
} from '../../../api/apiManager';
import { exportToCSV } from '../shared/exportUtils';

const Inventory = () => {
    const { showToast } = useAdminToast();
    const [loading, setLoading] = useState(true);
    const [inventory, setInventory] = useState([]);
    const [summary, setSummary] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTab, setFilterTab] = useState('all');

    // Inline edit tracking state: { [productId]: quantity }
    const [editedStock, setEditedStock] = useState({});
    const [savingId, setSavingId] = useState(null);

    const fetchInventory = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAdminInventory({
                search: searchTerm,
                filter: filterTab
            });
            if (res.success) {
                setInventory(res.inventory || []);
                setSummary(res.summary || {});
            } else {
                showToast({ title: 'Error', message: res.error || 'Failed to fetch inventory', type: 'error' });
            }
        } catch (e) {
            showToast({ title: 'Connection Error', message: 'Could not contact backend server', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [searchTerm, filterTab, showToast]);

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    const handleStockChange = (productId, newQty) => {
        const parsed = parseInt(newQty, 10);
        setEditedStock((prev) => ({
            ...prev,
            [productId]: isNaN(parsed) ? 0 : Math.max(parsed, 0)
        }));
    };

    const handleAdjust = (productId, currentVal, delta) => {
        const current = editedStock[productId] !== undefined ? editedStock[productId] : currentVal;
        const next = Math.max(current + delta, 0);
        setEditedStock((prev) => ({ ...prev, [productId]: next }));
    };

    const handleSaveStock = async (product) => {
        const newQty = editedStock[product.id] !== undefined ? editedStock[product.id] : product.quantity;
        setSavingId(product.id);
        try {
            const res = await updateAdminStock(product.id, { quantity: newQty });
            if (res.success) {
                showToast({
                    title: 'Stock Updated',
                    message: `${product.name}: stock updated to ${newQty} units.`,
                    type: 'success'
                });
                // Clear from local edit map and refresh
                setEditedStock((prev) => {
                    const copy = { ...prev };
                    delete copy[product.id];
                    return copy;
                });
                fetchInventory();
            } else {
                showToast({ title: 'Update Failed', message: res.error || 'Could not update stock.', type: 'error' });
            }
        } catch (err) {
            showToast({ title: 'Error', message: 'Connection error saving inventory', type: 'error' });
        } finally {
            setSavingId(null);
        }
    };

    const handleExportCSV = () => {
        if (!inventory.length) {
            showToast({ title: 'Export', message: 'No inventory items available to export.', type: 'info' });
            return;
        }
        const exportData = inventory.map((item) => ({
            ID: item.id,
            Name: item.name,
            Category: item.category,
            Price: Number(item.price || 0).toFixed(2),
            StockQuantity: item.stockQuantity || 0,
            StockStatus: item.stockStatus || 'In Stock',
            TotalValue: (Number(item.price || 0) * Number(item.stockQuantity || 0)).toFixed(2)
        }));
        exportToCSV(exportData, `lumen-inventory-${new Date().toISOString().split('T')[0]}.csv`);
    };

    return (
        <div className="admin-inventory-view">
            <AdminPageHeader
                title="Warehouse Inventory & Stock Control"
                subtitle="Live tracking of warehouse physical units, stock depletion alerts, and valuation."
                actions={
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" className="admin-btn admin-btn-outline" onClick={handleExportCSV}>
                            📥 Export Stock CSV
                        </button>
                        <button type="button" className="admin-btn admin-btn-outline" onClick={fetchInventory}>
                            Refresh Stock
                        </button>
                    </div>
                }
            />

            {/* Inventory Metric Cards */}
            <div className="stat-grid">
                <StatCard
                    title="Total Stock Valuation"
                    value={`৳${Number(summary.totalValuation || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    subtitle="Gross inventory cost at current retail pricing"
                    icon={InventoryIcon}
                />
                <StatCard
                    title="Total Physical Units"
                    value={summary.totalUnits || 0}
                    subtitle="Hardware components on warehouse floor"
                />
                <StatCard
                    title="Low Stock Warnings"
                    value={summary.lowStockCount || 0}
                    subtitle="Products at or below 5 units threshold"
                    trendType={summary.lowStockCount > 0 ? 'warning' : 'neutral'}
                />
                <StatCard
                    title="Out of Stock Depleted"
                    value={summary.outOfStockCount || 0}
                    subtitle="Products completely exhausted (0 units)"
                    trendType={summary.outOfStockCount > 0 ? 'down' : 'neutral'}
                />
            </div>

            {/* Inventory Table Container */}
            <div className="admin-card">
                <div className="products-toolbar">
                    <div className="products-filters-group">
                        <div className="admin-search-wrapper">
                            <span className="admin-search-icon"><SearchIcon size={16} /></span>
                            <input
                                type="text"
                                className="admin-search-input"
                                placeholder="Search by hardware name or SKU..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '4px' }}>
                            {[
                                { key: 'all', label: 'All Items' },
                                { key: 'low_stock', label: `Low Stock (${summary.lowStockCount || 0})` },
                                { key: 'out_of_stock', label: `Out of Stock (${summary.outOfStockCount || 0})` },
                                { key: 'in_stock', label: 'In Stock' }
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    className={`admin-btn admin-btn-sm ${filterTab === tab.key ? 'admin-btn-primary' : 'admin-btn-outline'}`}
                                    onClick={() => setFilterTab(tab.key)}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <LoadingSpinner message="Auditing warehouse inventory..." />
                ) : inventory.length === 0 ? (
                    <EmptyState
                        icon={InventoryIcon}
                        title="No Inventory Records Match Filter"
                        description="Try resetting your search query or choosing the 'All Items' filter."
                    />
                ) : (
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Hardware Component</th>
                                    <th>Category</th>
                                    <th>Unit Price</th>
                                    <th>Units On Hand</th>
                                    <th>Status</th>
                                    <th>Quick Adjust</th>
                                    <th style={{ textAlign: 'right' }}>Save Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventory.map((item) => {
                                    const isEdited = editedStock[item.id] !== undefined;
                                    const currentDisplayVal = isEdited ? editedStock[item.id] : item.quantity;
                                    const isSaving = savingId === item.id;

                                    const imageUrl = item.mainImage || '/images/banners/banner-1.jpg';
                                    const displayImg = imageUrl.startsWith('http')
                                        ? imageUrl
                                        : `${BACKEND_ROOT}${imageUrl.replace(/^\//, '')}`;

                                    return (
                                        <tr key={item.id} style={isEdited ? { backgroundColor: '#f0fdf4' } : {}}>
                                            <td>
                                                <div className="table-product-cell">
                                                    <img
                                                        src={displayImg}
                                                        alt={item.name}
                                                        className="table-product-thumb"
                                                        onError={(e) => {
                                                            e.target.src = 'https://placehold.co/100x100?text=HW';
                                                        }}
                                                    />
                                                    <div className="table-product-info">
                                                        <span className="table-product-title" title={item.name}>
                                                            {item.name}
                                                        </span>
                                                        <span className="table-product-id">
                                                            {item.brand && `${item.brand} • `}{item.sku}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{ fontSize: '0.8125rem', color: '#475569' }}>
                                                    {item.category}
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: 600 }}>
                                                ${Number(item.price || 0).toFixed(2)}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <input
                                                        type="number"
                                                        className="admin-input"
                                                        style={{ width: '80px', padding: '6px 8px', textAlign: 'center', fontWeight: 700 }}
                                                        value={currentDisplayVal}
                                                        onChange={(e) => handleStockChange(item.id, e.target.value)}
                                                    />
                                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>units</span>
                                                </div>
                                            </td>
                                            <td>
                                                <StatusBadge status={item.status} />
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button
                                                        type="button"
                                                        className="admin-page-btn"
                                                        style={{ padding: '4px 8px' }}
                                                        onClick={() => handleAdjust(item.id, item.quantity, -1)}
                                                        title="Decrease by 1"
                                                    >
                                                        -1
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="admin-page-btn"
                                                        style={{ padding: '4px 8px' }}
                                                        onClick={() => handleAdjust(item.id, item.quantity, 1)}
                                                        title="Increase by 1"
                                                    >
                                                        +1
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="admin-page-btn"
                                                        style={{ padding: '4px 8px' }}
                                                        onClick={() => handleAdjust(item.id, item.quantity, 5)}
                                                        title="Restock 5 units"
                                                    >
                                                        +5
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="admin-page-btn"
                                                        style={{ padding: '4px 8px' }}
                                                        onClick={() => handleAdjust(item.id, item.quantity, 20)}
                                                        title="Restock shipment of 20 units"
                                                    >
                                                        +20
                                                    </button>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button
                                                    type="button"
                                                    className={`admin-btn admin-btn-sm ${isEdited ? 'admin-btn-primary' : 'admin-btn-outline'}`}
                                                    onClick={() => handleSaveStock(item)}
                                                    disabled={!isEdited || isSaving}
                                                >
                                                    {isSaving ? 'Saving...' : (
                                                        <>
                                                            <CheckIcon size={14} />
                                                            <span>Save</span>
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Inventory;
