import { auth } from '../Firebase/firebase.config';

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
export const BACKEND_ROOT = process.env.REACT_APP_BACKEND_ROOT || API_BASE_URL.replace(/\/api\/?$/, '') + '/';

export const getAuthToken = async (forceRefresh = false) => {
    try {
        if (auth && auth.currentUser) {
            return await auth.currentUser.getIdToken(forceRefresh);
        }
    } catch (e) {
        console.warn('Could not retrieve or refresh Firebase ID token:', e);
    }
    return null;
};

export const request = async (endpoint, options = {}) => {
    try {
        const token = await getAuthToken(options.forceRefresh || false);
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...(options.headers || {})
        };

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers,
            ...options
        });

        // Handle expired Firebase token / 401 Unauthorized
        if (response.status === 401 && !options._retried && auth && auth.currentUser) {
            try {
                const refreshedToken = await getAuthToken(true);
                if (refreshedToken) {
                    return request(endpoint, {
                        ...options,
                        _retried: true,
                        headers: {
                            ...(options.headers || {}),
                            'Authorization': `Bearer ${refreshedToken}`
                        }
                    });
                }
            } catch (refreshErr) {
                console.warn('Token force-refresh failed on 401 response:', refreshErr);
            }

            // Clean re-authentication redirect if session expired
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/authentication') && !window.location.pathname.startsWith('/admin/login')) {
                const currentPath = window.location.pathname + window.location.search;
                if (window.location.pathname.startsWith('/admin')) {
                    window.location.href = `/admin/login?session_expired=true`;
                } else {
                    window.location.href = `/authentication/signin?session_expired=true&redirect=${encodeURIComponent(currentPath)}`;
                }
            }
        }

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                data: null,
                error: data.error || data.message || `Request failed with status ${response.status}`,
                status: response.status
            };
        }

        return {
            success: true,
            data,
            error: null,
            status: response.status
        };
    } catch (error) {
        console.error('API request failed:', error);
        return {
            success: false,
            data: null,
            error: 'Unable to connect to the server'
        };
    }
};

export default request;
