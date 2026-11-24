import { request } from '../apiClient';

export const getAdminProducts = async (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);
    if (params.search) query.set('search', params.search);
    if (params.category) query.set('category', params.category);
    if (params.status) query.set('status', params.status);
    if (params.sort) query.set('sort', params.sort);

    const qs = query.toString();
    const endpoint = `/admin/products${qs ? `?${qs}` : ''}`;
    const result = await request(endpoint);
    return {
        success: result.success,
        products: result.data?.products || [],
        total: result.data?.total || 0,
        page: result.data?.page || 1,
        totalPages: result.data?.totalPages || 1,
        categories: result.data?.categories || [],
        error: result.error
    };
};

export const getAdminProductById = async (id) => {
    const result = await request(`/admin/products/${encodeURIComponent(id)}`);
    return {
        success: result.success,
        product: result.data?.product || null,
        error: result.error
    };
};

export const createAdminProduct = async (productData) => {
    const result = await request('/admin/products', {
        method: 'POST',
        body: JSON.stringify(productData)
    });
    return {
        success: result.success,
        product: result.data?.product || null,
        message: result.data?.message || '',
        error: result.error
    };
};

export const updateAdminProduct = async (id, productData) => {
    const result = await request(`/admin/products/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(productData)
    });
    return {
        success: result.success,
        product: result.data?.product || null,
        message: result.data?.message || '',
        error: result.error
    };
};

export const deleteAdminProduct = async (id) => {
    const result = await request(`/admin/products/${encodeURIComponent(id)}`, {
        method: 'DELETE'
    });
    return {
        success: result.success,
        message: result.data?.message || '',
        error: result.error
    };
};
