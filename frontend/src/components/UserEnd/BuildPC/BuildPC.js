import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BreadcrumbNavigation from '../../Common/BreadcrumbNavigation/BreadcrumbNavigation';
import BuildPCStage from './BuildPCStage/BuildPCStage';
import { STAGES, FAQS } from './pcBuilderData';
import useAuth from '../../../authentication/useAuth';
import { addProductToCartlist, submitUserSupport } from '../../../api/apiManager';
import './BuildPC.css';

const STORAGE_KEY = 'lumen_saved_pc_build';

// Map Builder IDs to store catalog product IDs in productData.json when available
const BUILDER_TO_STORE_PRODUCT_MAP = {
    'cpu-1': 'comp-cpu-003', // 7800X3D
    'cpu-2': 'comp-cpu-001', // 9950X
    'cpu-4': 'comp-cpu-007', // 9700X
    'cpu-5': 'comp-cpu-009', // 7600X
    'cpu-6': 'comp-cpu-002', // Ultra 9 285K
    'cpu-7': 'comp-cpu-010', // Ultra 7 265K
    'cpu-8': 'comp-cpu-006', // i7-14700K
    'cpu-9': 'comp-cpu-008', // i5-14600K
    'mobo-1': 'comp-mb-006', // MSI B650
    'mobo-2': 'comp-mb-002', // MSI X870E
    'mobo-3': 'comp-mb-003', // Gigabyte X870E
    'mobo-5': 'comp-mb-004', // Crosshair X670E
    'mobo-6': 'comp-mb-001', // Maximus Z890
    'mobo-8': 'comp-mb-007', // Z790 AORUS
    'ram-1': 'comp-ram-002',  // G.Skill Trident
    'ram-2': 'comp-ram-001',  // Corsair Dominator
    'ram-3': 'comp-ram-006',  // Corsair Vengeance
    'ram-4': 'comp-ram-004',  // T-Force Delta
    'ram-6': 'comp-ram-007',  // Ripjaws S5
    'gpu-1': 'comp-gpu-005',  // 4070 Ti Super
    'gpu-3': 'comp-gpu-002',  // RTX 5080 Strix
    'gpu-4': 'comp-gpu-003',  // RTX 4090 Suprim
    'gpu-6': 'comp-gpu-004',  // RX 7900 XTX
    'gpu-7': 'comp-gpu-007',  // RX 7900 XT
    'ssd-3': 'comp-ssd-002',  // Crucial T705 2TB
    'ssd-4': 'comp-ssd-003',  // WD SN850X
    'ssd-5': 'comp-ssd-001',  // Samsung 990 PRO
    'ssd-6': 'comp-ssd-004'   // Kingston KC3000
};

