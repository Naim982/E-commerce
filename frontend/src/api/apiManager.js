import { auth } from '../Firebase/firebase.config';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
export const BACKEND_ROOT = process.env.REACT_APP_BACKEND_ROOT || API_BASE_URL.replace(/\/api\/?$/, '') + '/';

// =============================================================
//  Token Helper
// =============================================================

export const getAuthToken = async () => {
    try {
        if (auth && auth.currentUser) {
            return await auth.currentUser.getIdToken();
        }
    } catch (e) {
        console.warn('Could not retrieve Firebase ID token:', e);
    }
    // Fallback for development / mock admin mode
    const devToken = sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token');
    return devToken || null;
};

// =============================================================
//  API Request Blueprint 
// =============================================================

const request = async (endpoint, options = {}) => {
    try {
        const token = await getAuthToken();
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...(options.headers || {})
        };

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers,
            ...options
        });

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




// =============================================================
//  Products
// =============================================================


export const getProductDataById = async (id) => {
    const result = await request(`/products/${id}`);

    return {
        success: result.success,
        product: result.data,
        error: result.error
    };
};


export const getHomepageProducts = async () => {
    const result = await request('/products/homepage-products');

    return {
        success: result.success,
        products: result.data?.products || {
            group1: [],
            group2: []
        },
        bestSellers: result.data?.bestSellers || [],
        topRated: result.data?.topRated || [],
        error: result.error
    };
};


export const getShoppageProducts = async () => {
    const result = await request('/products/shoppage-products');

    return {
        success: result.success,
        products: result.data,
        error: result.error
    };
};


export const getProductSimilar = async (productId) => {
    const result = await request(`/products/${productId}/similar`);

    if (result.success) {
        return {
            success: true,
            products: result.data.products
        };
    }

    return {
        success: false,
        error: result.error
    };
};


export const submitProductReview = async (userId, productId, stars, title, description) => {
    const result = await request(`/products/${productId}/reviews`, {
        method: 'POST',
        body: JSON.stringify({
            userId,
            stars,
            title,
            description
        })
    });

    if (result.success) {
        return {
            success: true,
            product: result.data.product
        };
    }

    return {
        success: false,
        error: result.error
    };
};


export const submitProductFAQ = async (productId, question) => {
    const result = await request(`/products/${productId}/faq`, {
        method: 'POST',
        body: JSON.stringify({ question })
    });

    if (result.success) {
        return {
            success: true,
            product: result.data.product
        };
    }

    return {
        success: false,
        error: result.error
    };
};





// =============================================================
//  User
// =============================================================


export const checkAccountExists = async (email) => {
    const result = await request(`/users/account-exists?email=${encodeURIComponent(email)}`);

    return {
        success: result.success,
        exists: result.data?.exists || false,
        error: result.error
    };
};

export const createNewUser = async (userData) => {
    const result = await request('/users', {
        method: 'POST',
        body: JSON.stringify(userData)
    });

    return {
        success: result.success,
        user: result.data?.user || null,
        error: result.error
    };
};

export const updateUserProfile = async (userId, profileData) => {
    const result = await request(`/users/${userId}/profile`, {
        method: 'PATCH',
        body: JSON.stringify(profileData)
    });

    return {
        success: result.success,
        user: result.data?.user || null,
        profile: result.data?.profile || null,
        error: result.error
    };
};

export const getUserData = async (userId) => {
    const result = await request(`/users/${userId}`);

    return {
        success: result.success,
        user: result.data,
        error: result.error
    };
};


export const checkWishlistCartStatus = async (userId, productId) => {
    const result = await request(`/users/${userId}`);

    if (!result.success) {
        return {
            success: false,
            wishlistStatus: false,
            cartStatus: false,
            cartData: null,
            error: result.error
        };
    }

    const user = result.data;
    const wishlistStatus = (user.wishlist || []).includes(productId);
    const cartData = (user.cartList || []).find(item => item.id === productId) || null;

    return {
        success: true,
        wishlistStatus,
        cartStatus: cartData !== null,
        cartData,
        error: null
    };
};

export const getWishListByUser = async (userId) => {
    const result = await request(`/users/${userId}/wishlist`);

    return {
        success: result.success,
        wishList: result.data?.wishlist || [],
        error: result.error
    };
};

export const addProductToWishlist = async (userId, productId) => {
    const result = await request(`/users/${userId}/wishlist`, {
        method: 'POST',
        body: JSON.stringify({ productId })
    });

    return {
        success: result.success,
        user: result.data?.user || null,
        error: result.error
    };
};

