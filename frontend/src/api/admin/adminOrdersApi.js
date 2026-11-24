import { request } from '../apiClient';

export const getAdminOrders = async (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);
    if (params.search) query.set('search', params.search);
    if (params.status) query.set('status', params.status);

    const qs = query.toString();
    const endpoint = `/admin/orders${qs ? `?${qs}` : ''}`;
    const result = await request(endpoint);
    return {
        success: result.success,
        orders: result.data?.orders || [],
        total: result.data?.total || 0,
        page: result.data?.page || 1,
        totalPages: result.data?.totalPages || 1,
        error: result.error
    };
};

export const getAdminOrderById = async (orderId) => {
    const result = await request(`/admin/orders/${encodeURIComponent(orderId)}`);
    return {
        success: result.success,
        order: result.data?.order || null,
        error: result.error
    };
};

export const updateAdminOrderStatus = async (orderId, updateData) => {
    const result = await request(`/admin/orders/${encodeURIComponent(orderId)}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
    });
    return {
        success: result.success,
        message: result.data?.message || '',
        order: result.data?.order || null,
        error: result.error
    };
};
