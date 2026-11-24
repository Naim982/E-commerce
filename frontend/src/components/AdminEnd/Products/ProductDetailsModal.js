import React from 'react';
import Modal from '../shared/Modal';
import StatusBadge from '../shared/StatusBadge';
import { BACKEND_ROOT } from '../../../api/apiManager';

const ProductDetailsModal = ({ isOpen, onClose, product, onEdit }) => {
    if (!product) return null;

    const fixed = product.fixed || product;
    const variable = product.variable || product;
    const pricing = variable.price || product.pricing || {};
    const stock = variable.stock || product.stock || {};
    const media = fixed.media || product.media || {};
    const specs = fixed.specifications || product.specifications || {};
    const cardSpecs = specs.cardSpecs || product.cardSpecs || [];
    const reviews = variable.review || product.review || {};
    const badge = variable.badge || product.badge || {};

    const brandVal = Array.isArray(fixed.brand) ? fixed.brand.join(' • ') : (fixed.brand || 'LUMEN');
    const regularVal = pricing.regular !== undefined ? pricing.regular : (pricing.current || product.currentPrice || 0);
    const discountVal = pricing.discount || product.discount || 0;
    const currentPrice = discountVal ? (pricing.current || regularVal * (1 - discountVal / 100)) : regularVal;
    const oldPrice = pricing.old || product.oldPrice || (discountVal ? regularVal : null);
    const qty = stock.quantity !== undefined ? stock.quantity : (product.stockQuantity !== undefined ? product.stockQuantity : 0);
    const stockStatus = product.stockStatus || (qty > 5 ? 'in_stock' : (qty > 0 ? 'low_stock' : 'out_of_stock'));
    const badgeText = badge.text || product.badgeText;

    const imageUrl = media.mainImage || product.mainImage || '/images/banners/banner-1.jpg';
    const displayImg = imageUrl.startsWith('http') ? imageUrl : `${BACKEND_ROOT}${imageUrl.replace(/^\//, '')}`;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={product.name || 'Hardware Specifications'}
            size="large"
            footer={
                <>
                    <button type="button" className="admin-btn admin-btn-outline" onClick={onClose}>
                        Close
                    </button>
                    {onEdit && (
                        <button
                            type="button"
                            className="admin-btn admin-btn-primary"
                            onClick={() => {
                                onClose();
                                onEdit(product.id);
                            }}
                        >
                            Edit Product Record
                        </button>
                    )}
                </>
            }
        >
            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px', alignItems: 'start' }}>
                <div>
                    <img
                        src={displayImg}
                        alt={product.name}
                        style={{
                            width: '100%',
                            height: '240px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#f8fafc'
                        }}
                        onError={(e) => {
                            e.target.src = 'https://placehold.co/400x300?text=Hardware+Preview';
                        }}
                    />
                    <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <StatusBadge status={stockStatus} />
                        {badgeText && (
                            <span className="admin-status-badge info">{badgeText}</span>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                            {brandVal} &bull; {fixed.category}
                        </div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: '4px 0 8px' }}>
                            {fixed.name}
                        </h2>
                        <div style={{ fontSize: '0.8125rem', color: '#64748b', fontFamily: 'monospace' }}>
                            SKU / Catalog ID: {fixed.sku || fixed.id}
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                        <div>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>RETAIL PRICE</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
                                ${Number(currentPrice || 0).toFixed(2)}
                            </span>
                        </div>
                        {oldPrice && (
                            <div>
                                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>COMPARE AT</span>
                                <span style={{ fontSize: '1.1rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                                    ${Number(oldPrice).toFixed(2)}
                                </span>
                            </div>
                        )}
                        <div>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>STOCK ON HAND</span>
                            <span style={{ fontSize: '1.2rem', fontWeight: 600, color: '#334155' }}>
                                {qty} units
                            </span>
                        </div>
                    </div>

                    {cardSpecs.length > 0 && (
                        <div>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                                Technical Highlights
                            </h4>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {cardSpecs.map((spec, i) => (
                                    <span key={i} className="form-spec-chip" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
                                        {spec}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                            Customer Review Metric
                        </h4>
                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                            ⭐ <strong>{reviews.score || product.rating || 5.0}</strong> / 5.0 ({reviews.count || product.reviewCount || 0} customer reviews)
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ProductDetailsModal;
