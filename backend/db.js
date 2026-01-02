let db;

if (process.env.DATABASE_URL) {
    // PostgreSQL (Production)
    const { Pool } = require('pg');
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    // Helper to convert SQLite "?" placeholders to Postgres "$1, $2..."
    const translateParams = (sql) => {
        let count = 1;
        return sql.replace(/\?/g, () => `$${count++}`);
    };

    db = {
        query: (text, params) => pool.query(translateParams(text), params),
        get: (text, params, callback) => {
            pool.query(translateParams(text), params, (err, res) => {
                if (callback) callback(err, res ? res.rows[0] : null);
            });
        },
        all: (text, params, callback) => {
            pool.query(translateParams(text), params, (err, res) => {
                if (callback) callback(err, res ? res.rows : []);
            });
        },
        run: function (text, params, callback) {
            // Postgres doesn't have this.lastID in the same way. 
            // We append RETURNING id if it's an insert to mimic behavior for the specific usage in our routes.
            let queryText = translateParams(text);
            if (queryText.trim().toUpperCase().startsWith('INSERT')) {
                queryText += ' RETURNING id';
            }
            pool.query(queryText, params, (err, res) => {
                const result = res ? { lastID: res.rows[0]?.id } : {};
                if (callback) callback.call(result, err);
            });
        },
        serialize: (cb) => cb() // Noop for Postgres
    };
    console.log('Connected to the PostgreSQL database.');
} else {
    // SQLite (Local Development)
    const sqlite3 = require('sqlite3').verbose();
    const path = require('path');
    const dbPath = path.resolve(__dirname, 'chat.db');

    const sqliteDb = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error opening database ' + dbPath + ': ' + err.message);
        } else {
            console.log('Connected to the SQLite database.');
        }
    });

    // Wrapper to mimic pg's query method for limited compatibility
    db = {
        query: (text, params) => {
            return new Promise((resolve, reject) => {
                const method = text.trim().startsWith('SELECT') ? 'all' : 'run';
                sqliteDb[method](text, params, function (err, result) {
                    if (err) reject(err);
                    else resolve({ rows: result || [], lastID: this.lastID });
                });
            });
        },
        // Direct access if needed
        run: (...args) => sqliteDb.run(...args),
        get: (...args) => sqliteDb.get(...args),
        all: (...args) => sqliteDb.all(...args),
        serialize: (cb) => sqliteDb.serialize(cb)
    };
}

const initDb = () => {
    const isPostgres = !!process.env.DATABASE_URL;
    const autoIncrement = isPostgres ? 'SERIAL' : 'INTEGER';
    const primaryKey = isPostgres ? 'PRIMARY KEY' : 'PRIMARY KEY AUTOINCREMENT';
    const timestampDefault = isPostgres ? 'CURRENT_TIMESTAMP' : 'CURRENT_TIMESTAMP';

    const queries = [
        `CREATE TABLE IF NOT EXISTS users (
            id ${isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
            username TEXT UNIQUE,
            email TEXT UNIQUE,
            password TEXT,
            avatar TEXT,
            bio TEXT,
            last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            reset_token TEXT,
            reset_token_expiry BIGINT
        )`,
        `CREATE TABLE IF NOT EXISTS chats (
            id ${isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
            name TEXT,
            type TEXT DEFAULT 'private',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS chat_participants (
            chat_id INTEGER,
            user_id INTEGER,
            PRIMARY KEY (chat_id, user_id)
        )`,
        `CREATE TABLE IF NOT EXISTS messages (
            id ${isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
            chat_id INTEGER,
            sender_id INTEGER,
            content TEXT,
            type TEXT DEFAULT 'text',
            media_url TEXT,
            status TEXT DEFAULT 'sent',
            reply_to_id INTEGER,
            forwarded_from_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS push_tokens (
            id ${isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
            user_id INTEGER,
            token TEXT UNIQUE,
            platform TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
    ];

    if (isPostgres) {
        queries.forEach(q => db.query(q).catch(err => console.error('PG Init Error:', err.message)));
    } else {
        db.serialize(() => {
            queries.forEach(q => db.run(q));
            // Migration for existing databases
            db.run("ALTER TABLE users ADD COLUMN reset_token TEXT", (err) => { /* ignore */ });
            db.run("ALTER TABLE users ADD COLUMN reset_token_expiry INTEGER", (err) => { /* ignore */ });
            db.run("ALTER TABLE users ADD COLUMN bio TEXT", (err) => { /* ignore */ });
            db.run("ALTER TABLE users ADD COLUMN last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP", (err) => { /* ignore */ });
            // Messaging Phase 2 migrations
            db.run("ALTER TABLE messages ADD COLUMN type TEXT DEFAULT 'text'", (err) => { /* ignore */ });
            db.run("ALTER TABLE messages ADD COLUMN media_url TEXT", (err) => { /* ignore */ });
            db.run("ALTER TABLE messages ADD COLUMN status TEXT DEFAULT 'sent'", (err) => { /* ignore */ });
            db.run("ALTER TABLE messages ADD COLUMN reply_to_id INTEGER", (err) => { /* ignore */ });
            db.run("ALTER TABLE messages ADD COLUMN forwarded_from_id INTEGER", (err) => { /* ignore */ });
        });
    }
};

initDb();

module.exports = db;
