import { request } from '../apiClient';

export const getAdminCategories = async () => {
    const result = await request('/admin/categories');
    return {
        success: result.success,
        categories: result.data?.categories || [],
        error: result.error
    };
};

export const createAdminCategory = async (categoryData) => {
    const result = await request('/admin/categories', {
        method: 'POST',
        body: JSON.stringify(categoryData)
    });
    return {
        success: result.success,
        category: result.data?.category || null,
        message: result.data?.message || '',
        error: result.error
    };
};

export const updateAdminCategory = async (name, categoryData) => {
    const result = await request(`/admin/categories/${encodeURIComponent(name)}`, {
        method: 'PUT',
        body: JSON.stringify(categoryData)
    });
    return {
        success: result.success,
        message: result.data?.message || '',
        error: result.error
    };
};

export const deleteAdminCategory = async (name) => {
    const result = await request(`/admin/categories/${encodeURIComponent(name)}`, {
        method: 'DELETE'
    });
    return {
        success: result.success,
        message: result.data?.message || '',
        error: result.error
    };
};
