import React from 'react';
import { Link } from 'react-router-dom';

const AboutWhatWeDo = ({ items }) => {
    return (
        <section className="about-wwd-section" aria-label="What We Do">
            <div className="container">
                <div className="about-section-header text-center">
                    <div className="about-eyebrow about-eyebrow-centered">
                        <span className="about-eyebrow-dot" />
                        <span>WHAT WE DO</span>
                    </div>
                    <h2 className="about-section-title">
                        A Complete Hardware Ecosystem
                    </h2>
                    <p className="about-section-subtitle">
                        From individual component discovery to full custom rig assembly and dedicated post-purchase care.
                    </p>
                </div>

                <div className="about-wwd-grid">
                    {items.map((item) => (
                        <article key={item.id} className="about-wwd-card">
                            <div className="about-wwd-image-wrap">
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className="about-wwd-image"
                                    loading="lazy"
                                />
                                <span className="about-wwd-number">{item.number}</span>
                            </div>
                            <div className="about-wwd-content">
                                <h3 className="about-wwd-title">
                                    {item.title}
                                </h3>
                                <p className="about-wwd-desc">
                                    {item.description}
                                </p>
                                <Link to={item.linkUrl} className="about-wwd-link">
                                    <span>{item.linkText}</span>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                        <polyline points="12 5 19 12 12 19" />
                                    </svg>
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default AboutWhatWeDo;
