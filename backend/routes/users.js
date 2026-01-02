const express = require('express');
const db = require('../db');
const multer = require('multer');
const cloudinary = require('../utils/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const router = express.Router();

// Multer & Cloudinary Storage for Profile Pictures
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'orion_profiles',
        allowed_formats: ['jpg', 'jpeg', 'png']
    }
});

const upload = multer({ storage: storage });

// Get all users (excluding the current user)
router.get('/', (req, res) => {
    const currentUserId = req.query.currentUserId;

    let sql = 'SELECT id, username, email, avatar, bio, last_seen FROM users';
    const params = [];

    if (currentUserId) {
        sql += ' WHERE id != ?';
        params.push(currentUserId);
    }

    sql += ' ORDER BY username ASC';

    db.all(sql, params, (err, users) => {
        if (err) return res.status(500).send("Error retrieving users.");
        res.status(200).send(users);
    });
});

// Search users by username or email
router.get('/search', (req, res) => {
    const query = req.query.q;
    const currentUserId = req.query.currentUserId;

    if (!query) {
        return res.status(400).send("Search query is required.");
    }

    let sql = `
        SELECT id, username, email, avatar, bio, last_seen 
        FROM users 
        WHERE (username LIKE ? OR email LIKE ?)
    `;
    const params = [`%${query}%`, `%${query}%`];

    if (currentUserId) {
        sql += ' AND id != ?';
        params.push(currentUserId);
    }

    sql += ' ORDER BY username ASC LIMIT 20';

    db.all(sql, params, (err, users) => {
        if (err) return res.status(500).send("Error searching users.");
        res.status(200).send(users);
    });
});

// Update user profile
router.put('/profile', upload.single('avatar'), (req, res) => {
    const { userId, username, bio } = req.body;
    let avatarUrl = req.file ? req.file.path : null;

    if (!userId) {
        return res.status(400).send("User ID is required.");
    }

    // Build dynamic update query
    let fields = [];
    let params = [];

    if (username) {
        fields.push("username = ?");
        params.push(username);
    }
    if (bio !== undefined) {
        fields.push("bio = ?");
        params.push(bio);
    }
    if (avatarUrl) {
        fields.push("avatar = ?");
        params.push(avatarUrl);
    }

    if (fields.length === 0) {
        return res.status(400).send("No fields to update.");
    }

    params.push(userId);
    const sql = `UPDATE users SET \${fields.join(', ')} WHERE id = ?`;

    db.run(sql, params, function (err) {
        if (err) {
            console.error('Error updating profile:', err);
            if (err.message && err.message.includes('UNIQUE constraint failed: users.username')) {
                return res.status(400).send("Username already taken.");
            }
            return res.status(500).send("Error updating profile.");
        }

        // Fetch updated user
        db.get('SELECT id, username, email, avatar, bio, last_seen FROM users WHERE id = ?', [userId], (err, user) => {
            if (err) return res.status(500).send("Error retrieving updated profile.");
            res.status(200).send(user);
        });
    });
});

// Register or update push token
router.post('/push-token', (req, res) => {
    const { userId, token, platform } = req.body;

    if (!userId || !token) {
        return res.status(400).send("User ID and token are required.");
    }

    // Use INSERT OR REPLACE (SQLite) or ON CONFLICT (Postgres) logic
    // For simplicity, let's use a standard query that works with our db wrapper
    const sql = `
        INSERT INTO push_tokens (user_id, token, platform) 
        VALUES (?, ?, ?)
    `;

    // Check if token already exists to avoid unique constraint failure
    db.get('SELECT id FROM push_tokens WHERE token = ?', [token], (err, existing) => {
        if (existing) {
            // Update user_id if token exists but belongs to someone else (or just confirm)
            db.run('UPDATE push_tokens SET user_id = ?, platform = ? WHERE token = ?', [userId, platform, token], (err) => {
                if (err) return res.status(500).send("Error updating push token.");
                res.status(200).send({ message: "Push token updated." });
            });
        } else {
            db.run(sql, [userId, token, platform], function (err) {
                if (err) {
                    console.error('Error saving push token:', err);
                    return res.status(500).send("Error saving push token.");
                }
                res.status(201).send({ message: "Push token registered.", id: this.lastID });
            });
        }
    });
});

module.exports = router;
