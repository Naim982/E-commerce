import React from 'react';
import './ShopSearchBox.css';

const POPULAR_SEARCHES = [
    'RTX 5080',
    'Ryzen 9 9950X',
    'Samsung 990',
    '4K QD-OLED',
    'Apex Pro',
    'DDR5 7200'
];

const ShopSearchBox = ({
    searchQuery = '',
    onSearchChange = () => {},
    onClearSearch = () => {}
}) => {
    return (
        <div className="catalog-main-search-box" aria-label="Catalog Main Search">
            <form
                className="catalog-main-search-wrapper"
                onSubmit={(e) => e.preventDefault()}
            >
                <span className="catalog-main-search-icon" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                    </svg>
                </span>
                <input
                    type="search"
                    className="catalog-main-search-input"
                    id="catalog-main-search-input"
                    placeholder="Search all PC hardware, GPUs, CPUs, motherboards, DDR5 RAM, SSDs, peripherals..."
                    aria-label="Main catalog product search"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
                {searchQuery && (
                    <button
                        type="button"
                        className="catalog-search-clear-btn"
                        onClick={onClearSearch}
                        aria-label="Clear search input"
                        title="Clear search"
                    >
                        ✕
                    </button>
                )}
                <button
                    type="submit"
                    className="btn btn-primary catalog-main-search-btn"
                    id="catalog-main-search-btn"
                >
                    <span>Search</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </button>
            </form>

            <div className="catalog-search-tags-row">
                <span className="catalog-search-tag-label">Popular Searches:</span>
                {POPULAR_SEARCHES.map((tag) => {
                    const isActive = searchQuery.toLowerCase() === tag.toLowerCase();
                    return (
                        <button
                            key={tag}
                            type="button"
                            className={`catalog-search-tag-chip ${isActive ? 'active' : ''}`}
                            onClick={() => onSearchChange(isActive ? '' : tag)}
                        >
                            {tag}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default ShopSearchBox;
