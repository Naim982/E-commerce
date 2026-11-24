import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './HomeAbout.css';
import { getAboutSectionData } from '../../../../api/apiManager';

const FALLBACK_BRANDS = [
    'NVIDIA',
    'AMD',
    'Intel',
    'ASUS',
    'MSI',
    'Corsair',
    'Samsung',
    'Logitech',
    'NZXT',
    'Western Digital',
    'Gigabyte',
    'Razer'
];

const FALLBACK_REVIEWS = [
    {
        id: 'rev-1',
        author: 'Alexander Chen',
        role: 'Software Architect',
        rating: '★★★★★',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        quote: 'Ordered a full package for my RTX 5080 build. Delivered in 48 hours in double-boxed anti-static packaging.'
    },
    {
        id: 'rev-2',
        author: 'Elena Rostova',
        role: 'Lead Designer',
        rating: '★★★★★',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
        quote: 'The Clarity 27" 4K Studio Display matched my print proof color profile right out of the box with zero calibration needed.'
    },
    {
        id: 'rev-3',
        author: 'Marcus Vance',
        role: 'Hardware Reviewer',
        rating: '★★★★★',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
        quote: 'The Apex Pro wireless keyboard is solid CNC aluminum with zero hollow reverberation. Fantastic daily driver.'
    },
    {
        id: 'rev-4',
        author: 'David Kim',
        role: 'System Integrator',
        rating: '★★★★★',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
        quote: 'Mounting hardware on the 360mm AIO is top notch. Temps on my 9950X dropped 9°C under full multi-threaded render load.'
    },
    {
        id: 'rev-5',
        author: 'Sarah Jenkins',
        role: '3D Environment Artist',
        rating: '★★★★★',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
        quote: 'Dual 990 PRO 4TB SSDs in RAID 0 are blazingly fast. Loading 8K nanite textures into Unreal Engine 5 is instantaneous.'
    },
    {
        id: 'rev-6',
        author: 'Liam Thorne',
        role: 'Competitive Gamer',
        rating: '★★★★★',
        avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80',
        quote: 'Optical switches with 8000Hz polling rate give instantaneous response with zero debouncing latency. Absolute endgame mouse.'
    },
    {
        id: 'rev-7',
        author: 'Priya Patel',
        role: 'AI / ML Researcher',
        rating: '★★★★★',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
        quote: 'Installed 128GB DDR5 6000MHz. Ran MemTest86 for 12 hours with zero errors. Perfect memory stability for local LLM inference.'
    },
    {
        id: 'rev-8',
        author: 'Thomas Weber',
        role: 'Custom Loop Builder',
        rating: '★★★★★',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
        quote: 'Brass compression fittings and distro-plate tolerances are immaculate. Not a single drop or leak during 24h pressure testing.'
    },
    {
        id: 'rev-9',
        author: 'Sophia Martinez',
        role: 'Video Post-Producer',
        rating: '★★★★★',
        avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=200&auto=format&fit=crop&q=80',
        quote: 'The 1000W ATX 3.1 PSU with native 12V-2x6 cable runs completely silent even during multi-hour 4K timeline rendering.'
    },
    {
        id: 'rev-10',
        author: 'James Wilson',
        role: 'DevOps Engineer',
        rating: '★★★★★',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
        quote: 'Case airflow design with high static-pressure fans keeps my 24/7 homelab server whisper-quiet under 34°C ambient.'
    },
    {
        id: 'rev-11',
        author: 'Oliver Brown',
        role: 'Audio Engineer',
        rating: '★★★★★',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
        quote: 'Zero electromagnetic interference and zero coil whine on the GPU output. Exactly what I needed for studio monitor feeds.'
    },
    {
        id: 'rev-12',
        author: 'Amina Al-Mansoor',
        role: 'Indie Game Dev',
        rating: '★★★★★',
        avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&auto=format&fit=crop&q=80',
        quote: 'Customer support verified PCIe bifurcation and cooler clearance on my motherboard before purchase. Stellar service!'
    }
];

const FALLBACK_GUARANTEES = [
    {
        id: 'guarantee-1',
        title: '100% Genuine Hardware',
        subtitle: 'Direct from NVIDIA, AMD, Intel & ASUS',
        link: '/about',
        iconType: 'shield'
    },
    {
        id: 'guarantee-2',
        title: 'Official Brand Warranty',
        subtitle: 'Full 3-10 yr warranty & 30-day returns',
        link: '/about',
        iconType: 'award'
    },
    {
        id: 'guarantee-3',
        title: 'Insured Express Shipping',
        subtitle: 'Anti-static boxes with GPS tracking',
        link: '/about',
        iconType: 'truck'
    },
    {
        id: 'guarantee-4',
        title: 'Expert Tech Support',
        subtitle: 'Live chat with certified PC technicians',
        link: '/help-support',
        iconType: 'headset'
    },
    {
        id: 'guarantee-5',
        title: 'Builder Community Trust',
        subtitle: '100% verified serials & zero grey-market',
        link: '/about',
        iconType: 'star'
    }
];