export const removeProductFromWishlist = async (userId, productId) => {
    const result = await request(`/users/${userId}/wishlist/${productId}`, {
        method: 'DELETE'
    });

    return {
        success: result.success,
        user: result.data?.user || null,
        error: result.error
    };
};

export const moveWishlistToCart = async (userId) => {
    const result = await request(`/users/${userId}/wishlist/move-to-cart`, {
        method: 'POST'
    });

    return {
        success: result.success,
        user: result.data?.user || null,
        error: result.error
    };
};

export const clearWishlist = async (userId) => {
    const result = await request(`/users/${userId}/wishlist`, {
        method: 'DELETE'
    });

    return {
        success: result.success,
        user: result.data?.user || null,
        error: result.error
    };
};



export const getCartByUser = async (userId) => {
    const result = await request(`/users/${userId}/cart`);

    return {
        success: result.success,
        cartList: result.data?.cartList || [],
        error: result.error
    };
};

export const addProductToCartlist = async (userId, productId, quantity = 1, variant = []) => {
    const result = await request(`/users/${userId}/cart`, {
        method: 'POST',
        body: JSON.stringify({
            productId,
            quantity,
            variant
        })
    });

    return {
        success: result.success,
        user: result.data?.user || null,
        error: result.error
    };
};

export const updateCartItemQuantity = async (userId, productId, quantity) => {
    const result = await request(`/users/${userId}/cart/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity })
    });

    return {
        success: result.success,
        user: result.data?.user || null,
        error: result.error
    };
};

export const removeProductFromCartlist = async (userId, productId) => {
    const result = await request(`/users/${userId}/cart/${productId}`, {
        method: 'DELETE'
    });

    return {
        success: result.success,
        user: result.data?.user || null,
        error: result.error
    };
};

export const moveCartItemToWishlist = async (userId, productId) => {
    const result = await request(`/users/${userId}/cart/${productId}/move-to-wishlist`, {
        method: 'POST'
    });

    return {
        success: result.success,
        user: result.data?.user || null,
        error: result.error
    };
};

export const clearCart = async (userId) => {
    const result = await request(`/users/${userId}/cart`, {
        method: 'DELETE'
    });

    return {
        success: result.success,
        user: result.data?.user || null,
        error: result.error
    };
};



export const getAddresses = async (userId) => {
    const result = await request(`/users/${userId}/addresses`);

    return {
        success: result.success,
        addresses: result.data?.addresses || [],
        error: result.error
    };
};

export const addShippingAddress = async (userId, address) => {
    const result = await request(`/users/${userId}/addresses`, {
        method: 'POST',
        body: JSON.stringify(address)
    });

    return {
        success: result.success,
        user: result.data?.user || null,
        address: result.data?.address || null,
        error: result.error
    };
};

export const updateShippingAddress = async (userId, addressId, updatedAddress) => {
    const result = await request(`/users/${userId}/addresses/${addressId}`, {
        method: 'PATCH',
        body: JSON.stringify(updatedAddress)
    });

    return {
        success: result.success,
        user: result.data?.user || null,
        address: result.data?.address || null,
        error: result.error
    };
};

export const setDefaultShippingAddress = async (userId, addressId) => {
    const result = await request(`/users/${userId}/addresses/${addressId}/default`, {
        method: 'PATCH'
    });

    return {
        success: result.success,
        user: result.data?.user || null,
        error: result.error
    };
};

export const deleteShippingAddress = async (userId, addressId) => {
    const result = await request(`/users/${userId}/addresses/${addressId}`, {
        method: 'DELETE'
    });

    return {
        success: result.success,
        user: result.data?.user || null,
        error: result.error
    };
};



export const getPaymentMethods = async (userId) => {
    const result = await request(`/users/${userId}/payment-methods`);

    return {
        success: result.success,
        paymentMethods: result.data?.paymentMethods || [],
        error: result.error
    };
};

export const addPaymentMethod = async (userId, paymentMethod) => {
    const result = await request(`/users/${userId}/payment-methods`, {
        method: 'POST',
        body: JSON.stringify(paymentMethod)
    });

    return {
        success: result.success,
        user: result.data?.user || null,
        paymentMethod: result.data?.paymentMethod || null,
        error: result.error
    };
};

export const setDefaultPaymentMethod = async (userId, paymentMethodId) => {
    const result = await request(`/users/${userId}/payment-methods/${paymentMethodId}/default`, {
        method: 'PATCH'
    });

    return {
        success: result.success,
        user: result.data?.user || null,
        error: result.error
    };
};

export const deletePaymentMethod = async (userId, paymentMethodId) => {
    const result = await request(`/users/${userId}/payment-methods/${paymentMethodId}`, {
        method: 'DELETE'
    });

    return {
        success: result.success,
        user: result.data?.user || null,
        error: result.error
    };
};




export const updateUserNotifications = async (userId, payload) => {
    const result = await request(`/users/${userId}/notifications`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
    });

    return {
        success: result.success,
        notifications: result.data?.notifications || [],
        error: result.error
    };
};




export const createOrder = async (user_id, orderData) => {
    const result = await request(`/users/${user_id}/orders`, {
        method: 'POST',
        body: JSON.stringify(orderData)
    });

    return {
        success: result.success,
        order: result.data?.order || null,
        error: result.error
    };
};

export const cancelUserOrder = async (userId, orderId, reason = '') => {
    const result = await request(`/users/${userId}/orders/${orderId}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({ reason })
    });

    return {
        success: result.success,
        order: result.data?.order || null,
        message: result.data?.message || '',
        error: result.error
    };
};






