import React, { useEffect, useState } from 'react';
import ProductCard from '../ProductCard/ProductCard';
import { clearWishlist, getWishListByUser, moveWishlistToCart } from '../../../api/apiManager';
import useAuth from '../../../authentication/useAuth';
import './Wishlist.css';

const Wishlist = () => {
    const { user } = useAuth();
    const user_id = user?.uid;

    const [wishList, setWishList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadWishList = async () => {
            if (!user_id) {
                return;
            }

            setLoading(true);
            setError('');

            const result = await getWishListByUser(user_id);
            if (!result.success) {
                setError(result.error);
                setLoading(false);
                return;
            }

            setWishList(result.wishList);
            setLoading(false);
        };

        loadWishList();
    }, [user_id]);

    const handleRemoveFromWishlist = (productId) => {
        setWishList(prevWishList => prevWishList.filter(id => id !== productId));
    };

    const handleClearWishlist = async () => {
        if (loading || wishList.length === 0) {
            return;
        }

        setLoading(true);
        setError('');

        const result = await clearWishlist(user_id);
        if (!result.success) {
            setError(result.error);
            setLoading(false);
            return;
        }

        setWishList([]);
        setLoading(false);
    };

    const handleMoveAllToCart = async () => {
        if (loading || wishList.length === 0) {
            return;
        }

        setLoading(true);
        setError('');

        const result = await moveWishlistToCart(user_id, wishList);
        if (!result.success) {
            setError(result.error);
            setLoading(false);
            return;
        }

        setWishList([]);
        setLoading(false);
    };

    if (loading) {
        return <div className="catalog-state-box">Loading wishlist...</div>;
    }

    if (error) {
        return <div className="catalog-state-box">{error}</div>;
    }

    return (
        <main>
            <section className="wishlist-main-section">
                <div className="container">
                    <div className="wishlist-header-row">
                        <div>
                            <h1 className="wishlist-page-title">My Saved Hardware</h1>
                        </div>

                        <div className="wishlist-actions-group">
                            <button
                                className="btn btn-primary"
                                id="move-all-cart-btn"
                                onClick={handleMoveAllToCart}
                                disabled={loading || wishList.length === 0}
                            >
                                Move Available to Cart
                            </button>

                            <button
                                className="btn btn-secondary"
                                id="clear-wishlist-btn"
                                onClick={handleClearWishlist}
                                disabled={loading || wishList.length === 0}
                            >
                                Clear All
                            </button>
                        </div>
                    </div>

                    <div className="home-product-grid wishlist-product-grid" id="wishlist-items-container">
                        {wishList.length === 0 ? (
                            <div className="catalog-state-box wishlist-empty-state" id="wishlist-empty-box">
                                <div className="catalog-state-icon">💙</div>
                                <h3 className="catalog-state-title">Your Wishlist is Empty</h3>
                                <p className="catalog-state-desc">
                                    You haven't saved any hardware yet. Click the heart icon on any product
                                    in the catalog or offers page to track price drops.
                                </p>
                            </div>
                        ) : (
                            wishList.map(id => (
                                <ProductCard
                                    key={id}
                                    productId={id}
                                    block="wishList"
                                    handleProductCard={handleRemoveFromWishlist}
                                />
                            ))
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
};

export default Wishlist;
