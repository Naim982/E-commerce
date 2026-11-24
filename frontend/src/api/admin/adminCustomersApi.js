import { request } from '../apiClient';

export const getAdminCustomers = async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);

    const qs = query.toString();
    const endpoint = `/admin/customers${qs ? `?${qs}` : ''}`;
    const result = await request(endpoint);
    return {
        success: result.success,
        customers: result.data?.customers || [],
        total: result.data?.total || 0,
        error: result.error
    };
};

export const getAdminCustomerById = async (userId) => {
    const result = await request(`/admin/customers/${encodeURIComponent(userId)}`);
    return {
        success: result.success,
        customer: result.data?.customer || null,
        error: result.error
    };
};
