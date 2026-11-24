import React from 'react';

// Crisp SVG Icons for Core Values
const ValueIcon = ({ type }) => {
    switch (type) {
        case 'users':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            );
        case 'shield':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11 14 15 10" />
                </svg>
            );
        case 'search':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                </svg>
            );
        case 'zap':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
            );
        default:
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                </svg>
            );
    }
};

const AboutValues = ({ values }) => {
    return (
        <section className="about-values-section" aria-label="Our Core Values">
            <div className="container">
                <div className="about-section-header text-center">
                    <div className="about-eyebrow about-eyebrow-centered">
                        <span className="about-eyebrow-dot" />
                        <span>OUR CORE VALUES</span>
                    </div>
                    <h2 className="about-section-title">
                        Principles That Define the LUMEN Standard
                    </h2>
                    <p className="about-section-subtitle">
                        From component curation to interactive builder tools, these four pillars guide every interaction.
                    </p>
                </div>

                <div className="about-values-grid">
                    {values.map((val) => (
                        <div key={val.id} className="about-value-card">
                            <div className="about-value-icon-wrap">
                                <ValueIcon type={val.icon} />
                            </div>
                            <h3 className="about-value-title">
                                {val.title}
                            </h3>
                            <p className="about-value-desc">
                                {val.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default AboutValues;
