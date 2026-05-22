const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../chat.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Could not connect to database:', err);
        process.exit(1);
    }
});

db.serialize(() => {
    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
        if (err) {
            console.error('Error fetching tables:', err);
        } else {
            console.log('Tables found:', tables.map(t => t.name));

            const signalTables = tables.filter(t => t.name.startsWith('signal'));
            if (signalTables.length === 0) {
                console.log('CRITICAL: Signal tables are MISSING!');
            } else {
                console.log('Signal tables present:', signalTables.map(t => t.name));
            }
        }
    });
});

db.close();
