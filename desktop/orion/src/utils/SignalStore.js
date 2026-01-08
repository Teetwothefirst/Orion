/**
 * SignalStore.js
 * Implementation of the Signal Protocol storage interface using localStorage.
 */

export class SignalStore {
    constructor() {
        this.store = {};
    }

    // Helper to convert objects with ArrayBuffers to/from JSON-friendly format
    _serialize(value) {
        if (value instanceof ArrayBuffer) {
            return { __type: 'ArrayBuffer', data: btoa(String.fromCharCode(...new Uint8Array(value))) };
        }
        if (Array.isArray(value)) {
            return value.map(i => this._serialize(i));
        }
        if (value !== null && typeof value === 'object') {
            const result = {};
            for (const key in value) {
                result[key] = this._serialize(value[key]);
            }
            return result;
        }
        return value;
    }

    _deserialize(value) {
        if (value !== null && typeof value === 'object') {
            if (value.__type === 'ArrayBuffer') {
                const bin = atob(value.data);
                const buf = new ArrayBuffer(bin.length);
                const view = new Uint8Array(buf);
                for (let i = 0; i < bin.length; i++) {
                    view[i] = bin.charCodeAt(i);
                }
                return buf;
            }
            if (Array.isArray(value)) {
                return value.map(i => this._deserialize(i));
            }
            const result = {};
            for (const key in value) {
                result[key] = this._deserialize(value[key]);
            }
            return result;
        }
        return value;
    }

    get(key, defaultValue) {
        if (typeof window === 'undefined') return defaultValue;
        const val = localStorage.getItem('signal_' + key);
        if (val === null) return defaultValue;
        return this._deserialize(JSON.parse(val));
    }

    put(key, value) {
        if (typeof window === 'undefined') return;
        localStorage.setItem('signal_' + key, JSON.stringify(this._serialize(value)));
    }

    remove(key) {
        if (typeof window === 'undefined') return;
        localStorage.removeItem('signal_' + key);
    }

    // Identity
    async getIdentityKeyPair() {
        return this.get('identityKey');
    }

    async getLocalRegistrationId() {
        return this.get('registrationId');
    }

    async putIdentity(address, identityKey) {
        this.put('identity_' + address, identityKey);
    }

    async getIdentity(address) {
        return this.get('identity_' + address);
    }

    async isTrustedIdentity(address, identityKey, direction) {
        if (address === null || address === undefined) return false;
        const trusted = await this.getIdentity(address);
        if (trusted === null || trusted === undefined) return true;
        return identityKey === trusted;
    }

    // PreKeys
    async loadPreKey(keyId) {
        return this.get('prekey_' + keyId);
    }

    async storePreKey(keyId, keyPair) {
        this.put('prekey_' + keyId, keyPair);
    }

    async removePreKey(keyId) {
        this.remove('prekey_' + keyId);
    }

    // Signed PreKeys
    async loadSignedPreKey(keyId) {
        return this.get('signedprekey_' + keyId);
    }

    async storeSignedPreKey(keyId, keyPair) {
        this.put('signedprekey_' + keyId, keyPair);
    }

    async removeSignedPreKey(keyId) {
        this.remove('signedprekey_' + keyId);
    }

    // Sessions
    async loadSession(address) {
        return this.get('session_' + address);
    }

    async storeSession(address, sessionRecord) {
        this.put('session_' + address, sessionRecord);
    }

    async removeSession(address) {
        this.remove('session_' + address);
    }

    async removeAllSessions() {
        if (typeof window === 'undefined') return;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('signal_session_')) {
                localStorage.removeItem(key);
            }
        }
    }
}
