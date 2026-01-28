import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';

const dbName = 'orion_chat.db';

export interface LocalChat {
    id: number;
    type: string;
    name: string;
    updated_at: string;
    invite_code: string | null;
    other_user_id: number | null;
    last_message: string | null;
    last_message_type: string | null;
    last_message_time: string | null;
}

export interface LocalMessage {
    id: number;
    chat_id: number;
    sender_id: number;
    content: string;
    type: string;
    media_url: string | null;
    status: string;
    reply_to_id: number | null;
    reply_sender_id: number | null;
    reply_content: string | null;
    created_at: string;
    username: string;
    avatar: string | null;
}

class LocalDatabaseService {
    private dbPromise: Promise<SQLite.SQLiteDatabase | null> | null = null;
    private initialized = false;

    constructor() {
        // Only initialize on client-side (Native or Browser)
        if (typeof window !== 'undefined' || Platform.OS !== 'web') {
            this.getDb();
        }
    }

    private async getDb(): Promise<SQLite.SQLiteDatabase | null> {
        if (!this.dbPromise) {
            // Check if we are in an environment where SQLite is available
            if (typeof window === 'undefined' && Platform.OS === 'web') {
                return null; // Don't run on server
            }
            try {
                this.dbPromise = SQLite.openDatabaseAsync(dbName);
                if (!this.initialized) {
                    await this.init();
                }
            } catch (err) {
                console.error('Failed to open local database:', err);
                return null;
            }
        }
        return this.dbPromise;
    }

    private async init() {
        if (this.initialized) return;
        const db = await this.dbPromise;
        if (!db) return;

        try {
            await db.execAsync(`
                PRAGMA journal_mode = WAL;
                CREATE TABLE IF NOT EXISTS chats (
                    id INTEGER PRIMARY KEY,
                    type TEXT,
                    name TEXT,
                    updated_at TEXT,
                    invite_code TEXT,
                    other_user_id INTEGER,
                    last_message TEXT,
                    last_message_type TEXT,
                    last_message_time TEXT
                );
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY,
                    chat_id INTEGER,
                    sender_id INTEGER,
                    content TEXT,
                    type TEXT,
                    media_url TEXT,
                    status TEXT,
                    reply_to_id INTEGER,
                    reply_sender_id INTEGER,
                    reply_content TEXT,
                    created_at TEXT,
                    username TEXT,
                    avatar TEXT
                );
                CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
            `);
            this.initialized = true;
        } catch (err) {
            console.error('Failed to initialize local schema:', err);
        }
    }

    async saveChats(chats: LocalChat[]) {
        const db = await this.getDb();
        if (!db) return;
        try {
            await db.withTransactionAsync(async () => {
                for (const chat of chats) {
                    await db.runAsync(
                        `INSERT OR REPLACE INTO chats 
                        (id, type, name, updated_at, invite_code, other_user_id, last_message, last_message_type, last_message_time) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [chat.id, chat.type, chat.name, chat.updated_at, chat.invite_code, chat.other_user_id, chat.last_message, chat.last_message_type, chat.last_message_time]
                    );
                }
            });
        } catch (err) {
            console.error('Error saving chats to local cache:', err);
        }
    }

    async getCachedChats(): Promise<LocalChat[]> {
        const db = await this.getDb();
        if (!db) return [];
        try {
            return await db.getAllAsync<LocalChat>('SELECT * FROM chats ORDER BY last_message_time DESC');
        } catch (err) {
            console.warn('Error reading chat cache:', err);
            return [];
        }
    }

    async saveMessages(chatId: number, messages: LocalMessage[]) {
        const db = await this.getDb();
        if (!db) return;
        try {
            await db.withTransactionAsync(async () => {
                for (const msg of messages) {
                    await db.runAsync(
                        `INSERT OR REPLACE INTO messages 
                        (id, chat_id, sender_id, content, type, media_url, status, reply_to_id, reply_sender_id, reply_content, created_at, username, avatar) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [msg.id, msg.chat_id, msg.sender_id, msg.content, msg.type, msg.media_url, msg.status, msg.reply_to_id, msg.reply_sender_id, msg.reply_content, msg.created_at, msg.username, msg.avatar]
                    );
                }
            });
        } catch (err) {
            console.error('Error saving messages to local cache:', err);
        }
    }

    async saveSingleMessage(msg: LocalMessage) {
        const db = await this.getDb();
        if (!db) return;
        try {
            await db.withTransactionAsync(async () => {
                await db.runAsync(
                    `INSERT OR REPLACE INTO messages 
                    (id, chat_id, sender_id, content, type, media_url, status, reply_to_id, reply_sender_id, reply_content, created_at, username, avatar) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [msg.id, msg.chat_id, msg.sender_id, msg.content, msg.type, msg.media_url, msg.status, msg.reply_to_id, msg.reply_sender_id, msg.reply_content, msg.created_at, msg.username, msg.avatar]
                );
                // Also update the chat's last message
                await db.runAsync(
                    `UPDATE chats SET last_message = ?, last_message_type = ?, last_message_time = ? WHERE id = ?`,
                    [msg.content, msg.type, msg.created_at, msg.chat_id]
                );
            });
        } catch (err) {
            console.error('Error saving single message to local cache:', err);
        }
    }

    async getCachedMessages(chatId: number): Promise<LocalMessage[]> {
        const db = await this.getDb();
        if (!db) return [];
        try {
            return await db.getAllAsync<LocalMessage>('SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC', [chatId]);
        } catch (err) {
            console.warn('Error reading message cache:', err);
            return [];
        }
    }

    async deleteChat(chatId: number) {
        const db = await this.getDb();
        if (!db) return;
        try {
            await db.withTransactionAsync(async () => {
                await db.runAsync('DELETE FROM messages WHERE chat_id = ?', [chatId]);
                await db.runAsync('DELETE FROM chats WHERE id = ?', [chatId]);
            });
        } catch (err) {
            console.error('Error deleting local chat cache:', err);
        }
    }

    async clearLocalData() {
        const db = await this.getDb();
        if (!db) return;
        try {
            await db.withTransactionAsync(async () => {
                await db.runAsync('DELETE FROM messages');
                await db.runAsync('DELETE FROM chats');
            });
        } catch (err) {
            console.error('Error clearing local cache:', err);
        }
    }
}

export const localDb = new LocalDatabaseService();
