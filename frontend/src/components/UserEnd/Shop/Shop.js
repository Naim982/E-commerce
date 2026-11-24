import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import './Shop.css';
import BreadcrumbNavigation from '../../Common/BreadcrumbNavigation/BreadcrumbNavigation';
import ShopSearchBox from './ShopSearchBox/ShopSearchBox';
import ShopSidebar from './ShopSidebar/ShopSidebar';
import ShopCatalogToolbar from './ShopCatalogToolbar/ShopCatalogToolbar';
import ProductCard from '../ProductCard/ProductCard';
import { getShoppageProducts } from '../../../api/apiManager';

const Shop = () => {
    const [searchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Search State (initialized from URL if present)
    const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || searchParams.get('q') || '');

    // Filter States (initialized from URL if present)
    const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get('category') || 'all');
    const [selectedSubcategory, setSelectedSubcategory] = useState(() => searchParams.get('subcategory') || '');
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [priceRange, setPriceRange] = useState([0, 5000]);
    const [selectedAvailability, setSelectedAvailability] = useState([]);
    const [selectedRating, setSelectedRating] = useState(0);
    const [selectedDiscount, setSelectedDiscount] = useState(0);

    // Toolbar States
    const [sortBy, setSortBy] = useState('recommended');
    const [viewMode, setViewMode] = useState('grid');
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    // Synchronize filters when URL search params change (e.g. navigation from navbar or mega menu)
    useEffect(() => {
        const query = searchParams.get('search') ?? searchParams.get('q');
        const cat = searchParams.get('category');
        const subcat = searchParams.get('subcategory');

        if (query !== null) {
            setSearchQuery(query);
        }
        if (cat !== null) {
            setSelectedCategory(cat);
            setSelectedSubcategory(subcat || '');
        } else if (subcat !== null) {
            setSelectedSubcategory(subcat);
        }
    }, [searchParams]);

    useEffect(() => {
        const loadProducts = async () => {
            setLoading(true);
            setError('');

            const result = await getShoppageProducts();

            if (!result.success) {
                console.error(result.error);
                setError(result.error || 'Failed to load products');
                setLoading(false);
                return;
            }

            setProducts(result.products || []);
            setLoading(false);
        };

        loadProducts();
    }, []);

    // Handlers
    const handleSelectCategory = (category, subcategory = '') => {
        setSelectedCategory(category);
        setSelectedSubcategory(subcategory);
    };

    const handleToggleBrand = (brand) => {
        setSelectedBrands(prev =>
            prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
        );
    };

    const handleToggleAvailability = (status) => {
        setSelectedAvailability(prev =>
            prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
        );
    };

    const handleClearAll = () => {
        setSearchQuery('');
        setSelectedCategory('all');
        setSelectedSubcategory('');
        setSelectedBrands([]);
        setPriceRange([0, 5000]);
        setSelectedAvailability([]);
        setSelectedRating(0);
        setSelectedDiscount(0);
    };

    // Filter & Sort Calculation
    const filteredProducts = useMemo(() => {
        let list = [...products];

        // 0. Search Query Filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(p => {
                const title = (p.title || p.name || '').toLowerCase();
                const brand = (p.brand || p.brandPill || '').toLowerCase();
                const category = (p.category || '').toLowerCase();
                const subCategory = (p.subCategory || '').toLowerCase();
                const specs = (p.cardSpecs || []).join(' ').toLowerCase();
                return (
                    title.includes(q) ||
                    brand.includes(q) ||
                    category.includes(q) ||
                    subCategory.includes(q) ||
                    specs.includes(q)
                );
            });
        }

        // 1. Category Filter
        if (selectedCategory && selectedCategory !== 'all') {
            const catLower = selectedCategory.toLowerCase().trim();
            list = list.filter(p => (p.category || '').toLowerCase().trim() === catLower);
        }

        // 2. Subcategory Filter
        if (selectedSubcategory) {
            const subcatLower = selectedSubcategory.toLowerCase().trim();
            list = list.filter(p => (p.subCategory || '').toLowerCase().trim() === subcatLower);
        }

        // 3. Brands Filter
        if (selectedBrands.length > 0) {
            list = list.filter(p => {
                const brandStr = (p.brand || p.brandPill || '').toLowerCase();
                return selectedBrands.some(b => brandStr.includes(b.toLowerCase()));
            });
        }

        // 4. Price Filter
        const [minPrice, maxPrice] = priceRange;
        list = list.filter(p => {
            const price = Number(p.currentPrice) || 0;
            return price >= minPrice && price <= maxPrice;
        });

        // 5. Availability Filter
        if (selectedAvailability.length > 0) {
            list = list.filter(p => {
                const stockStr = (p.stock || '').toLowerCase();
                const remaining = Number(p.remaining) || 0;
                return selectedAvailability.some(av => {
                    if (av === 'in-stock') return remaining > 10 || stockStr.includes('in stock');
                    if (av === 'low-stock') return remaining > 0 && remaining <= 10;
                    if (av === 'preorder') return stockStr.includes('special') || stockStr.includes('pre-order') || remaining === 0;
                    return true;
                });
            });
        }

        // 6. Rating Filter
        if (selectedRating > 0) {
            list = list.filter(p => (Number(p.reviewScore) || 0) >= selectedRating);
        }

        // 7. Discount / Deals Filter
        if (selectedDiscount > 0) {
            list = list.filter(p => {
                const discNum = parseInt(String(p.discount || '').replace(/[^0-9]/g, ''), 10) || 0;
                return discNum >= selectedDiscount;
            });
        }

        // 8. Sorting
        if (sortBy === 'price-low') {
            list.sort((a, b) => (Number(a.currentPrice) || 0) - (Number(b.currentPrice) || 0));
        } else if (sortBy === 'price-high') {
            list.sort((a, b) => (Number(b.currentPrice) || 0) - (Number(a.currentPrice) || 0));
        } else if (sortBy === 'rating') {
            list.sort((a, b) => (Number(b.reviewScore) || 0) - (Number(a.reviewScore) || 0));
        } else if (sortBy === 'bestselling') {
            list.sort((a, b) => (Number(b.soldThisMonth) || 0) - (Number(a.soldThisMonth) || 0));
        } else if (sortBy === 'discount') {
            list.sort((a, b) => {
                const da = parseInt(String(a.discount || '').replace(/[^0-9]/g, ''), 10) || 0;
                const db = parseInt(String(b.discount || '').replace(/[^0-9]/g, ''), 10) || 0;
                return db - da;
            });
        }

        return list;
    }, [products, searchQuery, selectedCategory, selectedSubcategory, selectedBrands, priceRange, selectedAvailability, selectedRating, selectedDiscount, sortBy]);

    // Active Chips Data
    const activeChips = useMemo(() => {
        const chips = [];

        if (searchQuery.trim()) {
            chips.push({
                id: 'search-chip',
                label: `Search: "${searchQuery}"`,
                onRemove: () => setSearchQuery('')
            });
        }

        if (selectedCategory && selectedCategory !== 'all') {
            chips.push({
                id: 'cat-chip',
                label: selectedSubcategory ? `${selectedCategory} > ${selectedSubcategory}` : selectedCategory,
                onRemove: () => {
                    setSelectedCategory('all');
                    setSelectedSubcategory('');
                }
            });
        }

        selectedBrands.forEach(b => {
            chips.push({
                id: `brand-${b}`,
                label: b,
                onRemove: () => handleToggleBrand(b)
            });
        });

        if (priceRange[0] > 0 || priceRange[1] < 5000) {
            chips.push({
                id: 'price-chip',
                label: `৳${priceRange[0]} - ৳${priceRange[1].toLocaleString()}`,
                onRemove: () => setPriceRange([0, 5000])
            });
        }

        selectedAvailability.forEach(av => {
            const label = av === 'in-stock' ? 'In Stock' : av === 'low-stock' ? 'Low Stock' : 'Pre-Order';
            chips.push({
                id: `av-${av}`,
                label,
                onRemove: () => handleToggleAvailability(av)
            });
        });

        if (selectedRating > 0) {
            chips.push({
                id: 'rating-chip',
                label: `★ ${selectedRating}+`,
                onRemove: () => setSelectedRating(0)
            });
        }

        if (selectedDiscount > 0) {
            chips.push({
                id: 'discount-chip',
                label: `${selectedDiscount}%+ Off`,
                onRemove: () => setSelectedDiscount(0)
            });
        }

        return chips;
    }, [searchQuery, selectedCategory, selectedSubcategory, selectedBrands, priceRange, selectedAvailability, selectedRating, selectedDiscount]);

    return (
        <main>
            <BreadcrumbNavigation path={['Home', 'Shop']} />

            <section className="catalog-main-section">
                <div className="container">
                    {/* Full-width Search Bar spanning entire horizontal layout above sidebar and catalog */}
                    <ShopSearchBox
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        onClearSearch={() => setSearchQuery('')}
                    />

                    <div className="catalog-layout">
                        {/* Interactive Filter Sidebar */}
                        <ShopSidebar
                            products={products}
                            selectedCategory={selectedCategory}
                            selectedSubcategory={selectedSubcategory}
                            onSelectCategory={handleSelectCategory}
                            selectedBrands={selectedBrands}
                            onToggleBrand={handleToggleBrand}
                            priceRange={priceRange}
                            onChangePriceRange={setPriceRange}
                            selectedAvailability={selectedAvailability}
                            onToggleAvailability={handleToggleAvailability}
                            selectedRating={selectedRating}
                            onSelectRating={setSelectedRating}
                            selectedDiscount={selectedDiscount}
                            onSelectDiscount={setSelectedDiscount}
                            onClearAll={handleClearAll}
                            isOpenMobile={isMobileFilterOpen}
                            onCloseMobile={() => setIsMobileFilterOpen(false)}
                        />

                        <div className="catalog-content-col">
                            {/* Toolbar with live counts, sorting, and view toggle */}
                            <ShopCatalogToolbar
                                showingCount={filteredProducts.length}
                                totalCount={products.length}
                                sortBy={sortBy}
                                onSortChange={setSortBy}
                                onOpenMobileFilter={() => setIsMobileFilterOpen(true)}
                                activeFilterCount={activeChips.length}
                                viewMode={viewMode}
                                onViewModeChange={setViewMode}
                            />

                            {/* Active Filter Chips Row */}
                            {activeChips.length > 0 && (
                                <div className="catalog-active-filters-row">
                                    <div className="catalog-active-chips">
                                        <span className="catalog-chips-label">Active Filters:</span>
                                        {activeChips.map(chip => (
                                            <button
                                                key={chip.id}
                                                className="catalog-filter-chip"
                                                onClick={chip.onRemove}
                                                type="button"
                                            >
                                                <span>{chip.label}</span>
                                                <small>✕</small>
                                            </button>
                                        ))}
                                        <button
                                            className="catalog-clear-all-chip"
                                            onClick={handleClearAll}
                                            type="button"
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Loading State */}
                            {loading && (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)' }}>
                                    Loading hardware catalog...
                                </div>
                            )}

                            {/* Error State */}
                            {error && (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-error)' }}>
                                    {error}
                                </div>
                            )}

                            {/* Products Grid / List */}
                            {!loading && !error && filteredProducts.length > 0 && (
                                <div
                                    className={`catalog-product-grid ${viewMode === 'list' ? 'list-view' : ''}`}
                                    id="catalog-products-container"
                                >
                                    {filteredProducts.map((item) => (
                                        <ProductCard
                                            key={item.id}
                                            productId={item.id}
                                            productData={item}
                                            block="shop"
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Empty State */}
                            {!loading && !error && filteredProducts.length === 0 && (
                                <div
                                    className="catalog-empty-state"
                                    style={{
                                        padding: '60px 20px',
                                        textAlign: 'center',
                                        background: 'var(--color-surface)',
                                        borderRadius: 'var(--radius-xl)',
                                        border: '1px solid var(--color-border)',
                                        marginTop: '16px'
                                    }}
                                >
                                    <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔍</div>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
                                        {searchQuery ? `No products found for "${searchQuery}"` : 'No matching products found'}
                                    </h3>
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '20px' }}>
                                        {searchQuery ? 'Check for typos or try searching with different keywords.' : 'Try broadening your search or resetting active filters.'}
                                    </p>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={handleClearAll}
                                        type="button"
                                    >
                                        Reset All Filters
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default Shop;
