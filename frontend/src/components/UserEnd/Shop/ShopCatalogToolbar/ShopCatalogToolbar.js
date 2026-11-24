import React from 'react';
import './ShopCatalogToolbar.css';

const ShopCatalogToolbar = ({
    showingCount = 0,
    totalCount = 0,
    sortBy = 'recommended',
    onSortChange = () => {},
    onOpenMobileFilter = () => {},
    activeFilterCount = 0,
    viewMode = 'grid',
    onViewModeChange = () => {}
}) => {
    return (
        <div className="catalog-toolbar">
            <div className="catalog-toolbar-left">
                <button
                    className="btn btn-secondary catalog-mobile-filter-btn"
                    id="mobile-filter-open-btn"
                    aria-label="Open filter sidebar"
                    onClick={onOpenMobileFilter}
                    type="button"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="4" x2="20" y1="21" y2="21" />
                        <line x1="4" x2="20" y1="3" y2="3" />
                        <line x1="4" x2="20" y1="12" y2="12" />
                        <circle cx="14" cy="21" r="2" />
                        <circle cx="8" cy="12" r="2" />
                        <circle cx="16" cy="3" r="2" />
                    </svg>
                    <span>Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
                </button>

                <div className="catalog-count-info">
                    Showing <strong id="catalog-showing-count">{showingCount}</strong> of <strong>{totalCount}</strong> products
                </div>
            </div>

            <div className="catalog-toolbar-right">
                <div className="catalog-view-toggle-group" role="group" aria-label="View Mode">
                    <button
                        className={`catalog-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                        id="view-grid-btn"
                        aria-label="Switch to Grid View"
                        title="Grid View"
                        onClick={() => onViewModeChange('grid')}
                        type="button"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect width="7" height="7" x="3" y="3" rx="1" />
                            <rect width="7" height="7" x="14" y="3" rx="1" />
                            <rect width="7" height="7" x="14" y="14" rx="1" />
                            <rect width="7" height="7" x="3" y="14" rx="1" />
                        </svg>
                    </button>
                    <button
                        className={`catalog-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                        id="view-list-btn"
                        aria-label="Switch to List View"
                        title="List View"
                        onClick={() => onViewModeChange('list')}
                        type="button"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="8" x2="21" y1="6" y2="6" />
                            <line x1="8" x2="21" y1="12" y2="12" />
                            <line x1="8" x2="21" y1="18" y2="18" />
                            <line x1="3" x2="3.01" y1="6" y2="6" />
                            <line x1="3" x2="3.01" y1="12" y2="12" />
                            <line x1="3" x2="3.01" y1="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="catalog-sort-group">
                    <label htmlFor="catalog-sort-select" className="catalog-sort-label">Sort By:</label>
                    <select
                        id="catalog-sort-select"
                        className="catalog-sort-select"
                        aria-label="Sort products"
                        value={sortBy}
                        onChange={(e) => onSortChange(e.target.value)}
                    >
                        <option value="recommended">Recommended</option>
                        <option value="newest">Newest Arrivals</option>
                        <option value="bestselling">Best Selling</option>
                        <option value="rating">Top Customer Rated</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="discount">Biggest Discount</option>
                    </select>
                </div>
            </div>
        </div>
    );
};

export default ShopCatalogToolbar;
