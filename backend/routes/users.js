const express = require('express');
const db = require('../db');

const router = express.Router();

// Get all users (excluding the current user)
router.get('/', (req, res) => {
    const currentUserId = req.query.currentUserId;

    let sql = 'SELECT id, username, email, avatar FROM users';
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
        SELECT id, username, email, avatar 
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

module.exports = router;
