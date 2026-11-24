import React, { createContext, useContext, useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';
import AdminMobileSidebar from './AdminMobileSidebar';
import ToastNotification from '../shared/ToastNotification';
import { getAdminDashboard } from '../../../api/apiManager';
import './AdminLayout.css';

export const AdminToastContext = createContext(null);

export const useAdminToast = () => {
    const context = useContext(AdminToastContext);
    if (!context) {
        throw new Error('useAdminToast must be used within AdminLayout');
    }
    return context;
};

const AdminLayout = () => {
    const [collapsed, setCollapsed] = useState(() => {
        return localStorage.getItem('admin_sidebar_collapsed') === 'true';
    });
    const [mobileOpen, setMobileOpen] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [counts, setCounts] = useState({
        pendingOrders: 0,
        lowStock: 0,
        openTickets: 0
    });

    const toggleCollapse = () => {
        setCollapsed((prev) => {
            const next = !prev;
            localStorage.setItem('admin_sidebar_collapsed', String(next));
            return next;
        });
    };

    const showToast = (arg1, typeOrDuration = 'info', optDuration = 3500) => {
        let title = '';
        let message = '';
        let type = 'info';
        let duration = 3500;

        if (typeof arg1 === 'string') {
            message = arg1;
            if (typeof typeOrDuration === 'string') {
                type = typeOrDuration;
                duration = optDuration;
            } else if (typeof typeOrDuration === 'number') {
                duration = typeOrDuration;
            }
        } else if (arg1 && typeof arg1 === 'object') {
            title = arg1.title || '';
            message = arg1.message || '';
            type = arg1.type || 'info';
            duration = arg1.duration || 3500;
        }

        const id = `${Date.now()}-${Math.random()}`;
        setToasts((prev) => [...prev, { id, title, message, type, duration }]);
    };

    const dismissToast = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    // Load initial counts for badges
    useEffect(() => {
        let isMounted = true;
        const loadBadges = async () => {
            try {
                const res = await getAdminDashboard();
                if (res.success && res.metrics && isMounted) {
                    setCounts({
                        pendingOrders: res.metrics.pendingOrders || 0,
                        lowStock: res.metrics.lowStockCount || 0,
                        openTickets: 0
                    });
                }
            } catch (e) {
                // Ignore badge load errors
            }
        };
        loadBadges();
        return () => { isMounted = false; };
    }, []);

    return (
        <AdminToastContext.Provider value={{ showToast, addToast: showToast }}>
            <div className="admin-layout-root">
                {/* Desktop Sidebar */}
                <AdminSidebar collapsed={collapsed} counts={counts} />

                {/* Mobile Drawer */}
                <AdminMobileSidebar
                    isOpen={mobileOpen}
                    onClose={() => setMobileOpen(false)}
                    counts={counts}
                />

                {/* Main Content Area */}
                <div className={`admin-main ${collapsed ? 'sidebar-collapsed' : ''}`}>
                    <AdminTopbar
                        onToggleMobile={() => setMobileOpen(true)}
                        onToggleCollapse={toggleCollapse}
                        isCollapsed={collapsed}
                    />

                    <main className="admin-content">
                        <Outlet context={{ showToast }} />
                    </main>
                </div>

                {/* Global Toast Alerts */}
                <ToastNotification toasts={toasts} onDismiss={dismissToast} />
            </div>
        </AdminToastContext.Provider>
    );
};

export default AdminLayout;
