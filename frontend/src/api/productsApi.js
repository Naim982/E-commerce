import { request } from './apiClient';

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
