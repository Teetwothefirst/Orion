import {
    KeyHelper,
    ProtocolAddress,
    SessionBuilder,
    SessionCipher
} from '@privacyresearch/libsignal-protocol-typescript';
import { SignalStore } from './SignalStore';
import { api } from '../services/api';

class EncryptionService {
    constructor() {
        this.store = new SignalStore();
        this.initialized = false;
        this.userId = null;
    }

    async initialize(userId) {
        if (this.initialized) return;
        this.userId = userId;

        const registrationId = await this.store.getLocalRegistrationId();
        if (registrationId === undefined || registrationId === null) {
            await this._generateAndUploadKeys(userId);
        }

        this.initialized = true;
        console.log('Signal Encryption Service initialized for user:', userId);
    }

    async _generateAndUploadKeys(userId) {
        const registrationId = KeyHelper.generateRegistrationId();
        const identityKeyPair = await KeyHelper.generateIdentityKeyPair();

        await this.store.put('registrationId', registrationId);
        await this.store.put('identityKey', identityKeyPair);

        // Generate Signed PreKey
        const signedPreKeyId = Math.floor(Math.random() * 1000000);
        const signedPreKey = await KeyHelper.generateSignedPreKey(identityKeyPair, signedPreKeyId);
        await this.store.storeSignedPreKey(signedPreKeyId, signedPreKey);

        // Generate batch of One-Time PreKeys
        const oneTimePreKeys = [];
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
        } catch (error) {
            console.error('Error uploading keys to server:', error);
        }
    }

    _bufferToBase64(buffer) {
        return btoa(String.fromCharCode(...new Uint8Array(buffer)));
    }

    _base64ToBuffer(base64) {
        const bin = atob(base64);
        const buf = new ArrayBuffer(bin.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i < bin.length; i++) {
            view[i] = bin.charCodeAt(i);
        }
        return buf;
    }

    async encryptMessage(recipientId, plaintext) {
        if (!this.initialized) throw new Error('Encryption service not initialized');

        const address = new ProtocolAddress(recipientId.toString(), 1);
        const hasSession = await this.store.loadSession(address.toString());

        if (!hasSession) {
            console.log('Building new session for:', recipientId);
            const bundleResponse = await api.get(`/keys/bundle/${recipientId}`);
            const bundle = bundleResponse.data;

            const builder = new SessionBuilder(this.store, address);
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

        const cipher = new SessionCipher(this.store, address);
        const ciphertext = await cipher.encrypt(new TextEncoder().encode(plaintext));

        return {
            type: ciphertext.type,
            body: ciphertext.body
        };
    }

    async decryptMessage(senderId, encryptedData) {
        if (!this.initialized) throw new Error('Encryption service not initialized');

        const address = new ProtocolAddress(senderId.toString(), 1);
        const cipher = new SessionCipher(this.store, address);

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
