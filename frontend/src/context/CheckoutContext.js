import React, { createContext, useContext, useEffect, useState } from 'react';

const CheckoutContext = createContext(null);

const DEFAULT_CHECKOUT = {
    source: '',
    checkoutItems: [],
    address: null,
    delivery: null,
    discount: 0,
    couponCode: ''
};

export const CheckoutProvider = ({ children }) => {
    const [checkout, setCheckout] = useState(() => {
        const storedCheckout = sessionStorage.getItem('checkoutData');
        if (!storedCheckout) {
            return DEFAULT_CHECKOUT;
        }

        try {
            return { ...DEFAULT_CHECKOUT, ...JSON.parse(storedCheckout) };
        } catch (error) {
            console.error('Failed to load checkout data:', error);
            return DEFAULT_CHECKOUT;
        }
    });

    useEffect(() => {
        sessionStorage.setItem('checkoutData', JSON.stringify(checkout));
    }, [checkout]);

    const clearCheckout = () => {
        setCheckout(DEFAULT_CHECKOUT);
        sessionStorage.removeItem('checkoutData');
    };

    return (
        <CheckoutContext.Provider value={{ checkout, setCheckout, clearCheckout }}>
            {children}
        </CheckoutContext.Provider>
    );
};

export const useCheckout = () => {
    const context = useContext(CheckoutContext);

    if (!context) {
        throw new Error('useCheckout must be used inside CheckoutProvider');
    }

    return context;
};

export default CheckoutContext;
