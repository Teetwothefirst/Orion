import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * SignalStore.ts (Mobile)
 * Implementation of the Signal Protocol storage interface using SecureStore and AsyncStorage.
 */

export class SignalStore {
    // Helper to convert objects with ArrayBuffers to/from JSON-friendly format
    private _serialize(value: any): any {
        if (value instanceof ArrayBuffer) {
            return { __type: 'ArrayBuffer', data: this._bufferToBase64(value) };
        }
        if (Array.isArray(value)) {
            return value.map(i => this._serialize(i));
        }
        if (value !== null && typeof value === 'object') {
            const result: any = {};
            for (const key in value) {
                result[key] = this._serialize(value[key]);
            }
            return result;
        }
        return value;
    }

    private _deserialize(value: any): any {
        if (value !== null && typeof value === 'object') {
            if (value.__type === 'ArrayBuffer') {
                return this._base64ToBuffer(value.data);
            }
            if (Array.isArray(value)) {
                return value.map(i => this._deserialize(i));
            }
            const result: any = {};
            for (const key in value) {
                result[key] = this._deserialize(value[key]);
            }
            return result;
        }
        return value;
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

    // --- Core Storage Logic ---

    // Identity and registration info (Extremely sensitive)
    async getIdentityKeyPair(): Promise<any> {
        const val = await SecureStore.getItemAsync('signal_identityKey');
        return val ? this._deserialize(JSON.parse(val)) : null;
    }

    async getLocalRegistrationId(): Promise<number | null> {
        const val = await SecureStore.getItemAsync('signal_registrationId');
        return val ? JSON.parse(val) : null;
    }

    async put(key: string, value: any) {
        // Generic put for registrationId and identityKey
        await SecureStore.setItemAsync('signal_' + key, JSON.stringify(this._serialize(value)));
    }

    async putIdentity(address: string, identityKey: ArrayBuffer) {
        await AsyncStorage.setItem('signal_identity_' + address, this._bufferToBase64(identityKey));
    }

    async getIdentity(address: string): Promise<ArrayBuffer | null> {
        const val = await AsyncStorage.getItem('signal_identity_' + address);
        return val ? this._base64ToBuffer(val) : null;
    }

    async isTrustedIdentity(address: string, identityKey: ArrayBuffer, direction: number): Promise<boolean> {
        if (!address) return false;
        const trusted = await this.getIdentity(address);
        if (trusted === null) return true;

        // Simple comparison of buffers
        const trustedArray = new Uint8Array(trusted);
        const currentArray = new Uint8Array(identityKey);
        if (trustedArray.length !== currentArray.length) return false;
        for (let i = 0; i < trustedArray.length; i++) {
            if (trustedArray[i] !== currentArray[i]) return false;
        }
        return true;
    }

    // PreKeys (One-time usage, sensitive)
    async loadPreKey(keyId: number): Promise<any> {
        const val = await SecureStore.getItemAsync(`signal_prekey_${keyId}`);
        return val ? this._deserialize(JSON.parse(val)) : null;
    }

    async storePreKey(keyId: number, keyPair: any) {
        await SecureStore.setItemAsync(`signal_prekey_${keyId}`, JSON.stringify(this._serialize(keyPair)));
    }

    async removePreKey(keyId: number) {
        await SecureStore.deleteItemAsync(`signal_prekey_${keyId}`);
    }

    // Signed PreKeys (Sensitive)
    async loadSignedPreKey(keyId: number): Promise<any> {
        const val = await SecureStore.getItemAsync(`signal_signedprekey_${keyId}`);
        return val ? this._deserialize(JSON.parse(val)) : null;
    }

    async storeSignedPreKey(keyId: number, keyPair: any) {
        await SecureStore.setItemAsync(`signal_signedprekey_${keyId}`, JSON.stringify(this._serialize(keyPair)));
    }

    async removeSignedPreKey(keyId: number) {
        await SecureStore.deleteItemAsync(`signal_signedprekey_${keyId}`);
    }

    // Sessions (Can be large, stored in AsyncStorage)
    async loadSession(address: string): Promise<string | null> {
        return await AsyncStorage.getItem('signal_session_' + address);
    }

    async storeSession(address: string, sessionRecord: string) {
        await AsyncStorage.setItem('signal_session_' + address, sessionRecord);
    }

    async removeSession(address: string) {
        await AsyncStorage.removeItem('signal_session_' + address);
    }

    async removeAllSessions() {
        const keys = await AsyncStorage.getAllKeys();
        const sessionKeys = keys.filter(k => k.startsWith('signal_session_'));
        await AsyncStorage.multiRemove(sessionKeys);
    }
}
