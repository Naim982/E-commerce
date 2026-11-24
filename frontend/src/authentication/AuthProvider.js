import { createContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../Firebase/firebase.config';
import { getAuthMe } from '../api/apiManager';

export const AuthContext = createContext(null);
const STORAGE_KEY = 'authUser';

const AuthProvider = ({ children }) => {
    const storedAuth = sessionStorage.getItem(STORAGE_KEY);

    let initialUser = null;
    if (storedAuth && storedAuth !== 'loggedOut') {
        try {
            initialUser = JSON.parse(storedAuth);
        } catch (e) {
            initialUser = null;
        }
    }

    const [user, setUser] = useState(initialUser);
    const [userId, setUserId] = useState(initialUser?.uid || null);
    const [role, setRole] = useState(initialUser?.role || 'customer');
    const [loading, setLoading] = useState(!storedAuth);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                let userRole = 'customer';
                try {
                    const authMe = await getAuthMe();
                    if (authMe.success && authMe.user?.role) {
                        userRole = authMe.user.role;
                    }
                } catch (err) {
                    console.warn('Role verification deferred:', err);
                }

                const userData = {
                    uid: currentUser.uid,
                    email: currentUser.email || null,
                    displayName: currentUser.displayName || null,
                    phoneNumber: currentUser.phoneNumber || null,
                    photoURL: currentUser.photoURL || null,
                    role: userRole
                };

                setUser(userData);
                setUserId(currentUser.uid);
                setRole(userRole);
                sessionStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
            } else {
                setUser(null);
                setUserId(null);
                setRole('customer');
                sessionStorage.setItem(STORAGE_KEY, 'loggedOut');
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const authInfo = {
        user,
        userId,
        role,
        isAdmin: role === 'admin',
        loading
    };

    return (
        <AuthContext.Provider value={authInfo}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
