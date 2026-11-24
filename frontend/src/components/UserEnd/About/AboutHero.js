import React from 'react';
import { Link } from 'react-router-dom';

const AboutHero = ({ data }) => {
    return (
        <section className="about-hero-section" aria-label="Brand Introduction">
            <div className="container">
                <div className="about-hero-grid">
                    {/* Left Column: Text & CTAs */}
                    <div className="about-hero-content">
                        <div className="about-eyebrow">
                            <span className="about-eyebrow-dot" />
                            <span>{data.eyebrow}</span>
                        </div>
                        <h1 className="about-hero-title">
                            {data.headline}
                        </h1>
                        <p className="about-hero-desc">
                            {data.description}
                        </p>
                        <div className="about-hero-actions">
                            <Link to={data.primaryCTA.link} className="btn btn-lg btn-primary">
                                <span>{data.primaryCTA.text}</span>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 12h14" />
                                    <path d="m12 5 7 7-7 7" />
                                </svg>
                            </Link>
                            <Link to={data.secondaryCTA.link} className="btn btn-lg btn-outline">
                                <span>{data.secondaryCTA.text}</span>
                            </Link>
                        </div>
                    </div>

                    {/* Right Column: Hero Visual Frame */}
                    <div className="about-hero-visual">
                        <div className="about-hero-img-frame">
                            <img
                                src={data.image.url}
                                alt={data.image.alt}
                                className="about-hero-img"
                                loading="eager"
                            />
                            {data.image.tag && (
                                <div className="about-hero-img-badge">
                                    <span className="about-badge-indicator" />
                                    <span>{data.image.tag}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AboutHero;
