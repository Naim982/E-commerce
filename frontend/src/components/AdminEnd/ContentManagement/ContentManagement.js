import React, { useState, useEffect, useCallback } from 'react';
import { getAdminSiteContent, updateAdminSiteContent } from '../../../api/apiManager';
import AdminPageHeader from '../shared/AdminPageHeader';
import Modal from '../shared/Modal';
import LoadingSpinner from '../shared/LoadingSpinner';
import { useAdminToast } from '../Layout/AdminLayout';
import {
    EditIcon,
    PlusIcon,
    CheckIcon,
    LayersIcon,
    SlidersIcon
} from '../shared/AdminIcons';

const ContentManagement = () => {
    const { addToast } = useAdminToast();
    const [activeTab, setActiveTab] = useState('hero'); // 'hero' | 'auth' | 'about'
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Site Data
    const [heroSlides, setHeroSlides] = useState([]);
    const [authBanners, setAuthBanners] = useState([]);
    const [aboutSection, setAboutSection] = useState({ brandCompanies: [], reviews: [], guarantees: [] });

    // Modals
    const [editSlideModal, setEditSlideModal] = useState(false);
    const [editingSlide, setEditingSlide] = useState(null);

    const [editBannerModal, setEditBannerModal] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);

    const [newBrandInput, setNewBrandInput] = useState('');

    // Fetch site content
    const fetchContent = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAdminSiteContent();
            if (res.success) {
                setHeroSlides(res.heroSlides || []);
                setAuthBanners(res.authBanners || []);
                setAboutSection(res.aboutSection || { brandCompanies: [], reviews: [], guarantees: [] });
            } else {
                addToast(res.error || 'Failed to load site content', 'error');
            }
        } catch (err) {
            console.error(err);
            addToast('Error loading content', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchContent();
    }, [fetchContent]);

    // Save section
    const saveSection = async (sectionKey, data) => {
        setSaving(true);
        try {
            const res = await updateAdminSiteContent(sectionKey, data);
            if (res.success) {
                addToast(`Section "${sectionKey}" saved successfully!`, 'success');
                return true;
            } else {
                addToast(res.error || 'Failed to save section', 'error');
                return false;
            }
        } catch (err) {
            console.error(err);
            addToast('Error saving changes', 'error');
            return false;
        } finally {
            setSaving(false);
        }
    };

    // Hero slide modal handlers
    const handleOpenEditSlide = (slide) => {
        setEditingSlide(JSON.parse(JSON.stringify(slide)));
        setEditSlideModal(true);
    };

    const handleSaveSlide = async (e) => {
        e.preventDefault();
        if (!editingSlide) return;
        const updated = heroSlides.map(s => s.id === editingSlide.id ? editingSlide : s);
        const ok = await saveSection('heroSlides', updated);
        if (ok) {
            setHeroSlides(updated);
            setEditSlideModal(false);
        }
    };

    // Auth banner modal handlers
    const handleOpenEditBanner = (banner) => {
        setEditingBanner(JSON.parse(JSON.stringify(banner)));
        setEditBannerModal(true);
    };

    const handleSaveBanner = async (e) => {
        e.preventDefault();
        if (!editingBanner) return;
        const updated = authBanners.map(b => b.id === editingBanner.id ? editingBanner : b);
        const ok = await saveSection('authBanners', updated);
        if (ok) {
            setAuthBanners(updated);
            setEditBannerModal(false);
        }
    };

    // Brand companies handlers
    const handleAddBrand = async (e) => {
        e.preventDefault();
        const brand = newBrandInput.trim();
        if (!brand) return;
        if (aboutSection.brandCompanies?.includes(brand)) {
            addToast('Brand is already in the list', 'warning');
            return;
        }
        const updated = {
            ...aboutSection,
            brandCompanies: [...(aboutSection.brandCompanies || []), brand]
        };
        const ok = await saveSection('aboutSection', updated);
        if (ok) {
            setAboutSection(updated);
            setNewBrandInput('');
        }
    };

    const handleRemoveBrand = async (brandToRemove) => {
        const updated = {
            ...aboutSection,
            brandCompanies: (aboutSection.brandCompanies || []).filter(b => b !== brandToRemove)
        };
        const ok = await saveSection('aboutSection', updated);
        if (ok) {
            setAboutSection(updated);
        }
    };

    return (
        <div className="admin-page">
            <AdminPageHeader
                title="Storefront Content Management"
                description="Customize homepage hero slides, authentication page visuals, and partner brand showcases without editing code."
            />

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--admin-border)', marginBottom: '24px' }}>
                <button
                    type="button"
                    onClick={() => setActiveTab('hero')}
                    style={{
                        padding: '12px 20px',
                        fontWeight: '600',
                        fontSize: '0.9375rem',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        color: activeTab === 'hero' ? 'var(--admin-primary)' : 'var(--admin-text-muted)',
                        borderBottom: activeTab === 'hero' ? '2px solid var(--admin-primary)' : '2px solid transparent',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <SlidersIcon /> Homepage Hero Slides ({heroSlides.length})
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('auth')}
                    style={{
                        padding: '12px 20px',
                        fontWeight: '600',
                        fontSize: '0.9375rem',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        color: activeTab === 'auth' ? 'var(--admin-primary)' : 'var(--admin-text-muted)',
                        borderBottom: activeTab === 'auth' ? '2px solid var(--admin-primary)' : '2px solid transparent',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <LayersIcon /> Auth Screen Banners ({authBanners.length})
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('about')}
                    style={{
                        padding: '12px 20px',
                        fontWeight: '600',
                        fontSize: '0.9375rem',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        color: activeTab === 'about' ? 'var(--admin-primary)' : 'var(--admin-text-muted)',
                        borderBottom: activeTab === 'about' ? '2px solid var(--admin-primary)' : '2px solid transparent',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <CheckIcon /> Partner Brands & Trust Badges
                </button>
            </div>

            {loading ? (
                <LoadingSpinner text="Loading site content..." />
            ) : (
                <>
                    {/* TAB 1: HERO SLIDES */}
                    {activeTab === 'hero' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {heroSlides.map((slide, index) => (
                                <div
                                    key={slide.id || index}
                                    className="admin-card"
                                    style={{ padding: '24px', display: 'grid', gridTemplateColumns: '260px 1fr auto', gap: '24px', alignItems: 'center' }}
                                >
                                    {/* Preview Thumbnail */}
                                    <div style={{
                                        width: '100%',
                                        height: '160px',
                                        borderRadius: '8px',
                                        backgroundColor: '#0f172a',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        position: 'relative',
                                        border: '1px solid var(--admin-border)'
                                    }}>
                                        {slide.image?.src ? (
                                            <img
                                                src={slide.image.src}
                                                alt={slide.image.alt || slide.title}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <span style={{ color: '#94a3b8' }}>No Image</span>
                                        )}
                                        <div style={{
                                            position: 'absolute',
                                            top: '8px',
                                            left: '8px',
                                            backgroundColor: 'rgba(0,0,0,0.7)',
                                            color: '#fff',
                                            fontSize: '0.75rem',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontWeight: '600'
                                        }}>
                                            Slide #{index + 1}
                                        </div>
                                    </div>

                                    {/* Slide Content Details */}
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            {slide.eyebrow?.pill && (
                                                <span style={{
                                                    fontSize: '0.7rem',
                                                    fontWeight: '700',
                                                    backgroundColor: 'var(--admin-primary)',
                                                    color: '#fff',
                                                    padding: '2px 8px',
                                                    borderRadius: '4px',
                                                    letterSpacing: '0.05em'
                                                }}>
                                                    {slide.eyebrow.pill}
                                                </span>
                                            )}
                                            {slide.eyebrow?.sub && (
                                                <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', fontWeight: '600' }}>
                                                    {slide.eyebrow.sub}
                                                </span>
                                            )}
                                        </div>

                                        <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--admin-text-main)', marginBottom: '8px' }}>
                                            {slide.title}
                                        </h3>

                                        <p style={{ fontSize: '0.875rem', color: 'var(--admin-text-muted)', marginBottom: '12px', lineHeight: '1.4' }}>
                                            {slide.description}
                                        </p>

                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '0.875rem' }}>
                                            <div>
                                                <span style={{ color: 'var(--admin-text-muted)' }}>Price: </span>
                                                <strong style={{ color: 'var(--admin-text-main)' }}>{slide.pricing?.main}</strong>
                                                {slide.pricing?.old && (
                                                    <span style={{ textDecoration: 'line-through', color: 'var(--admin-text-muted)', marginLeft: '6px' }}>
                                                        {slide.pricing.old}
                                                    </span>
                                                )}
                                            </div>
                                            {slide.pricing?.savings && (
                                                <span style={{ color: 'var(--admin-success)', fontWeight: '600', fontSize: '0.8125rem' }}>
                                                    {slide.pricing.savings}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div>
                                        <button
                                            type="button"
                                            className="admin-btn admin-btn-outline"
                                            onClick={() => handleOpenEditSlide(slide)}
                                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                        >
                                            <EditIcon /> Edit Slide
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* TAB 2: AUTH BANNERS */}
                    {activeTab === 'auth' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
                            {authBanners.map((banner, index) => (
                                <div key={banner.id || index} className="admin-card" style={{ overflow: 'hidden' }}>
                                    <div style={{
                                        height: '180px',
                                        backgroundColor: '#1e293b',
                                        position: 'relative',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {banner.image ? (
                                            <img
                                                src={banner.image}
                                                alt={banner.title}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        ) : null}
                                        {banner.badge && (
                                            <span style={{
                                                position: 'absolute',
                                                top: '12px',
                                                left: '12px',
                                                backgroundColor: 'rgba(0,0,0,0.75)',
                                                color: '#38bdf8',
                                                padding: '3px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.75rem',
                                                fontWeight: '700'
                                            }}>
                                                {banner.badge}
                                            </span>
                                        )}
                                    </div>

                                    <div style={{ padding: '20px' }}>
                                        <h4 style={{ fontSize: '1.0625rem', fontWeight: '700', marginBottom: '8px', color: 'var(--admin-text-main)' }}>
                                            {banner.title}
                                        </h4>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--admin-text-muted)', lineHeight: '1.4', marginBottom: '16px' }}>
                                            {banner.subtitle}
                                        </p>

                                        <button
                                            type="button"
                                            className="admin-btn admin-btn-outline admin-btn-sm"
                                            onClick={() => handleOpenEditBanner(banner)}
                                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                        >
                                            <EditIcon /> Edit Banner
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* TAB 3: ABOUT & GUARANTEES */}
                    {activeTab === 'about' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* Brand Companies */}
                            <div className="admin-card" style={{ padding: '24px' }}>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '8px', color: 'var(--admin-text-main)' }}>
                                    Partner Brands Carousel
                                </h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--admin-text-muted)', marginBottom: '16px' }}>
                                    Brands displayed on the storefront ticker and trusted partner sections.
                                </p>

                                <form onSubmit={handleAddBrand} style={{ display: 'flex', gap: '12px', marginBottom: '20px', maxWidth: '450px' }}>
                                    <input
                                        type="text"
                                        placeholder="Add brand (e.g. Corsair, EVGA, Noctua)..."
                                        value={newBrandInput}
                                        onChange={(e) => setNewBrandInput(e.target.value)}
                                        className="admin-input"
                                        style={{ flex: 1 }}
                                    />
                                    <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                                        <PlusIcon /> Add Brand
                                    </button>
                                </form>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                    {aboutSection.brandCompanies?.map((brand) => (
                                        <span
                                            key={brand}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '6px 14px',
                                                borderRadius: '20px',
                                                backgroundColor: 'var(--admin-bg-hover, #f1f5f9)',
                                                border: '1px solid var(--admin-border)',
                                                fontWeight: '600',
                                                fontSize: '0.875rem',
                                                color: 'var(--admin-text-main)'
                                            }}
                                        >
                                            {brand}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveBrand(brand)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: 'var(--admin-text-muted)',
                                                    cursor: 'pointer',
                                                    fontSize: '1rem',
                                                    lineHeight: 1,
                                                    padding: 0
                                                }}
                                                title={`Remove ${brand}`}
                                            >
                                                &times;
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Trust Guarantees */}
                            <div className="admin-card" style={{ padding: '24px' }}>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '8px', color: 'var(--admin-text-main)' }}>
                                    Storefront Trust Badges & Guarantees
                                </h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--admin-text-muted)', marginBottom: '16px' }}>
                                    Core guarantees displayed across the storefront footer and checkout reassurance banners.
                                </p>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                                    {aboutSection.guarantees?.map((g) => (
                                        <div
                                            key={g.id}
                                            style={{
                                                padding: '16px',
                                                borderRadius: '8px',
                                                border: '1px solid var(--admin-border)',
                                                backgroundColor: 'var(--admin-card-bg)'
                                            }}
                                        >
                                            <div style={{ fontWeight: '700', color: 'var(--admin-text-main)', marginBottom: '4px' }}>
                                                {g.title}
                                            </div>
                                            <div style={{ fontSize: '0.8125rem', color: 'var(--admin-text-muted)' }}>
                                                {g.subtitle}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* EDIT HERO SLIDE MODAL */}
            <Modal
                isOpen={editSlideModal}
                onClose={() => setEditSlideModal(false)}
                title="Edit Hero Carousel Slide"
                size="lg"
            >
                {editingSlide && (
                    <form onSubmit={handleSaveSlide} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="admin-form-group">
                            <label className="admin-label">Headline Title *</label>
                            <input
                                type="text"
                                value={editingSlide.title || ''}
                                onChange={(e) => setEditingSlide({ ...editingSlide, title: e.target.value })}
                                className="admin-input"
                                required
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="admin-form-group">
                                <label className="admin-label">Eyebrow Pill Badge</label>
                                <input
                                    type="text"
                                    value={editingSlide.eyebrow?.pill || ''}
                                    onChange={(e) => setEditingSlide({
                                        ...editingSlide,
                                        eyebrow: { ...(editingSlide.eyebrow || {}), pill: e.target.value }
                                    })}
                                    className="admin-input"
                                    placeholder="e.g. FLAGSHIP GPU DROP"
                                />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-label">Eyebrow Subtitle</label>
                                <input
                                    type="text"
                                    value={editingSlide.eyebrow?.sub || ''}
                                    onChange={(e) => setEditingSlide({
                                        ...editingSlide,
                                        eyebrow: { ...(editingSlide.eyebrow || {}), sub: e.target.value }
                                    })}
                                    className="admin-input"
                                    placeholder="e.g. BLACKWELL ARCHITECTURE"
                                />
                            </div>
                        </div>

                        <div className="admin-form-group">
                            <label className="admin-label">Description Copy</label>
                            <textarea
                                value={editingSlide.description || ''}
                                onChange={(e) => setEditingSlide({ ...editingSlide, description: e.target.value })}
                                className="admin-textarea"
                                rows={3}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                            <div className="admin-form-group">
                                <label className="admin-label">Main Price Display</label>
                                <input
                                    type="text"
                                    value={editingSlide.pricing?.main || ''}
                                    onChange={(e) => setEditingSlide({
                                        ...editingSlide,
                                        pricing: { ...(editingSlide.pricing || {}), main: e.target.value }
                                    })}
                                    className="admin-input"
                                    placeholder="e.g. ৳134,900.00"
                                />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-label">Original Price (Strikethrough)</label>
                                <input
                                    type="text"
                                    value={editingSlide.pricing?.old || ''}
                                    onChange={(e) => setEditingSlide({
                                        ...editingSlide,
                                        pricing: { ...(editingSlide.pricing || {}), old: e.target.value }
                                    })}
                                    className="admin-input"
                                    placeholder="e.g. ৳144,900.00"
                                />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-label">Savings Promotional Tag</label>
                                <input
                                    type="text"
                                    value={editingSlide.pricing?.savings || ''}
                                    onChange={(e) => setEditingSlide({
                                        ...editingSlide,
                                        pricing: { ...(editingSlide.pricing || {}), savings: e.target.value }
                                    })}
                                    className="admin-input"
                                    placeholder="e.g. Save ৳10,000 with Code RTX50"
                                />
                            </div>
                        </div>

                        <div className="admin-form-group">
                            <label className="admin-label">Slide Image URL</label>
                            <input
                                type="text"
                                value={editingSlide.image?.src || ''}
                                onChange={(e) => setEditingSlide({
                                    ...editingSlide,
                                    image: { ...(editingSlide.image || {}), src: e.target.value }
                                })}
                                className="admin-input"
                                placeholder="https://..."
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--admin-border)' }}>
                            <button
                                type="button"
                                className="admin-btn admin-btn-outline"
                                onClick={() => setEditSlideModal(false)}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="admin-btn admin-btn-primary"
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : 'Save Slide'}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* EDIT AUTH BANNER MODAL */}
            <Modal
                isOpen={editBannerModal}
                onClose={() => setEditBannerModal(false)}
                title="Edit Authentication Banner"
                size="md"
            >
                {editingBanner && (
                    <form onSubmit={handleSaveBanner} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="admin-form-group">
                            <label className="admin-label">Banner Title *</label>
                            <input
                                type="text"
                                value={editingBanner.title || ''}
                                onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                                className="admin-input"
                                required
                            />
                        </div>

                        <div className="admin-form-group">
                            <label className="admin-label">Category Badge</label>
                            <input
                                type="text"
                                value={editingBanner.badge || ''}
                                onChange={(e) => setEditingBanner({ ...editingBanner, badge: e.target.value })}
                                className="admin-input"
                                placeholder="e.g. HARDWARE HUB"
                            />
                        </div>

                        <div className="admin-form-group">
                            <label className="admin-label">Subtitle / Description</label>
                            <textarea
                                value={editingBanner.subtitle || ''}
                                onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                                className="admin-textarea"
                                rows={3}
                            />
                        </div>

                        <div className="admin-form-group">
                            <label className="admin-label">Image Path / URL</label>
                            <input
                                type="text"
                                value={editingBanner.image || ''}
                                onChange={(e) => setEditingBanner({ ...editingBanner, image: e.target.value })}
                                className="admin-input"
                                placeholder="/images/banners/banner_1.jpeg"
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--admin-border)' }}>
                            <button
                                type="button"
                                className="admin-btn admin-btn-outline"
                                onClick={() => setEditBannerModal(false)}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="admin-btn admin-btn-primary"
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : 'Save Banner'}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
};

export default ContentManagement;
