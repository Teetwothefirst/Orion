import React, { useState } from 'react';
import { X, Send, AlertTriangle } from 'lucide-react';
import { reportBug } from '../services/SupportService';
import { useAuth } from '../context/AuthContext';

const BugReportModal = ({ onClose }) => {
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState(null); // 'success' | 'error'
    const { user } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!description.trim()) return;

        setIsSubmitting(true);
        setStatus(null);

        try {
            await reportBug({
                user: user?.email || 'Anonymous',
                description: description,
                isCrash: false
            });
            setStatus('success');
            setTimeout(() => onClose(), 2000);
        } catch (error) {
            console.error('Failed to report bug:', error);
            setStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div style={styles.header}>
                    <div style={styles.titleContainer}>
                        <AlertTriangle size={20} color="#fb923c" />
                        <h2 style={styles.title}>Report a Bug</h2>
                    </div>
                    <X size={20} style={styles.closeIcon} onClick={onClose} />
                </div>

                {status === 'success' ? (
                    <div style={styles.successMessage}>
                        <p>Thank you! Your report has been sent. We'll look into it.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={styles.form}>
                        <p style={styles.instruction}>
                            Describe what happened and how to reproduce the issue.
                        </p>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="I was trying to send a message but..."
                            style={styles.textarea}
                            autoFocus
                            required
                        />
                        {status === 'error' && (
                            <p style={styles.errorMessage}>
                                Failed to send report. Please check your connection.
                            </p>
                        )}
                        <div style={styles.footer}>
                            <button
                                type="button"
                                onClick={onClose}
                                style={styles.cancelButton}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                style={styles.submitButton}
                                disabled={isSubmitting || !description.trim()}
                            >
                                {isSubmitting ? 'Sending...' : 'Send Report'}
                                <Send size={16} style={{ marginLeft: '8px' }} />
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
        backdropFilter: 'blur(4px)',
    },
    modal: {
        backgroundColor: 'white',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '450px',
        padding: '24px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
    },
    titleContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },
    title: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#1f2937',
        margin: 0,
    },
    closeIcon: {
        cursor: 'pointer',
        color: '#6b7280',
    },
    instruction: {
        fontSize: '14px',
        color: '#4b5563',
        marginBottom: '12px',
    },
    textarea: {
        width: '100%',
        minHeight: '120px',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid #d1d5db',
        fontSize: '14px',
        fontFamily: 'inherit',
        resize: 'vertical',
        marginBottom: '16px',
        boxSizing: 'border-box',
    },
    successMessage: {
        padding: '20px',
        backgroundColor: '#f0fdf4',
        borderRadius: '8px',
        border: '1px solid #bbf7d0',
        color: '#166534',
        textAlign: 'center',
    },
    errorMessage: {
        color: '#ef4444',
        fontSize: '12px',
        marginBottom: '16px',
    },
    footer: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
    },
    cancelButton: {
        padding: '8px 16px',
        borderRadius: '8px',
        border: '1px solid #d1d5db',
        backgroundColor: 'white',
        color: '#374151',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
    },
    submitButton: {
        padding: '8px 16px',
        borderRadius: '8px',
        backgroundColor: '#fb923c',
        color: 'white',
        border: 'none',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'opacity 0.2s',
    },
};

export default BugReportModal;
