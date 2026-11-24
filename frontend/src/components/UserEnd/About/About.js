import React, { useEffect } from 'react';
import BreadcrumbNavigation from '../../Common/BreadcrumbNavigation/BreadcrumbNavigation';
import { ABOUT_CONTENT } from './aboutContent';
import AboutHero from './AboutHero';
import AboutStory from './AboutStory';
import AboutMission from './AboutMission';
import AboutValues from './AboutValues';
import AboutWhatWeDo from './AboutWhatWeDo';
import AboutWhyChoose from './AboutWhyChoose';
import AboutCTA from './AboutCTA';
import './About.css';

const About = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
        document.title = 'About Us | LUMEN Hardware';
    }, []);

    return (
        <main className="about-page-main">
            {/* Standard Breadcrumb Navigation */}
            <BreadcrumbNavigation path={['Home', 'About Us']} />

            {/* A. Hero: Brand Introduction */}
            <AboutHero data={ABOUT_CONTENT.hero} />

            {/* B. Our Story: Purpose & Origins */}
            <AboutStory data={ABOUT_CONTENT.story} />

            {/* C. Mission & Vision: Dark Navy Accent Section */}
            <AboutMission data={ABOUT_CONTENT.missionVision} />

            {/* D. Our Core Values: 4 Distinctive Cards */}
            <AboutValues values={ABOUT_CONTENT.coreValues} />

            {/* E. What We Do: The 4 Aspects of LUMEN */}
            <AboutWhatWeDo items={ABOUT_CONTENT.whatWeDo} />

            {/* F. Why Choose LUMEN: The Intended Experience */}
            <AboutWhyChoose data={ABOUT_CONTENT.whyChoose} />

            {/* G. Our Team: Deliberately omitted per guidelines as no genuine team photos exist */}

            {/* H. Closing CTA: Final Dark Navy Conversion Banner */}
            <AboutCTA data={ABOUT_CONTENT.closingCTA} />
        </main>
    );
};

export default About;
