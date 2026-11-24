import React, { useState, useEffect, useCallback } from 'react';
import './HomeHero.css';
import HomeHeroSlider from '../HomeHeroSlider/HomeHeroSlider';
import { getHeroSlides } from '../../../../api/apiManager';

// Fallback slides while data loads from siteData.json
const FALLBACK_SLIDES = [
    {
        id: 'slide-0',
        productId: 'comp-gpu-002',
        eyebrow: {
            pill: 'FLAGSHIP GPU DROP',
            sub: 'BLACKWELL ARCHITECTURE',
            styles: null
        },
        title: 'ASUS ROG Strix GeForce RTX 5080 OC 16GB GDDR7',
        description: 'Next-generation ray tracing compute, 4th Gen Tensor Cores with neural DLSS 4.0 frame reconstruction, and 1,000 GB/s ultra-high memory bandwidth.',
        specs: [
            { label: '10,752', value: 'CUDA Cores' },
            { label: '16 GB', value: 'GDDR7' },
            { label: '2.65 GHz', value: 'Boost Clock' },
            { label: 'PCIe 5.0', value: 'Interface' }
        ],
        pricing: {
            label: 'Launch Special:',
            main: '৳1,349.00',
            old: '৳1,449.00',
            savings: 'Save ৳100 with Code RTX50',
            savingsStyles: null
        },
        actions: {
            primary: {
                text: 'View Product • ৳1,349',
                link: '/product-details/comp-gpu-002/asus-rog-strix-geforce-rtx-5080-oc-edition-16gb-gddr7',
                icon: 'cart'
            },
            secondary: {
                text: 'Explore All GPUs →',
                link: '/shop?category=PC%20Components'
            }
        },
        image: {
            src: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=1000&auto=format&fit=crop&q=80',
            alt: 'ASUS ROG Strix GeForce RTX 5080 OC Graphics Card'
        },
        floatingBadge: {
            icon: '⚡',
            title: '4K 240Hz Ready',
            sub: 'Ultra Ray Tracing Enabled'
        }
    },
    {
        id: 'slide-1',
        productId: 'comp-cpu-001',
        eyebrow: {
            pill: 'ZEN 5 ARCHITECTURE',
            sub: 'SOCKET AM5 16-CORE',
            styles: { background: '#fef2f2', color: '#dc2626', borderColor: '#fecaca' }
        },
        title: 'AMD Ryzen™ 9 9950X 16-Core Flagship Processor',
        description: 'Engineered for workstation rendering and uncompromising competitive gaming. 32 threads, 80MB combined cache, and 5.7 GHz max boost clock.',
        specs: [
            { label: '16 Cores', value: '/ 32 Threads' },
            { label: '5.7 GHz', value: 'Max Boost' },
            { label: '80 MB', value: 'L3+L2 Cache' },
            { label: '170W', value: 'TDP' }
        ],
        pricing: {
            label: 'Builder Special:',
            main: '৳599.00',
            old: '৳649.00',
            savings: 'Free 1TB NVMe with Motherboard',
            savingsStyles: { background: '#ecfdf5', color: '#059669' }
        },
        actions: {
            primary: {
                text: 'Claim Processor Deal • ৳599',
                link: '/product-details/comp-cpu-001/amd-ryzen-9-9950x-16-core-32-thread-desktop-processor-zen-5-up-to-57ghz',
                icon: 'arrow-right'
            },
            secondary: {
                text: 'Compare Zen 5 CPUs →',
                link: '/shop?category=PC%20Components'
            }
        },
        image: {
            src: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=1000&auto=format&fit=crop&q=80',
            alt: 'AMD Ryzen 9 9950X 16 Core Flagship Processor'
        },
        floatingBadge: {
            icon: '🚀',
            title: '#1 Creator Benchmark',
            sub: 'Precision Boost Overdrive'
        }
    },
    {
        id: 'slide-2',
        productId: 'lap-002',
        eyebrow: {
            pill: 'CREATOR WORKSTATION',
            sub: '4K+ INFINITYEDGE DISPLAY',
            styles: { background: '#eff6ff', color: '#2563eb', borderColor: '#bfdbfe' }
        },
        title: 'Dell XPS 17 (2026) Core i9, 64GB RAM, RTX 4080',
        description: 'With an edge-to-edge 16:10 4K+ display, machined aluminum chassis, carbon fiber palm rest, and vapor chamber cooling for sustained creator performance.',
        specs: [
            { label: 'Core i9', value: '13900H' },
            { label: '64 GB', value: 'DDR5 RAM' },
            { label: '2 TB', value: 'PCIe 4.0 SSD' },
            { label: 'RTX 4080', value: '12GB VRAM' }
        ],
        pricing: {
            label: 'Creator Discount:',
            main: '৳2,899.00',
            old: '৳3,299.00',
            savings: 'Save ৳400 with Code SAVE12',
            savingsStyles: null
        },
        actions: {
            primary: {
                text: 'View Creator Laptop • ৳2,899',
                link: '/product-details/lap-002/dell-xps-17-2026-intel-core-i9-64gb-ram-2tb-ssd-rtx-4080',
                icon: 'arrow-right'
            },
            secondary: {
                text: 'Explore All Laptops →',
                link: '/shop?category=Laptops%20%26%20Notebooks'
            }
        },
        image: {
            src: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=1000&auto=format&fit=crop&q=80',
            alt: 'Dell XPS 17 Flagship Creator Laptop'
        },
        floatingBadge: {
            icon: '💎',
            title: '4K+ InfinityEdge',
            sub: '100% Adobe RGB Gamut'
        }
    },
    {
        id: 'slide-3',
        productId: 'mon-g-001',
        eyebrow: {
            pill: 'CREATOR & GAMING',
            sub: '4K QD-OLED 240HZ',
            styles: { background: '#f5f3ff', color: '#7c3aed', borderColor: '#ddd6fe' }
        },
        title: 'ASUS ROG Swift 32" 4K 240Hz QD-OLED Studio Monitor',
        description: '0.03ms GtG response time, 99% DCI-P3 color gamut, 90W USB-C single cable dock hub, and infinite contrast certified VESA DisplayHDR True Black 400.',
        specs: [
            { label: '3840 x 2160', value: '4K UHD' },
            { label: '240 Hz', value: 'QD-OLED' },
            { label: '0.03 ms', value: 'Response' },
            { label: '90W USB-C', value: 'Power Delivery' }
        ],
        pricing: {
            label: 'Promotional Drop:',
            main: '৳1,299.00',
            old: '৳1,399.00',
            savings: 'Includes 3-Year OLED Burn-In Warranty',
            savingsStyles: null
        },
        actions: {
            primary: {
                text: 'Order QD-OLED Monitor • ৳1,299',
                link: '/product-details/mon-g-001/asus-rog-swift-oled-pg32ucdm-32-4k-240hz-qd-oled-gaming-monitor',
                icon: 'arrow-right'
            },
            secondary: {
                text: 'Explore All Monitors →',
                link: '/shop?category=Monitors'
            }
        },
        image: {
            src: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=1000&auto=format&fit=crop&q=80',
            alt: 'ASUS ROG Swift 32 Inch 4K QD-OLED Monitor'
        },
        floatingBadge: {
            icon: '🎯',
            title: 'VESA True Black 400',
            sub: '0.03ms Instant GtG'
        }
    }
];

