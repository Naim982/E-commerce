import { request } from '../apiClient';

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
