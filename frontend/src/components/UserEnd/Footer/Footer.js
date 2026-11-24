import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="site-footer home-footer" role="contentinfo">
            <div className="container">
                <div className="home-footer-top">
                    {/* Brand Summary Column */}
                    <div className="home-footer-brand-col">
                        <Link to="/" className="brand-logo home-brand-logo">
                            <div className="brand-icon home-brand-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                </svg>
                            </div>
                            <div className="home-brand-text">
                                <span className="home-brand-name">LUMEN</span>
                                <span className="home-brand-tag">HARDWARE</span>
                            </div>
                        </Link>
                        <p className="home-footer-about">
                            Authorized retailer of high-performance PC hardware, custom mechanical keyboards, high-refresh studio
                            displays, and precision desktop ergonomics.
                        </p>
                        <div className="home-footer-contact">
                            <div>📞 +880 9612-LUMEN (Mon-Fri 9AM - 9PM BST)</div>
                            <div>✉️ support@lumenhardware.com</div>
                        </div>
                    </div>

                    {/* Links Columns */}
                    <div className="home-footer-col">
                        <h4 className="home-footer-heading">PC Components</h4>
                        <ul className="home-footer-links">
                            <li><Link to="/shop?category=PC+Components&subcategory=Processors">Processors</Link></li>
                            <li><Link to="/shop?category=PC+Components&subcategory=Graphics+Cards">Graphics Cards</Link></li>
                            <li><Link to="/shop?category=PC+Components&subcategory=Motherboards">Motherboards</Link></li>
                            <li><Link to="/shop?category=PC+Components&subcategory=Memory">RAM</Link></li>
                            <li><Link to="/shop?category=PC+Components&subcategory=Storage">SSDs</Link></li>
                            <li><Link to="/shop?category=PC+Components">Power Supplies</Link></li>
                            <li><Link to="/shop?category=PC+Components">Coolers</Link></li>
                        </ul>
                    </div>

                    <div className="home-footer-col">
                        <h4 className="home-footer-heading">Peripherals & Gear</h4>
                        <ul className="home-footer-links">
                            <li><Link to="/shop?category=Accessories&subcategory=Keyboards">Keyboards</Link></li>
                            <li><Link to="/shop?category=Accessories&subcategory=Mice">Mice</Link></li>
                            <li><Link to="/shop?category=Monitors">Monitors</Link></li>
                            <li><Link to="/shop?category=Accessories&subcategory=Headsets">Headsets</Link></li>
                            <li><Link to="/shop?category=Accessories">Mats & Accessories</Link></li>
                            <li><Link to="/shop?category=Accessories">Custom Cables</Link></li>
                        </ul>
                    </div>

                    <div className="home-footer-col">
                        <h4 className="home-footer-heading">Customer Support</h4>
                        <ul className="home-footer-links">
                            <li><Link to="/account">Customer Account</Link></li>
                            <li><Link to="/account/my-orders">Track Order Status</Link></li>
                            <li><Link to="/about">Shipping & Delivery Policy</Link></li>
                            <li><Link to="/about">Warranty Registration</Link></li>
                            <li><Link to="/about">Easy 30-Day Returns</Link></li>
                            <li><Link to="/buildpc">PC Compatibility Tool & Builder</Link></li>
                        </ul>
                    </div>

                    <div className="home-footer-col">
                        <h4 className="home-footer-heading">Company & Legal</h4>
                        <ul className="home-footer-links">
                            <li><Link to="/about">About LUMEN Hardware</Link></li>
                            <li><Link to="/about">Hardware Benchmark Lab</Link></li>
                            <li><Link to="/about">Official Brand Partners</Link></li>
                            <li><Link to="/about">Privacy Policy</Link></li>
                            <li><Link to="/about">Terms of Service</Link></li>
                            <li><Link to="/about">Cookie Preferences</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Footer Bottom Bar */}
                <div className="home-footer-bottom">
                    <div className="home-footer-copy">
                        &copy; 2026 LUMEN Hardware Technologies Inc. All rights reserved. Registered trademark.
                    </div>
                    <div className="home-footer-payments">
                        <span className="home-payment-badge">bKash</span>
                        <span className="home-payment-badge">Nagad</span>
                        <span className="home-payment-badge">Rocket</span>
                        <span className="home-payment-badge">VISA</span>
                        <span className="home-payment-badge">Mastercard</span>
                        <span className="home-payment-badge">Cash on Delivery</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
