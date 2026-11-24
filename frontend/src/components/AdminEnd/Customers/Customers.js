import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getAdminCustomers, getAdminCustomerById } from '../../../api/apiManager';
import AdminPageHeader from '../shared/AdminPageHeader';
import StatCard from '../shared/StatCard';
import StatusBadge from '../shared/StatusBadge';
import Pagination from '../shared/Pagination';
import LoadingSpinner from '../shared/LoadingSpinner';
import EmptyState from '../shared/EmptyState';
import CustomerDetailsModal from './CustomerDetailsModal';
import { exportToCSV } from '../shared/exportUtils';
import {
    SearchIcon,
    UsersIcon,
    DollarIcon,
    OrdersIcon,
    EyeIcon
} from '../shared/AdminIcons';

const ITEMS_PER_PAGE = 10;

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Detail modal state
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [loadingCustomer, setLoadingCustomer] = useState(false);
    const [customerModalOpen, setCustomerModalOpen] = useState(false);

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAdminCustomers({ search: searchTerm });
            if (res.success) {
                setCustomers(res.customers);
            }
        } catch (err) {
            console.error('Failed to fetch customers:', err);
        } finally {
            setLoading(false);
        }
    }, [searchTerm]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchCustomers();
            setCurrentPage(1);
        }, 300);
        return () => clearTimeout(timeout);
    }, [fetchCustomers]);

    // Handle view details
    const handleViewDetails = async (customerId) => {
        setLoadingCustomer(true);
        setCustomerModalOpen(true);
        try {
            const res = await getAdminCustomerById(customerId);
            if (res.success) {
                setSelectedCustomer(res.customer);
            }
        } catch (err) {
            console.error('Failed to fetch customer profile:', err);
        } finally {
            setLoadingCustomer(false);
        }
    };

    // Metrics
    const metrics = useMemo(() => {
        const total = customers.length;
        const totalSpend = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
        const totalOrders = customers.reduce((sum, c) => sum + (c.totalOrders || 0), 0);
        const avgOrders = total > 0 ? (totalOrders / total).toFixed(1) : 0;
        return { total, totalSpend, totalOrders, avgOrders };
    }, [customers]);

    // Pagination
    const paginatedCustomers = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return customers.slice(start, start + ITEMS_PER_PAGE);
    }, [customers, currentPage]);

    const totalPages = Math.ceil(customers.length / ITEMS_PER_PAGE);

    const handleExportCustomers = () => {
        if (!customers.length) return;
        const exportData = customers.map((c) => ({
            ID: c.id,
            Name: c.name,
            Email: c.email,
            Phone: c.phone || '',
            Role: c.role || 'customer',
            Status: c.status || 'active',
            TotalOrders: c.totalOrders || 0,
            TotalSpent: Number(c.totalSpent || 0).toFixed(2),
            JoinedDate: c.joinedDate || ''
        }));
        exportToCSV(exportData, `lumen-customers-${new Date().toISOString().split('T')[0]}.csv`);
    };

    return (
        <div className="admin-page">
            <AdminPageHeader
                title="Customer Directory"
                description="View registered accounts, customer lifetime value, and order histories."
            >
                <button
                    type="button"
                    className="admin-btn admin-btn-outline"
                    onClick={handleExportCustomers}
                >
                    📥 Export Directory CSV
                </button>
            </AdminPageHeader>

            {/* Metrics */}
            <div className="admin-stats-grid">
                <StatCard
                    title="Total Customers"
                    value={metrics.total}
                    icon={UsersIcon}
                    color="primary"
                />
                <StatCard
                    title="Lifetime Revenue"
                    value={`৳${metrics.totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    icon={DollarIcon}
                    color="success"
                />
                <StatCard
                    title="Total Orders Placed"
                    value={metrics.totalOrders}
                    icon={OrdersIcon}
                    color="warning"
                />
                <StatCard
                    title="Avg Orders / Customer"
                    value={metrics.avgOrders}
                    icon={UsersIcon}
                    color="info"
                />
            </div>

            {/* Main Content Card */}
            <div className="admin-card">
                {/* Search & Filters */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--admin-border)', display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: '1', maxWidth: '380px' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)', display: 'flex' }}>
                            <SearchIcon />
                        </span>
                        <input
                            type="text"
                            placeholder="Search by name, email, or user ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="admin-input"
                            style={{ paddingLeft: '38px', width: '100%' }}
                        />
                    </div>
                    {searchTerm && (
                        <button
                            type="button"
                            className="admin-btn admin-btn-ghost admin-btn-sm"
                            onClick={() => setSearchTerm('')}
                        >
                            Clear Search
                        </button>
                    )}
                </div>

                {/* Table or Loading */}
                {loading ? (
                    <LoadingSpinner text="Loading customers..." />
                ) : customers.length === 0 ? (
                    <EmptyState
                        icon={UsersIcon}
                        title="No customers found"
                        description={searchTerm ? `No customer records matched "${searchTerm}".` : "There are no registered customer records yet."}
                    />
                ) : (
                    <>
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Customer</th>
                                        <th>Contact</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Orders</th>
                                        <th>Lifetime Spend</th>
                                        <th>Joined</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedCustomers.map((c) => (
                                        <tr key={c.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{
                                                        width: '38px',
                                                        height: '38px',
                                                        borderRadius: '50%',
                                                        backgroundColor: 'var(--admin-primary-light, #e0e7ff)',
                                                        color: 'var(--admin-primary)',
                                                        fontWeight: '600',
                                                        fontSize: '0.875rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0
                                                    }}>
                                                        {c.avatarInitials || 'CU'}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: '600', color: 'var(--admin-text-main)' }}>
                                                            {c.name}
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', fontFamily: 'monospace' }}>
                                                            {c.id}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontSize: '0.875rem', color: 'var(--admin-text-main)' }}>{c.email}</div>
                                                {c.phone && (
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>{c.phone}</div>
                                                )}
                                            </td>
                                            <td>
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600',
                                                    padding: '3px 8px',
                                                    borderRadius: '6px',
                                                    textTransform: 'uppercase',
                                                    backgroundColor: c.role === 'admin' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(100, 116, 139, 0.12)',
                                                    color: c.role === 'admin' ? '#4f46e5' : '#475569'
                                                }}>
                                                    {c.role || 'customer'}
                                                </span>
                                            </td>
                                            <td>
                                                <StatusBadge status={c.status || 'active'} />
                                            </td>
                                            <td style={{ fontWeight: '600', color: 'var(--admin-text-main)' }}>
                                                {c.totalOrders || 0}
                                            </td>
                                            <td style={{ fontWeight: '600', color: 'var(--admin-success)' }}>
                                                ${(c.totalSpent || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td style={{ fontSize: '0.8125rem', color: 'var(--admin-text-muted)' }}>
                                                {c.joinedDate}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button
                                                    type="button"
                                                    className="admin-btn admin-btn-outline admin-btn-sm"
                                                    onClick={() => handleViewDetails(c.id)}
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                                >
                                                    <EyeIcon /> View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--admin-border)' }}>
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Customer Details Modal */}
            <CustomerDetailsModal
                isOpen={customerModalOpen}
                onClose={() => setCustomerModalOpen(false)}
                customer={selectedCustomer}
                loading={loadingCustomer}
            />
        </div>
    );
};

export default Customers;
