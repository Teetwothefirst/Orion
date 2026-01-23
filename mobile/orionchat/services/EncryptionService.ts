import {
    KeyHelper,
    SessionBuilder,
    SessionCipher,
    SignalProtocolAddress as ProtocolAddress
} from '@privacyresearch/libsignal-protocol-typescript';
import { SignalStore } from './SignalStore';
import { api } from './api';

// Polyfill for TextEncoder/Decoder if not available in RN environment
// Polyfill for TextEncoder/Decoder handled in _layout.tsx

class EncryptionService {
    private store: SignalStore;
    private initialized: boolean = false;
    private userId: number | null = null;

    constructor() {
        this.store = new SignalStore();
    }

    async initialize(userId: number) {
        // Sanity check for crypto polyfill
        if (!crypto || !crypto.getRandomValues) {
            console.error('CRITICAL: crypto.getRandomValues is NOT available!');
        } else {
            console.log('crypto.getRandomValues is available.');
        }

        if (this.initialized) return;
        this.userId = userId;

        const registrationId = await this.store.getLocalRegistrationId();
        if (registrationId === undefined || registrationId === null) {
            await this._generateAndUploadKeys(userId);
        }

        this.initialized = true;
        console.log('Mobile Signal Encryption Service initialized for user:', userId);
    }

    private async _generateAndUploadKeys(userId: number) {
        const registrationId = KeyHelper.generateRegistrationId();
        const identityKeyPair = await KeyHelper.generateIdentityKeyPair();

        await this.store.put('registrationId', registrationId);
        await this.store.put('identityKey', identityKeyPair);

        // Generate Signed PreKey
        const signedPreKeyId = Math.floor(Math.random() * 1000000);
        const signedPreKey = await KeyHelper.generateSignedPreKey(identityKeyPair, signedPreKeyId);
        await this.store.storeSignedPreKey(signedPreKeyId, signedPreKey);

        // Generate batch of One-Time PreKeys
        const oneTimePreKeys: any[] = [];
        for (let i = 0; i < 20; i++) {
            const keyId = Math.floor(Math.random() * 1000000);
            const preKey = await KeyHelper.generatePreKey(keyId);
            await this.store.storePreKey(keyId, preKey);
            oneTimePreKeys.push({
                keyId: keyId,
                publicKey: this._bufferToBase64(preKey.keyPair.pubKey)
            });
        }

        // Upload to server
        try {
            await api.post('/keys/identity', {
                userId,
                publicKey: this._bufferToBase64(identityKeyPair.pubKey),
                registrationId
            });

            await api.post('/keys/prekeys', {
                userId,
                signedPreKey: {
                    keyId: signedPreKeyId,
                    publicKey: this._bufferToBase64(signedPreKey.keyPair.pubKey),
                    signature: this._bufferToBase64(signedPreKey.signature)
                },
                oneTimePreKeys
            });
        } catch (error: any) {
            console.error('Error uploading keys to server:', error);
            if (error.response) {
                console.error('Server Response Status:', error.response.status);
                console.error('Server Response Data:', JSON.stringify(error.response.data, null, 2));
            }
        }
    }

    private _bufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    private _base64ToBuffer(base64: string): ArrayBuffer {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    async encryptMessage(recipientId: number, plaintext: string) {
        if (!this.initialized) throw new Error('Encryption service not initialized');

        const address = new ProtocolAddress(recipientId.toString(), 1);
        const hasSession = await this.store.loadSession(address.toString());

        if (!hasSession) {
            console.log('Mobile: Building new session for:', recipientId);
            const bundleResponse = await api.get(`/keys/bundle/${recipientId}`);
            const bundle = bundleResponse.data;

            const builder = new SessionBuilder(this.store as any, address);
            await builder.processPreKey({
                registrationId: bundle.registrationId,
                identityKey: this._base64ToBuffer(bundle.identityKey),
                signedPreKey: {
                    keyId: bundle.signedPreKey.keyId,
                    publicKey: this._base64ToBuffer(bundle.signedPreKey.publicKey),
                    signature: this._base64ToBuffer(bundle.signedPreKey.signature)
                },
                preKey: bundle.oneTimePreKey ? {
                    keyId: bundle.oneTimePreKey.keyId,
                    publicKey: this._base64ToBuffer(bundle.oneTimePreKey.publicKey)
                } : undefined
            });
        }

        const cipher = new SessionCipher(this.store as any, address);
        const ciphertext = await cipher.encrypt(new TextEncoder().encode(plaintext).buffer);

        return {
            type: ciphertext.type,
            body: ciphertext.body
        };
    }

    async decryptMessage(senderId: number, encryptedData: any) {
        if (!this.initialized) throw new Error('Encryption service not initialized');

        const address = new ProtocolAddress(senderId.toString(), 1);
        const cipher = new SessionCipher(this.store as any, address);

        let plaintextBuffer;
        if (encryptedData.type === 3) {
            plaintextBuffer = await cipher.decryptWhisperMessage(encryptedData.body);
        } else {
            plaintextBuffer = await cipher.decryptPreKeyWhisperMessage(encryptedData.body);
        }

        return new TextDecoder().decode(plaintextBuffer);
    }
}

export const encryptionService = new EncryptionService();
