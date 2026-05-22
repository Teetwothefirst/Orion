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
    db.all("SELECT id, username, email FROM users", [], (err, rows) => {
        if (err) {
            console.error('Error fetching users:', err);
        } else {
            console.log('Total Users Found:', rows.length);
            console.log(JSON.stringify(rows, null, 2));
        }
    });
});

db.close();