// =============================================================
//  User
// =============================================================


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


// =============================================================
//  AUTHENTICATION & IDENTITY
// =============================================================

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

// =============================================================
//  ADMIN: DASHBOARD
// =============================================================

export const getAdminDashboard = async () => {
    const result = await request('/admin/dashboard');
    return {
        success: result.success,
        metrics: result.data?.metrics || {},
        salesTrend: result.data?.salesTrend || [],
        categoryDistribution: result.data?.categoryDistribution || [],
        recentOrders: result.data?.recentOrders || [],
        lowStockAlerts: result.data?.lowStockAlerts || [],
        error: result.error,
        status: result.status
    };
};

// =============================================================
//  ADMIN: PRODUCTS
// =============================================================

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

// =============================================================
//  ADMIN: CATEGORIES
// =============================================================

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

// =============================================================
//  ADMIN: INVENTORY
// =============================================================

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

// =============================================================
//  ADMIN: ORDERS
// =============================================================

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

// =============================================================
//  ADMIN: CUSTOMERS
// =============================================================

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

// =============================================================
//  ADMIN: COUPONS
// =============================================================

export const getAdminCoupons = async () => {
    const result = await request('/admin/coupons');
    return {
        success: result.success,
        coupons: result.data?.coupons || [],
        error: result.error
    };
};

export const createAdminCoupon = async (couponData) => {
    const result = await request('/admin/coupons', {
        method: 'POST',
        body: JSON.stringify(couponData)
    });
    return {
        success: result.success,
        coupon: result.data?.coupon || null,
        message: result.data?.message || '',
        error: result.error
    };
};

export const updateAdminCoupon = async (idOrCode, couponData) => {
    const result = await request(`/admin/coupons/${encodeURIComponent(idOrCode)}`, {
        method: 'PUT',
        body: JSON.stringify(couponData)
    });
    return {
        success: result.success,
        coupon: result.data?.coupon || null,
        message: result.data?.message || '',
        error: result.error
    };
};

export const deleteAdminCoupon = async (idOrCode) => {
    const result = await request(`/admin/coupons/${encodeURIComponent(idOrCode)}`, {
        method: 'DELETE'
    });
    return {
        success: result.success,
        message: result.data?.message || '',
        error: result.error
    };
};

// =============================================================
//  ADMIN: REVIEWS
// =============================================================

export const getAdminReviews = async (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);

    const qs = query.toString();
    const endpoint = `/admin/reviews${qs ? `?${qs}` : ''}`;
    const result = await request(endpoint);
    return {
        success: result.success,
        reviews: result.data?.reviews || [],
        total: result.data?.total || 0,
        error: result.error
    };
};

export const updateAdminReviewStatus = async (reviewId, updateData) => {
    const result = await request(`/admin/reviews/${encodeURIComponent(reviewId)}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
    });
    return {
        success: result.success,
        message: result.data?.message || '',
        error: result.error
    };
};

export const updateAdminReview = updateAdminReviewStatus;

// =============================================================
//  ADMIN: SUPPORT
// =============================================================

export const getAdminSupportTickets = async () => {
    const result = await request('/admin/support');
    return {
        success: result.success,
        tickets: result.data?.tickets || [],
        total: result.data?.total || 0,
        error: result.error
    };
};

export const updateAdminSupportTicket = async (ticketId, ticketData) => {
    const result = await request(`/admin/support/${encodeURIComponent(ticketId)}`, {
        method: 'PATCH',
        body: JSON.stringify(ticketData)
    });
    return {
        success: result.success,
        ticket: result.data?.ticket || null,
        message: result.data?.message || '',
        error: result.error
    };
};

// =============================================================
//  ADMIN: SITE CONTENT
// =============================================================

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

// =============================================================
//  ADMIN: STORE SETTINGS
// =============================================================

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

