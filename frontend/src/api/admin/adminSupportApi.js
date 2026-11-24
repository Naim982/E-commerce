import { request } from '../apiClient';

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
