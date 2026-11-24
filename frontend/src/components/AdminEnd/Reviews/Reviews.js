import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getAdminReviews, updateAdminReview } from '../../../api/apiManager';
import AdminPageHeader from '../shared/AdminPageHeader';
import StatCard from '../shared/StatCard';
import StatusBadge from '../shared/StatusBadge';
import Pagination from '../shared/Pagination';
import LoadingSpinner from '../shared/LoadingSpinner';
import EmptyState from '../shared/EmptyState';
import ConfirmationDialog from '../shared/ConfirmationDialog';
import { useAdminToast } from '../Layout/AdminLayout';
import {
    StarIcon,
    SearchIcon,
    TrashIcon,
    CheckIcon,
    XIcon
} from '../shared/AdminIcons';

const ITEMS_PER_PAGE = 10;

const renderStars = (rating) => {
    const stars = [];
    const count = Math.max(1, Math.min(5, Math.round(rating || 5)));
    for (let i = 1; i <= 5; i++) {
        stars.push(
            <span
                key={i}
                style={{
                    color: i <= count ? '#f59e0b' : '#cbd5e1',
                    fontSize: '1rem',
                    marginRight: '2px'
                }}
            >
                ★
            </span>
        );
    }
    return <span style={{ display: 'inline-flex', alignItems: 'center' }}>{stars}</span>;
};

