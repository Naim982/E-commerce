import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getAdminSupportTickets, updateAdminSupportTicket } from '../../../api/apiManager';
import AdminPageHeader from '../shared/AdminPageHeader';
import StatCard from '../shared/StatCard';
import StatusBadge from '../shared/StatusBadge';
import Modal from '../shared/Modal';
import LoadingSpinner from '../shared/LoadingSpinner';
import EmptyState from '../shared/EmptyState';
import { useAdminToast } from '../Layout/AdminLayout';
import {
    SupportIcon,
    SearchIcon,
    EditIcon,
    CheckIcon,
    AlertIcon,
    MailIcon
} from '../shared/AdminIcons';

const Support = () => {
    const { addToast } = useAdminToast();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Detail/Edit modal
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [ticketStatus, setTicketStatus] = useState('open');
    const [ticketPriority, setTicketPriority] = useState('normal');
    const [adminNotes, setAdminNotes] = useState('');
    const [saving, setSaving] = useState(false);

    // Fetch tickets
    const fetchTickets = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAdminSupportTickets();
            if (res.success) {
                setTickets(res.tickets);
            } else {
                addToast(res.error || 'Failed to load tickets', 'error');
            }
        } catch (err) {
            console.error(err);
            addToast('Error loading support tickets', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    // Metrics
    const metrics = useMemo(() => {
        const total = tickets.length;
        const open = tickets.filter(t => (t.status || 'open').toLowerCase() === 'open').length;
        const inProgress = tickets.filter(t => (t.status || '').toLowerCase() === 'in-progress').length;
        const resolved = tickets.filter(t => ['resolved', 'closed'].includes((t.status || '').toLowerCase())).length;
        return { total, open, inProgress, resolved };
    }, [tickets]);

    // Filtered
    const filteredTickets = useMemo(() => {
        return tickets.filter(t => {
            const s = search.toLowerCase();
            const matchesSearch = !s ||
                t.id?.toLowerCase().includes(s) ||
                t.ticketId?.toLowerCase().includes(s) ||
                t.userName?.toLowerCase().includes(s) ||
                t.userEmail?.toLowerCase().includes(s) ||
                t.topic?.toLowerCase().includes(s) ||
                t.message?.toLowerCase().includes(s);

            const tStatus = (t.status || 'open').toLowerCase();
            const matchesStatus = statusFilter === 'all' || tStatus === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [tickets, search, statusFilter]);

    // Open detail modal
    const handleOpenTicket = (t) => {
        setSelectedTicket(t);
        setTicketStatus(t.status || 'open');
        setTicketPriority(t.priority || 'normal');
        setAdminNotes(t.adminNotes || '');
        setModalOpen(true);
    };

    // Save ticket update
    const handleSaveTicket = async (e) => {
        e.preventDefault();
        if (!selectedTicket) return;
        setSaving(true);
        try {
            const ticketId = selectedTicket.id || selectedTicket.ticketId;
            const res = await updateAdminSupportTicket(ticketId, {
                status: ticketStatus,
                priority: ticketPriority,
                adminNotes: adminNotes.trim()
            });

            if (res.success) {
                setTickets(prev => prev.map(t => (t.id === ticketId || t.ticketId === ticketId)
                    ? { ...t, status: ticketStatus, priority: ticketPriority, adminNotes: adminNotes.trim() }
                    : t
                ));
                addToast(`Ticket ${ticketId} updated successfully`, 'success');
                setModalOpen(false);
            } else {
                addToast(res.error || 'Failed to update ticket', 'error');
            }
        } catch (err) {
            console.error(err);
            addToast('Error saving ticket updates', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="admin-page">
            <AdminPageHeader
                title="Customer Support Tickets"
                description="Manage customer inquiries, order assistance requests, and warranty tickets."
            />

            {/* Metrics */}
            <div className="admin-stats-grid">
                <StatCard
                    title="Open Inquiries"
                    value={metrics.open}
                    icon={AlertIcon}
                    color="warning"
                />
                <StatCard
                    title="In Progress"
                    value={metrics.inProgress}
                    icon={SupportIcon}
                    color="primary"
                />
                <StatCard
                    title="Resolved / Closed"
                    value={metrics.resolved}
                    icon={CheckIcon}
                    color="success"
                />
                <StatCard
                    title="Total Tickets"
                    value={metrics.total}
                    icon={MailIcon}
                    color="info"
                />
            </div>

            {/* Table Card */}
            <div className="admin-card">
                <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--admin-border)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '16px',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ position: 'relative', width: '340px' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)', display: 'flex' }}>
                            <SearchIcon />
                        </span>
                        <input
                            type="text"
                            placeholder="Search ticket ID, name, email, or message..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="admin-input"
                            style={{ paddingLeft: '38px', width: '100%' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        {['all', 'open', 'in-progress', 'resolved', 'closed'].map(st => (
                            <button
                                key={st}
                                type="button"
                                className={`admin-btn admin-btn-sm ${statusFilter === st ? 'admin-btn-primary' : 'admin-btn-outline'}`}
                                onClick={() => setStatusFilter(st)}
                                style={{ textTransform: 'capitalize' }}
                            >
                                {st}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <LoadingSpinner text="Loading support tickets..." />
                ) : filteredTickets.length === 0 ? (
                    <EmptyState
                        icon={SupportIcon}
                        title="No tickets found"
                        description={search ? `No tickets matched "${search}".` : "There are currently no tickets in this status."}
                    />
                ) : (
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Ticket ID</th>
                                    <th>Customer</th>
                                    <th>Topic</th>
                                    <th>Message Snippet</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTickets.map(t => {
                                    const ticketId = t.id || t.ticketId;
                                    const priority = t.priority || 'normal';
                                    return (
                                        <tr key={ticketId}>
                                            <td>
                                                <div style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--admin-primary)' }}>
                                                    {ticketId}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                                                    {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'N/A'}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: '600', color: 'var(--admin-text-main)', fontSize: '0.875rem' }}>
                                                    {t.userName || 'Customer'}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                                                    {t.userEmail}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: '500', color: 'var(--admin-text-main)', fontSize: '0.875rem' }}>
                                                    {t.topic || 'General Inquiry'}
                                                </div>
                                                {t.orderNumber && (
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', fontFamily: 'monospace' }}>
                                                        Order: #{t.orderNumber}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ maxWidth: '280px' }}>
                                                <div style={{
                                                    fontSize: '0.8125rem',
                                                    color: 'var(--admin-text-muted)',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>
                                                    {t.message}
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600',
                                                    padding: '3px 8px',
                                                    borderRadius: '6px',
                                                    textTransform: 'capitalize',
                                                    backgroundColor: priority === 'urgent' || priority === 'high' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(100, 116, 139, 0.12)',
                                                    color: priority === 'urgent' || priority === 'high' ? '#dc2626' : '#475569'
                                                }}>
                                                    {priority}
                                                </span>
                                            </td>
                                            <td>
                                                <StatusBadge status={t.status || 'open'} />
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button
                                                    type="button"
                                                    className="admin-btn admin-btn-outline admin-btn-sm"
                                                    onClick={() => handleOpenTicket(t)}
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                                >
                                                    <EditIcon /> Manage
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Manage Ticket Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={`Manage Ticket: ${selectedTicket?.id || selectedTicket?.ticketId}`}
                size="md"
            >
                {selectedTicket && (
                    <form onSubmit={handleSaveTicket} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Customer & Ticket Info Header */}
                        <div style={{
                            padding: '14px 16px',
                            backgroundColor: 'var(--admin-bg-hover, #f8fafc)',
                            borderRadius: '8px',
                            border: '1px solid var(--admin-border)',
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '12px'
                        }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Customer</div>
                                <div style={{ fontWeight: '600', color: 'var(--admin-text-main)' }}>{selectedTicket.userName || 'Customer'}</div>
                                <div style={{ fontSize: '0.8125rem', color: 'var(--admin-text-muted)' }}>{selectedTicket.userEmail}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Topic</div>
                                <div style={{ fontWeight: '600', color: 'var(--admin-text-main)' }}>{selectedTicket.topic || 'General Inquiry'}</div>
                                {selectedTicket.orderNumber && (
                                    <div style={{ fontSize: '0.8125rem', color: 'var(--admin-primary)', fontFamily: 'monospace' }}>
                                        Order #{selectedTicket.orderNumber}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Message Box */}
                        <div>
                            <label className="admin-label">Customer Message</label>
                            <div style={{
                                padding: '14px 16px',
                                backgroundColor: '#ffffff',
                                border: '1px solid var(--admin-border)',
                                borderRadius: '8px',
                                fontSize: '0.875rem',
                                color: 'var(--admin-text-main)',
                                lineHeight: '1.5',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {selectedTicket.message}
                            </div>
                        </div>

                        {/* Controls */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="admin-form-group">
                                <label className="admin-label">Ticket Status</label>
                                <select
                                    value={ticketStatus}
                                    onChange={(e) => setTicketStatus(e.target.value)}
                                    className="admin-select"
                                >
                                    <option value="open">Open</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-label">Priority</label>
                                <select
                                    value={ticketPriority}
                                    onChange={(e) => setTicketPriority(e.target.value)}
                                    className="admin-select"
                                >
                                    <option value="low">Low</option>
                                    <option value="normal">Normal</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>
                        </div>

                        {/* Internal Notes */}
                        <div className="admin-form-group">
                            <label className="admin-label">Internal Resolution Notes (Admin Only)</label>
                            <textarea
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                placeholder="Add notes regarding how this inquiry was handled, refund references, customer call summary, etc."
                                className="admin-textarea"
                                rows={3}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid var(--admin-border)' }}>
                            <button
                                type="button"
                                className="admin-btn admin-btn-outline"
                                onClick={() => setModalOpen(false)}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="admin-btn admin-btn-primary"
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : 'Update Ticket'}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
};

export default Support;
