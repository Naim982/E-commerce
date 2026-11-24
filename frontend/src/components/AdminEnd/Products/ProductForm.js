import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import AdminPageHeader from '../shared/AdminPageHeader';
import LoadingSpinner from '../shared/LoadingSpinner';
import { useAdminToast } from '../Layout/AdminLayout';
import {
    getAdminProductById,
    createAdminProduct,
    updateAdminProduct,
    getAdminCategories,
    BACKEND_ROOT
} from '../../../api/apiManager';
import './Products.css';

const DEFAULT_CATEGORIES = [
    'PC Components',
    'Desktop Computers',
    'Laptops & Notebooks',
    'Monitors',
    'Storage & Backup',
    'Networking',
    'Printers & Office',
    'Accessories'
];

const ProductForm = ({ mode = 'create' }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useAdminToast();

    const [loading, setLoading] = useState(mode === 'edit');
    const [submitting, setSubmitting] = useState(false);
    const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
    const [error, setError] = useState(null);

    // Fixed Information State
    const [fixedData, setFixedData] = useState({
        id: '',
        sku: '',
        slug: '',
        name: '',
        brand: 'LUMEN',
        category: 'PC Components',
        subCategory: 'Graphics Cards',
        mainImage: '/images/banners/banner-1.jpg',
        thumbnails: ['/images/banners/banner-1.jpg'],
        cardSpecs: 'PCIe 5.0, High Bandwidth, Gaming Ready',
        quickOverview: [
            { label: 'Architecture', value: 'High Performance' },
            { label: 'Warranty', value: '3 Years Official' }
        ],
        specs: [
            {
                category: 'General Specifications',
                rows: [
                    { name: 'Model Number', value: 'LUMEN-HW-2026' },
                    { name: 'Form Factor', value: 'Standard ATX' }
                ]
            }
        ],
        descriptionHeading: '',
        paragraphs: ['Engineered for peak performance, maximum stability, and low latency.'],
        boxContents: ['Hardware Component', 'User Manual & Driver Documentation', 'Mounting Screws & Accessories'],
        assurance: [
            { type: 'warranty', time: '3 Years' },
            { type: 'guarantee', time: '14 Days' }
        ],
        variants: [
            {
                id: 'var-standard',
                label: 'Hardware Edition',
                options: [
                    { name: 'Standard Edition', isDefault: true, priceModifier: 0, stock: 25 }
                ]
            }
        ]
    });

    // Variable Information State
    const [variableData, setVariableData] = useState({
        badgeText: 'NEW',
        badgeType: 'accent',
        regularPrice: '12500',
        discount: '0',
        stockQuantity: '25',
        totalSold: '0',
        promoCode: 'LUMEN10',
        promoText: 'Save 10% on hardware components',
        faqs: [
            { q: 'Is this component compatible with standard motherboards?', a: 'Yes, it adheres strictly to industry standard specifications.' }
        ]
    });

    // Load available categories
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const res = await getAdminCategories();
                if (res.success && res.categories && res.categories.length > 0) {
                    setCategories(res.categories.map((c) => c.name));
                }
            } catch (e) {
                // Keep default categories
            }
        };
        loadCategories();
    }, []);

    // Load existing product if editing
    useEffect(() => {
        if (mode === 'edit' && id) {
            const loadProduct = async () => {
                setLoading(true);
                try {
                    const res = await getAdminProductById(id);
                    if (res.success && res.product) {
                        const p = res.product;
                        const fixed = p.fixed || p;
                        const variable = p.variable || p;
                        const pricing = variable.price || p.pricing || {};
                        const stock = variable.stock || p.stock || {};
                        const media = fixed.media || p.media || {};
                        const specifications = fixed.specifications || p.specifications || {};
                        const badge = variable.badge || p.badge || {};
                        const desc = fixed.description || p.description || {};
                        const assurance = Array.isArray(fixed.assurance) ? fixed.assurance : [];
                        const promo = variable.promo || {};

                        // Map brand
                        const brandVal = Array.isArray(fixed.brand) ? fixed.brand.join(' • ') : (fixed.brand || 'LUMEN');

                        // Map thumbnails (max 3)
                        const thumbnailsVal = Array.isArray(media.thumbnails) && media.thumbnails.length > 0
                            ? media.thumbnails.slice(0, 3)
                            : [media.mainImage || p.mainImage || '/images/banners/banner-1.jpg'];

                        // Map card specs
                        const cardSpecsVal = Array.isArray(specifications.cardSpecs)
                            ? specifications.cardSpecs.join(', ')
                            : (specifications.cardSpecs || '');

                        // Map quick overview
                        const quickOverviewVal = Array.isArray(specifications.quickOverview) && specifications.quickOverview.length > 0
                            ? specifications.quickOverview
                            : [{ label: 'Overview', value: 'High Performance' }];

                        // Map grouped specs
                        const specsVal = Array.isArray(specifications.specs) && specifications.specs.length > 0
                            ? specifications.specs
                            : [{ category: 'Specifications', rows: [{ name: 'Details', value: 'Hardware spec' }] }];

                        // Map description paragraphs
                        const paragraphsVal = Array.isArray(desc.paragraphs) && desc.paragraphs.length > 0
                            ? desc.paragraphs
                            : [desc.short || desc.overview || 'Engineered for performance.'];

                        // Map box contents
                        const boxContentsVal = Array.isArray(desc.boxContents) && desc.boxContents.length > 0
                            ? desc.boxContents
                            : [fixed.name || 'Hardware Unit'];

                        // Map variants and modifiers
                        const fixedVariants = Array.isArray(fixed.variants) ? fixed.variants : [];
                        const variableVariants = Array.isArray(variable.variants) ? variable.variants : [];

                        const mappedVariants = fixedVariants.map((fv) => {
                            const varMatch = variableVariants.find((vv) => vv.id === fv.id) || {};
                            const stockArr = varMatch.stock || [];
                            const priceModArr = varMatch.priceModifier || [];

                            const options = (fv.options || []).map((opt, idx) => ({
                                name: opt.name || `Option ${idx + 1}`,
                                isDefault: Boolean(opt.isDefault),
                                priceModifier: priceModArr[idx] !== undefined ? priceModArr[idx] : 0,
                                stock: stockArr[idx] !== undefined ? stockArr[idx] : (stock.quantity || 25)
                            }));

                            return {
                                id: fv.id || `var-${Math.random().toString(36).substring(2, 7)}`,
                                label: fv.label || 'Variant Attribute',
                                options: options.length > 0 ? options : [{ name: 'Standard', isDefault: true, priceModifier: 0, stock: 25 }]
                            };
                        });

                        const regularVal = pricing.regular !== undefined ? String(pricing.regular) : (pricing.current !== undefined ? String(pricing.current) : '0');
                        const discountVal = pricing.discount !== undefined ? String(pricing.discount) : '0';

                        setFixedData({
                            id: fixed.id || '',
                            sku: fixed.sku || fixed.id || '',
                            slug: fixed.slug || (fixed.name ? fixed.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : ''),
                            name: fixed.name || '',
                            brand: brandVal,
                            category: fixed.category || 'PC Components',
                            subCategory: fixed.subCategory || '',
                            mainImage: media.mainImage || p.mainImage || '/images/banners/banner-1.jpg',
                            thumbnails: thumbnailsVal,
                            cardSpecs: cardSpecsVal,
                            quickOverview: quickOverviewVal,
                            specs: specsVal,
                            descriptionHeading: desc.heading || fixed.name || '',
                            paragraphs: paragraphsVal,
                            boxContents: boxContentsVal,
                            assurance: assurance.length > 0 ? assurance : [{ type: 'warranty', time: '1 Year' }],
                            variants: mappedVariants.length > 0 ? mappedVariants : [
                                {
                                    id: 'var-standard',
                                    label: 'Edition',
                                    options: [{ name: 'Standard Edition', isDefault: true, priceModifier: 0, stock: parseInt(stock.quantity, 10) || 25 }]
                                }
                            ]
                        });

                        setVariableData({
                            badgeText: badge.text || '',
                            badgeType: badge.type || 'accent',
                            regularPrice: regularVal,
                            discount: discountVal,
                            stockQuantity: String(stock.quantity || '25'),
                            totalSold: String(stock.totalSold || '0'),
                            promoCode: promo.code || '',
                            promoText: promo.text || '',
                            faqs: Array.isArray(variable.faq) && variable.faq.length > 0
                                ? variable.faq
                                : [{ q: 'Product FAQ', a: 'Detailed product answer.' }]
                        });
                    } else {
                        setError('Product record could not be loaded.');
                    }
                } catch (e) {
                    setError('Connection error loading product.');
                } finally {
                    setLoading(false);
                }
            };
            loadProduct();
        }
    }, [mode, id]);

    // Input handlers
    const handleFixedChange = (e) => {
        const { name, value } = e.target;
        setFixedData((prev) => ({ ...prev, [name]: value }));
    };

    const handleVariableChange = (e) => {
        const { name, value } = e.target;
        setVariableData((prev) => ({ ...prev, [name]: value }));
    };

    // Thumbnail controls (Max 3)
    const handleAddThumbnail = () => {
        if (fixedData.thumbnails.length < 3) {
            setFixedData((prev) => ({
                ...prev,
                thumbnails: [...prev.thumbnails, '']
            }));
        }
    };

    const handleThumbnailChange = (idx, value) => {
        const updated = [...fixedData.thumbnails];
        updated[idx] = value;
        setFixedData((prev) => ({ ...prev, thumbnails: updated }));
    };

    const handleRemoveThumbnail = (idx) => {
        setFixedData((prev) => ({
            ...prev,
            thumbnails: prev.thumbnails.filter((_, i) => i !== idx)
        }));
    };

    // Quick Overview controls
    const handleAddQuickOverview = () => {
        setFixedData((prev) => ({
            ...prev,
            quickOverview: [...prev.quickOverview, { label: '', value: '' }]
        }));
    };

    const handleQuickOverviewChange = (idx, field, value) => {
        const updated = [...fixedData.quickOverview];
        updated[idx] = { ...updated[idx], [field]: value };
        setFixedData((prev) => ({ ...prev, quickOverview: updated }));
    };

    const handleRemoveQuickOverview = (idx) => {
        setFixedData((prev) => ({
            ...prev,
            quickOverview: prev.quickOverview.filter((_, i) => i !== idx)
        }));
    };

    // Grouped Specs controls
    const handleAddSpecGroup = () => {
        setFixedData((prev) => ({
            ...prev,
            specs: [
                ...prev.specs,
                { category: 'New Specification Category', rows: [{ name: '', value: '' }] }
            ]
        }));
    };

    const handleRemoveSpecGroup = (grpIdx) => {
        setFixedData((prev) => ({
            ...prev,
            specs: prev.specs.filter((_, i) => i !== grpIdx)
        }));
    };

    const handleSpecGroupCategoryChange = (grpIdx, categoryName) => {
        const updated = [...fixedData.specs];
        updated[grpIdx] = { ...updated[grpIdx], category: categoryName };
        setFixedData((prev) => ({ ...prev, specs: updated }));
    };

    const handleAddSpecRow = (grpIdx) => {
        const updated = [...fixedData.specs];
        updated[grpIdx] = {
            ...updated[grpIdx],
            rows: [...updated[grpIdx].rows, { name: '', value: '' }]
        };
        setFixedData((prev) => ({ ...prev, specs: updated }));
    };

    const handleSpecRowChange = (grpIdx, rowIdx, field, value) => {
        const updated = [...fixedData.specs];
        const rows = [...updated[grpIdx].rows];
        rows[rowIdx] = { ...rows[rowIdx], [field]: value };
        updated[grpIdx] = { ...updated[grpIdx], rows };
        setFixedData((prev) => ({ ...prev, specs: updated }));
    };

    const handleRemoveSpecRow = (grpIdx, rowIdx) => {
        const updated = [...fixedData.specs];
        updated[grpIdx] = {
            ...updated[grpIdx],
            rows: updated[grpIdx].rows.filter((_, i) => i !== rowIdx)
        };
        setFixedData((prev) => ({ ...prev, specs: updated }));
    };

    // Box Contents controls
    const handleAddBoxContent = () => {
        setFixedData((prev) => ({
            ...prev,
            boxContents: [...prev.boxContents, '']
        }));
    };

    const handleBoxContentChange = (idx, value) => {
        const updated = [...fixedData.boxContents];
        updated[idx] = value;
        setFixedData((prev) => ({ ...prev, boxContents: updated }));
    };

    const handleRemoveBoxContent = (idx) => {
        setFixedData((prev) => ({
            ...prev,
            boxContents: prev.boxContents.filter((_, i) => i !== idx)
        }));
    };

    // Assurance controls
    const handleAddAssurance = () => {
        setFixedData((prev) => ({
            ...prev,
            assurance: [...prev.assurance, { type: 'warranty', time: '1 Year' }]
        }));
    };

    const handleAssuranceChange = (idx, field, value) => {
        const updated = [...fixedData.assurance];
        updated[idx] = { ...updated[idx], [field]: value };
        setFixedData((prev) => ({ ...prev, assurance: updated }));
    };

    const handleRemoveAssurance = (idx) => {
        setFixedData((prev) => ({
            ...prev,
            assurance: prev.assurance.filter((_, i) => i !== idx)
        }));
    };

    // Variant Controls
    const handleAddVariantGroup = () => {
        const newId = `var-${Math.random().toString(36).substring(2, 7)}`;
        setFixedData((prev) => ({
            ...prev,
            variants: [
                ...prev.variants,
                {
                    id: newId,
                    label: 'New Variant Attribute',
                    options: [
                        { name: 'Option 1', isDefault: true, priceModifier: 0, stock: parseInt(variableData.stockQuantity, 10) || 25 }
                    ]
                }
            ]
        }));
    };

    const handleRemoveVariantGroup = (vIdx) => {
        setFixedData((prev) => ({
            ...prev,
            variants: prev.variants.filter((_, i) => i !== vIdx)
        }));
    };

    const handleVariantLabelChange = (vIdx, label) => {
        const updated = [...fixedData.variants];
        updated[vIdx] = { ...updated[vIdx], label };
        setFixedData((prev) => ({ ...prev, variants: updated }));
    };

    const handleAddVariantOption = (vIdx) => {
        const updated = [...fixedData.variants];
        const opts = [...updated[vIdx].options];
        opts.push({
            name: `Option ${opts.length + 1}`,
            isDefault: opts.length === 0,
            priceModifier: 0,
            stock: parseInt(variableData.stockQuantity, 10) || 25
        });
        updated[vIdx] = { ...updated[vIdx], options: opts };
        setFixedData((prev) => ({ ...prev, variants: updated }));
    };

    const handleVariantOptionChange = (vIdx, optIdx, field, value) => {
        const updated = [...fixedData.variants];
        const opts = [...updated[vIdx].options];

        if (field === 'isDefault') {
            opts.forEach((o, i) => {
                o.isDefault = i === optIdx;
            });
        } else {
            opts[optIdx] = { ...opts[optIdx], [field]: value };
        }

        updated[vIdx] = { ...updated[vIdx], options: opts };
        setFixedData((prev) => ({ ...prev, variants: updated }));
    };

    const handleRemoveVariantOption = (vIdx, optIdx) => {
        const updated = [...fixedData.variants];
        const opts = updated[vIdx].options.filter((_, i) => i !== optIdx);
        if (opts.length > 0 && !opts.some((o) => o.isDefault)) {
            opts[0].isDefault = true;
        }
        updated[vIdx] = { ...updated[vIdx], options: opts };
        setFixedData((prev) => ({ ...prev, variants: updated }));
    };

    // FAQ Controls
    const handleAddFaq = () => {
        setVariableData((prev) => ({
            ...prev,
            faqs: [...prev.faqs, { q: '', a: '' }]
        }));
    };

    const handleFaqChange = (idx, field, value) => {
        const updated = [...variableData.faqs];
        updated[idx] = { ...updated[idx], [field]: value };
        setVariableData((prev) => ({ ...prev, faqs: updated }));
    };

    const handleRemoveFaq = (idx) => {
        setVariableData((prev) => ({
            ...prev,
            faqs: prev.faqs.filter((_, i) => i !== idx)
        }));
    };

    // Form Submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!fixedData.name.trim()) {
            setError('Product Name is required.');
            return;
        }
        if (!variableData.regularPrice || isNaN(Number(variableData.regularPrice))) {
            setError('Valid retail regular price (৳) is required.');
            return;
        }
        if (!fixedData.category) {
            setError('Hardware category selection is required.');
            return;
        }

        setSubmitting(true);

        const regularPriceNum = parseFloat(variableData.regularPrice) || 0;
        const discountNum = Math.min(Math.max(parseInt(variableData.discount, 10) || 0, 0), 100);
        const stockQtyNum = parseInt(variableData.stockQuantity, 10) || 0;
        const totalSoldNum = parseInt(variableData.totalSold, 10) || 0;

        // Auto-generate ID & SKU if empty
        const cleanName = fixedData.name.trim();
        const prodId = fixedData.id.trim() || `comp-lumen-${Math.random().toString(36).substring(2, 8)}`;
        const sharedSku = fixedData.sku.trim() || `SKU-${prodId.toUpperCase()}`;
        const prodSlug = fixedData.slug.trim() || cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        // Format brand array
        const brandArray = fixedData.brand
            ? fixedData.brand.split('•').map((b) => b.trim()).filter(Boolean)
            : ['LUMEN'];

        // Format card specs array
        const cardSpecsArray = fixedData.cardSpecs
            ? fixedData.cardSpecs.split(',').map((s) => s.trim()).filter(Boolean)
            : [];

        // Build fixed.variants and variable.variants matching schema
        const fixedVariants = fixedData.variants.map((v) => ({
            id: v.id,
            label: v.label,
            options: v.options.map((opt) => ({
                name: opt.name,
                isDefault: Boolean(opt.isDefault)
            }))
        }));

        const variableVariants = fixedData.variants.map((v) => ({
            id: v.id,
            stock: v.options.map((opt) => parseInt(opt.stock, 10) || stockQtyNum),
            priceModifier: v.options.map((opt) => parseFloat(opt.priceModifier) || 0)
        }));

        // Clean paragraph lines
        const paragraphs = fixedData.paragraphs
            .map((p) => p.trim())
            .filter(Boolean);

        // Clean box contents
        const boxContents = fixedData.boxContents
            .map((b) => b.trim())
            .filter(Boolean);

        // Assemble comprehensive product payload compliant with schema and legacy endpoints
        const payload = {
            // Flat fields for backend route compatibility
            name: cleanName,
            id: prodId,
            sku: sharedSku,
            slug: prodSlug,
            brand: brandArray.join(' • '),
            category: fixedData.category,
            subCategory: fixedData.subCategory.trim(),
            currentPrice: regularPriceNum,
            regularPrice: regularPriceNum,
            discount: discountNum,
            stockQuantity: stockQtyNum,
            stockStatus: stockQtyNum > 5 ? 'in_stock' : (stockQtyNum > 0 ? 'low_stock' : 'out_of_stock'),
            mainImage: fixedData.mainImage.trim() || '/images/banners/banner-1.jpg',
            badgeText: variableData.badgeText.trim(),
            badgeType: variableData.badgeType,
            cardSpecs: cardSpecsArray,
            shortDescription: paragraphs.join('\n'),

            // Full agreed product JSON schema
            fixed: {
                id: prodId,
                sku: sharedSku,
                slug: prodSlug,
                name: cleanName,
                brand: brandArray,
                category: fixedData.category,
                subCategory: fixedData.subCategory.trim(),
                media: {
                    mainImage: fixedData.mainImage.trim() || '/images/banners/banner-1.jpg',
                    thumbnails: fixedData.thumbnails.filter(Boolean).slice(0, 3)
                },
                specifications: {
                    cardSpecs: cardSpecsArray,
                    quickOverview: fixedData.quickOverview.filter((q) => q.label && q.value),
                    specs: fixedData.specs.filter((s) => s.category && s.rows.length > 0)
                },
                description: {
                    heading: fixedData.descriptionHeading.trim() || cleanName,
                    paragraphs: paragraphs.length > 0 ? paragraphs : [cleanName],
                    boxContents: boxContents.length > 0 ? boxContents : [cleanName]
                },
                assurance: fixedData.assurance.filter((a) => a.type && a.time),
                variants: fixedVariants
            },
            variable: {
                badge: {
                    text: variableData.badgeText.trim(),
                    type: variableData.badgeType
                },
                price: {
                    regular: regularPriceNum,
                    discount: discountNum
                },
                stock: {
                    quantity: stockQtyNum,
                    totalSold: totalSoldNum
                },
                variants: variableVariants,
                promo: {
                    code: variableData.promoCode.trim(),
                    text: variableData.promoText.trim()
                },
                faq: variableData.faqs.filter((f) => f.q && f.a)
            }
        };

        try {
            let res;
            if (mode === 'edit') {
                res = await updateAdminProduct(id, payload);
            } else {
                res = await createAdminProduct(payload);
            }

            if (res.success) {
                showToast({
                    title: mode === 'edit' ? 'Product Updated' : 'Product Created',
                    message: `${payload.name} saved with complete specifications and variant matrix.`,
                    type: 'success'
                });
                navigate('/admin/products');
            } else {
                setError(res.error || 'Failed to save product record.');
            }
        } catch (err) {
            setError('Network error saving product.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <LoadingSpinner message="Retrieving hardware product specifications..." />;
    }

    const previewImg = fixedData.mainImage.startsWith('http')
        ? fixedData.mainImage
        : `${BACKEND_ROOT}${fixedData.mainImage.replace(/^\//, '')}`;

    const regularDisplay = parseFloat(variableData.regularPrice || 0);
    const discountVal = parseInt(variableData.discount, 10) || 0;
    const computedPrice = discountVal > 0 ? (regularDisplay * (1 - discountVal / 100)).toFixed(2) : regularDisplay.toFixed(2);

    return (
        <div className="admin-product-form-view">
            <AdminPageHeader
                title={mode === 'edit' ? `Edit Product: ${fixedData.name || id}` : 'Create New Catalog Product'}
                subtitle="Configure multi-attribute computer hardware, pricing, specifications, and warehouse stock."
                actions={
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Link to="/admin/products" className="admin-btn admin-btn-outline">
                            Cancel
                        </Link>
                        <button
                            type="button"
                            className="admin-btn admin-btn-primary"
                            onClick={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? 'Saving Hardware...' : mode === 'edit' ? 'Update Product' : 'Publish Product'}
                        </button>
                    </div>
                }
            />

            {error && (
                <div style={{ padding: '12px 16px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '20px', fontWeight: 600, fontSize: '0.875rem' }}>
                    ⚠ {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="product-form-grid">
                    {/* Left: Main Form Sections */}
                    <div>
                        {/* 1. Core Identification & Shared SKU */}
                        <div className="admin-card">
                            <div className="admin-card-header">
                                <h3 className="admin-card-title">1. Core Hardware Identification</h3>
                            </div>
                            <div style={{ padding: '20px' }}>
                                <div className="admin-form-group">
                                    <label className="admin-form-label" htmlFor="f-name">
                                        Product Full Name <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="f-name"
                                        name="name"
                                        className="admin-input"
                                        placeholder="e.g. AMD Ryzen 9 9950X Desktop Processor"
                                        value={fixedData.name}
                                        onChange={handleFixedChange}
                                        required
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div className="admin-form-group">
                                        <label className="admin-form-label" htmlFor="f-brand">
                                            Brand / Manufacturers (Bullet • separated)
                                        </label>
                                        <input
                                            type="text"
                                            id="f-brand"
                                            name="brand"
                                            className="admin-input"
                                            placeholder="e.g. AMD • Ryzen"
                                            value={fixedData.brand}
                                            onChange={handleFixedChange}
                                        />
                                    </div>
                                    <div className="admin-form-group">
                                        <label className="admin-form-label" htmlFor="f-category">
                                            Hardware Category <span className="required">*</span>
                                        </label>
                                        <select
                                            id="f-category"
                                            name="category"
                                            className="admin-select"
                                            style={{ width: '100%', padding: '10px 14px' }}
                                            value={fixedData.category}
                                            onChange={handleFixedChange}
                                            required
                                        >
                                            {categories.map((cat) => (
                                                <option key={cat} value={cat}>
                                                    {cat}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                                    <div className="admin-form-group">
                                        <label className="admin-form-label" htmlFor="f-subcategory">
                                            Subcategory
                                        </label>
                                        <input
                                            type="text"
                                            id="f-subcategory"
                                            name="subCategory"
                                            className="admin-input"
                                            placeholder="e.g. Processors, Gaming Laptops"
                                            value={fixedData.subCategory}
                                            onChange={handleFixedChange}
                                        />
                                    </div>

                                    <div className="admin-form-group">
                                        <label className="admin-form-label" htmlFor="f-id">
                                            Product ID
                                        </label>
                                        <input
                                            type="text"
                                            id="f-id"
                                            name="id"
                                            className="admin-input"
                                            placeholder="e.g. comp-cpu-009"
                                            value={fixedData.id}
                                            onChange={handleFixedChange}
                                            disabled={mode === 'edit'}
                                        />
                                    </div>

                                    <div className="admin-form-group">
                                        <label className="admin-form-label" htmlFor="f-sku">
                                            Shared SKU (Across Variants)
                                        </label>
                                        <input
                                            type="text"
                                            id="f-sku"
                                            name="sku"
                                            className="admin-input"
                                            placeholder="e.g. SKU-RYZEN-9950X"
                                            value={fixedData.sku}
                                            onChange={handleFixedChange}
                                            style={{ fontFamily: 'monospace' }}
                                        />
                                    </div>
                                </div>

                                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                                    <label className="admin-form-label" htmlFor="f-slug">
                                        URL Slug
                                    </label>
                                    <input
                                        type="text"
                                        id="f-slug"
                                        name="slug"
                                        className="admin-input"
                                        placeholder="amd-ryzen-9-9950x-desktop-processor"
                                        value={fixedData.slug}
                                        onChange={handleFixedChange}
                                    />
                                    <span className="admin-form-hint">
                                        Canonical browser URL segment. Will auto-generate from product name if empty.
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 2. Pricing & Warehouse Inventory */}
                        <div className="admin-card">
                            <div className="admin-card-header">
                                <h3 className="admin-card-title">2. Pricing & Warehouse Inventory</h3>
                            </div>
                            <div style={{ padding: '20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
                                    <div className="admin-form-group">
                                        <label className="admin-form-label" htmlFor="f-regular-price">
                                            Regular Price (৳ / BDT) <span className="required">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            id="f-regular-price"
                                            name="regularPrice"
                                            className="admin-input"
                                            placeholder="78500"
                                            value={variableData.regularPrice}
                                            onChange={handleVariableChange}
                                            required
                                        />
                                    </div>

                                    <div className="admin-form-group">
                                        <label className="admin-form-label" htmlFor="f-discount">
                                            Discount Percentage (%)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            id="f-discount"
                                            name="discount"
                                            className="admin-input"
                                            placeholder="10"
                                            value={variableData.discount}
                                            onChange={handleVariableChange}
                                        />
                                    </div>

                                    <div className="admin-form-group">
                                        <label className="admin-form-label" htmlFor="f-stock">
                                            Warehouse Stock Units <span className="required">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            id="f-stock"
                                            name="stockQuantity"
                                            className="admin-input"
                                            placeholder="25"
                                            value={variableData.stockQuantity}
                                            onChange={handleVariableChange}
                                            required
                                        />
                                    </div>

                                    <div className="admin-form-group">
                                        <label className="admin-form-label" htmlFor="f-sold">
                                            Total Units Sold
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            id="f-sold"
                                            name="totalSold"
                                            className="admin-input"
                                            placeholder="0"
                                            value={variableData.totalSold}
                                            onChange={handleVariableChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Media & Thumbnails */}
                        <div className="admin-card">
                            <div className="admin-card-header">
                                <h3 className="admin-card-title">3. Media Gallery (Main & Up to 3 Thumbnails)</h3>
                            </div>
                            <div style={{ padding: '20px' }}>
                                <div className="admin-form-group">
                                    <label className="admin-form-label" htmlFor="f-main-img">
                                        Main Image URL
                                    </label>
                                    <input
                                        type="text"
                                        id="f-main-img"
                                        name="mainImage"
                                        className="admin-input"
                                        placeholder="https://... or /images/..."
                                        value={fixedData.mainImage}
                                        onChange={handleFixedChange}
                                    />
                                </div>

                                <div className="admin-form-group">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <label className="admin-form-label" style={{ marginBottom: 0 }}>
                                            Gallery Thumbnails (Max 3)
                                        </label>
                                        {fixedData.thumbnails.length < 3 && (
                                            <button
                                                type="button"
                                                className="admin-add-item-btn"
                                                onClick={handleAddThumbnail}
                                            >
                                                + Add Thumbnail Slot
                                            </button>
                                        )}
                                    </div>

                                    {fixedData.thumbnails.map((thumbUrl, idx) => (
                                        <div key={idx} className="admin-thumbnail-slot">
                                            <img
                                                src={thumbUrl.startsWith('http') ? thumbUrl : `${BACKEND_ROOT}${thumbUrl.replace(/^\//, '')}`}
                                                alt={`Thumb ${idx + 1}`}
                                                className="admin-thumbnail-preview"
                                                onError={(e) => {
                                                    e.target.src = 'https://placehold.co/100x100?text=Thumb';
                                                }}
                                            />
                                            <input
                                                type="text"
                                                className="admin-input"
                                                placeholder={`Thumbnail ${idx + 1} URL`}
                                                value={thumbUrl}
                                                onChange={(e) => handleThumbnailChange(idx, e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                className="admin-remove-btn"
                                                onClick={() => handleRemoveThumbnail(idx)}
                                                title="Remove Thumbnail"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 4. Specifications & Quick Overview */}
                        <div className="admin-card">
                            <div className="admin-card-header">
                                <h3 className="admin-card-title">4. Structured Hardware Specifications</h3>
                            </div>
                            <div style={{ padding: '20px' }}>
                                <div className="admin-form-group">
                                    <label className="admin-form-label" htmlFor="f-cardspecs">
                                        Card Specification Chips (Comma-separated)
                                    </label>
                                    <input
                                        type="text"
                                        id="f-cardspecs"
                                        name="cardSpecs"
                                        className="admin-input"
                                        placeholder="16 Cores, 32 Threads, 5.7 GHz Boost, 80MB Cache"
                                        value={fixedData.cardSpecs}
                                        onChange={handleFixedChange}
                                    />
                                    <span className="admin-form-hint">
                                        Displayed as quick highlight pills on product cards in shop listings.
                                    </span>
                                </div>

                                <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '20px 0' }} />

                                <div className="admin-form-group">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <label className="admin-form-label" style={{ marginBottom: 0 }}>
                                            Quick Overview Key-Value Rows
                                        </label>
                                        <button
                                            type="button"
                                            className="admin-add-item-btn"
                                            onClick={handleAddQuickOverview}
                                        >
                                            + Add Overview Row
                                        </button>
                                    </div>

                                    {fixedData.quickOverview.map((row, idx) => (
                                        <div key={idx} className="admin-dynamic-row">
                                            <input
                                                type="text"
                                                className="admin-input"
                                                placeholder="Label (e.g. Socket)"
                                                value={row.label}
                                                onChange={(e) => handleQuickOverviewChange(idx, 'label', e.target.value)}
                                                style={{ width: '40%' }}
                                            />
                                            <input
                                                type="text"
                                                className="admin-input"
                                                placeholder="Value (e.g. AM5)"
                                                value={row.value}
                                                onChange={(e) => handleQuickOverviewChange(idx, 'value', e.target.value)}
                                                style={{ width: '55%' }}
                                            />
                                            <button
                                                type="button"
                                                className="admin-remove-btn"
                                                onClick={() => handleRemoveQuickOverview(idx)}
                                                title="Remove row"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '20px 0' }} />

                                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <label className="admin-form-label" style={{ marginBottom: 0 }}>
                                            Detailed Specification Categories & Tables
                                        </label>
                                        <button
                                            type="button"
                                            className="admin-add-item-btn"
                                            onClick={handleAddSpecGroup}
                                        >
                                            + Add Spec Category
                                        </button>
                                    </div>

                                    {fixedData.specs.map((group, grpIdx) => (
                                        <div key={grpIdx} className="admin-dynamic-group">
                                            <div className="admin-dynamic-header">
                                                <input
                                                    type="text"
                                                    className="admin-input"
                                                    style={{ fontWeight: 600, width: '70%' }}
                                                    placeholder="Category Name (e.g. Thermal & Power)"
                                                    value={group.category}
                                                    onChange={(e) => handleSpecGroupCategoryChange(grpIdx, e.target.value)}
                                                />
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        type="button"
                                                        className="admin-add-item-btn"
                                                        onClick={() => handleAddSpecRow(grpIdx)}
                                                    >
                                                        + Add Row
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="admin-remove-btn"
                                                        onClick={() => handleRemoveSpecGroup(grpIdx)}
                                                        title="Delete category"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>

                                            {group.rows.map((row, rowIdx) => (
                                                <div key={rowIdx} className="admin-dynamic-row">
                                                    <input
                                                        type="text"
                                                        className="admin-input"
                                                        placeholder="Spec Name (e.g. Base Clock)"
                                                        value={row.name}
                                                        onChange={(e) => handleSpecRowChange(grpIdx, rowIdx, 'name', e.target.value)}
                                                        style={{ width: '45%' }}
                                                    />
                                                    <input
                                                        type="text"
                                                        className="admin-input"
                                                        placeholder="Spec Value (e.g. 4.3 GHz)"
                                                        value={row.value}
                                                        onChange={(e) => handleSpecRowChange(grpIdx, rowIdx, 'value', e.target.value)}
                                                        style={{ width: '50%' }}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="admin-remove-btn"
                                                        onClick={() => handleRemoveSpecRow(grpIdx, rowIdx)}
                                                        title="Remove row"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 5. Description & In-The-Box */}
                        <div className="admin-card">
                            <div className="admin-card-header">
                                <h3 className="admin-card-title">5. Description & In-The-Box Contents</h3>
                            </div>
                            <div style={{ padding: '20px' }}>
                                <div className="admin-form-group">
                                    <label className="admin-form-label" htmlFor="f-desc-heading">
                                        Description Heading
                                    </label>
                                    <input
                                        type="text"
                                        id="f-desc-heading"
                                        name="descriptionHeading"
                                        className="admin-input"
                                        placeholder="e.g. Dominance in Gaming and Content Creation"
                                        value={fixedData.descriptionHeading}
                                        onChange={handleFixedChange}
                                    />
                                </div>

                                <div className="admin-form-group">
                                    <label className="admin-form-label" htmlFor="f-paragraphs">
                                        Detailed Description Paragraphs (One per line)
                                    </label>
                                    <textarea
                                        id="f-paragraphs"
                                        className="admin-textarea"
                                        rows="4"
                                        value={fixedData.paragraphs.join('\n')}
                                        onChange={(e) => setFixedData((prev) => ({ ...prev, paragraphs: e.target.value.split('\n') }))}
                                        placeholder="Enter each paragraph on a new line..."
                                    />
                                </div>

                                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <label className="admin-form-label" style={{ marginBottom: 0 }}>
                                            What's In The Box (Items List)
                                        </label>
                                        <button
                                            type="button"
                                            className="admin-add-item-btn"
                                            onClick={handleAddBoxContent}
                                        >
                                            + Add Item
                                        </button>
                                    </div>

                                    {fixedData.boxContents.map((item, idx) => (
                                        <div key={idx} className="admin-dynamic-row">
                                            <input
                                                type="text"
                                                className="admin-input"
                                                placeholder={`Included Item ${idx + 1}`}
                                                value={item}
                                                onChange={(e) => handleBoxContentChange(idx, e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                className="admin-remove-btn"
                                                onClick={() => handleRemoveBoxContent(idx)}
                                                title="Remove item"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 6. Warranty & Guarantee Assurances */}
                        <div className="admin-card">
                            <div className="admin-card-header">
                                <h3 className="admin-card-title">6. Warranty & Customer Assurances</h3>
                            </div>
                            <div style={{ padding: '20px' }}>
                                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <span className="admin-form-hint">Customer warranty and return guarantees.</span>
                                        <button
                                            type="button"
                                            className="admin-add-item-btn"
                                            onClick={handleAddAssurance}
                                        >
                                            + Add Assurance
                                        </button>
                                    </div>

                                    {fixedData.assurance.map((item, idx) => (
                                        <div key={idx} className="admin-dynamic-row">
                                            <select
                                                className="admin-select"
                                                value={item.type}
                                                onChange={(e) => handleAssuranceChange(idx, 'type', e.target.value)}
                                                style={{ width: '40%' }}
                                            >
                                                <option value="warranty">Warranty</option>
                                                <option value="guarantee">Guarantee</option>
                                                <option value="service">Service</option>
                                            </select>
                                            <input
                                                type="text"
                                                className="admin-input"
                                                placeholder="Duration (e.g. 3 Years, 14 Days)"
                                                value={item.time}
                                                onChange={(e) => handleAssuranceChange(idx, 'time', e.target.value)}
                                                style={{ width: '55%' }}
                                            />
                                            <button
                                                type="button"
                                                className="admin-remove-btn"
                                                onClick={() => handleRemoveAssurance(idx)}
                                                title="Remove assurance"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 7. Product Variants & Option Price Modifiers */}
                        <div className="admin-card">
                            <div className="admin-card-header">
                                <h3 className="admin-card-title">7. Product Variants & Price Modifiers</h3>
                            </div>
                            <div style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                    <span className="admin-form-hint">
                                        Variants share the single base SKU. Configure options with relative price adjustments (+/- ৳) and dedicated warehouse stock.
                                    </span>
                                    <button
                                        type="button"
                                        className="admin-add-item-btn"
                                        onClick={handleAddVariantGroup}
                                    >
                                        + Add Variant Group
                                    </button>
                                </div>

                                {fixedData.variants.map((vGroup, vIdx) => (
                                    <div key={vGroup.id || vIdx} className="admin-dynamic-group">
                                        <div className="admin-dynamic-header">
                                            <div style={{ display: 'flex', gap: '10px', width: '75%' }}>
                                                <input
                                                    type="text"
                                                    className="admin-input"
                                                    placeholder="Attribute Label (e.g. Memory / RAM)"
                                                    value={vGroup.label}
                                                    onChange={(e) => handleVariantLabelChange(vIdx, e.target.value)}
                                                    style={{ fontWeight: 600 }}
                                                />
                                                <input
                                                    type="text"
                                                    className="admin-input"
                                                    placeholder="Group ID"
                                                    value={vGroup.id}
                                                    disabled
                                                    style={{ width: '130px', fontFamily: 'monospace', fontSize: '0.8rem' }}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    type="button"
                                                    className="admin-add-item-btn"
                                                    onClick={() => handleAddVariantOption(vIdx)}
                                                >
                                                    + Add Option
                                                </button>
                                                <button
                                                    type="button"
                                                    className="admin-remove-btn"
                                                    onClick={() => handleRemoveVariantGroup(vIdx)}
                                                    title="Remove Variant Group"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>

                                        <div style={{ padding: '4px 0 0' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 0.8fr auto', gap: '8px', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                                                <span>Option Name</span>
                                                <span>Price Modifier (৳)</span>
                                                <span>Option Stock</span>
                                                <span style={{ textAlign: 'center' }}>Default</span>
                                                <span></span>
                                            </div>

                                            {vGroup.options.map((opt, optIdx) => (
                                                <div key={optIdx} className="admin-dynamic-row" style={{ gridTemplateColumns: '2fr 1.2fr 1fr 0.8fr auto', display: 'grid' }}>
                                                    <input
                                                        type="text"
                                                        className="admin-input"
                                                        placeholder="Option Name"
                                                        value={opt.name}
                                                        onChange={(e) => handleVariantOptionChange(vIdx, optIdx, 'name', e.target.value)}
                                                    />
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        className="admin-input"
                                                        placeholder="+/- ৳"
                                                        value={opt.priceModifier}
                                                        onChange={(e) => handleVariantOptionChange(vIdx, optIdx, 'priceModifier', e.target.value)}
                                                    />
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        className="admin-input"
                                                        placeholder="Units"
                                                        value={opt.stock}
                                                        onChange={(e) => handleVariantOptionChange(vIdx, optIdx, 'stock', e.target.value)}
                                                    />
                                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                        <input
                                                            type="radio"
                                                            name={`default-opt-${vGroup.id}`}
                                                            checked={Boolean(opt.isDefault)}
                                                            onChange={() => handleVariantOptionChange(vIdx, optIdx, 'isDefault', true)}
                                                            title="Mark as default selection"
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="admin-remove-btn"
                                                        onClick={() => handleRemoveVariantOption(vIdx, optIdx)}
                                                        disabled={vGroup.options.length <= 1}
                                                        title="Delete option"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 8. Frequently Asked Questions */}
                        <div className="admin-card">
                            <div className="admin-card-header">
                                <h3 className="admin-card-title">8. Customer FAQs</h3>
                            </div>
                            <div style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <span className="admin-form-hint">Address common hardware compatibility questions.</span>
                                    <button
                                        type="button"
                                        className="admin-add-item-btn"
                                        onClick={handleAddFaq}
                                    >
                                        + Add FAQ
                                    </button>
                                </div>

                                {variableData.faqs.map((faq, idx) => (
                                    <div key={idx} className="admin-dynamic-group">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <strong style={{ fontSize: '0.85rem' }}>Question #{idx + 1}</strong>
                                            <button
                                                type="button"
                                                className="admin-remove-btn"
                                                onClick={() => handleRemoveFaq(idx)}
                                                title="Remove FAQ"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        <div style={{ marginBottom: '8px' }}>
                                            <input
                                                type="text"
                                                className="admin-input"
                                                placeholder="Customer Question (e.g. Does it support PCIe 5.0?)"
                                                value={faq.q}
                                                onChange={(e) => handleFaqChange(idx, 'q', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <textarea
                                                className="admin-textarea"
                                                rows="2"
                                                placeholder="Detailed technical answer..."
                                                value={faq.a}
                                                onChange={(e) => handleFaqChange(idx, 'a', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Badges, Promotions & Live Card Preview */}
                    <div>
                        {/* Merchandising & Badges */}
                        <div className="admin-card">
                            <div className="admin-card-header">
                                <h3 className="admin-card-title">Merchandising & Badges</h3>
                            </div>
                            <div style={{ padding: '20px' }}>
                                <div className="admin-form-group">
                                    <label className="admin-form-label" htmlFor="f-badgetext">
                                        Storefront Badge Text
                                    </label>
                                    <input
                                        type="text"
                                        id="f-badgetext"
                                        name="badgeText"
                                        className="admin-input"
                                        placeholder="e.g. HOT, NEW, SALE, -15%"
                                        value={variableData.badgeText}
                                        onChange={handleVariableChange}
                                    />
                                </div>

                                <div className="admin-form-group">
                                    <label className="admin-form-label" htmlFor="f-badgetype">
                                        Badge Visual Theme
                                    </label>
                                    <select
                                        id="f-badgetype"
                                        name="badgeType"
                                        className="admin-select"
                                        style={{ width: '100%', padding: '10px 14px' }}
                                        value={variableData.badgeType}
                                        onChange={handleVariableChange}
                                    >
                                        <option value="accent">Indigo (Accent / Best Seller)</option>
                                        <option value="hot">Red (Hot / Extreme)</option>
                                        <option value="success">Green (New / In Stock)</option>
                                        <option value="warning">Orange (Limited / Promo)</option>
                                    </select>
                                </div>

                                <div className="admin-form-group">
                                    <label className="admin-form-label" htmlFor="f-promocode">
                                        Promotion Code
                                    </label>
                                    <input
                                        type="text"
                                        id="f-promocode"
                                        name="promoCode"
                                        className="admin-input"
                                        placeholder="e.g. LUMEN10"
                                        value={variableData.promoCode}
                                        onChange={handleVariableChange}
                                    />
                                </div>

                                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                                    <label className="admin-form-label" htmlFor="f-promotext">
                                        Promotion Banner Text
                                    </label>
                                    <input
                                        type="text"
                                        id="f-promotext"
                                        name="promoText"
                                        className="admin-input"
                                        placeholder="e.g. Save 10% on hardware components"
                                        value={variableData.promoText}
                                        onChange={handleVariableChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Live Storefront Card Preview */}
                        <div className="admin-card">
                            <div className="admin-card-header">
                                <h3 className="admin-card-title">Live Storefront Card Preview</h3>
                            </div>
                            <div style={{ padding: '20px' }}>
                                <div className="form-preview-card">
                                    <div style={{ position: 'relative' }}>
                                        <img
                                            src={previewImg}
                                            alt="Preview"
                                            className="form-preview-img"
                                            onError={(e) => {
                                                e.target.src = 'https://placehold.co/400x300?text=Hardware+Preview';
                                            }}
                                        />
                                        {variableData.badgeText && (
                                            <span
                                                className={`admin-status-badge ${variableData.badgeType || 'accent'}`}
                                                style={{ position: 'absolute', top: '10px', left: '10px' }}
                                            >
                                                {variableData.badgeText}
                                            </span>
                                        )}
                                    </div>
                                    <div className="form-preview-body">
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                                            {fixedData.brand || 'LUMEN'} &bull; {fixedData.category}
                                        </div>
                                        <div className="form-preview-title">
                                            {fixedData.name || 'Hardware Component'}
                                        </div>
                                        <div className="form-preview-pricing">
                                            <span className="form-preview-current-price">
                                                ৳{computedPrice}
                                            </span>
                                            {discountVal > 0 && (
                                                <span className="form-preview-old-price">
                                                    ৳{regularDisplay.toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                        {fixedData.cardSpecs && (
                                            <div className="form-specs-chips">
                                                {fixedData.cardSpecs.split(',').slice(0, 3).map((spec, i) => (
                                                    <span key={i} className="form-spec-chip">
                                                        {spec.trim()}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <div style={{ marginTop: '12px', fontSize: '0.75rem', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                                            <span>SKU: {fixedData.sku || 'N/A'}</span> &bull; <span>Stock: {variableData.stockQuantity}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Search Engine Optimization Preview */}
                        <div className="admin-card">
                            <div className="admin-card-header">
                                <h3 className="admin-card-title">SEO Listing Preview</h3>
                            </div>
                            <div style={{ padding: '20px' }}>
                                <div style={{
                                    padding: '16px',
                                    backgroundColor: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px'
                                }}>
                                    <div style={{ color: '#1a0dab', fontSize: '1rem', fontWeight: 600, marginBottom: '3px' }}>
                                        {fixedData.name || 'Hardware Product'} — LUMEN Hardware
                                    </div>
                                    <div style={{ color: '#006621', fontSize: '0.75rem', marginBottom: '6px', fontFamily: 'monospace' }}>
                                        https://lumenhardware.com/shop/{fixedData.slug || 'product'}
                                    </div>
                                    <div style={{ color: '#4d5156', fontSize: '0.8rem', lineHeight: 1.45 }}>
                                        {fixedData.paragraphs[0] || 'Engineered for peak performance, thermal headroom, and maximum stability across intense computing workloads.'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;
