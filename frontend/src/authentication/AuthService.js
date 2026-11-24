import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signOut,
    sendPasswordResetEmail,
    updateProfile,
    sendSignInLinkToEmail,
    signInWithEmailLink,
    isSignInWithEmailLink,
    EmailAuthProvider,
    updatePassword,
    reauthenticateWithCredential
} from 'firebase/auth';
import { auth, facebookProvider, googleProvider } from '../Firebase/firebase.config';

export const getAuthErrorMessage = (error) => {
    switch (error?.code) {
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/user-not-found':
            return 'No account found with this email.';
        case 'auth/wrong-password':
            return 'Incorrect current password.';
        case 'auth/requires-recent-login':
            return 'This operation is sensitive and requires recent authentication. Please log out and log in again before retrying.';
        case 'auth/invalid-credential':
            return 'Invalid email/password, or your verification link is no longer valid.';
        case 'auth/email-already-in-use':
            return 'An account already exists with this email.';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters.';
        case 'auth/user-disabled':
            return 'This account has been disabled.';
        case 'auth/expired-action-code':
            return 'This verification link has expired. Please request a new link.';
        case 'auth/invalid-action-code':
            return 'This verification link is invalid or has already been used.';
        case 'auth/popup-closed-by-user':
            return 'The sign-in popup was closed.';
        case 'auth/popup-blocked':
            return 'The sign-in popup was blocked by your browser.';
        case 'auth/cancelled-popup-request':
            return 'Another sign-in request is already in progress.';
        case 'auth/account-exists-with-different-credential':
            return 'An account already exists with this email using a different sign-in method.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your internet connection.';
        case 'auth/too-many-requests':
            return 'Too many attempts. Please try again later.';
        default:
            return error?.message || 'Something went wrong. Please try again.';
    }
};

export const login = async ({ method, email, password }) => {
    try {
        let result;
        switch (method) {
            case 'email':
                result = await signInWithEmailAndPassword(auth, email, password);
                break;
            case 'google':
                result = await signInWithPopup(auth, googleProvider);
                break;
            case 'facebook':
                result = await signInWithPopup(auth, facebookProvider);
                break;
            default:
                throw new Error('Invalid authentication method.');
        }

        return {
            success: true,
            user: result.user,
            error: null
        };
    } catch (error) {
        return {
            success: false,
            user: null,
            error: getAuthErrorMessage(error)
        };
    }
};

export const sendRegisterLink = async (email) => {
    const cleanEmail = email.trim().toLowerCase();

    try {
        const actionCodeSettings = {
            url: `${window.location.origin}/authentication/verify-email`,
            handleCodeInApp: true
        };

        await sendSignInLinkToEmail(auth, cleanEmail, actionCodeSettings);

        return {
            success: true,
            error: null
        };
    } catch (error) {
        return {
            success: false,
            error: getAuthErrorMessage(error)
        };
    }
};

export const completePasswordlessSignIn = async (email) => {
    try {
        if (!isSignInWithEmailLink(auth, window.location.href)) {
            return {
                success: false,
                error: 'This is not a valid passwordless sign-in link.'
            };
        }

        const result = await signInWithEmailLink(auth, email, window.location.href);

        return {
            success: true,
            user: result.user,
            error: null
        };
    } catch (error) {
        console.error('completePasswordlessSignIn:', error);
        return {
            success: false,
            user: null,
            error: getAuthErrorMessage(error)
        };
    }
};

export const addAccountPassword = async (password) => {
    const user = auth.currentUser;

    if (!user) {
        return {
            success: false,
            error: 'No authenticated user found.'
        };
    }

    if (!user.email) {
        return {
            success: false,
            error: 'No email address is associated with this account.'
        };
    }

    try {
        await updatePassword(user, password);
        return {
            success: true,
            user,
            error: null
        };
    } catch (error) {
        return {
            success: false,
            user,
            error: getAuthErrorMessage(error)
        };
    }
};

export const changeAccountPassword = async (currentPassword, newPassword) => {
    const user = auth.currentUser;

    if (!user) {
        return {
            success: false,
            error: 'No authenticated user found. Please log in again.'
        };
    }

    if (!user.email) {
        return {
            success: false,
            error: 'No email address is associated with this account.'
        };
    }

    try {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);

        return {
            success: true,
            error: null
        };
    } catch (error) {
        console.error('changeAccountPassword error:', error);
        return {
            success: false,
            error: getAuthErrorMessage(error)
        };
    }
};

export const register = async ({ email, password, displayName }) => {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName });

        return {
            success: true,
            user: result.user,
            error: null
        };
    } catch (error) {
        return {
            success: false,
            user: null,
            error: getAuthErrorMessage(error)
        };
    }
};

export const sendResetEmail = async (email) => {
    try {
        const actionCodeSettings = {
            url: `${window.location.origin}/authentication/reset-password`,
            handleCodeInApp: false
        };

        await sendPasswordResetEmail(auth, email, actionCodeSettings);
        return {
            success: true,
            error: null
        };
    } catch (error) {
        return {
            success: false,
            error: getAuthErrorMessage(error)
        };
    }
};

export const updateNewProfile = async ({ displayName, photoURL }) => {
    try {
        const user = auth.currentUser;
        if (!user) {
            return {
                success: false,
                user: null,
                error: 'No authenticated user'
            };
        }

        await updateProfile(user, {
            displayName,
            photoURL
        });

        return {
            success: true,
            user,
            error: null
        };
    } catch (error) {
        console.error('updateFirebaseProfile:', error);
        return {
            success: false,
            user: null,
            error: getAuthErrorMessage(error)
        };
    }
};

export const logout = async () => {
    try {
        await signOut(auth);
        return {
            success: true,
            error: null
        };
    } catch (error) {
        return {
            success: false,
            error: getAuthErrorMessage(error)
        };
    }
};
