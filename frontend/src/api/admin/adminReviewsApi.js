import { request } from '../apiClient';

export const getAdminReviews = async (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);

    const qs = query.toString();
    const endpoint = `/admin/reviews${qs ? `?${qs}` : ''}`;
    const result = await request(endpoint);
    return {
        success: result.success,
        reviews: result.data?.reviews || [],
        total: result.data?.total || 0,
        error: result.error
    };
};

export const updateAdminReviewStatus = async (reviewId, updateData) => {
    const result = await request(`/admin/reviews/${encodeURIComponent(reviewId)}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
    });
    return {
        success: result.success,
        message: result.data?.message || '',
        error: result.error
    };
};

export const updateAdminReview = updateAdminReviewStatus;
