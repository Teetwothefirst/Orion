const express = require('express');
const db = require('../db');

const router = express.Router();

// Get all chats for a user
router.get('/', (req, res) => {
    const userId = req.query.userId;

    const sql = `
        SELECT c.*, 
               (SELECT content FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
               (SELECT created_at FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time
        FROM chats c
        JOIN chat_participants cp ON c.id = cp.chat_id
        WHERE cp.user_id = ?
        ORDER BY last_message_time DESC
    `;

    db.all(sql, [userId], (err, chats) => {
        if (err) return res.status(500).send("Error retrieving chats.");
        res.status(200).send(chats);
    });
});

// Create a new chat (or get existing private chat)
router.post('/', (req, res) => {
    const { userId, otherUserId } = req.body;

    // Check if private chat already exists
    const checkSql = `
        SELECT c.id 
        FROM chats c
        JOIN chat_participants cp1 ON c.id = cp1.chat_id
        JOIN chat_participants cp2 ON c.id = cp2.chat_id
        WHERE c.type = 'private' AND cp1.user_id = ? AND cp2.user_id = ?
    `;

    db.get(checkSql, [userId, otherUserId], (err, chat) => {
        if (chat) {
            return res.status(200).send(chat);
        }

        // Create new chat
        db.run(`INSERT INTO chats (name, type) VALUES (?, ?)`, ['Private Chat', 'private'], function (err) {
            if (err) return res.status(500).send("Error creating chat.");
            const chatId = this.lastID;

            // Add participants
            const stmt = db.prepare(`INSERT INTO chat_participants (chat_id, user_id) VALUES (?, ?)`);
            stmt.run(chatId, userId);
            stmt.run(chatId, otherUserId);
            stmt.finalize();

            res.status(200).send({ id: chatId });
        });
    });
});

// Get messages for a chat
router.get('/:id/messages', (req, res) => {
    const chatId = req.params.id;

    const sql = `
        SELECT m.*, u.username, u.avatar
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.chat_id = ?
        ORDER BY m.created_at ASC
    `;

    db.all(sql, [chatId], (err, messages) => {
        if (err) return res.status(500).send("Error retrieving messages.");
        res.status(200).send(messages);
    });
});

module.exports = router;
