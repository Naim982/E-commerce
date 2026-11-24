import { request } from './apiClient';

export const getAuthBanners = async () => {
    const result = await request('/site-data/auth-banners');

    if (!result.success) {
        return {
            success: false,
            authBanners: [],
            error: result.error
        };
    }

    return {
        success: true,
        authBanners: result.data.authBanners || [],
        error: null
    };
};

export const getHeroSlides = async () => {
    const result = await request('/site-data/hero-slides');

    if (result.success && result.data?.heroSlides && result.data.heroSlides.length > 0) {
        return {
            success: true,
            heroSlides: result.data.heroSlides,
            error: null
        };
    }

    // Fallback: try general /site-data
    const fallbackResult = await request('/site-data');
    if (fallbackResult.success && fallbackResult.data?.heroSlides) {
        return {
            success: true,
            heroSlides: fallbackResult.data.heroSlides,
            error: null
        };
    }

    return {
        success: false,
        heroSlides: [],
        error: result.error || fallbackResult.error || 'Failed to load hero slides'
    };
};

export const getAboutSectionData = async () => {
    const result = await request('/site-data/about');

    if (result.success && result.data?.aboutSection) {
        return {
            success: true,
            aboutSection: result.data.aboutSection,
            error: null
        };
    }

    // Fallback: try general /site-data
    const fallbackResult = await request('/site-data');
    if (fallbackResult.success && fallbackResult.data?.aboutSection) {
        return {
            success: true,
            aboutSection: fallbackResult.data.aboutSection,
            error: null
        };
    }

    return {
        success: false,
        aboutSection: null,
        error: result.error || fallbackResult.error || 'Failed to load about section data'
    };
};

export const submitUserSupport = async (supportData) => {
    const result = await request('/user-support', {
        method: 'POST',
        body: JSON.stringify(supportData)
    });

    return {
        success: result.success,
        ticket: result.data?.ticket || null,
        message: result.data?.message || '',
        error: result.error
    };
};

export const getUserSupportTickets = async (userId) => {
    const endpoint = userId ? `/user-support?userId=${encodeURIComponent(userId)}` : '/user-support';
    const result = await request(endpoint);

    return {
        success: result.success,
        userSupport: result.data?.userSupport || [],
        error: result.error
    };
};
