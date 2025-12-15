const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'chat.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + dbPath + ': ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        email TEXT UNIQUE,
        password TEXT,
        avatar TEXT,
        reset_token TEXT,
        reset_token_expiry INTEGER
    )`);

    // Chats table
    db.run(`CREATE TABLE IF NOT EXISTS chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        type TEXT DEFAULT 'private', -- 'private' or 'group'
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Chat Participants table
    db.run(`CREATE TABLE IF NOT EXISTS chat_participants (
        chat_id INTEGER,
        user_id INTEGER,
        PRIMARY KEY (chat_id, user_id),
        FOREIGN KEY (chat_id) REFERENCES chats(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Messages table
    db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id INTEGER,
        sender_id INTEGER,
        content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chat_id) REFERENCES chats(id),
        FOREIGN KEY (sender_id) REFERENCES users(id)
    )`);

    // Migration for existing databases
    db.run("ALTER TABLE users ADD COLUMN reset_token TEXT", (err) => { /* ignore */ });
    db.run("ALTER TABLE users ADD COLUMN reset_token_expiry INTEGER", (err) => { /* ignore */ });
});

module.exports = db;
