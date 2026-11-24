import React from 'react';

const AboutMission = ({ data }) => {
    const { mission, vision } = data;

    return (
        <section className="about-mission-section" aria-label="Mission and Vision">
            <div className="container">
                <div className="about-mission-card">
                    {/* Background Ambient Glow */}
                    <div className="about-mission-glow" aria-hidden="true" />

                    <div className="about-mission-grid">
                        {/* Mission Column */}
                        <div className="about-mission-item">
                            <div className="about-eyebrow about-eyebrow-dark">
                                <span className="about-eyebrow-dot" />
                                <span>{mission.eyebrow}</span>
                            </div>
                            <h2 className="about-statement-title">
                                {mission.title}
                            </h2>
                            <p className="about-statement-desc">
                                {mission.description}
                            </p>
                        </div>

                        {/* Divider */}
                        <div className="about-mission-divider" aria-hidden="true" />

                        {/* Vision Column */}
                        <div className="about-mission-item">
                            <div className="about-eyebrow about-eyebrow-dark">
                                <span className="about-eyebrow-dot" />
                                <span>{vision.eyebrow}</span>
                            </div>
                            <h2 className="about-statement-title">
                                {vision.title}
                            </h2>
                            <p className="about-statement-desc">
                                {vision.description}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AboutMission;
