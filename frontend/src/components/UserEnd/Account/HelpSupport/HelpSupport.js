import React, { useState, useEffect } from 'react';
import './HelpSupport.css';
import { submitUserSupport, getUserSupportTickets } from '../../../../api/apiManager';

const HelpSupport = ({ user }) => {
    const [topic, setTopic] = useState('Hardware Compatibility Check');
    const [orderNumber, setOrderNumber] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', message: '' });
    const [tickets, setTickets] = useState([]);
    const [isLoadingTickets, setIsLoadingTickets] = useState(false);

    const userId = user?.id || user?.uid || '';
    const userName = `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`.trim() || 'Verified Customer';
    const userEmail = user?.profile?.email || '';

    useEffect(() => {
        let isMounted = true;

        const fetchTickets = async () => {
            if (!userId) return;
            setIsLoadingTickets(true);
            try {
                const res = await getUserSupportTickets(userId);
                if (isMounted && res.success) {
                    setTickets(res.userSupport || []);
                }
            } catch (err) {
                console.error('Failed to load support tickets:', err);
            } finally {
                if (isMounted) setIsLoadingTickets(false);
            }
        };

        fetchTickets();

        return () => {
            isMounted = false;
        };
    }, [userId]);

    const showToast = (type, message) => {
        setFeedback({ type, message });
        setTimeout(() => {
            setFeedback({ type: '', message: '' });
        }, 5000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFeedback({ type: '', message: '' });

        if (!message.trim()) {
            showToast('error', 'Please describe your question or issue.');
            return;
        }

        setIsSubmitting(true);

        const payload = {
            userId,
            userName,
            userEmail,
            topic,
            orderNumber: orderNumber.trim(),
            subject: subject.trim() || topic,
            message: message.trim()
        };

        try {
            const res = await submitUserSupport(payload);
            setIsSubmitting(false);

            if (res.success) {
                setMessage('');
                setOrderNumber('');
                setSubject('');
                showToast('success', `Support ticket #${res.ticket?.id || 'SUBMITTED'} created successfully! Our hardware engineering team will review it.`);
                if (res.ticket) {
                    setTickets((prev) => [res.ticket, ...prev]);
                }
            } else {
                showToast('error', res.error || 'Failed to submit support request.');
            }
        } catch (err) {
            setIsSubmitting(false);
            console.error('Support ticket submission error:', err);
            showToast('error', 'An unexpected error occurred while submitting your ticket.');
        }
    };

    return (
        <div className="account-card-section help-support-container">
            <div className="account-section-header">
                <div>
                    <h2 className="account-section-title" style={{ fontSize: '1.35rem' }}>Help & Technical Support</h2>
                    <span className="account-section-subtitle" style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                        Direct access to LUMEN hardware engineers, warranty dispatch, and order specialists
                    </span>
                </div>
            </div>

            {feedback.message && (
                <div className={`support-feedback-toast ${feedback.type}`}>
                    {feedback.type === 'success' && '✓ '}
                    {feedback.type === 'error' && '⚠ '}
                    {feedback.message}
                </div>
            )}

            <form className="support-ticket-form" onSubmit={handleSubmit}>
                <div className="support-form-row">
                    <div className="form-group support-form-col">
                        <label className="form-label" htmlFor="sup-topic">Topic / Category</label>
                        <select
                            id="sup-topic"
                            className="input"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            disabled={isSubmitting}
                        >
                            <option value="Hardware Compatibility Check">Hardware Compatibility Check</option>
                            <option value="Order Tracking & Shipping">Order Tracking & Shipping</option>
                            <option value="Warranty Claim & Returns">Warranty Claim & Returns</option>
                            <option value="Custom PC Builder Advice">Custom PC Builder Advice</option>
                            <option value="General Technical Support">General Technical Support</option>
                        </select>
                    </div>

                    <div className="form-group support-form-col">
                        <label className="form-label" htmlFor="sup-order">Related Order Number (Optional)</label>
                        <input
                            type="text"
                            id="sup-order"
                            className="input"
                            placeholder="e.g. ORD-20260916-5614"
                            list="user-orders-list"
                            value={orderNumber}
                            onChange={(e) => setOrderNumber(e.target.value)}
                            disabled={isSubmitting}
                        />
                        <datalist id="user-orders-list">
                            {user?.ordersSummary?.map((order, idx) => (
                                <option key={order.orderId || idx} value={order.orderId} />
                            ))}
                            {user?.recentOrdersSummary?.map((order, idx) => (
                                <option key={order.orderNumber || order.id || idx} value={order.orderNumber || order.orderId} />
                            ))}
                        </datalist>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="sup-subject">Subject (Optional)</label>
                    <input
                        type="text"
                        id="sup-subject"
                        className="input"
                        placeholder="Brief summary of your inquiry"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        disabled={isSubmitting}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="sup-msg">Describe Your Question or Issue</label>
                    <textarea
                        id="sup-msg"
                        className="input"
                        rows="4"
                        placeholder="How can our hardware engineers assist you today?"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                        disabled={isSubmitting}
                    ></textarea>
                </div>

                <div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isSubmitting}
                        id="submit-support-ticket-btn"
                    >
                        {isSubmitting ? 'Submitting Request...' : 'Submit Support Request'}
                    </button>
                </div>
            </form>

            {isLoadingTickets && (
                <p style={{ color: 'var(--color-text-secondary)', padding: '1rem 0' }}>Loading your previous support requests...</p>
            )}

            {tickets.length > 0 && (
                <div className="support-tickets-history">
                    <h3 className="support-history-title">My Support Requests ({tickets.length})</h3>
                    <div className="support-tickets-list">
                        {tickets.map((t) => (
                            <div key={t.id} className="support-ticket-card">
                                <div className="support-ticket-header">
                                    <div className="support-ticket-meta">
                                        <span className="support-ticket-id">#{t.id}</span>
                                        <span className="support-ticket-topic">{t.topic}</span>
                                        {t.orderNumber && (
                                            <span className="support-ticket-order">Order: {t.orderNumber}</span>
                                        )}
                                    </div>
                                    <div className="support-ticket-status-badge">
                                        <span className="status-dot"></span>
                                        {t.status || 'open'}
                                    </div>
                                </div>
                                <p className="support-ticket-msg">{t.message}</p>
                                <div className="support-ticket-footer">
                                    <small className="support-ticket-date">
                                        Submitted {new Date(t.createdAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                            hour: 'numeric',
                                            minute: '2-digit'
                                        })}
                                    </small>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HelpSupport;
