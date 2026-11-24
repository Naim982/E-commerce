import React from 'react';
import { Link } from 'react-router-dom';
import './HomeHeroSlider.css';

const HomeHeroSlider = ({ slider }) => {
    if (!slider) return null;

    const primaryLink = slider.actions?.primary?.link || '/shop';
    const secondaryLink = slider.actions?.secondary?.link || '/shop';

    return (
        <div className="home-hero-slide" data-slide-index={slider.id}>
            <div className="home-hero-grid">
                <div className="home-hero-content">
                    <div className="home-hero-eyebrow">
                        <span
                            className="home-eyebrow-pill"
                            style={slider.eyebrow?.styles || undefined}
                        >
                            {slider.eyebrow?.pill}
                        </span>
                        <span className="home-eyebrow-sub">{slider.eyebrow?.sub}</span>
                    </div>

                    <h1 className="home-hero-title">
                        <Link to={primaryLink} className="home-hero-title-link">
                            {slider.title}
                        </Link>
                    </h1>

                    <p className="home-hero-desc">{slider.description}</p>

                    {slider.specs && slider.specs.length > 0 && (
                        <div className="home-hero-specs-strip">
                            {slider.specs.map((spec, index) => (
                                <div key={index} className="home-spec-tag">
                                    <strong>{spec.label}</strong> {spec.value}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="home-hero-pricing">
                        <div className="home-price-col">
                            <span className="home-price-label">{slider.pricing?.label}</span>
                            <span className="home-price-main">{slider.pricing?.main}</span>
                            {slider.pricing?.old && (
                                <span className="home-price-old">{slider.pricing.old}</span>
                            )}
                        </div>
                        {slider.pricing?.savings && (
                            <span
                                className="home-badge-savings"
                                style={slider.pricing.savingsStyles || undefined}
                            >
                                {slider.pricing.savings}
                            </span>
                        )}
                    </div>

                    <div className="home-hero-actions">
                        <Link to={primaryLink} className="btn btn-lg btn-primary">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="8" cy="21" r="1" />
                                <circle cx="19" cy="21" r="1" />
                                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                            </svg>
                            <span>{slider.actions?.primary?.text || 'View Product'}</span>
                        </Link>

                        {slider.actions?.secondary && (
                            <Link to={secondaryLink} className="btn btn-lg btn-outline">
                                {slider.actions.secondary.text}
                            </Link>
                        )}
                    </div>
                </div>

                <div className="home-hero-visual">
                    <Link to={primaryLink} className="home-hero-image-frame" title={slider.title}>
                        <img src={slider.image?.src} alt={slider.image?.alt || slider.title} loading="eager" />
                        {slider.floatingBadge && (
                            <div className="home-hero-floating-badge">
                                <div className="home-badge-icon">{slider.floatingBadge.icon}</div>
                                <div>
                                    <div className="home-badge-title">{slider.floatingBadge.title}</div>
                                    <div className="home-badge-sub">{slider.floatingBadge.sub}</div>
                                </div>
                            </div>
                        )}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default HomeHeroSlider;
