import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { CartIcon, SettingsIcon, WishlistHeartIcon, CompareIcon } from '../../../assets/icons/icons';
import {
    addProductToCartlist,
    addProductToWishlist,
    checkWishlistCartStatus,
    getProductDataById,
    getProductSimilar,
    removeProductFromWishlist,
    submitProductFAQ,
    submitProductReview
} from '../../../api/apiManager';
import useAuth from '../../../authentication/useAuth';
import { useCheckout } from '../../../context/CheckoutContext';
import { useCompare } from '../../../context/CompareContext';
import './ProductDetails.css';

const ProductDetails = () => {
    const { user } = useAuth();
    const user_id = user?.uid;

    const { productId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { setCheckout } = useCheckout();
    const { addToCompare, isInCompare } = useCompare();

    const [product, setProduct] = useState(null);
    const [selectedImage, setSelectedImage] = useState('');
    const [variant, setVariant] = useState([]);
    const [quantity, setQuantity] = useState(1);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    const [wishlistStatus, setWishlistStatus] = useState(false);
    const [cartlistStatus, setCartlistStatus] = useState(false);

    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [cartLoading, setCartLoading] = useState(false);

    const [showAskQuestion, setShowAskQuestion] = useState(false);
    const [faqQuestion, setFaqQuestion] = useState('');
    const [showWriteReview, setShowWriteReview] = useState(false);
    const [selectedStars, setSelectedStars] = useState(5);
    const [hoverStars, setHoverStars] = useState(0);
    const [reviewTitle, setReviewTitle] = useState('');
    const [reviewDesc, setReviewDesc] = useState('');
    const [similarProducts, setSimilarProducts] = useState([]);

    let unitPrice = 0;
    let totalPrice = 0;

    useEffect(() => {
        const loadProduct = async () => {
            setLoading(true);
            setError('');

            const result = await getProductDataById(productId);
            if (!result.success) {
                setError(result.error);
                setLoading(false);
                return;
            }

            let savedVariant = [];
            let savedCartData = null;
            if (user_id) {
                const statusResult = await checkWishlistCartStatus(user_id, productId);
                if (!statusResult.success) {
                    setError(statusResult.error);
                    setLoading(false);
                    return;
                }

                setWishlistStatus(statusResult.wishlistStatus);
                setCartlistStatus(statusResult.cartStatus);

                savedCartData = statusResult.cartData;
                savedVariant = savedCartData?.variant || [];
            }

            const defaultVariant = result.product.variants.map(variantData => {
                const defaultOption = variantData.options.find(option => option.isDefault);
                return {
                    type: variantData.type,
                    name: defaultOption?.name || '',
                    priceModifier: defaultOption?.priceModifier || 0
                };
            });

            setProduct(result.product);
            setSelectedImage(result.product.mainImage);
            if (savedVariant.length > 0) {
                setVariant(savedVariant);
            } else {
                setVariant(defaultVariant);
            }

            setLoading(false);
        };

        const loadSimilarProducts = async () => {
            const result = await getProductSimilar(productId);
            if (result.success) {
                setSimilarProducts(result.products);
            }
        };

        loadProduct();
        loadSimilarProducts();
    }, [productId, user_id]);

    useEffect(() => {
        if (!loading && product && (location.state?.tab === 'reviews' || location.hash === '#reviews')) {
            setActiveTab('reviews');
            const timer = setTimeout(() => {
                if (location.state?.reviewId) {
                    const specificReview = document.getElementById(`review-${location.state.reviewId}`);
                    if (specificReview) {
                        specificReview.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        specificReview.style.transition = 'box-shadow 0.4s ease, border-color 0.4s ease';
                        specificReview.style.borderColor = 'var(--color-primary)';
                        specificReview.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.25)';
                        return;
                    }
                }
                const el = document.getElementById('tab-pane-reviews');
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 350);
            return () => clearTimeout(timer);
        }
    }, [location.state, location.hash, product, loading]);

    const handleVariantSelect = (variantData, option) => {
        setVariant(prevVariant => {
            return prevVariant.map(item =>
                item.type === variantData.type
                    ? {
                        type: variantData.type,
                        name: option.name,
                        priceModifier: option.priceModifier || 0
                    }
                    : item
            );
        });
    };

    const variantPriceModifier = variant.reduce(
        (total, item) => total + item.priceModifier,
        0
    );

    unitPrice = (product?.price.current || 0) + variantPriceModifier;
    totalPrice = unitPrice * quantity;

    const handleWishlistClick = async () => {
        if (wishlistLoading) {
            return;
        }

        setWishlistLoading(true);
        setError('');

        let result;
        if (wishlistStatus) {
            result = await removeProductFromWishlist(user_id, productId);
        } else {
            result = await addProductToWishlist(user_id, productId);
        }

        if (result.success) {
            setWishlistStatus(prevStatus => !prevStatus);
        } else {
            setError(result.error);
        }

        setWishlistLoading(false);
    };

    const handleCartListClick = async () => {
        if (cartlistStatus || cartLoading) {
            return;
        }

        setCartLoading(true);
        setError('');

        const result = await addProductToCartlist(
            user_id,
            productId,
            quantity,
            variant
        );

        if (result.success) {
            setCartlistStatus(true);
        } else {
            setError(result.error);
        }

        setCartLoading(false);
    };

    // --- Review Handler ---
    const handleReviewSubmit = async () => {
        if (!user_id) {
            setError('You must be logged in to leave a review.');
            return;
        }

        if (!reviewTitle.trim() || !reviewDesc.trim()) {
            setError('Please fill out both the title and description.');
            return;
        }

        const result = await submitProductReview(user_id, productId, selectedStars, reviewTitle, reviewDesc);
        if (result.success) {
            setProduct(result.product);
            setShowWriteReview(false);
            setReviewTitle('');
            setReviewDesc('');
            setSelectedStars(5);
        } else {
            setError(result.error);
        }
    };

    // --- FAQ Handler ---
    const handleFaqSubmit = async () => {
        if (!faqQuestion.trim()) {
            setError('Please enter a question.');
            return;
        }

        const result = await submitProductFAQ(productId, faqQuestion);
        if (result.success) {
            setProduct(result.product);
            setShowAskQuestion(false);
            setFaqQuestion('');
        } else {
            setError(result.error);
        }
    };

    if (loading || !product) {
        return <div>{error || 'Loading product details...'}</div>;
    }

    return (
        <main>
            <section className="details-main-section">
                <div className="container">
                    <div className="details-grid">
                        {/* Left Column: Gallery & Chooser */}
                        <div className="details-gallery-col">
                            <div className="details-main-image-frame" id="details-main-image-frame">
                                <img src={selectedImage || product?.mainImage} alt={product?.name} id="details-main-img" />
                                {product?.badge && product?.badge?.text && (
                                    <span className={`details-badge-overlay badge-${product.badge.type}`}>
                                        {product.badge.text}
                                    </span>
                                )}
                            </div>

                            <div className="details-thumbs-row" id="details-thumbs-row">
                                {product?.thumbnails.map((thumbnail, index) => (
                                    <button
                                        key={index}
                                        className={`details-thumb-btn ${selectedImage === thumbnail ? 'active' : ''}`}
                                        onClick={() => setSelectedImage(thumbnail)}
                                        aria-label={`View product image ${index + 1}`}
                                    >
                                        <img src={thumbnail} alt={`${product?.name} view ${index + 1}`} />
                                    </button>
                                ))}
                            </div>

                            {/* Hardware Specification Chooser Card */}
                            <div className="details-chooser-card">
                                <div className="details-chooser-header">
                                    <div className="details-chooser-title">
                                        <SettingsIcon /> <span>Hardware Specification Chooser</span>
                                    </div>
                                </div>

                                {product?.variants.map((variantData, vIndex) => {
                                    const selectedVariant = variant.find(item => item.type === variantData.type);
                                    return (
                                        <div className="details-chooser-group" key={vIndex}>
                                            <div className="details-chooser-label-row">
                                                <strong>{variantData.label}:</strong>
                                            </div>
                                            <div className="details-chooser-options">
                                                {variantData.options.map((opt, oIndex) => {
                                                    const isActive = selectedVariant?.name === opt.name;
                                                    return (
                                                        <button
                                                            key={oIndex}
                                                            type="button"
                                                            className={`details-choice-btn ${isActive ? 'active' : ''}`}
                                                            disabled={opt.stock === 'Out of Stock'}
                                                            title={opt.stock === 'Out of Stock' ? 'Currently out of stock' : ''}
                                                            onClick={() => handleVariantSelect(variantData, opt)}
                                                        >
                                                            <span>{opt.name}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Hardware Confidence Points */}
                            <div className="details-confidence-strip">
                                <div className="details-conf-item">
                                    <span>🛡️</span> 100% Genuine Hardware
                                </div>
                                <div className="details-conf-item">
                                    <span>📜</span> {product?.warranty || 'Official Brand Warranty'}
                                </div>
                                <div className="details-conf-item">
                                    <span>🚚</span> Free Insured Express Delivery
                                </div>
                                <div className="details-conf-item">
                                    <span>🔄</span> {product?.guarantee || '30-Day Hassle-Free Returns'}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Info & Actions */}
                        <div className="details-info-col">
                            <div className="details-meta-top">
                                <span className="details-brand-pill">{product?.brandPill}</span>
                                <span className="details-sku-label">{`SKU: ${product?.sku}`}</span>
                            </div>

                            <h1 className="details-product-title">{product?.title}</h1>

                            {/* Badges Row */}
                            {product?.badge && product?.badge?.text && (
                                <div className="details-hero-badges-row">
                                    <span className={`badge badge-${product.badge.type}`}>{product.badge.text}</span>
                                </div>
                            )}

                            {/* Telemetry Spec Matrix */}
                            <div className="details-quick-overview-card">
                                <div className="details-quick-overview-header">
                                    <div className="details-telemetry-badge">
                                        <span className="telemetry-live-dot" />
                                        <span className="telemetry-title">Primary Hardware Specifications</span>
                                    </div>
                                </div>

                                <div className="details-stat-matrix-grid">
                                    {product?.quickOverview.map((spec, index) => (
                                        <div className="details-stat-tile" key={index}>
                                            <div className="stat-tile-content">
                                                <span className="stat-tile-val">{spec.value}</span>
                                                <span className="stat-tile-lbl">{spec.label}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Pricing & Stock Information */}
                            <div className="details-price-stock-box">
                                <div className="details-price-pane">
                                    <div className="details-price-main-row">
                                        <span className="details-price-current">৳{unitPrice.toFixed(2)}</span>
                                        <span className="details-price-old">৳{product?.price.old.toFixed(2)}</span>
                                        <span className="badge badge-error">{product?.price.discount}</span>
                                    </div>
                                    <div className="details-price-total">
                                        {` ${quantity} × ৳${unitPrice.toFixed(2)} = ৳${totalPrice.toFixed(2)}`}
                                    </div>
                                </div>
                            </div>

                            {/* Purchase Actions */}
                            <div className="details-purchase-row">
                                <div className="details-quantity-control">
                                    <button
                                        className="details-qty-btn"
                                        id="qty-minus-btn"
                                        onClick={() => setQuantity(preQnt => preQnt !== 1 ? preQnt - 1 : 1)}
                                        disabled={quantity === 1}
                                    >
                                        -
                                    </button>
                                    <input type="number" id="details-qty-input" value={quantity} readOnly />
                                    <button
                                        className="details-qty-btn"
                                        id="qty-plus-btn"
                                        onClick={() => setQuantity(preQnt => preQnt + 1)}
                                    >
                                        +
                                    </button>
                                </div>

                                <button
                                    className="btn btn-lg btn-primary details-add-cart-btn"
                                    data-action="add-to-cart"
                                    data-product-id={product?.id}
                                    title={cartlistStatus ? 'This item has already been added to cart' : 'Add to cart'}
                                    onClick={handleCartListClick}
                                    disabled={cartLoading || cartlistStatus}
                                >
                                    <CartIcon />
                                    <span>{cartlistStatus ? 'Added to Cart' : 'Add to Cart'}</span>
                                </button>

                                <button
                                    className={`btn btn-lg btn-secondary details-wishlist-btn ${wishlistStatus ? 'active' : ''}`}
                                    id="details-wishlist-toggle-btn"
                                    data-action="wishlist"
                                    onClick={handleWishlistClick}
                                    data-product-id={product?.id}
                                    disabled={wishlistLoading}
                                    title={wishlistStatus ? 'Remove from wishlist' : 'Save to wishlist'}
                                    aria-label="Wishlist"
                                >
                                    <WishlistHeartIcon size={18} />
                                </button>

                                <button
                                    className={`btn btn-lg btn-secondary details-compare-btn ${product && isInCompare(product.id) ? 'active' : ''}`}
                                    id="details-compare-toggle-btn"
                                    data-action="compare"
                                    onClick={() => {
                                        if (!product) return;
                                        const res = addToCompare(product);
                                        if (res.success) {
                                            navigate('/compare');
                                        }
                                    }}
                                    data-product-id={product?.id}
                                    title={product && isInCompare(product.id) ? 'In Comparison — View Compare' : 'Add to Compare'}
                                    aria-label="Compare"
                                >
                                    <CompareIcon size={18} />
                                    <span>{product && isInCompare(product.id) ? 'In Compare' : 'Compare'}</span>
                                </button>
                            </div>

                            {/* Instant Buy Now Action */}
                            <Link
                                to="/product-delivery"
                                onClick={() => {
                                    setCheckout({
                                        source: 'direct',
                                        checkoutItems: [
                                            {
                                                id: product.id,
                                                quantity,
                                                variant
                                            }
                                        ],
                                        address: null,
                                        delivery: null
                                    });
                                }}
                                className="btn btn-lg btn-outline details-buy-now-btn"
                            >
                                <span>Buy Now with Express 1-Click Checkout &rarr;</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Lower Section: Tabs Filter + Content + Sidebar */}
            <section className="details-bottom-section">
                <div className="container">
                    <div className="details-bottom-layout-grid">
                        {/* Main Content Column */}
                        <div className="details-main-content-col">
                            {/* Tab Navigation Filter Buttons */}
                            <div className="details-nav-tabs-bar" role="tablist" aria-label="Product Details Navigation">
                                <button
                                    className={`details-nav-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('all')}
                                    role="tab"
                                    aria-selected={activeTab === 'all'}
                                >
                                    <span>📋 All Details</span>
                                </button>
                                <button
                                    className={`details-nav-tab-btn ${activeTab === 'specs' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('specs')}
                                    role="tab"
                                    aria-selected={activeTab === 'specs'}
                                >
                                    <span>⚙️ Specifications</span>
                                </button>
                                <button
                                    className={`details-nav-tab-btn ${activeTab === 'description' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('description')}
                                    role="tab"
                                    aria-selected={activeTab === 'description'}
                                >
                                    <span>📖 Description</span>
                                </button>
                                <button
                                    className={`details-nav-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('reviews')}
                                    role="tab"
                                    aria-selected={activeTab === 'reviews'}
                                >
                                    <span>⭐ Customer Reviews ({(product?.review || product?.reviews)?.count || 0})</span>
                                </button>
                                <button
                                    className={`details-nav-tab-btn ${activeTab === 'faq' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('faq')}
                                    role="tab"
                                    aria-selected={activeTab === 'faq'}
                                >
                                    <span>💬 FAQ</span>
                                </button>
                            </div>

                            <div className="details-tabs-content-wrapper">
                                {/* Specifications */}
                                {(activeTab === 'all' || activeTab === 'specs') && (
                                    <div className="details-tab-pane" id="tab-pane-specs" data-tab="specs">
                                        <div className="home-section-header" style={{ marginBottom: 'var(--space-4)' }}>
                                            <h2 className="home-section-title" style={{ fontSize: '1.4rem' }}>
                                                Technical Specifications
                                            </h2>
                                        </div>

                                        <div className="details-specs-table-wrapper">
                                            <table className="details-specs-table">
                                                <tbody>
                                                    {product?.specs.map((spec, index) => (
                                                        <React.Fragment key={index}>
                                                            <tr className="details-spec-category">
                                                                <th colSpan="2">{spec.category}</th>
                                                            </tr>
                                                            {spec.rows.map((row, rIndex) => (
                                                                <tr key={rIndex}>
                                                                    <td className="details-spec-name">{row.name}</td>
                                                                    <td className="details-spec-val">{row.value}</td>
                                                                </tr>
                                                            ))}
                                                        </React.Fragment>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Description */}
                                {(activeTab === 'all' || activeTab === 'description') && (
                                    <div className="details-tab-pane" id="tab-pane-description" data-tab="description">
                                        <div className="home-section-header" style={{ marginBottom: 'var(--space-4)' }}>
                                            <h2 className="home-section-title" style={{ fontSize: '1.4rem' }}>
                                                Product Description
                                            </h2>
                                        </div>

                                        <div className="details-overview-box">
                                            <div className="details-overview-grid">
                                                <div className="details-overview-text">
                                                    <h3 className="details-section-heading">
                                                        {product?.description.heading}
                                                    </h3>

                                                    {product?.description.paragraphs.map((paragraph, index) => (
                                                        <p key={index}>{paragraph}</p>
                                                    ))}

                                                    <h4 style={{ marginTop: 'var(--space-5)', fontSize: '1.05rem', fontWeight: '700' }}>
                                                        What's in the Box
                                                    </h4>
                                                    <ul className="details-box-list">
                                                        {product?.description.boxContents.map((content, index) => (
                                                            <li key={index}>{content}</li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                <div className="details-overview-visual">
                                                    <div className="details-box-card">
                                                        <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: 'var(--space-3)' }}>
                                                            Verified Clearance & Compatibility
                                                        </h4>
                                                        <div className="details-compat-check-list">
                                                            {product?.compatibilityChecks.map((compatibility, index) => (
                                                                <div key={index} className={`compat-check-item ${compatibility.icon}`}>
                                                                    <strong>{compatibility.text}</strong>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Reviews */}
                                {(activeTab === 'all' || activeTab === 'reviews') && (
                                    <div className="details-tab-pane" id="tab-pane-reviews" data-tab="reviews">
                                        <div className="home-section-header" style={{ marginBottom: 'var(--space-4)' }}>
                                            <h2 className="home-section-title" style={{ fontSize: '1.4rem' }}>
                                                Customer Reviews & Benchmarks
                                            </h2>
                                            <button
                                                className={`btn ${showWriteReview ? 'btn-secondary' : 'btn-outline'}`}
                                                onClick={() => setShowWriteReview(!showWriteReview)}
                                            >
                                                {showWriteReview ? 'Hide Review' : 'Write a Review'}
                                            </button>
                                        </div>

                                        <div className="details-reviews-summary-grid">
                                            <div className="details-reviews-score-box">
                                                <div className="details-score-number">{(product?.review || product?.reviews)?.score}</div>
                                                <div className="star-rating" style={{ fontSize: '1.35rem', marginBottom: '4px' }}>
                                                    ★★★★★
                                                </div>
                                                <div className="details-score-count">
                                                    Based on {(product?.review || product?.reviews)?.count} verified purchases
                                                </div>
                                            </div>

                                            <div className="details-rating-bars">
                                                {(product?.review || product?.reviews)?.bars.map((bar, index) => {
                                                    const totalCount = (product?.review || product?.reviews)?.count || 1;
                                                    const percentage = bar.percentage !== undefined ? bar.percentage : Math.round((bar.count / totalCount) * 100);
                                                    return (
                                                        <div key={index} className="details-bar-row">
                                                            <span>{bar.stars} Stars</span>
                                                            <div className="details-bar-track">
                                                                <div className="details-bar-fill" style={{ width: `${percentage}%` }} />
                                                            </div>
                                                            <span>{bar.count !== undefined ? bar.count : `${percentage}%`}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Write a Review Form */}
                                        {showWriteReview && (
                                            <div className="details-write-review-card">
                                                <h4 className="details-form-heading">Write a Review</h4>

                                                <div className="details-form-row">
                                                    <label className="details-form-label">Rating:</label>
                                                    <div className="details-star-buttons" role="radiogroup" aria-label="Select star rating">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <button
                                                                key={star}
                                                                type="button"
                                                                className={`details-star-btn ${star <= (hoverStars || selectedStars) ? 'active' : ''}`}
                                                                onClick={() => setSelectedStars(star)}
                                                                onMouseEnter={() => setHoverStars(star)}
                                                                onMouseLeave={() => setHoverStars(0)}
                                                                aria-label={`${star} star${star > 1 ? 's' : ''}`}
                                                            >
                                                                ★
                                                            </button>
                                                        ))}
                                                        <span className="details-star-count-label">
                                                            ({selectedStars} of 5 Stars)
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="details-form-row">
                                                    <label className="details-form-label" htmlFor="review-title-input">
                                                        Review Title:
                                                    </label>
                                                    <input
                                                        id="review-title-input"
                                                        type="text"
                                                        className="details-form-input"
                                                        placeholder="e.g., Exceptional speed and whisper quiet thermals"
                                                        value={reviewTitle}
                                                        onChange={(e) => setReviewTitle(e.target.value)}
                                                    />
                                                </div>

                                                <div className="details-form-row details-form-row-textarea">
                                                    <label className="details-form-label" htmlFor="review-desc-input">
                                                        Review Description:
                                                    </label>
                                                    <textarea
                                                        id="review-desc-input"
                                                        className="details-form-textarea"
                                                        rows="4"
                                                        placeholder="Write your review here..."
                                                        value={reviewDesc}
                                                        onChange={(e) => setReviewDesc(e.target.value)}
                                                    />
                                                </div>

                                                <div className="details-form-actions details-form-actions-aligned">
                                                    <button type="button" className="btn btn-primary btn-sm" onClick={handleReviewSubmit}>
                                                        Submit Review
                                                    </button>
                                                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowWriteReview(false)}>
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="details-reviews-list">
                                            {(product?.review || product?.reviews)?.list.map((review, index) => (
                                                <div key={review.id || index} id={review.id ? `review-${review.id}` : undefined} className="details-review-card">
                                                    <div className="details-review-header">
                                                        <div>
                                                            <div className="star-rating">
                                                                {'★'.repeat(review.stars || 5)}{'☆'.repeat(5 - (review.stars || 5))}
                                                            </div>
                                                            <h4 className="details-review-title">{review.title}</h4>
                                                        </div>
                                                        <span className="details-review-date">{review.date}</span>
                                                    </div>

                                                    <p className="details-review-body">{review.description || review.body}</p>

                                                    <div className="details-reviewer-meta">
                                                        <strong>{review.reviewerName || review.reviewer}</strong>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* FAQ */}
                                {(activeTab === 'all' || activeTab === 'faq') && (
                                    <div className="details-tab-pane" id="tab-pane-faq" data-tab="faq">
                                        <div className="home-section-header" style={{ marginBottom: 'var(--space-4)' }}>
                                            <h2 className="home-section-title" style={{ fontSize: '1.4rem' }}>
                                                Frequently Asked Questions
                                            </h2>
                                            <button
                                                className={`btn ${showAskQuestion ? 'btn-secondary' : 'btn-outline'}`}
                                                onClick={() => setShowAskQuestion(!showAskQuestion)}
                                            >
                                                {showAskQuestion ? 'Hide Question' : 'Ask a Question'}
                                            </button>
                                        </div>

                                        {/* Ask a Question Form */}
                                        {showAskQuestion && (
                                            <div className="details-ask-question-card">
                                                <h4 className="details-form-heading">Ask a Question</h4>
                                                <div className="details-form-field">
                                                    <textarea
                                                        className="details-form-textarea"
                                                        rows="3"
                                                        placeholder="Ask your question here..."
                                                        value={faqQuestion}
                                                        onChange={(e) => setFaqQuestion(e.target.value)}
                                                    />
                                                </div>

                                                <div className="details-form-actions">
                                                    <button type="button" className="btn btn-primary btn-sm" onClick={handleFaqSubmit}>
                                                        Submit Question
                                                    </button>
                                                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowAskQuestion(false)}>
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="details-qa-list">
                                            {product?.faq.map((faq, index) => (
                                                <div key={index} className="details-qa-item">
                                                    <div className="details-qa-q">
                                                        <strong>Q:</strong> {faq.q}
                                                    </div>
                                                    <div className="details-qa-a">
                                                        <strong>A:</strong> {faq.a}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Similar Products Sidebar */}
                        <aside className="details-similar-sidebar-col" aria-label="Similar Hardware">
                            <div className="details-similar-sidebar-card">
                                <div className="details-similar-header">
                                    <div>
                                        <span className="details-similar-eyebrow">MATCHING GEAR</span>
                                        <h3 className="details-similar-title">Similar Products</h3>
                                    </div>
                                    <Link to="/shop" className="details-similar-view-all">All Products &rarr;</Link>
                                </div>

                                <div className="details-similar-list">
                                    {similarProducts.map((similarItem, index) => (
                                        <div key={similarItem.id || index} className="similar-product-card">
                                            <img src={similarItem.mainImage} alt={similarItem.title} className="similar-product-thumb" />
                                            <div className="similar-product-details">
                                                <span className="similar-product-brand">{similarItem.brandPill}</span>
                                                <h4 className="similar-product-title" title={similarItem.title}>{similarItem.title}</h4>

                                                <span className="similar-product-spec">
                                                    {similarItem.cardSpecs?.length > 0
                                                        ? similarItem.cardSpecs[0].name
                                                        : 'Standard Specs'}
                                                </span>

                                                <div className="similar-product-bottom">
                                                    <span className="similar-product-price">৳{similarItem.currentPrice?.toFixed(2)}</span>
                                                    <button
                                                        className="similar-add-btn"
                                                        onClick={() => navigate(`/product-details/${similarItem.id}`)}
                                                    >
                                                        View
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default ProductDetails;
