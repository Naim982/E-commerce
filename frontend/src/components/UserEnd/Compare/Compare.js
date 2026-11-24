import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BreadcrumbNavigation from '../../Common/BreadcrumbNavigation/BreadcrumbNavigation';
import { useCompare } from '../../../context/CompareContext';
import { getProductDataById, getShoppageProducts } from '../../../api/apiManager';
import { generateSlug } from '../../Common/Functions';
import { SearchIcon } from '../../../assets/icons/icons';
import './Compare.css';

const Compare = () => {
    const {
        compareProducts,
        compareCategory,
        removeFromCompare,
        clearCompare,
        addToCompare
    } = useCompare();

    const navigate = useNavigate();

    const [highlightDiff, setHighlightDiff] = useState(false);
    const [detailedProductsMap, setDetailedProductsMap] = useState({});
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [categoryProducts, setCategoryProducts] = useState([]);

    // Collapsed state for specification categories (accordion)
    const [collapsedCategories, setCollapsedCategories] = useState({});

    // Search state for empty slots
    const [slotSearchQueries, setSlotSearchQueries] = useState({});
    const [activeSearchSlot, setActiveSearchSlot] = useState(null);
    const searchDropdownRef = useRef(null);

    // Close search suggestions on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target)) {
                setActiveSearchSlot(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Load detailed specs for each product currently in comparison
    useEffect(() => {
        let isMounted = true;
        const fetchDetails = async () => {
            if (compareProducts.length === 0) {
                setDetailedProductsMap({});
                return;
            }

            setLoadingDetails(true);
            const newMap = {};

            await Promise.all(
                compareProducts.map(async (p) => {
                    if (p.specs && Array.isArray(p.specs)) {
                        newMap[p.id] = p;
                        return;
                    }
                    const res = await getProductDataById(p.id);
                    if (res.success && res.product) {
                        newMap[p.id] = { ...p, ...res.product };
                    } else {
                        newMap[p.id] = p;
                    }
                })
            );

            if (isMounted) {
                setDetailedProductsMap(newMap);
                setLoadingDetails(false);
            }
        };

        fetchDetails();
        return () => {
            isMounted = false;
        };
    }, [compareProducts]);

    // Load other products in the same category for search suggestions
    useEffect(() => {
        let isMounted = true;
        const loadCategoryProducts = async () => {
            const res = await getShoppageProducts();
            if (res.success && Array.isArray(res.products) && isMounted) {
                const available = res.products.filter((p) => {
                    const matchesCategory = !compareCategory ||
                        (p.category && p.category.toLowerCase().trim() === compareCategory.toLowerCase().trim());
                    const alreadyInCompare = compareProducts.some((cp) => cp.id === p.id);
                    return matchesCategory && !alreadyInCompare;
                });
                setCategoryProducts(available);
            }
        };

        loadCategoryProducts();
        return () => {
            isMounted = false;
        };
    }, [compareCategory, compareProducts]);

    // Toggle specification category collapse
    const toggleCategory = (catName) => {
        setCollapsedCategories((prev) => ({
            ...prev,
            [catName]: !prev[catName]
        }));
    };

    // Detailed products array aligned with compareProducts order
    const activeProducts = useMemo(() => {
        return compareProducts.map((p) => detailedProductsMap[p.id] || p);
    }, [compareProducts, detailedProductsMap]);

    // Extract unified specifications structure grouped by spec categories
    const { specCategories, categoryRowsMap } = useMemo(() => {
        const categories = [];
        const rowsMap = {};

        activeProducts.forEach((p) => {
            const pSpecs = p.specs || [];
            pSpecs.forEach((sc) => {
                if (!sc || !sc.category) return;
                if (!categories.includes(sc.category)) {
                    categories.push(sc.category);
                }
                if (!rowsMap[sc.category]) {
                    rowsMap[sc.category] = [];
                }
                (sc.rows || []).forEach((row) => {
                    if (row && row.name && !rowsMap[sc.category].includes(row.name)) {
                        rowsMap[sc.category].push(row.name);
                    }
                });
            });
        });

        return { specCategories: categories, categoryRowsMap: rowsMap };
    }, [activeProducts]);

    // Filter suggestions based on slot query
    const getSuggestionsForQuery = (query) => {
        if (!query || !query.trim()) {
            return categoryProducts.slice(0, 6);
        }
        const q = query.toLowerCase().trim();
        return categoryProducts
            .filter((p) => {
                const titleMatch = (p.title || p.name || '').toLowerCase().includes(q);
                const brandMatch = (p.brandPill || p.brand || '').toLowerCase().includes(q);
                const skuMatch = (p.sku || p.id || '').toLowerCase().includes(q);
                return titleMatch || brandMatch || skuMatch;
            })
            .slice(0, 6);
    };

    // Primary Overview Row Items (SKU, Brand, Availability, Rating, Actual Price, Discount, Current Price)
    const primaryOverviewRows = [
        {
            key: 'sku',
            label: 'SKU',
            getValue: (p) => (
                <span className="compare-sku-val">{p.sku || p.id}</span>
            ),
            getRawValue: (p) => p.sku || p.id
        },
        {
            key: 'brand',
            label: 'Brand',
            getValue: (p) => (
                <span className="compare-brand-val">{p.brandPill || p.brand || '—'}</span>
            ),
            getRawValue: (p) => p.brandPill || p.brand || ''
        },
        {
            key: 'availability',
            label: 'Availability',
            getValue: (p) => (
                <span className="compare-avail-val">
                    <span className="compare-stock-dot" />
                    {p.stock || p.stockStatus || 'In Stock'}
                </span>
            ),
            getRawValue: (p) => p.stock || p.stockStatus || 'In Stock'
        },
        {
            key: 'rating',
            label: 'Rating',
            getValue: (p) => {
                const score = Number(p.reviewScore || 5.0);
                const count = p.reviewCount || 12;
                return (
                    <span className="compare-rating-val">
                        <span className="compare-stars">
                            {'★'.repeat(Math.min(5, Math.max(1, Math.round(score))))}
                            {'☆'.repeat(Math.max(0, 5 - Math.round(score)))}
                        </span>
                        <span className="compare-rating-count">({count} reviews)</span>
                    </span>
                );
            },
            getRawValue: (p) => `${p.reviewScore || 5.0}-${p.reviewCount || 12}`
        },
        {
            key: 'actualPrice',
            label: 'Actual Price',
            getValue: (p) => {
                const hasOld = Boolean(p.oldPrice || p.price?.old);
                const val = hasOld
                    ? (typeof p.oldPrice === 'number' ? `৳${p.oldPrice.toLocaleString()}` : (p.oldPrice || `৳${p.price?.old}`))
                    : (typeof p.currentPrice === 'number' ? `৳${p.currentPrice.toLocaleString()}` : (p.currentPrice || (p.price?.current ? `৳${p.price.current}` : '—')));
                return (
                    <span className={hasOld ? 'compare-actual-price-val' : ''}>
                        {val}
                    </span>
                );
            },
            getRawValue: (p) => p.oldPrice || p.price?.old || p.currentPrice || ''
        },
        {
            key: 'discount',
            label: 'Discount',
            getValue: (p) => {
                const disc = p.discount || p.price?.discount;
                return disc ? (
                    <span className="compare-discount-tag">{disc}</span>
                ) : (
                    '—'
                );
            },
            getRawValue: (p) => p.discount || p.price?.discount || '—'
        },
        {
            key: 'currentPrice',
            label: 'Current Price',
            isPriceRow: true,
            getValue: (p) => (
                <span className="compare-current-price-val">
                    {typeof p.currentPrice === 'number'
                        ? `৳${p.currentPrice.toLocaleString()}`
                        : (p.currentPrice || (p.price?.current ? `৳${p.price.current}` : '৳0'))}
                </span>
            ),
            getRawValue: (p) => p.currentPrice || (p.price?.current ? p.price.current : 0)
        }
    ];

    const emptySlotsCount = Math.max(0, 3 - activeProducts.length);

    return (
        <main className="compare-page-main">
            <BreadcrumbNavigation path={['Home', 'Compare']} />

            {/* Header Toolbar */}
            <section className="compare-header-section">
                <div className="container">
                    <div className="compare-header-row">
                        <div>
                            <h1 className="compare-title">Compare Products</h1>
                        </div>

                        {compareProducts.length > 0 && (
                            <div className="compare-header-actions">
                                {compareCategory && (
                                    <span className="compare-category-badge">
                                        Category: {compareCategory}
                                    </span>
                                )}

                                <button
                                    type="button"
                                    className="compare-clear-btn"
                                    onClick={clearCompare}
                                    title="Clear comparison list"
                                >
                                    ✕ Clear All
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Empty State when no products are selected */}
            {compareProducts.length === 0 && (
                <div className="container">
                    <div className="compare-empty-page">
                        <div className="compare-empty-page-icon">⇄</div>
                        <h2 className="compare-empty-page-title">Your Comparison List is Empty</h2>
                        <p className="compare-empty-page-desc">
                            Select up to 3 products in the same hardware category to inspect and compare their technical specifications side-by-side.
                        </p>
                        <Link to="/shop" className="btn btn-primary btn-lg">
                            Browse Hardware Catalog &rarr;
                        </Link>
                    </div>
                </div>
            )}

            {/* Comparison Workspace */}
            {compareProducts.length > 0 && (
                <section className="compare-content-section">
                    <div className="container">
                        {/* ========================================================= */}
                        {/* 1. UPPER SECTION: PRIMARY COMPARISON TABLE MATRIX        */}
                        {/* ========================================================= */}
                        <div className="compare-specs-section compare-primary-matrix-section">
                            <div className="compare-specs-table-wrapper">
                                <table className="compare-specs-table compare-primary-table">
                                    <colgroup>
                                        <col className="compare-col-name" />
                                        <col className="compare-col-prod" />
                                        <col className="compare-col-prod" />
                                        <col className="compare-col-prod" />
                                    </colgroup>
                                    <tbody>
                                        {/* Product Images & Names Row */}
                                        <tr className="compare-primary-header-row">
                                            <td className="compare-spec-name-col compare-primary-item-label">
                                                Product
                                            </td>

                                            {/* Active Product Cells */}
                                            {activeProducts.map((p, idx) => {
                                                const slug = generateSlug(p.name || p.title || '');

                                                return (
                                                    <td key={p.id} className="compare-spec-val-col compare-primary-prod-cell">
                                                        <div className="compare-prod-cell-top">
                                                            <span className="compare-slot-tag">Product {idx + 1} of 3</span>
                                                            <button
                                                                type="button"
                                                                className="compare-remove-btn"
                                                                onClick={() => removeFromCompare(p.id)}
                                                                title={`Remove ${p.title || p.name} from compare`}
                                                                aria-label="Remove item"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>

                                                        <Link to={`/product-details/${p.id}/${slug}`} className="compare-image-link">
                                                            <img
                                                                src={p.mainImage}
                                                                alt={p.title || p.name}
                                                                className="compare-product-img"
                                                                loading="lazy"
                                                            />
                                                        </Link>

                                                        <h3 className="compare-product-title">
                                                            <Link to={`/product-details/${p.id}/${slug}`} title={p.title || p.name}>
                                                                {p.title || p.name}
                                                            </Link>
                                                        </h3>
                                                    </td>
                                                );
                                            })}

                                            {/* Empty Slot Cells */}
                                            {Array.from({ length: emptySlotsCount }).map((_, slotIdx) => {
                                                const currentQuery = slotSearchQueries[slotIdx] || '';
                                                const isSearching = activeSearchSlot === slotIdx;
                                                const suggestions = getSuggestionsForQuery(currentQuery);

                                                return (
                                                    <td
                                                        key={`empty-slot-cell-${slotIdx}`}
                                                        className="compare-spec-val-col compare-primary-empty-cell"
                                                        ref={isSearching ? searchDropdownRef : null}
                                                    >
                                                        <div className="compare-empty-slot-content">
                                                            <button
                                                                type="button"
                                                                className="compare-empty-slot-icon"
                                                                onClick={() => navigate(compareCategory ? `/shop?category=${encodeURIComponent(compareCategory)}` : '/shop')}
                                                                title="Browse Shop to add products"
                                                                aria-label="Browse Shop"
                                                            >
                                                                +
                                                            </button>

                                                            <div className="compare-empty-slot-title">
                                                                Add {compareCategory ? `${compareCategory} ` : ''}Model
                                                            </div>

                                                            {/* Search bar with instant suggestion dropdown */}
                                                            <div className="compare-slot-search-wrapper">
                                                                <div className="compare-slot-search-box">
                                                                    <SearchIcon size={15} className="compare-slot-search-icon" />
                                                                    <input
                                                                        type="text"
                                                                        className="compare-slot-search-input"
                                                                        placeholder={`Search ${compareCategory || 'product'}...`}
                                                                        value={currentQuery}
                                                                        onChange={(e) => {
                                                                            const val = e.target.value;
                                                                            setSlotSearchQueries((prev) => ({ ...prev, [slotIdx]: val }));
                                                                            setActiveSearchSlot(slotIdx);
                                                                        }}
                                                                        onFocus={() => setActiveSearchSlot(slotIdx)}
                                                                    />
                                                                    {currentQuery && (
                                                                        <button
                                                                            type="button"
                                                                            className="compare-slot-search-clear"
                                                                            onClick={() => {
                                                                                setSlotSearchQueries((prev) => ({ ...prev, [slotIdx]: '' }));
                                                                            }}
                                                                        >
                                                                            ✕
                                                                        </button>
                                                                    )}
                                                                </div>

                                                                {/* Dropdown Suggestions */}
                                                                {isSearching && (
                                                                    <div className="compare-slot-suggestions-dropdown">
                                                                        <div className="compare-slot-suggestions-header">
                                                                            Available {compareCategory || 'Products'} ({categoryProducts.length})
                                                                        </div>
                                                                        {suggestions.length > 0 ? (
                                                                            <div className="compare-slot-suggestions-list">
                                                                                {suggestions.map((item) => (
                                                                                    <button
                                                                                        key={item.id}
                                                                                        type="button"
                                                                                        className="compare-suggestion-item"
                                                                                        onClick={() => {
                                                                                            addToCompare(item);
                                                                                            setSlotSearchQueries((prev) => ({ ...prev, [slotIdx]: '' }));
                                                                                            setActiveSearchSlot(null);
                                                                                        }}
                                                                                    >
                                                                                        <img
                                                                                            src={item.mainImage}
                                                                                            alt={item.title || item.name}
                                                                                            className="compare-suggestion-thumb"
                                                                                        />
                                                                                        <div className="compare-suggestion-details">
                                                                                            <span className="compare-suggestion-title">
                                                                                                {item.title || item.name}
                                                                                            </span>
                                                                                            <span className="compare-suggestion-meta">
                                                                                                {item.brandPill || item.brand} •{' '}
                                                                                                <strong>
                                                                                                    {typeof item.currentPrice === 'number'
                                                                                                        ? `৳${item.currentPrice.toLocaleString()}`
                                                                                                        : item.currentPrice}
                                                                                                </strong>
                                                                                            </span>
                                                                                        </div>
                                                                                        <span className="compare-suggestion-add-btn">+ Add</span>
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        ) : (
                                                                            <div className="compare-suggestion-empty">
                                                                                No matching products found.
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>

                                        {/* Primary Specification Rows (Item names on the left ONCE) */}
                                        {primaryOverviewRows.map((rowItem) => {
                                            const rawVals = activeProducts.map((p) => rowItem.getRawValue(p));
                                            const isDiff = rawVals.some((v) => v !== rawVals[0]);

                                            return (
                                                <tr
                                                    key={`primary-row-${rowItem.key}`}
                                                    className={`compare-specs-row ${rowItem.isPriceRow ? 'compare-primary-price-row' : ''} ${highlightDiff && isDiff ? 'diff-highlight' : ''}`}
                                                >
                                                    <td className="compare-spec-name-col">
                                                        <div className="compare-spec-name-inner">
                                                            {highlightDiff && isDiff && (
                                                                <span className="compare-diff-marker" title="Different value" />
                                                            )}
                                                            <span>{rowItem.label}</span>
                                                        </div>
                                                    </td>

                                                    {activeProducts.map((p) => (
                                                        <td key={p.id} className="compare-spec-val-col">
                                                            {rowItem.getValue(p)}
                                                        </td>
                                                    ))}

                                                    {Array.from({ length: emptySlotsCount }).map((_, sIdx) => (
                                                        <td key={`empty-val-${sIdx}`} className="compare-spec-val-col compare-spec-val-empty">
                                                            —
                                                        </td>
                                                    ))}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* ========================================================= */}
                        {/* 2. LOWER SECTION: SPECIFICATIONS COMPARISON MATRIX       */}
                        {/* ========================================================= */}
                        <div className="compare-specs-section">
                            {/* Section Header with Highlight Differences toggle beside Title */}
                            <div className="compare-specs-header">
                                <div className="compare-specs-title-group">
                                    <h3 className="compare-specs-title">
                                        <span>📋</span> Detailed Technical Specifications
                                    </h3>

                                    <button
                                        type="button"
                                        className={`compare-diff-toggle-btn ${highlightDiff ? 'active' : ''}`}
                                        onClick={() => setHighlightDiff(!highlightDiff)}
                                        title="Highlight differing attributes across products"
                                    >
                                        <span>{highlightDiff ? '✓ Highlight Differences Active' : '⚡ Highlight Differences'}</span>
                                    </button>
                                </div>

                                {loadingDetails && (
                                    <small className="compare-specs-loading-text">
                                        Loading detailed specs...
                                    </small>
                                )}
                            </div>

                            <div className="compare-specs-table-wrapper">
                                <table className="compare-specs-table">
                                    <colgroup>
                                        <col className="compare-col-name" />
                                        <col className="compare-col-prod" />
                                        <col className="compare-col-prod" />
                                        <col className="compare-col-prod" />
                                    </colgroup>
                                    <tbody>
                                        {/* Detailed Specs Categories & Rows with Dropdown Collapsible Header */}
                                        {specCategories.map((catName) => {
                                            const rowNames = categoryRowsMap[catName] || [];
                                            if (rowNames.length === 0) return null;
                                            const isCollapsed = Boolean(collapsedCategories[catName]);

                                            return (
                                                <React.Fragment key={catName}>
                                                    <tr
                                                        className="compare-specs-category-header"
                                                        onClick={() => toggleCategory(catName)}
                                                    >
                                                        <th colSpan={1 + 3}>
                                                            <div className="compare-cat-header-content">
                                                                <span className="compare-cat-header-title">{catName}</span>
                                                                <button
                                                                    type="button"
                                                                    className={`compare-cat-toggle-btn ${isCollapsed ? 'collapsed' : ''}`}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        toggleCategory(catName);
                                                                    }}
                                                                    aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${catName}`}
                                                                    title={`${isCollapsed ? 'Expand' : 'Collapse'} ${catName}`}
                                                                >
                                                                    <span className="compare-cat-toggle-label">
                                                                        {isCollapsed ? 'Expand' : 'Collapse'}
                                                                    </span>
                                                                    <span className="compare-cat-toggle-chevron">
                                                                        {isCollapsed ? '▾' : '▴'}
                                                                    </span>
                                                                </button>
                                                            </div>
                                                        </th>
                                                    </tr>

                                                    {!isCollapsed && rowNames.map((rowName) => {
                                                        const values = activeProducts.map((p) => {
                                                            const pSpecs = p.specs || [];
                                                            const foundCat = pSpecs.find((sc) => sc.category === catName);
                                                            if (!foundCat) return '—';
                                                            const foundRow = (foundCat.rows || []).find((r) => r.name === rowName);
                                                            return foundRow?.value || '—';
                                                        });

                                                        const isDiff = values.some((v) => v !== values[0]);

                                                        return (
                                                            <tr
                                                                key={`${catName}-${rowName}`}
                                                                className={`compare-specs-row ${highlightDiff && isDiff ? 'diff-highlight' : ''}`}
                                                            >
                                                                <td className="compare-spec-name-col">
                                                                    <div className="compare-spec-name-inner">
                                                                        {highlightDiff && isDiff && (
                                                                            <span className="compare-diff-marker" title="Different value" />
                                                                        )}
                                                                        <span>{rowName}</span>
                                                                    </div>
                                                                </td>
                                                                {values.map((val, pIdx) => (
                                                                    <td key={pIdx} className="compare-spec-val-col">
                                                                        {val !== '—' ? (
                                                                            <span className="compare-spec-val-text">{val}</span>
                                                                        ) : (
                                                                            <span className="compare-spec-val-empty">—</span>
                                                                        )}
                                                                    </td>
                                                                ))}
                                                                {Array.from({ length: emptySlotsCount }).map((_, sIdx) => (
                                                                    <td key={`row-empty-${sIdx}`} className="compare-spec-val-col compare-spec-val-empty">
                                                                        —
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        );
                                                    })}
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </main>
    );
};

export default Compare;
