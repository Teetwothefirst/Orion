const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../chat.db');

const db = new sqlite3.Database(dbPath);

const userId = 99999; // Test ID
const publicKey = 'test_pub_key';
const registrationId = 12345;

const query = `
    INSERT INTO signal_identities (user_id, public_key, registration_id) 
    VALUES (?, ?, ?) 
    ON CONFLICT(user_id) DO UPDATE SET public_key=excluded.public_key, registration_id=excluded.registration_id
`;

db.serialize(() => {
    console.log('Testing UPSERT query...');
    db.run(query, [userId, publicKey, registrationId], function (err) {
        if (err) {
            console.error('UPSERT FAILED:', err.message);
        } else {
            console.log('UPSERT SUCCESS. Rows affected:', this.changes);
        }
    });

    // Cleanup
    db.run("DELETE FROM signal_identities WHERE user_id = ?", [userId]);
});

db.close();
