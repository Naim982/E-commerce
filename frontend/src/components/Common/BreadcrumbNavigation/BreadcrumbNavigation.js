import React from 'react';
import { Link } from 'react-router-dom';

const ROUTE_MAP = {
    Home: '/',
    'Hardware Catalog': '/shop',
    Shop: '/shop',
    Products: '/shop',
    'Custom PC Builder': '/buildpc',
    'PC Builder': '/buildpc',
    'Shopping Cart': '/cart',
    Cart: '/cart',
    Wishlist: '/wishlist',
    'Product Comparison': '/compare',
    Compare: '/compare',
    'About Us': '/about',
    About: '/about'
};

const BreadcrumbNavigation = ({ path = [] }) => {
    const pathLength = path.length;

    return (
        <div className="catalog-breadcrumb-wrapper">
            <div className="container">
                <nav className="catalog-breadcrumb" aria-label="Breadcrumb">
                    <ol>
                        {path.map((page, index) => {
                            const isLast = index === pathLength - 1;
                            const targetRoute = ROUTE_MAP[page] || (index === 0 ? '/' : null);

                            return (
                                <React.Fragment key={index}>
                                    <li>
                                        {isLast ? (
                                            <span className="breadcrumb-current" aria-current="page">
                                                {page}
                                            </span>
                                        ) : targetRoute ? (
                                            <Link to={targetRoute}>{page}</Link>
                                        ) : (
                                            <Link to={`/shop?category=${encodeURIComponent(page)}`}>{page}</Link>
                                        )}
                                    </li>
                                    {!isLast && <li className="catalog-sep">/</li>}
                                </React.Fragment>
                            );
                        })}
                    </ol>
                </nav>
            </div>
        </div>
    );
};

export default BreadcrumbNavigation;
