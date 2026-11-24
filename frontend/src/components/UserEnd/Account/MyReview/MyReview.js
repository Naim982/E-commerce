import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './MyReview.css';
import { getProductDataById } from '../../../../api/apiManager';
import { generateSlug } from '../../../Common/Functions';

const MyReview = ({ user }) => {
    const navigate = useNavigate();
    const [reviews, setReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const loadReviewDetails = async () => {
            const rawSummaries = user?.reviewsSummary || [];
            if (rawSummaries.length === 0) {
                setReviews([]);
                return;
            }

            setIsLoading(true);

            const enriched = await Promise.all(
                rawSummaries.map(async (item) => {
                    try {
                        const res = await getProductDataById(item.productId);
                        if (res.success && res.product) {
                            const prod = res.product;
                            const reviewList = prod.reviews?.list || [];
                            const matchedReview = reviewList.find(
                                (r) => String(r.id) === String(item.reviewId)
                            ) || reviewList.find(
                                (r) => String(r.reviewerId) === String(user?.id || user?.uid)
                            );

                            const productTitle = prod.title || prod.name || item.productTitle || item.productName || 'Hardware Product';
                            const slug = generateSlug(prod.name || prod.title || item.productId);

                            return {
                                productId: item.productId,
                                reviewId: item.reviewId,
                                slug,
                                productTitle,
                                productImage: (prod.images && prod.images[0]) || item.productImage || 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=120&auto=format&fit=crop&q=80',
                                title: matchedReview?.title || item.title || 'Product Feedback',
                                description: matchedReview?.description || item.description || item.comment || 'Verified purchase review.',
                                stars: matchedReview?.stars || item.stars || item.rating || 5,
                                date: matchedReview?.date || item.date || ''
                            };
                        }
                    } catch (err) {
                        console.error('Failed to load product details for review', item.productId, err);
                    }

                    const fallbackTitle = item.productTitle || item.productName || 'Hardware Product';
                    const fallbackSlug = generateSlug(fallbackTitle);

                    return {
                        productId: item.productId,
                        reviewId: item.reviewId,
                        slug: fallbackSlug,
                        productTitle: fallbackTitle,
                        productImage: item.productImage || 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=120&auto=format&fit=crop&q=80',
                        title: item.title || 'Customer Review',
                        description: item.description || item.comment || 'Verified purchase feedback.',
                        stars: item.stars || item.rating || 5,
                        date: item.date || ''
                    };
                })
            );

            if (isMounted) {
                setReviews(enriched);
                setIsLoading(false);
            }
        };

        loadReviewDetails();

        return () => {
            isMounted = false;
        };
    }, [user]);

    const renderStars = (starCount) => {
        const fullStars = Math.max(1, Math.min(5, Math.round(Number(starCount) || 5)));
        const emptyStars = 5 - fullStars;

        return (
            <div className="review-star-rating" aria-label={`Rating: ${fullStars} out of 5 stars`}>
                <div className="review-stars-visual">
                    {'★'.repeat(fullStars)}
                    <span className="review-stars-empty">{'☆'.repeat(emptyStars)}</span>
                </div>
            </div>
        );
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const parsed = new Date(dateStr);
        if (isNaN(parsed.getTime())) {
            return dateStr;
        }
        return parsed.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const handleViewReview = (productId, slug, reviewId) => {
        const targetPath = slug ? `/product-details/${productId}/${slug}` : `/product-details/${productId}`;
        navigate(targetPath, { state: { tab: 'reviews', reviewId } });
    };

    return (
        <div className="account-card-section my-reviews-container">
            <div className="account-section-header">
                <div>
                    <h2 className="account-section-title" style={{ fontSize: '1.35rem', marginBottom: 0 }}>
                        My Product Reviews ({reviews.length})
                    </h2>
                </div>
            </div>

            {isLoading && (
                <div className="reviews-loading-state">
                    <div className="reviews-spinner"></div>
                    <span>Loading your reviews...</span>
                </div>
            )}

            {!isLoading && reviews.length === 0 && (
                <div className="reviews-empty-state">
                    <div className="reviews-empty-icon">⭐</div>
                    <h3>No Reviews Written Yet</h3>
                    <p>When you purchase and review products on LUMEN, your feedback will be accessible here.</p>
                    <Link to="/shop" className="btn btn-primary btn-sm">
                        Browse Hardware
                    </Link>
                </div>
            )}

            {!isLoading && reviews.length > 0 && (
                <div className="reviews-history-list">
                    {reviews.map((rev, index) => {
                        const key = rev.reviewId || `${rev.productId}-${index}`;
                        const targetPath = rev.slug
                            ? `/product-details/${rev.productId}/${rev.slug}`
                            : `/product-details/${rev.productId}`;

                        return (
                            <article key={key} className="reviews-history-item">
                                <div className="review-prod-header">
                                    <Link
                                        to={targetPath}
                                        state={{ tab: 'reviews', reviewId: rev.reviewId }}
                                        className="review-prod-thumb-link"
                                        title={rev.productTitle}
                                    >
                                        <img
                                            src={rev.productImage}
                                            alt={rev.productTitle}
                                            className="review-prod-thumb"
                                            onError={(e) => {
                                                e.target.src = 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=120&auto=format&fit=crop&q=80';
                                            }}
                                        />
                                    </Link>

                                    <div className="review-prod-info">
                                        <h3 className="review-prod-title">
                                            <Link
                                                to={targetPath}
                                                state={{ tab: 'reviews', reviewId: rev.reviewId }}
                                                className="review-prod-title-link"
                                                title={`View ${rev.productTitle}`}
                                            >
                                                {rev.productTitle}
                                            </Link>
                                        </h3>

                                        <div className="review-stars-wrapper">
                                            {renderStars(rev.stars)}
                                        </div>
                                    </div>

                                    {rev.date && (
                                        <div className="review-date-badge">
                                            <span className="review-date-text">{formatDate(rev.date)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="review-content-section">
                                    {rev.title && (
                                        <h4 className="review-user-title">{rev.title}</h4>
                                    )}

                                    <div className="review-message-box">
                                        <p className="review-user-description">{rev.description}</p>
                                    </div>
                                </div>

                                <div className="review-actions-bar">
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline review-view-btn"
                                        onClick={() => handleViewReview(rev.productId, rev.slug, rev.reviewId)}
                                    >
                                        View Review
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MyReview;
