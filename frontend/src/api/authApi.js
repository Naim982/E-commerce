import { request } from './apiClient';

export const getAuthMe = async () => {
    const result = await request('/auth/me');
    return {
        success: result.success,
        authenticated: result.data?.authenticated || false,
        user: result.data?.user || null,
        error: result.error,
        status: result.status
    };
};
