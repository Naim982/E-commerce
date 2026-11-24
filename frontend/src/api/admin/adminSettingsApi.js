import { request } from '../apiClient';

export const getAdminSettings = async () => {
    const result = await request('/admin/settings');
    return {
        success: result.success,
        settings: result.data?.settings || {},
        error: result.error
    };
};

export const updateAdminSettings = async (settingsData) => {
    const result = await request('/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify(settingsData)
    });
    return {
        success: result.success,
        settings: result.data?.settings || {},
        message: result.data?.message || '',
        error: result.error
    };
};
