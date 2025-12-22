import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { reportBug } from '../services/support';
import { useAuth } from '../context/AuthContext';

interface BugReportModalProps {
    visible: boolean;
    onClose: () => void;
}

const BugReportModal: React.FC<BugReportModalProps> = ({ visible, onClose }) => {
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<'success' | 'error' | null>(null);
    const { user } = useAuth();

    const handleSubmit = async () => {
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
            setTimeout(() => {
                setDescription('');
                setStatus(null);
                onClose();
            }, 2000);
        } catch (error) {
            console.error('Failed to report bug:', error);
            setStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.overlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.container}
                    >
                        <View style={styles.modalContent}>
                            <View style={styles.header}>
                                <View style={styles.titleContainer}>
                                    <Ionicons name="alert-circle" size={24} color="#fb923c" />
                                    <Text style={styles.title}>Report a Bug</Text>
                                </View>
                                <TouchableOpacity onPress={onClose}>
                                    <Ionicons name="close" size={24} color="#6b7280" />
                                </TouchableOpacity>
                            </View>

                            {status === 'success' ? (
                                <View style={styles.successContainer}>
                                    <Ionicons name="checkmark-circle" size={48} color="#166534" />
                                    <Text style={styles.successText}>
                                        Thank you! Your report has been sent.
                                    </Text>
                                </View>
                            ) : (
                                <View style={styles.form}>
                                    <Text style={styles.label}>
                                        Describe what happened and how to reproduce it:
                                    </Text>
                                    <TextInput
                                        style={styles.input}
                                        multiline
                                        numberOfLines={4}
                                        value={description}
                                        onChangeText={setDescription}
                                        placeholder="I was trying to..."
                                        placeholderTextColor="#9ca3af"
                                    />
                                    {status === 'error' && (
                                        <Text style={styles.errorText}>
                                            Failed to send report. Please try again.
                                        </Text>
                                    )}
                                    <TouchableOpacity
                                        style={[
                                            styles.submitButton,
                                            (!description.trim() || isSubmitting) && styles.disabledButton
                                        ]}
                                        onPress={handleSubmit}
                                        disabled={!description.trim() || isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <>
                                                <Text style={styles.submitButtonText}>Send Report</Text>
                                                <Ionicons name="send" size={18} color="#fff" style={{ marginLeft: 8 }} />
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    container: {
        width: '100%',
        maxWidth: 400
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 10,
        color: '#1f2937'
    },
    form: {
        width: '100%'
    },
    label: {
        fontSize: 14,
        color: '#4b5563',
        marginBottom: 10
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        textAlignVertical: 'top',
        minHeight: 120,
        marginBottom: 20,
        color: '#1f2937'
    },
    submitButton: {
        backgroundColor: '#fb923c',
        flexDirection: 'row',
        padding: 14,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center'
    },
    disabledButton: {
        opacity: 0.6
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600'
    },
    errorText: {
        color: '#ef4444',
        fontSize: 12,
        marginBottom: 10,
        textAlign: 'center'
    },
    successContainer: {
        alignItems: 'center',
        paddingVertical: 20
    },
    successText: {
        fontSize: 16,
        color: '#166534',
        textAlign: 'center',
        marginTop: 10,
        fontWeight: '500'
    }
});

export default BugReportModal;
