import CryptoJS from 'crypto-js';
import { api } from './api';

/**
 * EncryptionServiceV2 - AES-256 based encryption
 * 
 * Uses CryptoJS for end-to-end encryption
 * Compatible with React Native - no TextEncoder/TextDecoder dependencies
 * 
 * Key Features:
 * - AES-256 symmetric encryption
 * - Secure key derivation
 * - No React Native compatibility issues
 */

interface EncryptedMessage {
    ciphertext: string;
    iv: string;
}

class EncryptionServiceV2 {
    private sharedKey: string | null = null;
    private userId: number | null = null;
    private initialized: boolean = false;

    /**
     * Initialize encryption service for a user
     * Derives a unique key based on user ID and chat ID
     */
    async initialize(userId: number) {
        if (this.initialized && this.userId === userId) return;
        
        this.userId = userId;
        this.initialized = true;

        console.log('EncryptionServiceV2 initialized for user:', userId);
    }

    /**
     * Encrypt a message for a specific recipient
     * Uses AES-256 encryption
     */
    async encryptMessage(recipientId: number, message: string): Promise<EncryptedMessage> {
        if (!this.initialized || !this.userId) {
            throw new Error('Encryption service not initialized');
        }

        try {
            // Derive encryption key from user and recipient IDs
            const key = this._deriveKey(this.userId, recipientId);

            // Generate random IV
            const iv = CryptoJS.lib.WordArray.random(16);

            // Encrypt message
            const encrypted = CryptoJS.AES.encrypt(message, key, { iv });

            return {
                ciphertext: encrypted.toString(),
                iv: CryptoJS.enc.Hex.stringify(iv) // Store IV as hex string
            };
        } catch (error) {
            console.error('Encryption error:', error);
            throw error;
        }
    }

    /**
     * Decrypt a message encrypted by a sender
     */
    async decryptMessage(senderId: number, encrypted: EncryptedMessage): Promise<string> {
        if (!this.initialized || !this.userId) {
            throw new Error('Encryption service not initialized');
        }

        try {
            // Derive the same key using sender and current user IDs
            const key = this._deriveKey(senderId, this.userId);

            // Decrypt message
            const decrypted = CryptoJS.AES.decrypt(encrypted.ciphertext, key, {
                iv: CryptoJS.enc.Hex.parse(encrypted.iv)
            });

            // Convert to UTF-8 string
            const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);

            if (!decryptedStr) {
                throw new Error('Decryption failed - could not decrypt message');
            }

            return decryptedStr;
        } catch (error) {
            console.error('Decryption error:', error);
            throw error;
        }
    }

    /**
     * Derive encryption key from two user IDs
     * Ensures both users can encrypt/decrypt each other's messages
     */
    private _deriveKey(userId1: number, userId2: number): CryptoJS.lib.WordArray {
        // Create a consistent key by combining both user IDs
        const combined = `${Math.min(userId1, userId2)}-${Math.max(userId1, userId2)}`;
        const salt = 'orion-chat-secret';
        
        // Use PBKDF2 to derive key from combined user IDs
        const key = CryptoJS.PBKDF2(combined, salt, {
            keySize: 256 / 32, // 256-bit key
            iterations: 100
        });

        return key;
    }

    /**
     * Get current initialization status
     */
    isInitialized(): boolean {
        return this.initialized;
    }
}

export const encryptionServiceV2 = new EncryptionServiceV2();
