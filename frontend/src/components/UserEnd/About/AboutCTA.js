import React from 'react';
import { Link } from 'react-router-dom';

const AboutCTA = ({ data }) => {
    return (
        <section className="about-cta-section" aria-label="Get Started with LUMEN">
            <div className="container">
                <div className="about-cta-card">
                    {/* Background ambient lighting */}
                    <div className="about-cta-glow" aria-hidden="true" />

                    <div className="about-cta-grid">
                        <div className="about-cta-content">
                            <div className="about-eyebrow about-eyebrow-dark">
                                <span className="about-eyebrow-dot" />
                                <span>GET STARTED</span>
                            </div>
                            <h2 className="about-cta-title">
                                {data.headline}
                            </h2>
                            <p className="about-cta-desc">
                                {data.description}
                            </p>
                            <div className="about-cta-actions">
                                <Link to={data.primaryCTA.link} className="btn btn-lg btn-primary">
                                    <span>{data.primaryCTA.text}</span>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                        <polyline points="12 5 19 12 12 19" />
                                    </svg>
                                </Link>
                                <Link to={data.secondaryCTA.link} className="btn btn-lg btn-outline-light">
                                    <span>{data.secondaryCTA.text}</span>
                                </Link>
                            </div>
                        </div>

                        <div className="about-cta-visual">
                            <div className="about-cta-img-frame">
                                <img
                                    src={data.image}
                                    alt="LUMEN High Performance Hardware"
                                    className="about-cta-img"
                                    loading="lazy"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AboutCTA;
