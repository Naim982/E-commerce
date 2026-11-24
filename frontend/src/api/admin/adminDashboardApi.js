import { request } from '../apiClient';

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
