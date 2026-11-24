import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BrandLogoIcon, CartIcon, ChevronDownIcon, MobileMenuIcon, SearchIcon, UnSignedUserIcon, WishlistHeartIcon } from '../../../assets/icons/icons';
import NavbarMegaMenu from '../NavbarMegaMenu/NavbarMegaMenu';
import useAuth from '../../../authentication/useAuth';
import { useCompare } from '../../../context/CompareContext';
import { getUserData } from '../../../api/apiManager';
import './Navbar.css';

const getUserInitials = (user) => {
    const name = user?.displayName?.trim() || user?.email?.split('@')[0]?.trim() || '';
    const words = name.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
    }
    if (words.length === 1 && words[0].length > 0) {
        return words[0][0].toUpperCase();
    }
    return 'U';
};

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isAdmin, role } = useAuth();
    const { compareCount } = useCompare();

    // Badges State
    const [cartCount, setCartCount] = useState(0);
    const [wishlistCount, setWishlistCount] = useState(0);

    useEffect(() => {
        let isMounted = true;
        if (!user?.uid) {
            setCartCount(0);
            setWishlistCount(0);
            return;
        }

        const updateCounts = async () => {
            try {
                const res = await getUserData(user.uid);
                if (isMounted && res.success && res.user) {
                    setCartCount(res.user.cartList?.length || 0);
                    setWishlistCount(res.user.wishlist?.length || res.user.wishList?.length || 0);
                }
            } catch (e) {
                // Ignore background badge check errors
            }
        };

        updateCounts();
        return () => { isMounted = false; };
    }, [user, location.pathname]);

    // Global Navbar Search
    const [navSearch, setNavSearch] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchRef = useRef(null);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (navSearch.trim()) {
            navigate(`/shop?search=${encodeURIComponent(navSearch.trim())}`);
            setIsSearchOpen(false);
        }
    };

    const handleSuggestionClick = (path) => {
        navigate(path);
        setIsSearchOpen(false);
        setNavSearch('');
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setIsSearchOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="header">
            <div className="container">
                <div className="navbar">
                    <div className="navbar-brand-group">
                        {/* Mobile: Menu Toggle */}
                        <button className="icon-btn icon-btn-ghost menu-toggle" id="mobile-menu-open-btn">
                            <MobileMenuIcon />
                        </button>

                        {/* Brand Logo */}
                        <Link to="/" className="brand-logo">
                            <div className="brand-icon">
                                <BrandLogoIcon />
                            </div>
                            <div className="brand-text">
                                <span className="brand-name">LUMEN</span>
                                <span className="brand-tag">HARDWARE</span>
                            </div>
                        </Link>
                    </div>

                    <nav className="nav-links">
                        <Link to="/home" className={`nav-link ${location.pathname === '/home' || location.pathname === '/' ? 'active' : ''}`}>Home</Link>
                        <div className="nav-item-dropdown">
                            <Link to="/shop" className={`nav-link ${location.pathname.startsWith('/shop') ? 'active' : ''}`}>
                                <span>Shop</span> <ChevronDownIcon className="chevron-icon" />
                            </Link>
                            <NavbarMegaMenu />
                        </div>
                        <Link to="/compare" className={`nav-link ${location.pathname === '/compare' ? 'active' : ''}`}>
                            <span>Compare</span>
                            {compareCount > 0 && (
                                <span className="nav-badge-count">{compareCount}</span>
                            )}
                        </Link>
                        <Link to="/buildpc" className={`nav-link ${location.pathname === '/buildpc' ? 'active' : ''}`}>Build Your PC</Link>
                        <Link to="/about" className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}>About</Link>
                    </nav>

                    <div className="header-right-group">
                        <div className="header-search" ref={searchRef}>
                            <form className="search-input-group" onSubmit={handleSearchSubmit}>
                                <span className="search-icon"><SearchIcon /></span>
                                <input
                                    type="search"
                                    className="input search-input"
                                    placeholder="Search Ryzen 9, RTX 5080, NVMe..."
                                    id="global-search-input"
                                    value={navSearch}
                                    onChange={(e) => {
                                        setNavSearch(e.target.value);
                                        setIsSearchOpen(true);
                                    }}
                                    onFocus={() => setIsSearchOpen(true)}
                                    autoComplete="off"
                                />
                            </form>

                            {isSearchOpen && (
                                <div className="search-suggestions-panel active" id="search-suggestions-dropdown" role="listbox">
                                    <div className="suggestion-section-title">Popular Searches</div>
                                    <div className="suggestion-list">
                                        {['RTX 5080', 'Ryzen 9 9950X', 'Samsung 990', 'DDR5 7200', '4K OLED'].map((term) => (
                                            <button
                                                key={term}
                                                type="button"
                                                className="suggestion-item"
                                                onClick={() => handleSuggestionClick(`/shop?search=${encodeURIComponent(term)}`)}
                                                style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
                                            >
                                                <span>🔍</span>
                                                <span>{term}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="suggestion-section-title">Categories</div>
                                    <div className="suggestion-list">
                                        <button
                                            type="button"
                                            className="suggestion-item"
                                            onClick={() => handleSuggestionClick('/shop?category=PC+Components&subcategory=Graphics+Cards')}
                                            style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
                                        >
                                            <span>🎮</span>
                                            <span>Graphics Cards</span>
                                        </button>
                                        <button
                                            type="button"
                                            className="suggestion-item"
                                            onClick={() => handleSuggestionClick('/shop?category=PC+Components&subcategory=Processors')}
                                            style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
                                        >
                                            <span>⚡</span>
                                            <span>Processors</span>
                                        </button>
                                        <button
                                            type="button"
                                            className="suggestion-item"
                                            onClick={() => handleSuggestionClick('/shop?category=Laptops+%26+Notebooks&subcategory=Gaming+Laptops')}
                                            style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
                                        >
                                            <span>💻</span>
                                            <span>Gaming Laptops</span>
                                        </button>
                                    </div>
                                    {navSearch.trim() && (
                                        <button
                                            type="button"
                                            className="suggestion-item"
                                            onClick={() => handleSuggestionClick(`/shop?search=${encodeURIComponent(navSearch.trim())}`)}
                                            style={{ background: 'var(--color-surface-subtle)', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontWeight: 700, color: 'var(--color-accent)', marginTop: '4px' }}
                                        >
                                            <span>Search for "{navSearch}" &rarr;</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="header-actions">
                            <Link to="/wishlist" className="icon-btn icon-btn-ghost action-badge-wrapper" title="Saved Hardware">
                                <WishlistHeartIcon isFilled={Boolean(user)} />
                                {wishlistCount > 0 && (
                                    <span className="badge-count" data-wishlist-count>{wishlistCount}</span>
                                )}
                            </Link>

                            <Link to="/cart" className="icon-btn icon-btn-ghost action-badge-wrapper" title="Hardware Cart">
                                <CartIcon isFilled={Boolean(user)} />
                                {cartCount > 0 && (
                                    <span className="badge-count" data-cart-count>{cartCount}</span>
                                )}
                            </Link>

                            {user ? (
                                <Link to="/account" className="icon-btn icon-btn-ghost avatar-wrapper" title={user.displayName || "Account"}>
                                    {user.photoURL && user.photoURL.trim() !== '' ? (
                                        <img
                                            src={user.photoURL}
                                            alt={user.displayName || "User Profile"}
                                            referrerPolicy="no-referrer"
                                            className="avatar-img"
                                        />
                                    ) : (
                                        <div className="avatar-initials" aria-label={user.displayName || "User Profile"}>
                                            {getUserInitials(user)}
                                        </div>
                                    )}
                                </Link>
                            ) : (
                                <Link to="/authentication" state={{ from: location }} className="icon-btn icon-btn-ghost" title="Sign In">
                                    <UnSignedUserIcon />
                                </Link>
                            )}

                            {(isAdmin || role === 'admin') && (
                                <Link
                                    to="/admin"
                                    className="admin-nav-pill"
                                    title="Open LUMEN Operations Admin Panel"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        backgroundColor: '#4f46e5',
                                        color: '#ffffff',
                                        padding: '5px 12px',
                                        borderRadius: '16px',
                                        fontSize: '0.75rem',
                                        fontWeight: '700',
                                        textDecoration: 'none',
                                        letterSpacing: '0.04em',
                                        boxShadow: '0 2px 4px rgba(79, 70, 229, 0.25)',
                                        marginLeft: '4px'
                                    }}
                                >
                                    ⚡ Admin
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