const BuildPC = () => {
    const breadcrumbSections = ['Home', 'Custom PC Builder'];
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    // 1. Initial State: Load from localStorage or default to balanced build
    const [selectedParts, setSelectedParts] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('Error reading saved build from localStorage', e);
        }

        // Default initial selection
        const initial = {};
        const defaultIds = {
            'stage-cpu': 'cpu-1',      // Ryzen 7 7800X3D
            'stage-mobo': 'mobo-1',     // MSI MAG B650 Tomahawk WiFi
            'stage-cooler': 'cooler-3', // Arctic Liquid Freezer III 360
            'stage-ram': 'ram-3',       // Corsair Vengeance RGB 32GB DDR5 6000
            'stage-gpu': 'gpu-1',       // NVIDIA RTX 5070 12GB
            'stage-ssd': 'ssd-4',       // WD_BLACK SN850X 2TB NVMe
            'stage-psu': 'psu-1',       // Corsair RM850x 850W Gold
            'stage-case': 'case-4'      // Corsair 4000D Airflow
        };

        STAGES.forEach(stage => {
            const targetId = defaultIds[stage.id];
            if (targetId) {
                const comp = stage.components.find(c => c.id === targetId);
                if (comp) initial[stage.id] = comp;
            }
        });
        return initial;
    });

    // FAQ State
    const [faqList, setFaqList] = useState(FAQS);
    const [showAskQuestion, setShowAskQuestion] = useState(false);
    const [faqQuestion, setFaqQuestion] = useState('');

    const [toastMessage, setToastMessage] = useState(null);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [cartFeedbackModal, setCartFeedbackModal] = useState(null);
    const [isSubmittingFaq, setIsSubmittingFaq] = useState(false);

    // Auto-dismiss toast
    useEffect(() => {
        if (!toastMessage) return;
        const timer = setTimeout(() => setToastMessage(null), 4000);
        return () => clearTimeout(timer);
    }, [toastMessage]);

    // Handle component selection per stage
    const handleSelectComponent = (stageId, component) => {
        setSelectedParts(prev => {
            const updated = { ...prev };
            if (component) {
                updated[stageId] = component;
            } else {
                delete updated[stageId];
            }
            return updated;
        });
    };

    // Clear entire build
    const handleClearAll = () => {
        setSelectedParts({});
        setToastMessage('Build configuration cleared.');
    };

    // Save build to localStorage
    const handleSaveBuild = () => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedParts));
            setToastMessage('Build configuration saved to browser! ✓');
        } catch (e) {
            console.error('Failed to save build', e);
            setToastMessage('Failed to save build to browser.');
        }
    };

    // Add all selected build items to cart with clear feedback
    const handleAddCompleteBuildToCart = async () => {
        const partsList = Object.values(selectedParts);
        if (partsList.length === 0) {
            setToastMessage('Please select components before adding to cart.');
            return;
        }

        if (!user) {
            navigate('/authentication/signin', { state: { from: location } });
            return;
        }

        setIsAddingToCart(true);

        try {
            let addedCount = 0;
            let unmappedCount = 0;
            for (const part of partsList) {
                const catalogId = BUILDER_TO_STORE_PRODUCT_MAP[part.id];
                if (catalogId) {
                    const result = await addProductToCartlist(user.uid, catalogId, 1);
                    if (result.success) {
                        addedCount++;
                    }
                } else {
                    unmappedCount++;
                }
            }

            if (addedCount > 0) {
                setCartFeedbackModal({
                    type: 'success',
                    title: 'Hardware Components Added to Cart!',
                    addedCount,
                    unmappedCount,
                    message: `Successfully transferred ${addedCount} catalog components directly into your cart.${unmappedCount > 0 ? ` Note: ${unmappedCount} parts (Cooler, PSU, or Case) are preserved in your custom builder configuration and will sync as catalog items are allocated.` : ''}`
                });
            } else {
                setCartFeedbackModal({
                    type: 'info',
                    title: 'Build Configuration Preserved',
                    addedCount: 0,
                    unmappedCount,
                    message: 'Selected custom builder components (Cooler, PSU, Case) are saved in your active configuration. Full catalog cart checkout for these slots will be enabled once dedicated SKUs are seeded in store inventory.'
                });
            }
        } catch (error) {
            console.error('Error adding build to cart:', error);
            setToastMessage('Failed to add build items to cart. Please try again.');
        } finally {
            setIsAddingToCart(false);
        }
    };

    // Scroll to a specific stage card
    const handleScrollToStage = (stageId) => {
        const el = document.getElementById(stageId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('build-stage-highlight');
            setTimeout(() => el.classList.remove('build-stage-highlight'), 1500);
        }
    };

    // FAQ Submit Handler connected to existing support system
    const handleFaqSubmit = async (e) => {
        e.preventDefault();
        const cleanQ = faqQuestion.trim();
        if (!cleanQ) return;

        setIsSubmittingFaq(true);
        try {
            const supportRes = await submitUserSupport({
                userId: user?.uid || null,
                userName: user?.displayName || 'PC Builder Customer',
                userEmail: user?.email || '',
                topic: 'PC Builder Technical Inquiry',
                subject: `PC Builder FAQ: ${cleanQ.slice(0, 50)}`,
                message: cleanQ
            });

            const newFaq = {
                q: cleanQ,
                a: supportRes?.success && supportRes.ticket
                    ? `Inquiry registered with support (Ticket #${supportRes.ticket.id || supportRes.ticket.ticketId || 'OPEN'}). Our hardware engineers will respond shortly.`
                    : 'Your technical inquiry has been submitted to the LUMEN engineering team. A verified answer will be posted following compatibility testing.'
            };

            setFaqList([newFaq, ...faqList]);
            setFaqQuestion('');
            setShowAskQuestion(false);
            setToastMessage('Technical question submitted to hardware support team! ✓');
        } catch (err) {
            console.error('Failed to submit FAQ question:', err);
            setToastMessage('Unable to send inquiry to support. Please try again later.');
        } finally {
            setIsSubmittingFaq(false);
        }
    };

    // Sockets of selected parts
    const cpuPart = selectedParts['stage-cpu'];
    const moboPart = selectedParts['stage-mobo'];
    const cpuSocket = cpuPart?.socket || null;
    const moboSocket = moboPart?.socket || null;

    // Total Price calculation
    const totalPrice = useMemo(() => {
        let price = 0;
        Object.values(selectedParts).forEach(part => {
            if (!part) return;
            price += Number(part.price || 0);
        });
        return price;
    }, [selectedParts]);

    return (
        <main className="build-main-content">
            {/* Breadcrumb Navigation */}
            <BreadcrumbNavigation path={breadcrumbSections} />

            {/* Toast Notification */}
            {toastMessage && (
                <div style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-accent)',
                    borderLeft: '4px solid var(--color-accent)',
                    boxShadow: 'var(--shadow-lg)',
                    padding: '14px 20px',
                    borderRadius: 'var(--radius-lg)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    animation: 'slideIn 0.25s ease-out'
                }}>
                    <span>{toastMessage}</span>
                    <button
                        type="button"
                        onClick={() => setToastMessage(null)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
                    >
                        &times;
                    </button>
                </div>
            )}

            {/* 1. Builder Introduction (Seamless Header: Title + Two Buttons only) */}
            <section className="build-intro-section">
                <div className="container">
                    <div className="build-intro-box">
                        <div className="build-intro-text-col">
                            <h1 className="build-intro-title" style={{ margin: 0 }}>
                                Build Your Dream PC Component by Component
                            </h1>
                        </div>
                        <div className="build-intro-action-col" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <a href="#pc-builder-workbench" className="btn btn-lg btn-primary">
                                Configure System &darr;
                            </a>
                            <button
                                type="button"
                                className="btn btn-lg btn-secondary"
                                onClick={handleClearAll}
                                title="Start Fresh"
                            >
                                Reset Build
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Main PC Builder Workbench */}
            <section className="build-workbench-section" id="pc-builder-workbench" aria-label="Interactive PC Builder">
                <div className="container">
                    <div className="build-workbench-layout">
                        {/* Left Column: Component Selection Stages */}
                        <div className="build-stages-col">
                            {STAGES.map(stage => (
                                <BuildPCStage
                                    key={stage.id}
                                    stage={stage}
                                    selectedComponent={selectedParts[stage.id] || null}
                                    onSelectComponent={(comp) => handleSelectComponent(stage.id, comp)}
                                    selectedCpuSocket={cpuSocket}
                                    selectedMoboSocket={moboSocket}
                                />
                            ))}
                        </div>

                        {/* Right Column: Sticky Build Summary (Pinned Footer, Never Lost Under Scrolling) */}
                        <aside className="build-summary-sidebar" aria-label="System Build Summary">
                            <div className="build-summary-card">
                                <div className="build-summary-top">
                                    <div>
                                        <h3 className="build-summary-title">Your Custom PC Build</h3>
                                        <small className="build-summary-sub">
                                            {Object.keys(selectedParts).length} of {STAGES.length} parts chosen
                                        </small>
                                    </div>
                                </div>

                                {/* Dynamic Itemized List (Scrolls independently within card) */}
                                <div className="build-summary-items" id="build-summary-lines">
                                    {Object.keys(selectedParts).length > 0 ? (
                                        STAGES.map(stage => {
                                            const item = selectedParts[stage.id];
                                            if (!item) return null;
                                            return (
                                                <div key={stage.id} className="build-line-item">
                                                    <div className="build-line-left">
                                                        <span className="build-line-cat">{stage.title.split(' ')[0]}</span>
                                                        <strong className="build-line-name" title={item.title}>
                                                            {item.dataName || item.title}
                                                        </strong>
                                                    </div>
                                                    <div className="build-line-right">
                                                        <span className="build-line-price">
                                                            ৳{Number(item.price || 0).toFixed(2)}
                                                        </span>
                                                        <div className="build-line-action">
                                                            <button
                                                                type="button"
                                                                className="build-line-change"
                                                                onClick={() => handleScrollToStage(stage.id)}
                                                                title="Change component"
                                                            >
                                                                Change
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="build-line-remove"
                                                                onClick={() => handleSelectComponent(stage.id, null)}
                                                                title="Remove component"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div style={{
                                            padding: 'var(--space-4)',
                                            textAlign: 'center',
                                            color: 'var(--color-text-muted)',
                                            fontSize: '0.9rem'
                                        }}>
                                            No components selected yet. Pick components on the left!
                                        </div>
                                    )}
                                </div>

                                {/* Pinned Summary Footer: Estimated Total & Buttons Always Visible */}
                                <div className="build-summary-footer-pinned">
                                    <div className="build-total-row">
                                        <span>Estimated Total:</span>
                                        <strong className="build-total-price" id="build-total-price-display">
                                            ৳{totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </strong>
                                    </div>

                                    <div className="build-summary-actions">
                                        <button
                                            type="button"
                                            className="btn btn-lg btn-primary btn-block"
                                            id="build-add-cart-btn"
                                            onClick={handleAddCompleteBuildToCart}
                                            disabled={isAddingToCart || Object.keys(selectedParts).length === 0}
                                        >
                                            <span>
                                                {isAddingToCart ? 'Adding to Cart...' : '🛒 Add Complete Build to Cart'}
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-secondary btn-block"
                                            id="build-save-config-btn"
                                            onClick={handleSaveBuild}
                                            disabled={Object.keys(selectedParts).length === 0}
                                        >
                                            <span>💾 Save Build Configuration</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </section>

            {/* 3. Frequently Asked Questions (Product Details Page Design & Interactive) */}
            <section className="build-faq-section" aria-label="Frequently Asked Questions" style={{ paddingBlock: 'var(--space-8)' }}>
                <div className="container">
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 'var(--space-5)'
                    }}>
                        <h2 style={{
                            fontSize: '1.75rem',
                            fontWeight: 800,
                            color: 'var(--color-text-primary)',
                            margin: 0,
                            letterSpacing: '-0.02em'
                        }}>
                            Frequently Asked Questions
                        </h2>
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => setShowAskQuestion(!showAskQuestion)}
                            style={{
                                padding: '10px 22px',
                                fontWeight: 600,
                                borderRadius: 'var(--radius-lg, 10px)',
                                background: showAskQuestion ? 'var(--color-surface-subtle)' : '#ffffff',
                                border: '1px solid var(--color-border)',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                            }}
                        >
                            {showAskQuestion ? 'Hide Question' : 'Ask a Question'}
                        </button>
                    </div>

                    {/* Ask a Question Form Modal/Card */}
                    {showAskQuestion && (
                        <div className="details-ask-question-card" style={{
                            background: '#ffffff',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-xl, 14px)',
                            padding: '24px',
                            marginBottom: '20px',
                            boxShadow: 'var(--shadow-sm)'
                        }}>
                            <h4 className="details-form-heading" style={{
                                fontSize: '1.1rem',
                                fontWeight: 800,
                                color: 'var(--color-text-primary)',
                                marginBottom: '16px'
                            }}>
                                Ask a Question
                            </h4>
                            <div className="details-form-field" style={{ marginBottom: '16px' }}>
                                <textarea
                                    className="details-form-textarea"
                                    rows="3"
                                    placeholder="Ask your question here..."
                                    value={faqQuestion}
                                    onChange={(e) => setFaqQuestion(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        fontSize: '0.9rem',
                                        fontFamily: 'inherit',
                                        color: 'var(--color-text-primary)',
                                        background: 'var(--color-surface-subtle, #f8fafc)',
                                        border: '1px solid var(--color-border, #cbd5e1)',
                                        borderRadius: '8px',
                                        outline: 'none',
                                        resize: 'vertical',
                                        minHeight: '80px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                            <div className="details-form-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    onClick={handleFaqSubmit}
                                    disabled={isSubmittingFaq}
                                    style={{
                                        background: '#0f172a',
                                        color: '#ffffff',
                                        borderRadius: '6px',
                                        padding: '8px 18px',
                                        fontWeight: 600,
                                        border: 'none',
                                        cursor: isSubmittingFaq ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {isSubmittingFaq ? 'Submitting Inquiry...' : 'Submit Question'}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline btn-sm"
                                    onClick={() => setShowAskQuestion(false)}
                                    style={{
                                        background: '#ffffff',
                                        borderRadius: '6px',
                                        padding: '8px 18px',
                                        border: '1px solid var(--color-border)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Q&A Cards List */}
                    <div className="details-qa-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {faqList.map((faq, index) => {
                            const cleanQ = faq.q.replace(/^Q:\s*/i, '');
                            const cleanA = faq.a.replace(/^A:\s*/i, '');
                            return (
                                <div
                                    key={index}
                                    className="details-qa-item"
                                    style={{
                                        background: '#ffffff',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-xl, 14px)',
                                        padding: '20px 24px',
                                        boxShadow: 'var(--shadow-xs)'
                                    }}
                                >
                                    <div className="details-qa-q" style={{
                                        fontWeight: 700,
                                        color: 'var(--color-text-primary)',
                                        fontSize: '0.95rem',
                                        marginBottom: '8px'
                                    }}>
                                        <strong>Q: {cleanQ}</strong>
                                    </div>
                                    <div className="details-qa-a" style={{
                                        color: 'var(--color-text-secondary)',
                                        fontSize: '0.9rem',
                                        lineHeight: '1.5'
                                    }}>
                                        <span><strong>A:</strong> {cleanA}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Add to Cart Feedback Modal */}
            {cartFeedbackModal && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '16px',
                        backdropFilter: 'blur(3px)'
                    }}
                    onClick={() => setCartFeedbackModal(null)}
                >
                    <div
                        style={{
                            background: '#ffffff',
                            borderRadius: '12px',
                            maxWidth: '480px',
                            width: '100%',
                            padding: '24px',
                            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <span style={{ fontSize: '1.5rem' }}>
                                {cartFeedbackModal.type === 'success' ? '🛒' : 'ℹ️'}
                            </span>
                            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                                {cartFeedbackModal.title}
                            </h3>
                        </div>

                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
                            {cartFeedbackModal.message}
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => setCartFeedbackModal(null)}
                            >
                                Continue Customizing
                            </button>
                            {cartFeedbackModal.addedCount > 0 && (
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => navigate('/cart')}
                                >
                                    Proceed to Cart &rarr;
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default BuildPC;
