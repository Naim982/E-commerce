import React, { useState, useEffect } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import './AuthLayout.css';

import { BrandLogoIcon } from '../assets/icons/icons';
import SignIn from './SignIn';
import SignUp from './SignUp';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import VerifyEmail from './VerifyEmail';
import { BACKEND_ROOT, getAuthBanners } from '../api/apiManager';

const AuthLayout = () => {
    const [banners, setBanners] = useState([]);
    const [activeBanner, setActiveBanner] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadBanners = async () => {
            const result = await getAuthBanners();
            if (result.success) {
                setBanners(result.authBanners);
            }
            setLoading(false);
        };

        loadBanners();
    }, []);

    useEffect(() => {
        if (loading || isPaused || banners.length <= 1) {
            return;
        }

        const timer = setInterval(() => {
            setActiveBanner((prev) => (prev + 1) % banners.length);
        }, 2000);

        return () => clearInterval(timer);
    }, [loading, isPaused, banners]);

    return (
        <div className="auth-layout-page-root">
            <div className="auth-layout-split-container">
                <div
                    className="auth-layout-banner-column"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    <div className="auth-layout-brand-corner">
                        <Link to="/" className="auth-layout-brand-link">
                            <div className="brand-icon"><BrandLogoIcon /></div>
                            <div className="brand-text">
                                <span className="brand-name">LUMEN</span>
                                <span className="brand-tag">HARDWARE</span>
                            </div>
                        </Link>
                    </div>

                    <div className="auth-layout-banner-viewport">
                        {banners.map((slide, index) => (
                            <div
                                key={slide.id}
                                className={`auth-layout-banner-slide ${activeBanner === index ? 'active' : ''}`}
                                aria-hidden={activeBanner !== index}
                            >
                                <img
                                    src={`${BACKEND_ROOT}${slide.image}`}
                                    alt={slide.title}
                                    className="auth-layout-banner-img"
                                    loading={index === 0 ? 'eager' : 'lazy'}
                                />
                                <div className="auth-layout-banner-gradient-top" />
                                <div className="auth-layout-banner-gradient-bottom" />
                            </div>
                        ))}
                    </div>

                    <div className="auth-layout-banner-footer">
                        <div className="auth-layout-banner-caption">
                            <span className="auth-layout-banner-badge">{banners[activeBanner]?.badge}</span>
                            <h2 className="auth-layout-banner-title">{banners[activeBanner]?.title}</h2>
                            <p className="auth-layout-banner-desc">{banners[activeBanner]?.subtitle}</p>
                        </div>

                        <div className="auth-layout-banner-dots" role="tablist" aria-label="Banner slides">
                            {banners.map((slide, index) => (
                                <button
                                    key={slide.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={activeBanner === index}
                                    aria-label={`Switch to slide ${index + 1}: ${slide.title}`}
                                    className={`auth-layout-banner-dot ${activeBanner === index ? 'active' : ''}`}
                                    onClick={() => setActiveBanner(index)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="auth-form-column">
                    <Routes>
                        <Route index element={<Navigate to="signin" replace />} />
                        <Route path="signin" element={<SignIn />} />
                        <Route path="create-new-account" element={<SignUp />} />
                        <Route path="forgot-password" element={<ForgotPassword />} />
                        <Route path="forget-password" element={<ForgotPassword />} />
                        <Route path="reset-password" element={<ResetPassword />} />
                        <Route path="verify-email" element={<VerifyEmail />} />
                    </Routes>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
