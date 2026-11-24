import { request } from '../apiClient';

export const getAdminInventory = async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.filter) query.set('filter', params.filter);

    const qs = query.toString();
    const endpoint = `/admin/inventory${qs ? `?${qs}` : ''}`;
    const result = await request(endpoint);
    return {
        success: result.success,
        inventory: result.data?.inventory || [],
        summary: result.data?.summary || {},
        error: result.error
    };
};

export const updateAdminStock = async (id, stockData) => {
    const result = await request(`/admin/inventory/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(stockData)
    });
    return {
        success: result.success,
        message: result.data?.message || '',
        stock: result.data?.stock || null,
        error: result.error
    };
};