const renderGuaranteeIcon = (iconType) => {
    switch (iconType) {
        case 'shield':
            return (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11 14 15 10" />
                </svg>
            );
        case 'award':
            return (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="6" />
                    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                </svg>
            );
        case 'truck':
            return (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                    <path d="M15 18H9" />
                    <path d="M19 18h2a1 1 0 0 0 1-1v-5l-3-4h-5v10" />
                    <circle cx="7" cy="18" r="2" />
                    <circle cx="17" cy="18" r="2" />
                </svg>
            );
        case 'headset':
            return (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
            );
        case 'star':
        default:
            return (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
            );
    }
};

const HomeAbout = () => {
    const [brandCompanies, setBrandCompanies] = useState(FALLBACK_BRANDS);
    const [allReviews, setAllReviews] = useState(FALLBACK_REVIEWS);
    const [storeGuarantees, setStoreGuarantees] = useState(FALLBACK_GUARANTEES);

    const [activePage, setActivePage] = useState(0);
    const [isReviewsHovered, setIsReviewsHovered] = useState(false);

    // Fetch dynamic About data from backend siteData.json
    useEffect(() => {
        let isMounted = true;
        const fetchAboutData = async () => {
            const res = await getAboutSectionData();
            if (isMounted && res.success && res.aboutSection) {
                if (Array.isArray(res.aboutSection.brandCompanies) && res.aboutSection.brandCompanies.length > 0) {
                    setBrandCompanies(res.aboutSection.brandCompanies);
                }
                if (Array.isArray(res.aboutSection.reviews) && res.aboutSection.reviews.length > 0) {
                    setAllReviews(res.aboutSection.reviews);
                }
                if (Array.isArray(res.aboutSection.guarantees) && res.aboutSection.guarantees.length > 0) {
                    setStoreGuarantees(res.aboutSection.guarantees);
                }
            }
        };
        fetchAboutData();
        return () => {
            isMounted = false;
        };
    }, []);

    // Reviews pagination: 4 items per page
    const reviewsPerPage = 4;
    const totalPages = Math.ceil(allReviews.length / reviewsPerPage) || 1;
    const visibleReviews = allReviews.slice(activePage * reviewsPerPage, activePage * reviewsPerPage + reviewsPerPage);

    // Autoplay for reviews (cycles every 4 seconds, pauses on hover)
    useEffect(() => {
        if (isReviewsHovered || totalPages <= 1) return;

        const interval = setInterval(() => {
            setActivePage((prev) => (prev + 1) % totalPages);
        }, 4000);

        return () => clearInterval(interval);
    }, [isReviewsHovered, totalPages]);

    return (
        <section className="home-section home-about-review-section" id="about-review-section" aria-label="Companies We Sell, Customer Reviews and Store Guarantees">
            <div className="container">
                <div className="home-three-col-layout">
                    {/* Middle Column Header (Review Title with bilateral divider lines) */}
                    <div className="home-reviews-header-wrap">
                        <div className="home-about-col-header">
                            <h3 className="home-about-col-title">Customer Reviews</h3>
                        </div>
                    </div>

                    {/* Column 1: Companies We Sell (Clickable brand chips linking to /shop?brand=...) */}
                    <div className="home-brands-card">
                        <div className="home-brands-grid">
                            {brandCompanies.map((name, index) => (
                                <Link
                                    key={index}
                                    to={`/shop?brand=${encodeURIComponent(name)}`}
                                    className="home-brand-chip"
                                    title={`Explore ${name} Hardware`}
                                >
                                    {name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Column 2: Customer Reviews 2x2 Grid (Interactive, pauses on hover) */}
                    <div
                        className="home-reviews-grid-2x2"
                        onMouseEnter={() => setIsReviewsHovered(true)}
                        onMouseLeave={() => setIsReviewsHovered(false)}
                    >
                        {visibleReviews.map((review) => (
                            <div key={review.id} className="home-review-box">
                                <div className="home-review-half-avatar">
                                    <img src={review.avatar} alt={review.author} loading="lazy" />
                                </div>
                                <div className="home-review-box-content">
                                    <h4 className="home-review-author-name">{review.author}</h4>
                                    <span className="home-review-stars">{review.rating}</span>
                                    <p className="home-review-text">{review.quote}</p>
                                    <span className="home-review-role">{review.role}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Column 3: Store Guarantees (Clickable links to /about with micro-interaction) */}
                    <div className="home-services-card">
                        {storeGuarantees.map((guarantee) => (
                            <Link
                                key={guarantee.id}
                                to={guarantee.link || '/about'}
                                className="home-service-item"
                                title={`Learn more about ${guarantee.title}`}
                            >
                                <div className="home-service-icon">
                                    {renderGuaranteeIcon(guarantee.iconType)}
                                </div>
                                <div className="home-service-content">
                                    <h4 className="home-service-title">{guarantee.title}</h4>
                                    <p className="home-service-subtitle">{guarantee.subtitle}</p>
                                </div>
                                <span className="home-service-arrow" aria-hidden="true">→</span>
                            </Link>
                        ))}
                    </div>

                    {/* Column 2 Dots Navigation */}
                    <div className="home-reviews-dots-wrap">
                        <div className="home-reviews-dots" role="tablist" aria-label="Review page navigation">
                            {Array.from({ length: totalPages }).map((_, pageIndex) => (
                                <button
                                    key={pageIndex}
                                    type="button"
                                    className={`home-reviews-dot ${pageIndex === activePage ? 'active' : ''}`}
                                    onClick={() => setActivePage(pageIndex)}
                                    aria-label={`View reviews page ${pageIndex + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HomeAbout;
