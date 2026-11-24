import React from 'react';
import { Link } from 'react-router-dom';
import './HomeBuildPC.css';

const HomeBuildPC = () => {
    return (
        <section className="home-builder-section" id="pc-builder-section" aria-label="Custom PC Builder">
            <div className="container">
                <div className="home-builder-card">
                    <div className="home-builder-grid">
                        <div className="home-builder-info">
                            <div className="home-builder-tag">
                                <span className="home-badge-icon">🛠️</span>
                                <span>CUSTOM RIG CONFIGURATOR</span>
                            </div>
                            <h2 className="home-builder-heading">Build Your Dream PC Component by Component</h2>
                            <p className="home-builder-desc">
                                Select perfectly matched components with guaranteed hardware compatibility. Real-time wattage
                                calculations, physical clearance verification, and BIOS update validation.
                            </p>

                            <div className="home-builder-steps">
                                <div className="home-step-item active">
                                    <span className="home-step-num">1</span>
                                    <span className="home-step-name">Processor</span>
                                </div>
                                <div className="home-step-arrow">&rarr;</div>
                                <div className="home-step-item">
                                    <span className="home-step-num">2</span>
                                    <span className="home-step-name">Graphics</span>
                                </div>
                                <div className="home-step-arrow">&rarr;</div>
                                <div className="home-step-item">
                                    <span className="home-step-num">3</span>
                                    <span className="home-step-name">Motherboard</span>
                                </div>
                                <div className="home-step-arrow">&rarr;</div>
                                <div className="home-step-item">
                                    <span className="home-step-num">4</span>
                                    <span className="home-step-name">RAM & SSD</span>
                                </div>
                                <div className="home-step-arrow">&rarr;</div>
                                <div className="home-step-item">
                                    <span className="home-step-num">5</span>
                                    <span className="home-step-name">Case & PSU</span>
                                </div>
                            </div>

                            <div className="home-builder-actions">
                                <Link to="/buildpc" className="btn btn-lg btn-primary">
                                    <span>Start PC Builder</span>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </Link>
                                <Link to="/buildpc" className="btn btn-lg btn-secondary">
                                    Explore Pre-Configured Rigs
                                </Link>
                            </div>
                        </div>

                        <div className="home-builder-visual">
                            <div className="home-builder-image-wrapper">
                                <img
                                    src="https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=900&auto=format&fit=crop&q=80"
                                    alt="Custom High-End Liquid Cooled Gaming PC Build"
                                />
                                <div className="home-builder-overlay-badge">
                                    <div className="home-builder-check">✓</div>
                                    <div>
                                        <strong>100% Compatibility Checked</strong>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                            Zero Bottlenecks &bull; 3-Year System Warranty
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HomeBuildPC;
