import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from './useAuth';
import { getAuthMe } from '../api/apiManager';
import AdminAccessDenied from './AdminAccessDenied';
import './AdminAuth.css';

const ProtectedRoute = ({ requiredRole }) => {
    const { user, loading: authLoading } = useAuth();
    const location = useLocation();

    const [roleLoading, setRoleLoading] = useState(requiredRole === 'admin');
    const [verifiedRole, setVerifiedRole] = useState(null);
    const [verifiedEmail, setVerifiedEmail] = useState(null);

    useEffect(() => {
        if (requiredRole !== 'admin') {
            return;
        }

        let isMounted = true;

        const checkRole = async () => {
            if (!user) {
                if (isMounted) {
                    setRoleLoading(false);
                    setVerifiedRole(null);
                }
                return;
            }

            try {
                const result = await getAuthMe();
                if (isMounted) {
                    if (result.success && result.user) {
                        setVerifiedRole(result.user.role);
                        setVerifiedEmail(result.user.email);
                    } else if (result.success && result.role) {
                        setVerifiedRole(result.role);
                        setVerifiedEmail(user.email);
                    } else {
                        setVerifiedRole('customer');
                    }
                    setRoleLoading(false);
                }
            } catch (err) {
                if (isMounted) {
                    console.error('Admin role verification failed:', err);
                    setVerifiedRole('customer');
                    setRoleLoading(false);
                }
            }
        };

        if (!authLoading) {
            checkRole();
        }

        return () => {
            isMounted = false;
        };
    }, [user, authLoading, requiredRole]);

    // Administrator role guard
    if (requiredRole === 'admin') {
        if (authLoading || roleLoading) {
            return (
                <div className="admin-auth-loading">
                    <div className="admin-auth-spinner" />
                    <div style={{ fontWeight: 600, letterSpacing: '0.05em' }}>VERIFYING ADMINISTRATOR PRIVILEGES...</div>
                </div>
            );
        }

        if (!user) {
            return <Navigate to="/admin/login" state={{ from: location }} replace />;
        }

        if (verifiedRole !== 'admin') {
            return <AdminAccessDenied userEmail={verifiedEmail || user?.email} userRole={verifiedRole} />;
        }

        return <Outlet />;
    }

    // Default customer route guard
    if (authLoading) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/authentication/signin" state={{ from: location }} replace />;
    }

    return <Outlet />;
};

export const AdminProtectedRoute = (props) => <ProtectedRoute requiredRole="admin" {...props} />;

export default ProtectedRoute;
