import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CompareContext = createContext(null);

const STORAGE_KEY = 'lumen_compare_products';

export const CompareProvider = ({ children }) => {
    const [compareProducts, setCompareProducts] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Failed to load compare items from localStorage', e);
            return [];
        }
    });

    const [conflictModal, setConflictModal] = useState({
        isOpen: false,
        pendingProduct: null,
        currentCategory: '',
        newCategory: ''
    });

    // Save to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(compareProducts));
        } catch (e) {
            console.error('Failed to save compare items to localStorage', e);
        }
    }, [compareProducts]);

    const compareCategory = compareProducts.length > 0 ? (compareProducts[0].category || null) : null;

    const isInCompare = useCallback((productId) => {
        return compareProducts.some(p => p.id === productId);
    }, [compareProducts]);

    const addToCompare = useCallback((product, force = false) => {
        if (!product || !product.id) {
            return { success: false, reason: 'INVALID_PRODUCT' };
        }

        // Already in comparison
        if (compareProducts.some(p => p.id === product.id)) {
            return { success: true, alreadyExists: true, message: 'Already in comparison' };
        }

        const currentCat = compareCategory;
        const newCat = product.category;

        // Check category mismatch
        if (currentCat && newCat && currentCat.toLowerCase().trim() !== newCat.toLowerCase().trim()) {
            if (force) {
                setCompareProducts([product]);
                return { success: true, forced: true };
            }

            setConflictModal({
                isOpen: true,
                pendingProduct: product,
                currentCategory: currentCat,
                newCategory: newCat
            });

            return {
                success: false,
                reason: 'DIFFERENT_CATEGORY',
                currentCategory: currentCat,
                newCategory: newCat,
                pendingProduct: product
            };
        }

        // Check max 3 products limit
        if (compareProducts.length >= 3) {
            return {
                success: false,
                reason: 'MAX_LIMIT_REACHED',
                message: 'You can compare a maximum of 3 products at a time.'
            };
        }

        setCompareProducts(prev => [...prev, product]);
        return { success: true };
    }, [compareProducts, compareCategory]);

    const removeFromCompare = useCallback((productId) => {
        setCompareProducts(prev => prev.filter(p => p.id !== productId));
    }, []);

    const clearCompare = useCallback(() => {
        setCompareProducts([]);
    }, []);

    const resolveConflict = useCallback((shouldReplace) => {
        const productToAdd = conflictModal.pendingProduct;
        setConflictModal({
            isOpen: false,
            pendingProduct: null,
            currentCategory: '',
            newCategory: ''
        });
        if (shouldReplace && productToAdd) {
            setCompareProducts([productToAdd]);
            return productToAdd;
        }
        return null;
    }, [conflictModal.pendingProduct]);

    return (
        <CompareContext.Provider
            value={{
                compareProducts,
                compareCategory,
                compareCount: compareProducts.length,
                isInCompare,
                addToCompare,
                removeFromCompare,
                clearCompare,
                conflictModal,
                resolveConflict
            }}
        >
            {children}
            {conflictModal.isOpen && (
                <div className="compare-conflict-modal-overlay" role="dialog" aria-modal="true">
                    <div className="compare-conflict-modal">
                        <div className="compare-conflict-icon">⚠️</div>
                        <h3>Different Category</h3>
                        <p>
                            You currently have items from <strong>{conflictModal.currentCategory}</strong> in your comparison.
                        </p>
                        <p className="compare-conflict-subtext">
                            Comparison requires all products to be in the same category. Would you like to clear your current comparison and compare <strong>{conflictModal.newCategory}</strong>?
                        </p>
                        <div className="compare-conflict-actions">
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => resolveConflict(false)}
                            >
                                Keep Current
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => resolveConflict(true)}
                            >
                                Clear & Compare New
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </CompareContext.Provider>
    );
};

export const useCompare = () => {
    const context = useContext(CompareContext);
    if (!context) {
        throw new Error('useCompare must be used within a CompareProvider');
    }
    return context;
};
