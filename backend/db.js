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
            let queryText = translateParams(text);
            const isInsert = queryText.trim().toUpperCase().startsWith('INSERT');
            const hasReturning = queryText.toUpperCase().includes('RETURNING');

            // Only append RETURNING id if it's an insert, doesn't have one, 
            // and isn't a known table without an id (though we are adding id to chat_participants)
            if (isInsert && !hasReturning) {
                queryText += ' RETURNING id';
            }

            pool.query(queryText, params, (err, res) => {
                // If it fails with "column id does not exist", retry without RETURNING id
                if (err && err.message.includes('column "id" does not exist') && isInsert && !hasReturning) {
                    const originalQuery = translateParams(text);
                    return pool.query(originalQuery, params, (retryErr, retryRes) => {
                        if (callback) callback.call({}, retryErr);
                    });
                }

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
            creator_id INTEGER,
            invite_code TEXT UNIQUE,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS chat_participants (
            id ${isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
            chat_id INTEGER,
            user_id INTEGER,
            role TEXT DEFAULT 'member' -- 'owner', 'admin', 'member'
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
        )`,
        `CREATE TABLE IF NOT EXISTS signal_identities (
            user_id INTEGER PRIMARY KEY,
            public_key TEXT,
            registration_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS signal_prekeys (
            id ${isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
            user_id INTEGER,
            key_id INTEGER,
            public_key TEXT,
            signature TEXT,
            type TEXT, -- 'signed' or 'one-time'
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
    ];

    if (isPostgres) {
        queries.forEach(q => db.query(q).catch(err => console.error('PG Init Error:', err.message)));

        // Postgres Migrations (handling missing columns)
        db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT").catch(() => { });
        db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP").catch(() => { });

        // Phase 2-4 migrations for Postgres
        db.query("ALTER TABLE messages ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text'").catch(() => { });
        db.query("ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_url TEXT").catch(() => { });
        db.query("ALTER TABLE messages ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent'").catch(() => { });
        db.query("ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id INTEGER").catch(() => { });
        db.query("ALTER TABLE messages ADD COLUMN IF NOT EXISTS forwarded_from_id INTEGER").catch(() => { });
        db.query("ALTER TABLE chats ADD COLUMN IF NOT EXISTS creator_id INTEGER").catch(() => { });
        db.query("ALTER TABLE chats ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE").catch(() => { });
        db.query("ALTER TABLE chat_participants ADD COLUMN IF NOT EXISTS id SERIAL PRIMARY KEY").catch(() => { });
        db.query("ALTER TABLE chat_participants ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member'").catch(() => { });
    } else {
        db.serialize(() => {
            queries.forEach((q, index) => {
                db.run(q, (err) => {
                    if (err && !err.message.includes('already exists') && !err.message.includes('duplicate column name')) {
                        console.error(`SQLite Init Error (query ${index}):`, err.message);
                    }
                });
            });

            // Sequential migrations
            const migrations = [
                "ALTER TABLE users ADD COLUMN reset_token TEXT",
                "ALTER TABLE users ADD COLUMN reset_token_expiry INTEGER",
                "ALTER TABLE users ADD COLUMN bio TEXT",
                "ALTER TABLE users ADD COLUMN last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
                "ALTER TABLE messages ADD COLUMN type TEXT DEFAULT 'text'",
                "ALTER TABLE messages ADD COLUMN media_url TEXT",
                "ALTER TABLE messages ADD COLUMN status TEXT DEFAULT 'sent'",
                "ALTER TABLE messages ADD COLUMN reply_to_id INTEGER",
                "ALTER TABLE messages ADD COLUMN forwarded_from_id INTEGER",
                "ALTER TABLE chats ADD COLUMN creator_id INTEGER",
                "ALTER TABLE chats ADD COLUMN invite_code TEXT UNIQUE",
                "ALTER TABLE chat_participants ADD COLUMN role TEXT DEFAULT 'member'"
            ];

            migrations.forEach(m => {
                db.run(m, (err) => {
                    // Ignore "already exists" errors for columns
                    if (err && !err.message.includes('duplicate column name') && !err.message.includes('already exists')) {
                        console.error("Migration Error:", err.message, "Query:", m);
                    }
                });
            });
        });
    }
};

initDb();

module.exports = db;
