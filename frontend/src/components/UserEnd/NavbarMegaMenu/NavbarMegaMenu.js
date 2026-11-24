import React from 'react';
import { Link } from 'react-router-dom';
import './NavbarMegaMenu.css';

const NavbarMegaMenu = () => {
    return (
        <div className="home-mega-menu" role="menu">
            <div className="home-mega-grid">
                <div className="home-mega-col">
                    <div className="home-mega-heading">PC Components</div>
                    <ul className="home-mega-list">
                        <li><Link to="/shop?category=PC+Components&subcategory=Processors">Processors (CPUs)</Link></li>
                        <li><Link to="/shop?category=PC+Components&subcategory=Graphics+Cards">Graphics Cards (GPUs)</Link></li>
                        <li><Link to="/shop?category=PC+Components&subcategory=Motherboards">Motherboards</Link></li>
                        <li><Link to="/shop?category=PC+Components&subcategory=Memory">Memory (RAM)</Link></li>
                        <li><Link to="/shop?category=PC+Components&subcategory=Storage">Internal Storage</Link></li>
                        <li><Link to="/shop?category=PC+Components" className="home-mega-view-all">All PC Components &rarr;</Link></li>
                    </ul>
                </div>

                <div className="home-mega-col">
                    <div className="home-mega-heading">Systems & Displays</div>
                    <ul className="home-mega-list">
                        <li><Link to="/shop?category=Laptops+%26+Notebooks&subcategory=Gaming+Laptops">Gaming Laptops</Link></li>
                        <li><Link to="/shop?category=Laptops+%26+Notebooks&subcategory=Business+Laptops">Business Laptops</Link></li>
                        <li><Link to="/shop?category=Desktop+Computers&subcategory=Gaming+PCs">Gaming Desktops</Link></li>
                        <li><Link to="/shop?category=Desktop+Computers&subcategory=Workstations">Workstations</Link></li>
                        <li><Link to="/shop?category=Desktop+Computers&subcategory=Mini+PCs">Mini PCs</Link></li>
                        <li><Link to="/shop?category=Monitors&subcategory=Gaming+Monitors">Gaming Monitors</Link></li>
                        <li><Link to="/shop?category=Monitors&subcategory=Professional+Monitors">Professional Displays</Link></li>
                    </ul>
                </div>

                <div className="home-mega-col">
                    <div className="home-mega-heading">Gear & Networking</div>
                    <ul className="home-mega-list">
                        <li><Link to="/shop?category=Accessories&subcategory=Keyboards">Mechanical Keyboards</Link></li>
                        <li><Link to="/shop?category=Accessories&subcategory=Mice">Gaming Mice</Link></li>
                        <li><Link to="/shop?category=Accessories&subcategory=Headsets">Gaming Headsets</Link></li>
                        <li><Link to="/shop?category=Networking&subcategory=Routers">Wi-Fi 7 Routers</Link></li>
                        <li><Link to="/shop?category=Storage+%26+Backup&subcategory=External+SSDs">External SSDs</Link></li>
                        <li><Link to="/shop?category=Printers+%26+Office">Printers & Office</Link></li>
                    </ul>
                </div>

                <div className="home-mega-promo">
                    <div className="home-mega-promo-card">
                        <span className="home-mega-promo-tag">FEATURED DROP</span>
                        <h4>GeForce RTX 5080 16GB</h4>
                        <p>Next-Gen Blackwell architecture with DLSS 4.0 in stock.</p>
                        <Link to="/shop?search=RTX+5080" className="btn btn-sm btn-primary">
                            View GPU Deals &rarr;
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NavbarMegaMenu;
