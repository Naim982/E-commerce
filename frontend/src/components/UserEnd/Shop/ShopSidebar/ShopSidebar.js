import React, { useMemo } from 'react';
import './ShopSidebar.css';

const CATEGORY_TREE = [
    {
        id: 'all',
        name: 'All Categories',
        subcategories: []
    },
    {
        id: 'Laptops & Notebooks',
        name: 'Laptops & Notebooks',
        subcategories: ['Gaming Laptops', 'Business Laptops']
    },
    {
        id: 'Desktop Computers',
        name: 'Desktop Computers',
        subcategories: ['Gaming PCs', 'Workstations', 'Mini PCs']
    },
    {
        id: 'Monitors',
        name: 'Monitors',
        subcategories: ['Gaming Monitors', 'Professional Monitors']
    },
    {
        id: 'PC Components',
        name: 'PC Components',
        subcategories: ['Graphics Cards', 'Processors', 'Motherboards', 'Memory', 'Storage']
    },
    {
        id: 'Accessories',
        name: 'Accessories',
        subcategories: ['Keyboards', 'Mice', 'Webcams', 'Headsets', 'USB Hubs & Adapters']
    },
    {
        id: 'Networking',
        name: 'Networking',
        subcategories: ['Routers', 'Network Switches']
    },
    {
        id: 'Storage & Backup',
        name: 'Storage & Backup',
        subcategories: ['External SSDs', 'External Hard Drives', 'USB Flash Drives', 'Memory Cards']
    },
    {
        id: 'Printers & Office',
        name: 'Printers & Office',
        subcategories: ['Printers', 'Scanners']
    }
];

const POPULAR_BRANDS = [
    'ASUS',
    'NVIDIA',
    'AMD',
    'Intel',
    'Apple',
    'MSI',
    'Corsair',
    'Samsung',
    'Logitech',
    'Razer',
    'Western Digital',
    'SanDisk',
    'Crucial',
    'Kingston',
    'SteelSeries'
];

