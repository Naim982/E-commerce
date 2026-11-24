import React from 'react';
import { Link } from 'react-router-dom';
import './HomeCategory.css';

const HomeCategory = () => {
    const hardwareCategories = [
        {
            id: 'cat-gpu',
            link: '/shop?category=PC+Components&subcategory=Graphics+Cards',
            icon: '🎮',
            name: 'Graphics Cards',
            count: 'NVIDIA & AMD GPUs'
        },
        {
            id: 'cat-cpu',
            link: '/shop?category=PC+Components&subcategory=Processors',
            icon: '⚡',
            name: 'Processors',
            count: 'Intel Core & AMD Ryzen'
        },
        {
            id: 'cat-mobo',
            link: '/shop?category=PC+Components&subcategory=Motherboards',
            icon: '🔌',
            name: 'Motherboards',
            count: 'Z890, X870 & B650'
        },
        {
            id: 'cat-ram',
            link: '/shop?category=PC+Components&subcategory=Memory',
            icon: '🧠',
            name: 'Memory (RAM)',
            count: 'DDR5 Up to 8000MT/s'
        },
        {
            id: 'cat-storage',
            link: '/shop?category=PC+Components&subcategory=Storage',
            icon: '💾',
            name: 'NVMe Storage',
            count: 'PCIe Gen5 & Gen4'
        },
        {
            id: 'cat-laptops',
            link: '/shop?category=Laptops+%26+Notebooks&subcategory=Gaming+Laptops',
            icon: '💻',
            name: 'Gaming Laptops',
            count: 'RTX 50 & 40 Series'
        },
        {
            id: 'cat-desktops',
            link: '/shop?category=Desktop+Computers&subcategory=Gaming+PCs',
            icon: '🖥️',
            name: 'Gaming Desktops',
            count: 'Custom Pre-builts'
        },
        {
            id: 'cat-monitors',
            link: '/shop?category=Monitors&subcategory=Gaming+Monitors',
            icon: '📺',
            name: 'Gaming Monitors',
            count: 'OLED 240Hz & 4K IPS'
        },
        {
            id: 'cat-keyboards',
            link: '/shop?category=Accessories&subcategory=Keyboards',
            icon: '⌨️',
            name: 'Keyboards',
            count: 'Mechanical & Rapid Trigger'
        },
        {
            id: 'cat-mice',
            link: '/shop?category=Accessories&subcategory=Mice',
            icon: '🖱️',
            name: 'Gaming Mice',
            count: 'Ultra-light & Wireless'
        },
        {
            id: 'cat-networking',
            link: '/shop?category=Networking&subcategory=Routers',
            icon: '📶',
            name: 'Networking',
            count: 'Wi-Fi 7 & 10G Switches'
        },
        {
            id: 'cat-extstorage',
            link: '/shop?category=Storage+%26+Backup&subcategory=External+SSDs',
            icon: '💽',
            name: 'External Storage',
            count: 'Portable SSDs & Hubs'
        }
    ];

    return (
        <section className="home-categories-section" aria-label="Hardware Categories">
            <div className="container">
                <div className="home-category-track">
                    {hardwareCategories.map((data) => (
                        <Link
                            to={data.link}
                            key={data.id}
                            className="home-cat-tile"
                            title={`Browse ${data.name} in Shop`}
                        >
                            <div className="home-cat-icon">{data.icon}</div>
                            <div className="home-cat-info">
                                <span className="home-cat-name">{data.name}</span>
                                <span className="home-cat-show-all">Show all &rarr;</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HomeCategory;