const Reviews = () => {
    const { addToast } = useAdminToast();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [ratingFilter, setRatingFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    // Delete confirmation
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [reviewToDelete, setReviewToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Fetch reviews
    const fetchReviews = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAdminReviews();
            if (res.success) {
                setReviews(res.reviews);
            } else {
                addToast(res.error || 'Failed to load reviews', 'error');
            }
        } catch (err) {
            console.error(err);
            addToast('Error loading reviews', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, statusFilter, ratingFilter]);

    // Metrics
    const metrics = useMemo(() => {
        const total = reviews.length;
        const approved = reviews.filter(r => (r.status || 'approved').toLowerCase() === 'approved').length;
        const pending = reviews.filter(r => (r.status || '').toLowerCase() === 'pending').length;
        const avgRating = total > 0
            ? (reviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / total).toFixed(1)
            : '5.0';
        return { total, approved, pending, avgRating };
    }, [reviews]);

    // Filtered reviews
    const filteredReviews = useMemo(() => {
        return reviews.filter(r => {
            const s = search.toLowerCase();
            const matchesSearch = !s ||
                r.productName?.toLowerCase().includes(s) ||
                r.userName?.toLowerCase().includes(s) ||
                r.description?.toLowerCase().includes(s) ||
                r.title?.toLowerCase().includes(s);

            const rStatus = (r.status || 'approved').toLowerCase();
            const matchesStatus = statusFilter === 'all' || rStatus === statusFilter;

            const rRating = Math.round(Number(r.rating) || 5);
            const matchesRating = ratingFilter === 'all' || String(rRating) === String(ratingFilter);

            return matchesSearch && matchesStatus && matchesRating;
        });
    }, [reviews, search, statusFilter, ratingFilter]);

    // Pagination
    const totalPages = Math.ceil(filteredReviews.length / ITEMS_PER_PAGE);
    const paginatedReviews = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredReviews.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredReviews, currentPage]);

    // Change status action
    const handleUpdateStatus = async (review, newStatus) => {
        try {
            const res = await updateAdminReview(review.id, {
                productId: review.productId,
                status: newStatus,
                action: 'update'
            });
            if (res.success) {
                setReviews(prev => prev.map(r => r.id === review.id ? { ...r, status: newStatus } : r));
                addToast(`Review marked as ${newStatus}`, 'success');
            } else {
                addToast(res.error || 'Failed to update review', 'error');
            }
        } catch (err) {
            console.error(err);
            addToast('Error updating review', 'error');
        }
    };

    // Delete review
    const handleConfirmDelete = async () => {
        if (!reviewToDelete) return;
        setDeleting(true);
        try {
            const res = await updateAdminReview(reviewToDelete.id, {
                productId: reviewToDelete.productId,
                action: 'delete'
            });
            if (res.success) {
                setReviews(prev => prev.filter(r => r.id !== reviewToDelete.id));
                addToast('Review deleted successfully', 'success');
                setDeleteDialogOpen(false);
            } else {
                addToast(res.error || 'Failed to delete review', 'error');
            }
        } catch (err) {
            console.error(err);
            addToast('Error deleting review', 'error');
        } finally {
            setDeleting(false);
            setReviewToDelete(null);
        }
    };

    return (
        <div className="admin-page">
            <AdminPageHeader
                title="Customer Reviews Moderation"
                description="Moderate customer feedback, approve verified testimonials, and maintain product rating integrity."
            />

            {/* Metrics */}
            <div className="admin-stats-grid">
                <StatCard
                    title="Total Reviews"
                    value={metrics.total}
                    icon={StarIcon}
                    color="primary"
                />
                <StatCard
                    title="Store Average Rating"
                    value={`${metrics.avgRating} / 5.0`}
                    icon={StarIcon}
                    color="warning"
                />
                <StatCard
                    title="Approved Reviews"
                    value={metrics.approved}
                    icon={CheckIcon}
                    color="success"
                />
                <StatCard
                    title="Pending Moderation"
                    value={metrics.pending}
                    icon={StarIcon}
                    color="info"
                />
            </div>

            {/* Main Table Card */}
            <div className="admin-card">
                {/* Search & Filter Toolbar */}
                <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--admin-border)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '16px',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ position: 'relative', width: '320px' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)', display: 'flex' }}>
                            <SearchIcon />
                        </span>
                        <input
                            type="text"
                            placeholder="Search reviewer, product, or review text..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="admin-input"
                            style={{ paddingLeft: '38px', width: '100%' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {/* Rating filter */}
                        <select
                            value={ratingFilter}
                            onChange={(e) => {
                                setRatingFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="admin-select"
                            style={{ width: '130px' }}
                        >
                            <option value="all">All Ratings</option>
                            <option value="5">5 Stars</option>
                            <option value="4">4 Stars</option>
                            <option value="3">3 Stars</option>
                            <option value="2">2 Stars</option>
                            <option value="1">1 Star</option>
                        </select>

                        {/* Status tabs */}
                        <div style={{ display: 'flex', gap: '6px' }}>
                            {['all', 'approved', 'pending', 'rejected'].map(st => (
                                <button
                                    key={st}
                                    type="button"
                                    className={`admin-btn admin-btn-sm ${statusFilter === st ? 'admin-btn-primary' : 'admin-btn-outline'}`}
                                    onClick={() => {
                                        setStatusFilter(st);
                                        setCurrentPage(1);
                                    }}
                                    style={{ textTransform: 'capitalize' }}
                                >
                                    {st}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <LoadingSpinner text="Loading customer reviews..." />
                ) : filteredReviews.length === 0 ? (
                    <EmptyState
                        icon={StarIcon}
                        title="No reviews match your filter"
                        description={search ? `No customer reviews found matching "${search}".` : "There are no reviews in this category."}
                    />
                ) : (
                    <>
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '220px' }}>Product</th>
                                        <th style={{ width: '160px' }}>Customer</th>
                                        <th style={{ width: '120px' }}>Rating</th>
                                        <th>Review Content</th>
                                        <th style={{ width: '100px' }}>Status</th>
                                        <th style={{ width: '140px', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedReviews.map((r) => {
                                        const currentStatus = (r.status || 'approved').toLowerCase();
                                        return (
                                            <tr key={r.id}>
                                                <td>
                                                    <div style={{ fontWeight: '600', color: 'var(--admin-text-main)', fontSize: '0.875rem' }}>
                                                        {r.productName}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                                                        {r.category}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: '600', color: 'var(--admin-text-main)', fontSize: '0.875rem' }}>
                                                        {r.userName}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                                                        {r.date}
                                                    </div>
                                                </td>
                                                <td>
                                                    {renderStars(r.rating)}
                                                </td>
                                                <td>
                                                    {r.title && (
                                                        <div style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--admin-text-main)', marginBottom: '4px' }}>
                                                            "{r.title}"
                                                        </div>
                                                    )}
                                                    <div style={{ fontSize: '0.8125rem', color: 'var(--admin-text-muted)', lineHeight: '1.4' }}>
                                                        {r.description || 'No comment provided.'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <StatusBadge status={currentStatus} />
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                                                        {currentStatus !== 'approved' && (
                                                            <button
                                                                type="button"
                                                                className="admin-btn admin-btn-ghost admin-btn-sm"
                                                                onClick={() => handleUpdateStatus(r, 'approved')}
                                                                title="Approve review"
                                                                style={{ color: 'var(--admin-success)' }}
                                                            >
                                                                <CheckIcon />
                                                            </button>
                                                        )}
                                                        {currentStatus !== 'rejected' && (
                                                            <button
                                                                type="button"
                                                                className="admin-btn admin-btn-ghost admin-btn-sm"
                                                                onClick={() => handleUpdateStatus(r, 'rejected')}
                                                                title="Reject review"
                                                                style={{ color: 'var(--admin-warning)' }}
                                                            >
                                                                <XIcon />
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            className="admin-btn admin-btn-ghost admin-btn-sm"
                                                            onClick={() => {
                                                                setReviewToDelete(r);
                                                                setDeleteDialogOpen(true);
                                                            }}
                                                            title="Delete review"
                                                            style={{ color: 'var(--admin-danger)' }}
                                                        >
                                                            <TrashIcon />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--admin-border)' }}>
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Delete Confirmation */}
            <ConfirmationDialog
                isOpen={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Customer Review"
                message={`Are you sure you want to permanently delete the review from "${reviewToDelete?.userName}" on "${reviewToDelete?.productName}"? Product average rating will be automatically recalculated.`}
                confirmText={deleting ? 'Deleting...' : 'Delete Review'}
                isDestructive={true}
            />
        </div>
    );
};

export default Reviews;
