import React from 'react';
import './Home.css';

import HomeHero from './HomeHero/HomeHero';
import HomeCategory from './HomeCategory/HomeCategory';
import HomeBuildPC from './HomeBuildPC/HomeBuildPC';
import HomeAbout from './HomeAbout/HomeAbout';
import HomeProductsList from './HomeProductsList/HomeProductsList';

const Home = () => {
    return (
        <main>
            <HomeHero />
            <HomeCategory />
            <HomeProductsList />
            <HomeBuildPC />
            <HomeAbout />
        </main>
    );
};

export default Home;
