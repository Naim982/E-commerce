import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { WishlistHeartIcon, CompareIcon } from '../../../assets/icons/icons';
import { generateSlug, formatBDT } from '../../Common/Functions';
import { addProductToCartlist, addProductToWishlist, checkWishlistCartStatus, getProductDataById, removeProductFromWishlist } from '../../../api/apiManager';
import useAuth from '../../../authentication/useAuth';
import { useCompare } from '../../../context/CompareContext';
import './ProductCard.css';

const ProductCard = ({ productId, productData = null, block = '', handleProductCard = () => {} }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const user_id = user?.uid;
    const { addToCompare, isInCompare } = useCompare();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [wishlistStatus, setWishlistStatus] = useState(false);
    const [cartlistStatus, setCartlistStatus] = useState(false);

    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [cartLoading, setCartLoading] = useState(false);

    useEffect(() => {
        const loadProduct = async () => {
            if (productData) {
                setProduct(productData);
                return;
            }

            setLoading(true);
            setError('');

            const result = await getProductDataById(productId);
            if (!result.success) {
                setError(result.error);
                setLoading(false);
                return;
            }

            setProduct(result.product);
            setLoading(false);
        };

        loadProduct();
    }, [productId, productData]);

    useEffect(() => {
        const loadWishCartStatus = async () => {
            if (!user_id) {
                return;
            }

            const statusResult = await checkWishlistCartStatus(user_id, productId);
            if (!statusResult.success) {
                setError(statusResult.error);
                return;
            }

            setWishlistStatus(statusResult.wishlistStatus);
            setCartlistStatus(statusResult.cartStatus);
        };

        loadWishCartStatus();
    }, [productId, user_id]);

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
            if (wishlistStatus) {
                setWishlistStatus(false);
                if (block === 'wishList') {
                    handleProductCard(productId);
                }
            } else {
                setWishlistStatus(true);
            }
        } else {
            setError(result.error);
        }

        setWishlistLoading(false);
    };

    const handleCartListClick = async () => {
        // Don't do anything if already in cart
        if (cartlistStatus || cartLoading) {
            return;
        }

        setCartLoading(true);
        setError('');

        const result = await addProductToCartlist(user_id, productId);
        if (result.success) {
            setCartlistStatus(true);
        } else {
            setError(result.error);
        }

        setCartLoading(false);
    };

    const inCompare = product ? isInCompare(product.id) : false;

    const handleCompareClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!product) return;
        const res = addToCompare(product);
        if (res.success) {
            navigate('/compare');
        }
    };

    if (loading) {
        return <div className="catalog-skeleton-card" />;
    }

    if (error) {
        return (
            <div className="product-card home-product-card">
                {error}
            </div>
        );
    }

    if (!product) {
        return null;
    }

    const slug = generateSlug(product.name);

    return (
        <div className="product-card home-product-card">
            <div className="product-badge-group">
                <span className={`badge badge-${product.badgeType}`}>
                    {product.badgeText}
                </span>
            </div>

            <div className="product-card-actions">
                <button
                    className={`wishlist-btn ${wishlistStatus ? 'active' : ''}`}
                    data-action="wishlist"
                    onClick={handleWishlistClick}
                    data-product-id={product.id}
                    disabled={wishlistLoading}
                    title={wishlistStatus ? 'Remove from wishlist' : 'Add to wishlist'}
                    aria-label="Wishlist"
                >
                    <WishlistHeartIcon size={18} isFilled={wishlistStatus} />
                </button>

                <button
                    className={`compare-btn ${inCompare ? 'active' : ''}`}
                    data-action="compare"
                    onClick={handleCompareClick}
                    data-product-id={product.id}
                    title={inCompare ? 'In Comparison — View Compare' : 'Add to Compare'}
                    aria-label="Compare Product"
                >
                    <CompareIcon size={17} />
                </button>
            </div>

            <Link to={`/product-details/${product.id}/${slug}`} className="product-image-container">
                <img src={product.mainImage} alt={product.name} className="product-image" loading="lazy" />
            </Link>

            <div className="product-info">
                <div className="product-brand">{product.brandPill}</div>
                <h3>
                    <Link to={`/product-details/${product.id}/${slug}`} className="product-title">
                        {product.title}
                    </Link>
                </h3>

                <div className="catalog-specs-line">
                    {product.cardSpecs?.map((spec, idx) => (
                        <span key={idx}>{spec}</span>
                    ))}
                </div>

                {product.badgeType === 'bestseller' ? (
                    <div className="home-stock-bar-wrapper">
                        <div className="home-stock-bar">
                            <div className="home-stock-fill" style={{ width: `${product.salesPercentage}%` }} />
                        </div>
                        <div className="home-stock-text">
                            <span>Sold: {product.soldThisMonth}</span>
                            <span className="home-stock-avail">Only {product.remaining} units left!</span>
                        </div>
                    </div>
                ) : (
                    <div className="product-rating">
                        <span className="star-rating">★★★★★</span>
                        <span className="rating-text">
                            {`${product.reviewScore || 0} (${product.reviewCount || 0} reviews)`}
                        </span>
                    </div>
                )}

                <div className="product-price-row">
                    <div>
                        <span className="price-current">{formatBDT(product.currentPrice)}</span>
                        {product.oldPrice && <span className="price-original">{formatBDT(product.oldPrice)}</span>}
                    </div>
                    <button
                        className="btn btn-sm btn-primary"
                        data-action="add-to-cart"
                        data-product-id={product.id}
                        title={cartlistStatus ? 'This item has already been added to cart' : 'Add to cart'}
                        onClick={handleCartListClick}
                        disabled={cartLoading || cartlistStatus}
                    >
                        {cartlistStatus ? 'Added to Cart' : 'Add to Cart'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
