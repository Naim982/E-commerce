import React from 'react';

const AboutWhyChoose = ({ data }) => {
    return (
        <section className="about-why-section" aria-label="Why Choose LUMEN">
            <div className="container">
                <div className="about-section-header text-center">
                    <div className="about-eyebrow about-eyebrow-centered">
                        <span className="about-eyebrow-dot" />
                        <span>{data.eyebrow}</span>
                    </div>
                    <h2 className="about-section-title">
                        {data.headline}
                    </h2>
                    <p className="about-section-subtitle">
                        {data.subtitle}
                    </p>
                </div>

                <div className="about-why-grid">
                    {data.features.map((feat, idx) => (
                        <div key={idx} className="about-why-card">
                            <div className="about-why-card-top">
                                <span className="about-why-num">{feat.number}</span>
                                <div className="about-why-indicator" />
                            </div>
                            <h3 className="about-why-card-title">
                                {feat.title}
                            </h3>
                            <p className="about-why-card-desc">
                                {feat.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default AboutWhyChoose;
