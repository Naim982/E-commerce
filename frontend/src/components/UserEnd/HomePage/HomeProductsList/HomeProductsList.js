import React, { useEffect, useState } from 'react';
import './HomeProductsList.css';
import ProductCard from '../../ProductCard/ProductCard';
import { getHomepageProducts } from '../../../../api/apiManager';
import { Link } from 'react-router-dom';
import { generateSlug } from '../../../Common/Functions';

const HomeProductsList = () => {
    const [products, setProducts] = useState({
        group1: [],
        group2: []
    });
    const [bestSellers, setBestSellers] = useState([]);
    const [topRated, setTopRated] = useState([]);

    useEffect(() => {
        const loadHomepageProducts = async () => {
            const result = await getHomepageProducts();

            if (!result.success) {
                console.error(result.error);
                return;
            }

            setProducts(result.products);
            setBestSellers(result.bestSellers);
            setTopRated(result.topRated);
        };

        loadHomepageProducts();
    }, []);

    return (
        <section className="home-section home-top-rated-section" aria-label="Current Sales, Best Sales and Top Rated Hardware">
            <div className="container">
                <div className="home-two-col-layout">
                    <div className="home-left-col">
                        <div className="home-left-group">
                            <h3 className="home-col-title">BEST SALES</h3>
                            <div className="home-mini-list">
                                {bestSellers.map((item, index) => (
                                    <div key={item.id || index} className="home-mini-card">
                                        <Link to={`/product-details/${item.id}/${generateSlug(item.name)}`} className="home-mini-thumb">
                                            <img src={item.mainImage} alt={item.title} loading="lazy" />
                                        </Link>
                                        <div className="home-mini-info">
                                            <Link to={`/product-details/${item.id}/${generateSlug(item.name)}`} className="home-mini-title">
                                                {item.title}
                                            </Link>

                                            <div className="home-stock-bar-wrapper">
                                                <div className="home-stock-bar">
                                                    <div className="home-stock-fill" style={{ width: `${item.salesPercentage}%` }} />
                                                </div>
                                                <div className="home-stock-text">
                                                    <span>Sold: {item.salesMetrics?.unitsSoldThisMonth}</span>
                                                    <span className="home-stock-avail">Only {item.remaining} units left!</span>
                                                </div>
                                            </div>

                                            <div className="home-mini-prices">
                                                <span className="home-mini-old-price">{item.oldPrice}</span>
                                                <span className="home-mini-price">{item.currentPrice}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="home-left-group">
                            <h3 className="home-col-title">TOP RATED</h3>
                            <div className="home-mini-list">
                                {topRated.map((item, index) => (
                                    <div key={item.id || index} className="home-mini-card">
                                        <Link to={`/product-details/${item.id}/${generateSlug(item.name)}`} className="home-mini-thumb">
                                            <img src={item.mainImage} alt={item.title} loading="lazy" />
                                        </Link>
                                        <div className="home-mini-info">
                                            <Link to={`/product-details/${item.id}/${generateSlug(item.name)}`} className="home-mini-title">
                                                {item.title}
                                            </Link>

                                            <div className="product-rating">
                                                <span className="star-rating">★★★★★</span>
                                                <span className="rating-text">
                                                    {`${item.reviewScore || 0} (${item.reviewCount || 0} reviews)`}
                                                </span>
                                            </div>
                                            <div className="home-mini-prices">
                                                <span className="home-mini-old-price">{item.oldPrice}</span>
                                                <span className="home-mini-price">{item.currentPrice}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="home-right-col">
                        <div className="home-right-header">
                            <h3 className="home-right-title">CURRENT SALES</h3>
                        </div>

                        <div className="home-right-grid">
                            {products.group1.map((item, index) => (
                                <ProductCard key={index} productId={item.id} productData={item} block="home" />
                            ))}
                        </div>

                        <div className="home-inline-buildpc-card">
                            <div className="home-inline-buildpc-content">
                                <div className="home-inline-buildpc-badge">
                                    <span>🛠️</span>
                                    <span>CUSTOM RIG CONFIGURATOR</span>
                                </div>
                                <h3 className="home-inline-buildpc-title">Build Your Dream PC Component by Component</h3>
                                <p className="home-inline-buildpc-desc">
                                    Select perfectly matched components with guaranteed hardware compatibility, real-time wattage calculations &amp; physical clearance validation.
                                </p>
                                <div className="home-inline-buildpc-steps">
                                    <div className="home-inline-step active">
                                        <span className="home-inline-step-num">1</span>
                                        <span>CPU</span>
                                    </div>
                                    <span className="home-inline-step-arrow">&rarr;</span>
                                    <div className="home-inline-step">
                                        <span className="home-inline-step-num">2</span>
                                        <span>GPU</span>
                                    </div>
                                    <span className="home-inline-step-arrow">&rarr;</span>
                                    <div className="home-inline-step">
                                        <span className="home-inline-step-num">3</span>
                                        <span>Motherboard</span>
                                    </div>
                                    <span className="home-inline-step-arrow">&rarr;</span>
                                    <div className="home-inline-step">
                                        <span className="home-inline-step-num">4</span>
                                        <span>RAM &amp; SSD</span>
                                    </div>
                                    <span className="home-inline-step-arrow">&rarr;</span>
                                    <div className="home-inline-step">
                                        <span className="home-inline-step-num">5</span>
                                        <span>Case</span>
                                    </div>
                                    <span className="home-inline-step-arrow">&rarr;</span>
                                    <div className="home-inline-step">
                                        <span className="home-inline-step-num">5</span>
                                        <span>PSU</span>
                                    </div>
                                </div>
                                <div className="home-inline-buildpc-actions">
                                    <Link to="/buildpc" className="btn btn-primary home-inline-buildpc-btn">
                                        Start Custom PC Builder &rarr;
                                    </Link>
                                    {/* <span className="home-inline-buildpc-note">✓ 100% Guaranteed Compatibility &bull; 3-Year Warranty</span> */}
                                </div>
                            </div>
                            <div className="home-inline-buildpc-visual">
                                <img
                                    src="https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=700&auto=format&fit=crop&q=80"
                                    alt="Custom Liquid Cooled Gaming PC"
                                    loading="lazy"
                                />
                                <div className="home-inline-buildpc-overlay">
                                    <div className="home-inline-check">✓</div>
                                    <div>
                                        <strong style={{ fontSize: '0.8rem', display: 'block' }}>100% Compatibility Checked</strong>
                                        {/* <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Zero Bottlenecks &bull; 3-Year Warranty</span> */}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="home-right-grid">
                            {products.group2.map((item, index) => (
                                <ProductCard key={index} productId={item.id} productData={item} block="home" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HomeProductsList;
