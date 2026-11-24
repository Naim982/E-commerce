import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './AdminLayout.css';

const PATH_NAMES = {
    admin: 'Admin',
    products: 'Products',
    new: 'Add Product',
    edit: 'Edit Product',
    categories: 'Categories',
    inventory: 'Inventory',
    orders: 'Orders',
    customers: 'Customers',
    coupons: 'Coupons & Promos',
    reviews: 'Reviews',
    support: 'Support Tickets',
    content: 'Content Management',
    settings: 'Settings'
};

const AdminBreadcrumbs = () => {
    const location = useLocation();
    const segments = location.pathname.split('/').filter(Boolean);

    // If just /admin
    if (segments.length <= 1) {
        return (
            <div className="admin-breadcrumbs">
                <span className="current">Dashboard</span>
            </div>
        );
    }

    return (
        <nav className="admin-breadcrumbs" aria-label="Breadcrumb">
            <Link to="/admin">Admin</Link>
            {segments.slice(1).map((segment, index) => {
                const path = `/${segments.slice(0, index + 2).join('/')}`;
                const isLast = index === segments.length - 2;
                const displayName = PATH_NAMES[segment] || (segment.length > 15 ? `${segment.slice(0, 12)}...` : segment);

                return (
                    <React.Fragment key={path}>
                        <span className="separator">/</span>
                        {isLast ? (
                            <span className="current">{displayName}</span>
                        ) : (
                            <Link to={path}>{displayName}</Link>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
};

export default AdminBreadcrumbs;