const ShopSidebar = ({
    products = [],
    selectedCategory = 'all',
    selectedSubcategory = '',
    onSelectCategory = () => {},
    selectedBrands = [],
    onToggleBrand = () => {},
    priceRange = [0, 5000],
    onChangePriceRange = () => {},
    selectedAvailability = [],
    onToggleAvailability = () => {},
    selectedRating = 0,
    onSelectRating = () => {},
    selectedDiscount = 0,
    onSelectDiscount = () => {},
    onClearAll = () => {},
    isOpenMobile = false,
    onCloseMobile = null
}) => {
    // Dynamic counts derived from loaded products
    const categoryCounts = useMemo(() => {
        const counts = { all: products.length };
        products.forEach(p => {
            if (p.category) {
                counts[p.category] = (counts[p.category] || 0) + 1;
            }
            if (p.subCategory) {
                counts[p.subCategory] = (counts[p.subCategory] || 0) + 1;
            }
        });
        return counts;
    }, [products]);

    const brandCounts = useMemo(() => {
        const counts = {};
        POPULAR_BRANDS.forEach(b => { counts[b] = 0; });
        products.forEach(p => {
            const brandStr = (p.brand || p.brandPill || '').toLowerCase();
            POPULAR_BRANDS.forEach(b => {
                if (brandStr.includes(b.toLowerCase())) {
                    counts[b] = (counts[b] || 0) + 1;
                }
            });
        });
        return counts;
    }, [products]);

    const availabilityCounts = useMemo(() => {
        let inStock = 0;
        let lowStock = 0;
        let preorder = 0;
        products.forEach(p => {
            const remaining = Number(p.remaining) || 0;
            const stockStr = (p.stock || '').toLowerCase();
            if (remaining > 10 || stockStr.includes('in stock')) inStock++;
            if (remaining > 0 && remaining <= 10) lowStock++;
            if (stockStr.includes('special') || stockStr.includes('pre-order') || remaining === 0) preorder++;
        });
        return {
            'in-stock': inStock,
            'low-stock': lowStock,
            'preorder': preorder
        };
    }, [products]);

    const ratingCounts = useMemo(() => {
        return {
            4.8: products.filter(p => (Number(p.reviewScore) || 0) >= 4.8).length,
            4.5: products.filter(p => (Number(p.reviewScore) || 0) >= 4.5).length,
            4.0: products.filter(p => (Number(p.reviewScore) || 0) >= 4.0).length
        };
    }, [products]);

    const dealsCounts = useMemo(() => {
        const getDisc = p => parseInt(String(p.discount || '').replace(/[^0-9]/g, ''), 10) || 0;
        return {
            'on-sale': products.filter(p => getDisc(p) > 0).length,
            '10-off': products.filter(p => getDisc(p) >= 10).length,
            '15-off': products.filter(p => getDisc(p) >= 15).length
        };
    }, [products]);

    const hasActiveFilters =
        selectedCategory !== 'all' ||
        selectedSubcategory !== '' ||
        selectedBrands.length > 0 ||
        priceRange[0] > 0 ||
        priceRange[1] < 5000 ||
        selectedAvailability.length > 0 ||
        selectedRating > 0 ||
        selectedDiscount > 0;

    return (
        <aside
            className={`catalog-filter-sidebar ${isOpenMobile ? 'mobile-open' : ''}`}
            id="catalog-filter-sidebar"
        >
            {/* Header */}
            <div className="catalog-sidebar-header">
                <h3 className="catalog-sidebar-title">Filters</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {hasActiveFilters && (
                        <button
                            className="catalog-clear-link"
                            id="catalog-clear-filters-btn"
                            onClick={onClearAll}
                            type="button"
                        >
                            Clear All
                        </button>
                    )}
                    {onCloseMobile && (
                        <button
                            className="catalog-close-mobile-btn"
                            onClick={onCloseMobile}
                            type="button"
                            aria-label="Close filters"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Group 1: Hardware Categories */}
            <div className="catalog-filter-group">
                <div className="catalog-filter-heading">
                    <span>Categories</span>
                </div>
                <div className="catalog-filter-options">
                    {CATEGORY_TREE.map(cat => {
                        const isSelected = selectedCategory === cat.id;
                        const count = categoryCounts[cat.id] || 0;

                        return (
                            <div key={cat.id}>
                                <label
                                    className={`catalog-radio-item ${isSelected ? 'active' : ''}`}
                                    onClick={() => onSelectCategory(cat.id, '')}
                                >
                                    <input
                                        type="radio"
                                        name="cat-filter"
                                        value={cat.id}
                                        checked={isSelected}
                                        onChange={() => onSelectCategory(cat.id, '')}
                                    />
                                    <span>{cat.name}</span>
                                    <small>{count.toLocaleString()}</small>
                                </label>

                                {/* Subcategories dropdown/list when parent is selected */}
                                {isSelected && cat.subcategories.length > 0 && (
                                    <div className="catalog-subcategory-list">
                                        <div
                                            className={`catalog-subcategory-item ${selectedSubcategory === '' ? 'active' : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSelectCategory(cat.id, '');
                                            }}
                                        >
                                            <span>All {cat.name}</span>
                                            <small>{count}</small>
                                        </div>
                                        {cat.subcategories.map(sub => {
                                            const subCount = categoryCounts[sub] || 0;
                                            const isSubSelected = selectedSubcategory === sub;
                                            return (
                                                <div
                                                    key={sub}
                                                    className={`catalog-subcategory-item ${isSubSelected ? 'active' : ''}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onSelectCategory(cat.id, sub);
                                                    }}
                                                >
                                                    <span>{sub}</span>
                                                    <small>{subCount}</small>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Filter Group 2: Hardware Brand */}
            <div className="catalog-filter-group">
                <div className="catalog-filter-heading">
                    <span>Hardware Brand</span>
                </div>
                <div className="catalog-filter-options">
                    {POPULAR_BRANDS.map(brand => {
                        const isChecked = selectedBrands.includes(brand);
                        const count = brandCounts[brand] || 0;

                        return (
                            <label key={brand} className="catalog-checkbox-item">
                                <input
                                    type="checkbox"
                                    name="brand-filter"
                                    value={brand}
                                    checked={isChecked}
                                    onChange={() => onToggleBrand(brand)}
                                />
                                <span>{brand}</span>
                                <small>{count}</small>
                            </label>
                        );
                    })}
                </div>
            </div>

            {/* Filter Group 3: Price Range Slider & Inputs */}
            <div className="catalog-filter-group">
                <div className="catalog-filter-heading">
                    <span>Price Range</span>
                </div>
                <div className="catalog-price-slider-box">
                    <input
                        type="range"
                        min="0"
                        max="5000"
                        step="50"
                        value={priceRange[1]}
                        className="catalog-range-input"
                        id="catalog-price-slider"
                        aria-label="Max Price Range"
                        onChange={(e) => onChangePriceRange([priceRange[0], Number(e.target.value)])}
                    />
                    <div className="catalog-price-row-display">
                        <span className="catalog-min-label">৳{priceRange[0]}</span>
                        <span className="catalog-cur-label" id="catalog-price-cur">
                            Max: ৳{priceRange[1].toLocaleString()}
                        </span>
                        <span className="catalog-max-label">৳5,000</span>
                    </div>
                    <div className="catalog-price-inputs">
                        <div className="catalog-input-field">
                            <span>৳</span>
                            <input
                                type="number"
                                value={priceRange[0]}
                                min="0"
                                max={priceRange[1]}
                                className="input input-sm"
                                aria-label="Minimum Price"
                                onChange={(e) => onChangePriceRange([Math.max(0, Number(e.target.value)), priceRange[1]])}
                            />
                        </div>
                        <span className="catalog-to-sep">to</span>
                        <div className="catalog-input-field">
                            <span>৳</span>
                            <input
                                type="number"
                                value={priceRange[1]}
                                min={priceRange[0]}
                                max="10000"
                                className="input input-sm"
                                id="catalog-price-max-input"
                                aria-label="Maximum Price"
                                onChange={(e) => onChangePriceRange([priceRange[0], Math.max(priceRange[0], Number(e.target.value))])}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Group 4: Stock Availability */}
            <div className="catalog-filter-group">
                <div className="catalog-filter-heading">
                    <span>Availability</span>
                </div>
                <div className="catalog-filter-options">
                    <label className="catalog-checkbox-item">
                        <input
                            type="checkbox"
                            name="stock-filter"
                            value="in-stock"
                            checked={selectedAvailability.includes('in-stock')}
                            onChange={() => onToggleAvailability('in-stock')}
                        />
                        <span className="catalog-stock-pill in-stock">● In Stock (Warehouse Ready)</span>
                        <small>{availabilityCounts['in-stock']}</small>
                    </label>
                    <label className="catalog-checkbox-item">
                        <input
                            type="checkbox"
                            name="stock-filter"
                            value="low-stock"
                            checked={selectedAvailability.includes('low-stock')}
                            onChange={() => onToggleAvailability('low-stock')}
                        />
                        <span className="catalog-stock-pill low-stock">● Low Stock (&lt; 10 left)</span>
                        <small>{availabilityCounts['low-stock']}</small>
                    </label>
                    <label className="catalog-checkbox-item">
                        <input
                            type="checkbox"
                            name="stock-filter"
                            value="preorder"
                            checked={selectedAvailability.includes('preorder')}
                            onChange={() => onToggleAvailability('preorder')}
                        />
                        <span className="catalog-stock-pill preorder">● Pre-Order / Special</span>
                        <small>{availabilityCounts['preorder']}</small>
                    </label>
                </div>
            </div>

            {/* Filter Group 5: Customer Rating */}
            <div className="catalog-filter-group">
                <div className="catalog-filter-heading">
                    <span>Customer Rating</span>
                </div>
                <div className="catalog-filter-options">
                    {[
                        { val: 4.8, stars: '★★★★★', label: '4.8 & Above' },
                        { val: 4.5, stars: '★★★★☆', label: '4.5 & Above' },
                        { val: 4.0, stars: '★★★★☆', label: '4.0 & Above' }
                    ].map(r => (
                        <label key={r.val} className="catalog-radio-item">
                            <input
                                type="radio"
                                name="rating-filter"
                                value={r.val}
                                checked={selectedRating === r.val}
                                onChange={() => onSelectRating(selectedRating === r.val ? 0 : r.val)}
                                onClick={() => {
                                    if (selectedRating === r.val) onSelectRating(0);
                                }}
                            />
                            <span className="star-rating">{r.stars}</span>
                            <span>{r.label}</span>
                            <small>{ratingCounts[r.val] || 0}</small>
                        </label>
                    ))}
                </div>
            </div>

            {/* Filter Group 6: Promotions & Deals */}
            <div className="catalog-filter-group">
                <div className="catalog-filter-heading">
                    <span>Promotions & Deals</span>
                </div>
                <div className="catalog-filter-options">
                    <label className="catalog-checkbox-item">
                        <input
                            type="checkbox"
                            name="deal-filter"
                            value="on-sale"
                            checked={selectedDiscount === 1}
                            onChange={() => onSelectDiscount(selectedDiscount === 1 ? 0 : 1)}
                        />
                        <span>On Sale & Rebates</span>
                        <small>{dealsCounts['on-sale']}</small>
                    </label>
                    <label className="catalog-checkbox-item">
                        <input
                            type="checkbox"
                            name="deal-filter"
                            value="10-off"
                            checked={selectedDiscount === 10}
                            onChange={() => onSelectDiscount(selectedDiscount === 10 ? 0 : 10)}
                        />
                        <span>10% Off or More</span>
                        <small>{dealsCounts['10-off']}</small>
                    </label>
                    <label className="catalog-checkbox-item">
                        <input
                            type="checkbox"
                            name="deal-filter"
                            value="15-off"
                            checked={selectedDiscount === 15}
                            onChange={() => onSelectDiscount(selectedDiscount === 15 ? 0 : 15)}
                        />
                        <span>15% Off or More</span>
                        <small>{dealsCounts['15-off']}</small>
                    </label>
                </div>
            </div>
        </aside>
    );
};

export default ShopSidebar;
