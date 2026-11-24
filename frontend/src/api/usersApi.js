import { request } from './apiClient';

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
