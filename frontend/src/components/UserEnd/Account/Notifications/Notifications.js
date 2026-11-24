import React, { useState, useEffect } from 'react';
import './Notifications.css';
import { updateUserNotifications } from '../../../../api/apiManager';

const TYPE_CONFIG = {
    order_update: { label: 'Order Update', icon: '📦', badgeClass: 'badge-order' },
    security_alert: { label: 'Security Alert', icon: '🔒', badgeClass: 'badge-security' },
    price_drop: { label: 'Price Drop', icon: '🔥', badgeClass: 'badge-price' },
    promotional: { label: 'Promotional', icon: '🎉', badgeClass: 'badge-promo' },
    system: { label: 'System Notice', icon: '⚙️', badgeClass: 'badge-system' }
};

const Notifications = ({ user }) => {
    const [notifications, setNotifications] = useState([]);
    const [selectedNotif, setSelectedNotif] = useState(null);
    const [filter, setFilter] = useState('all');
    const [isUpdating, setIsUpdating] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', message: '' });

    const userId = user?.id || user?.uid;

    useEffect(() => {
        if (user?.notifications) {
            setNotifications(user.notifications);
        }
    }, [user]);

    const showToast = (type, message) => {
        setFeedback({ type, message });
        setTimeout(() => {
            setFeedback({ type: '', message: '' });
        }, 3000);
    };

    const unseenCount = notifications.filter((n) => !n.isRead).length;
    const seenCount = notifications.length - unseenCount;

    const filteredNotifications = notifications.filter((n) => {
        if (filter === 'unseen') return !n.isRead;
        if (filter === 'seen') return n.isRead;
        return true;
    });

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'Just now';
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return timestamp;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const getTypeMeta = (type, customIcon) => {
        const key = (type || '').toLowerCase();
        const config = TYPE_CONFIG[key] || {
            label: (type || 'Notice').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
            icon: customIcon || '🔔',
            badgeClass: 'badge-default'
        };
        return {
            ...config,
            icon: customIcon || config.icon
        };
    };

    const handleSelectNotification = async (notif) => {
        setSelectedNotif(notif);

        if (!notif.isRead && userId) {
            setNotifications((prev) =>
                prev.map((item) => (item.id === notif.id ? { ...item, isRead: true } : item))
            );
            setSelectedNotif({ ...notif, isRead: true });

            try {
                await updateUserNotifications(userId, {
                    notifId: notif.id,
                    isRead: true
                });
            } catch (err) {
                console.error('Error marking notification as read:', err);
            }
        }
    };

    const handleToggleReadStatus = async (notifId, currentStatus, e) => {
        if (e) e.stopPropagation();
        if (!userId) {
            showToast('error', 'Sign in required to update notification status.');
            return;
        }

        const newStatus = !currentStatus;

        setNotifications((prev) =>
            prev.map((item) => (item.id === notifId ? { ...item, isRead: newStatus } : item))
        );

        if (selectedNotif && selectedNotif.id === notifId) {
            setSelectedNotif((prev) => ({ ...prev, isRead: newStatus }));
        }

        try {
            const res = await updateUserNotifications(userId, {
                notifId,
                isRead: newStatus
            });
            if (res.success) {
                showToast('success', `Marked as ${newStatus ? 'seen' : 'unseen'}.`);
            } else {
                showToast('error', res.error || 'Failed to update status.');
            }
        } catch (err) {
            console.error('Failed to update notification status:', err);
            showToast('error', 'Network error updating status.');
        }
    };

    const handleMarkAllRead = async () => {
        if (!userId) {
            showToast('error', 'Sign in required to update notifications.');
            return;
        }
        if (unseenCount === 0) return;

        setIsUpdating(true);
        setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
        if (selectedNotif) {
            setSelectedNotif((prev) => ({ ...prev, isRead: true }));
        }

        try {
            const res = await updateUserNotifications(userId, { markAllRead: true });
            setIsUpdating(false);
            if (res.success) {
                showToast('success', 'All notifications marked as seen.');
            } else {
                showToast('error', res.error || 'Failed to mark all as read.');
            }
        } catch (err) {
            setIsUpdating(false);
            console.error('Error marking all notifications read:', err);
            showToast('error', 'Error updating notifications.');
        }
    };

    return (
        <div className="account-card-section notifications-container">
            {feedback.message && (
                <div className={`notif-feedback-toast ${feedback.type}`}>
                    {feedback.type === 'success' && '✓ '}
                    {feedback.type === 'error' && '⚠ '}
                    {feedback.message}
                </div>
            )}

            {selectedNotif ? (
                <div className="notif-detail-view">
                    <div className="notif-detail-toolbar">
                        <button
                            type="button"
                            className="btn btn-sm btn-outline notif-back-btn"
                            onClick={() => setSelectedNotif(null)}
                            id="notif-back-to-list-btn"
                        >
                            ← Back to Notifications
                        </button>

                        <div className="notif-detail-actions">
                            <button
                                type="button"
                                className={`btn btn-xs ${selectedNotif.isRead ? 'btn-outline' : 'btn-primary'}`}
                                onClick={(e) => handleToggleReadStatus(selectedNotif.id, selectedNotif.isRead, e)}
                            >
                                {selectedNotif.isRead ? 'Mark as Unseen' : 'Mark as Seen'}
                            </button>
                        </div>
                    </div>

                    <div className="notif-detail-card">
                        <div className="notif-detail-header">
                            <div className="notif-detail-type-row">
                                {(() => {
                                    const meta = getTypeMeta(selectedNotif.type, selectedNotif.icon);
                                    return (
                                        <span className={`notif-type-pill ${meta.badgeClass}`}>
                                            <span className="notif-type-icon">{meta.icon}</span>
                                            {meta.label}
                                        </span>
                                    );
                                })()}

                                <span className={`notif-status-badge ${selectedNotif.isRead ? 'status-seen' : 'status-unseen'}`}>
                                    <span className="status-dot"></span>
                                    {selectedNotif.isRead ? 'Seen' : 'Unseen'}
                                </span>
                            </div>

                            <h2 className="notif-detail-title">{selectedNotif.title}</h2>

                            <div className="notif-detail-time">
                                <span>🕒 {formatTimestamp(selectedNotif.timestamp)}</span>
                            </div>
                        </div>

                        <div className="notif-detail-body">
                            <h4 className="notif-body-heading">Message</h4>
                            <div className="notif-message-box">
                                <p>{selectedNotif.message}</p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="notif-list-view">
                    <div className="account-section-header">
                        <div>
                            <div className="notif-title-row">
                                <h2 className="account-section-title" style={{ fontSize: '1.35rem' }}>
                                    Notifications ({notifications.length})
                                </h2>
                                {unseenCount > 0 && (
                                    <span className="notif-unseen-badge">{unseenCount} New</span>
                                )}
                            </div>
                            <span className="account-section-subtitle" style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                                Click any notification to view its full details and message
                            </span>
                        </div>

                        {unseenCount > 0 && (
                            <button
                                type="button"
                                className="btn btn-xs btn-outline notif-mark-all-btn"
                                onClick={handleMarkAllRead}
                                disabled={isUpdating}
                            >
                                ✓ Mark All as Read
                            </button>
                        )}
                    </div>

                    <div className="notif-filters-bar">
                        <button
                            type="button"
                            className={`notif-filter-tab ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            All ({notifications.length})
                        </button>
                        <button
                            type="button"
                            className={`notif-filter-tab ${filter === 'unseen' ? 'active' : ''}`}
                            onClick={() => setFilter('unseen')}
                        >
                            Unseen ({unseenCount})
                        </button>
                        <button
                            type="button"
                            className={`notif-filter-tab ${filter === 'seen' ? 'active' : ''}`}
                            onClick={() => setFilter('seen')}
                        >
                            Seen ({seenCount})
                        </button>
                    </div>

                    {filteredNotifications.length === 0 ? (
                        <div className="notif-empty-state">
                            <span className="notif-empty-icon">🔔</span>
                            <h3>No notifications found</h3>
                            <p>
                                {filter === 'unseen'
                                    ? "You're all caught up! There are no unseen notifications."
                                    : 'You do not have any notifications at the moment.'}
                            </p>
                        </div>
                    ) : (
                        <div className="notifications-list">
                            {filteredNotifications.map((notif) => {
                                const meta = getTypeMeta(notif.type, notif.icon);
                                const isUnseen = !notif.isRead;

                                return (
                                    <div
                                        key={notif.id}
                                        className={`notification-item ${isUnseen ? 'item-unseen' : 'item-seen'}`}
                                        onClick={() => handleSelectNotification(notif)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                handleSelectNotification(notif);
                                            }
                                        }}
                                        title="Click to view notification message"
                                    >
                                        <div className="notif-left-icon-box">
                                            <span className="notif-icon">{meta.icon}</span>
                                        </div>

                                        <div className="notif-main-info">
                                            <div className="notif-top-meta">
                                                <span className={`notif-type-pill ${meta.badgeClass}`}>{meta.label}</span>
                                                <span className="notif-time-text">{formatTimestamp(notif.timestamp)}</span>
                                            </div>

                                            <h4 className="notif-item-title">{notif.title}</h4>
                                        </div>

                                        <div className="notif-status-col">
                                            <span className={`notif-status-badge ${isUnseen ? 'status-unseen' : 'status-seen'}`}>
                                                <span className="status-dot"></span>
                                                {isUnseen ? 'Unseen' : 'Seen'}
                                            </span>

                                            <button
                                                type="button"
                                                className="notif-quick-toggle-btn"
                                                onClick={(e) => handleToggleReadStatus(notif.id, notif.isRead, e)}
                                                title={isUnseen ? 'Mark as Seen' : 'Mark as Unseen'}
                                            >
                                                {isUnseen ? '✓' : '●'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Notifications;
