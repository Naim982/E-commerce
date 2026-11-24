import React from 'react';

const AboutStory = ({ data }) => {
    return (
        <section className="about-story-section" aria-label="Our Story">
            <div className="container">
                <div className="about-story-grid">
                    {/* Visual Column */}
                    <div className="about-story-visual-col">
                        <div className="about-story-img-frame">
                            <img
                                src={data.image.url}
                                alt={data.image.alt}
                                className="about-story-img"
                                loading="lazy"
                            />
                            <div className="about-story-overlay-caption">
                                <strong>Engineering First</strong>
                                <span>Curated for Enthusiasts & Creators</span>
                            </div>
                        </div>
                    </div>

                    {/* Editorial Content Column */}
                    <div className="about-story-content-col">
                        <div className="about-eyebrow">
                            <span className="about-eyebrow-dot" />
                            <span>{data.eyebrow}</span>
                        </div>
                        <h2 className="about-section-title">
                            {data.heading}
                        </h2>
                        {data.lead && (
                            <p className="about-story-lead">
                                {data.lead}
                            </p>
                        )}
                        <div className="about-story-paragraphs">
                            {data.paragraphs.map((p, idx) => (
                                <p key={idx} className="about-story-p">
                                    {p}
                                </p>
                            ))}
                        </div>

                        {/* Story Highlights */}
                        <div className="about-story-highlights">
                            {data.highlights.map((item, idx) => (
                                <div key={idx} className="about-story-highlight-item">
                                    <div className="about-highlight-bullet">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="about-highlight-title">{item.title}</h3>
                                        <p className="about-highlight-desc">{item.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AboutStory;
