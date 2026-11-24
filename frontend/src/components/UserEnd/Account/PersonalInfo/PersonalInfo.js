import React, { useState, useEffect, useRef } from 'react';
import './PersonalInfo.css';
import { updateUserProfile } from '../../../../api/apiManager';
import { auth, storage } from '../../../../Firebase/firebase.config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile as updateFirebaseAuthProfile } from 'firebase/auth';

const PersonalInfo = ({ user }) => {
    const fileInputRef = useRef(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', message: '' });

    const [profile, setProfile] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        avatarInitials: '',
        avatarUrl: '',
        joinedDate: '',
        accountStatus: 'active'
    });

    useEffect(() => {
        if (user) {
            const prof = user.profile || {};
            setProfile({
                firstName: prof.firstName || '',
                lastName: prof.lastName || '',
                email: prof.email || '',
                phone: prof.phone || '',
                avatarInitials: prof.avatarInitials || 'LU',
                avatarUrl: prof.avatarUrl || user.photoURL || '',
                joinedDate: prof.joinedDate || '',
                accountStatus: user.accountStatus || 'active'
            });
        }
    }, [user]);

    const showTemporaryFeedback = (type, message) => {
        setFeedback({ type, message });
        setTimeout(() => {
            setFeedback({ type: '', message: '' });
        }, 4000);
    };

    const handlePhotoSelected = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showTemporaryFeedback('error', 'Please select a valid image file (JPG, PNG or GIF).');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showTemporaryFeedback('error', 'File size exceeds 5MB limit.');
            return;
        }

        // Generate instant local preview
        const reader = new FileReader();
        reader.onload = () => {
            setProfile((prev) => ({ ...prev, avatarUrl: reader.result }));
        };
        reader.readAsDataURL(file);

        setUploadingPhoto(true);

        try {
            const userId = user?.id || user?.uid;
            if (storage && userId) {
                const storageRef = ref(storage, `avatars/${userId}/${Date.now()}_${file.name}`);
                const snapshot = await uploadBytes(storageRef, file);
                const downloadUrl = await getDownloadURL(snapshot.ref);

                setProfile((prev) => ({ ...prev, avatarUrl: downloadUrl }));
                if (auth.currentUser) {
                    await updateFirebaseAuthProfile(auth.currentUser, { photoURL: downloadUrl });
                }
                await updateUserProfile(userId, { avatarUrl: downloadUrl });
                showTemporaryFeedback('success', 'Profile photo uploaded and synced with cloud account.');
            } else {
                showTemporaryFeedback('info', 'Profile photo preview saved locally.');
            }
        } catch (err) {
            console.warn('Firebase Storage upload failed or restricted:', err);
            showTemporaryFeedback('info', 'Photo preview applied locally. Cloud storage requires server bucket rules.');
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleRemovePhoto = async () => {
        setProfile((prev) => ({ ...prev, avatarUrl: '' }));
        try {
            const userId = user?.id || user?.uid;
            if (auth.currentUser) {
                await updateFirebaseAuthProfile(auth.currentUser, { photoURL: '' });
            }
            if (userId) {
                await updateUserProfile(userId, { avatarUrl: '' });
            }
            showTemporaryFeedback('success', 'Profile photo removed.');
        } catch (err) {
            showTemporaryFeedback('info', 'Profile photo cleared locally.');
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setFeedback({ type: '', message: '' });

        const form = e.currentTarget;
        const firstName = form.firstName.value.trim();
        const lastName = form.lastName.value.trim();
        const phone = form.phone.value.trim();
        const userId = user?.id || user?.uid;
        if (!userId) {
            setIsSaving(false);
            showTemporaryFeedback('error', 'Authentication required. Please sign in to update your profile.');
            return;
        }

        try {
            const result = await updateUserProfile(userId, { firstName, lastName, phone });
            setIsSaving(false);

            if (result.success) {
                const updatedProf = result.profile || {};
                setProfile(prev => ({
                    ...prev,
                    firstName: updatedProf.firstName || firstName,
                    lastName: updatedProf.lastName || lastName,
                    phone: updatedProf.phone || phone,
                    avatarInitials: updatedProf.avatarInitials || `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || prev.avatarInitials
                }));
                setIsEditing(false);
                showTemporaryFeedback('success', 'Personal information updated successfully!');
            } else {
                showTemporaryFeedback('error', result.error || 'Failed to update profile changes.');
            }
        } catch (err) {
            setIsSaving(false);
            console.error('Error updating profile:', err);
            showTemporaryFeedback('error', 'An unexpected error occurred while saving.');
        }
    };

    const formattedJoinedDate = profile.joinedDate
        ? new Date(profile.joinedDate).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        })
        : 'Member since 2026';

    const isActive = (profile.accountStatus || 'active').toLowerCase() === 'active';

    return (
        <div className="profile-tab-pane active" id="pane-profile">
            <div className="account-card-section">
                <div className="account-section-header">
                    <div>
                        <h1 className="account-section-title" style={{ fontSize: '1.35rem' }}>Personal Information</h1>
                        <span className="account-section-subtitle" style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                            View and manage your personal details, contact info, and account status
                        </span>
                    </div>

                    {!isEditing ? (
                        <button
                            type="button"
                            className="btn btn-primary"
                            id="edit-profile-trigger-btn"
                            onClick={() => setIsEditing(true)}
                        >
                            ✏️ Edit Information
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="btn btn-outline"
                            id="cancel-edit-trigger-btn"
                            onClick={() => setIsEditing(false)}
                            disabled={isSaving}
                        >
                            ✕ Cancel
                        </button>
                    )}
                </div>

                {feedback.message && (
                    <div className={`profile-feedback-alert ${feedback.type}`}>
                        {feedback.type === 'success' && '✓ '}
                        {feedback.type === 'info' && 'ℹ '}
                        {feedback.type === 'error' && '⚠ '}
                        {feedback.message}
                    </div>
                )}

                <div className="profile-hero-card">
                    <div className="profile-avatar-wrapper">
                        {profile.avatarUrl ? (
                            <img src={profile.avatarUrl} alt="Profile" className="profile-large-avatar" style={{ objectFit: 'cover' }} />
                        ) : (
                            <div className="profile-large-avatar">{profile.avatarInitials}</div>
                        )}
                        <div className="profile-status-dot-badge" title="Account Status: Active"></div>
                    </div>

                    <div className="profile-hero-details">
                        <div className="profile-name-row">
                            <h2 className="profile-display-name">{profile.firstName} {profile.lastName}</h2>
                            <span className={`badge ${isActive ? 'badge-success' : 'badge-secondary'}`}>
                                <span className="status-indicator-dot"></span>
                                {isActive ? 'Account Active' : 'Account Inactive'}
                            </span>
                        </div>

                        <p className="profile-display-email">{profile.email}</p>

                        <div className="profile-meta-tags">
                            <span className="profile-meta-pill">🗓️ {formattedJoinedDate}</span>
                            <span className="profile-meta-pill">🛡️ Email Verified</span>
                            <span className="profile-meta-pill">⭐ LUMEN Verified Customer</span>
                        </div>
                    </div>
                </div>

                {!isEditing ? (
                    <div className="profile-details-view">
                        <div className="profile-view-grid">
                            <div className="profile-info-tile">
                                <span className="profile-tile-label">First Name</span>
                                <strong className="profile-tile-value">{profile.firstName || 'Not provided'}</strong>
                            </div>

                            <div className="profile-info-tile">
                                <span className="profile-tile-label">Last Name</span>
                                <strong className="profile-tile-value">{profile.lastName || 'Not provided'}</strong>
                            </div>

                            <div className="profile-info-tile">
                                <span className="profile-tile-label">Email Address</span>
                                <strong className="profile-tile-value">{profile.email || 'Not provided'}</strong>
                                <small className="profile-tile-subtext">Primary login & order notification email</small>
                            </div>

                            <div className="profile-info-tile">
                                <span className="profile-tile-label">Phone Number</span>
                                <strong className="profile-tile-value">{profile.phone || 'Not provided'}</strong>
                                <small className="profile-tile-subtext">Used for delivery courier SMS updates</small>
                            </div>

                            <div className="profile-info-tile">
                                <span className="profile-tile-label">Account Status</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                    <span className="status-indicator-dot active"></span>
                                    <strong className="profile-tile-value" style={{ color: 'var(--color-success)', marginTop: 0 }}>
                                        {isActive ? 'Active & Good Standing' : 'Inactive'}
                                    </strong>
                                </div>
                                <small className="profile-tile-subtext">Full platform and warranty access granted</small>
                            </div>

                            <div className="profile-info-tile">
                                <span className="profile-tile-label">Membership Tier</span>
                                <strong className="profile-tile-value">LUMEN Pro Member</strong>
                                <small className="profile-tile-subtext">Free carbon-neutral courier delivery enabled</small>
                            </div>
                        </div>

                        <div className="profile-view-footer-note">
                            <span>🔒 Your data is protected by LUMEN 256-bit hardware encryption standards.</span>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline"
                                onClick={() => setIsEditing(true)}
                            >
                                Edit Information
                            </button>
                        </div>
                    </div>
                ) : (
                    <form className="profile-edit-form" onSubmit={handleSaveProfile}>
                        <div className="profile-avatar-edit-box">
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/png, image/jpeg, image/gif, image/webp"
                                onChange={handlePhotoSelected}
                                style={{ display: 'none' }}
                            />
                            <div className="profile-avatar-edit-info">
                                {profile.avatarUrl ? (
                                    <img src={profile.avatarUrl} alt="Avatar Preview" className="profile-large-avatar" style={{ objectFit: 'cover' }} />
                                ) : (
                                    <div className="profile-large-avatar">{profile.avatarInitials}</div>
                                )}
                                <div>
                                    <strong style={{ display: 'block', fontSize: '0.9375rem', marginBottom: '2px' }}>
                                        Profile Avatar
                                    </strong>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                        Upload a customized profile image (JPG, PNG or GIF up to 5MB)
                                    </span>
                                </div>
                            </div>

                            <div className="profile-avatar-btn-group">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingPhoto}
                                >
                                    {uploadingPhoto ? 'Uploading...' : '📷 Upload Photo'}
                                </button>
                                {profile.avatarUrl && (
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-ghost text-error"
                                        onClick={handleRemovePhoto}
                                        disabled={uploadingPhoto}
                                    >
                                        🗑️ Remove
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="profile-form-grid">
                            <div className="form-group">
                                <label className="form-label" htmlFor="prof-fname">
                                    First Name <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="prof-fname"
                                    name="firstName"
                                    className="input"
                                    defaultValue={profile.firstName}
                                    placeholder="Enter your first name"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="prof-lname">
                                    Last Name <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="prof-lname"
                                    name="lastName"
                                    className="input"
                                    defaultValue={profile.lastName}
                                    placeholder="Enter your last name"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="prof-email">Email Address (Read-Only)</label>
                                <input
                                    type="email"
                                    id="prof-email"
                                    name="email"
                                    className="input disabled-input"
                                    defaultValue={profile.email}
                                    disabled
                                    title="Email address is linked to your login credentials"
                                />
                                <small style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                                    Email is linked to your security login credentials.
                                </small>
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="prof-phone">
                                    Phone Number <span className="required">*</span>
                                </label>
                                <input
                                    type="tel"
                                    id="prof-phone"
                                    name="phone"
                                    className="input"
                                    defaultValue={profile.phone}
                                    placeholder="e.g. +880 1XXX XXXXXX"
                                    required
                                />
                            </div>
                        </div>

                        <div className="profile-edit-actions">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setIsEditing(false)}
                                disabled={isSaving}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isSaving}
                            >
                                {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default PersonalInfo;
