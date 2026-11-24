import { initializeApp } from 'firebase/app';
import { FacebookAuthProvider, getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: 'AIzaSyBVcIFh7kuaZt3uWjOq-f3frs6cUDz3ypE',
    authDomain: 'e-commerce-d60a7.firebaseapp.com',
    projectId: 'e-commerce-d60a7',
    storageBucket: 'e-commerce-d60a7.firebasestorage.app',
    messagingSenderId: '221568156650',
    appId: '1:221568156650:web:2a9d8d825d1d2cc6cca893'
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
