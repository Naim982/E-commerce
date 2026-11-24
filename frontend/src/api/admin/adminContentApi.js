import { request } from '../apiClient';

export const getAdminSiteContent = async () => {
    const result = await request('/admin/site-content');
    return {
        success: result.success,
        heroSlides: result.data?.heroSlides || [],
        authBanners: result.data?.authBanners || [],
        aboutSection: result.data?.aboutSection || {},
        error: result.error
    };
};

export const updateAdminSiteContent = async (section, data) => {
    const result = await request('/admin/site-content', {
        method: 'PUT',
        body: JSON.stringify({ section, data })
    });
    return {
        success: result.success,
        message: result.data?.message || '',
        error: result.error
    };
};