const HomeHero = () => {
    const [slides, setSlides] = useState(FALLBACK_SLIDES);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    // Touch swipe coordinates for mobile
    const [touchStartX, setTouchStartX] = useState(null);
    const [touchEndX, setTouchEndX] = useState(null);

    // Fetch live hero slides from siteData.json via API
    useEffect(() => {
        let isMounted = true;
        const fetchSlides = async () => {
            const result = await getHeroSlides();
            if (isMounted && result.success && Array.isArray(result.heroSlides) && result.heroSlides.length > 0) {
                setSlides(result.heroSlides);
            }
        };
        fetchSlides();
        return () => {
            isMounted = false;
        };
    }, []);

    const totalSlides = slides.length;

    const nextSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
    }, [totalSlides]);

    const prevSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
    }, [totalSlides]);

    const goToSlide = (index) => {
        setCurrentSlide(index);
    };

    // Autoplay: slide advances every 3s, pauses on hover
    useEffect(() => {
        if (totalSlides <= 1 || isHovered) return;

        const interval = setInterval(() => {
            nextSlide();
        }, 3000);

        return () => clearInterval(interval);
    }, [totalSlides, isHovered, nextSlide]);

    // Keyboard navigation (Left / Right arrow keys)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === 'ArrowLeft') {
                prevSlide();
            } else if (e.key === 'ArrowRight') {
                nextSlide();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [prevSlide, nextSlide]);

    // Touch gestures for mobile swipe
    const handleTouchStart = (e) => {
        setTouchEndX(null);
        setTouchStartX(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e) => {
        setTouchEndX(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStartX || !touchEndX) return;
        const distance = touchStartX - touchEndX;
        if (distance > 50) {
            nextSlide();
        } else if (distance < -50) {
            prevSlide();
        }
    };

    const sliderMove = {
        transform: `translateX(-${currentSlide * 100}%)`,
        transition: 'transform 0.65s cubic-bezier(0.22, 1, 0.36, 1)',
        display: 'flex'
    };

    return (
        <section
            className="home-hero-section"
            id="hero-slider-section"
            aria-label="Current Hardware Specials"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="container">
                <div
                    className="home-hero-viewport"
                    id="home-hero-viewport"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {totalSlides > 1 && (
                        <>
                            <button
                                className="home-hero-arrow prev"
                                onClick={prevSlide}
                                aria-label="Previous Hardware Deal"
                                title="Previous slide"
                            >
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m15 18-6-6 6-6" />
                                </svg>
                            </button>
                            <button
                                className="home-hero-arrow next"
                                onClick={nextSlide}
                                aria-label="Next Hardware Deal"
                                title="Next slide"
                            >
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m9 18 6-6-6-6" />
                                </svg>
                            </button>
                        </>
                    )}

                    <div className="home-hero-track" id="home-hero-track" style={sliderMove}>
                        {slides.map((slider) => (
                            <HomeHeroSlider key={slider.id} slider={slider} />
                        ))}
                    </div>

                    {totalSlides > 1 && (
                        <div className="home-hero-pagination" id="home-hero-dots">
                            {slides.map((_, index) => (
                                <button
                                    key={index}
                                    className={`home-hero-dot ${currentSlide === index ? 'active' : ''}`}
                                    onClick={() => goToSlide(index)}
                                    aria-label={`Go to slide ${index + 1}`}
                                    title={`Slide ${index + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default HomeHero;
