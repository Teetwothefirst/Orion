const express = require('express');
const db = require('../db');
const multer = require('multer');
const cloudinary = require('../utils/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const router = express.Router();

// Multer & Cloudinary Storage Configuration
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'orion_chat_media',
        resource_type: 'auto', // Support image, video, raw (docs)
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'pdf', 'doc', 'docx', 'txt']
    }
});

const upload = multer({ storage: storage });

// Media Upload Endpoint
router.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send("No file uploaded.");
    }
    res.status(200).send({
        url: req.file.path,
        type: req.file.mimetype.split('/')[0] === 'image' ? 'image' :
            req.file.mimetype.split('/')[0] === 'video' ? 'video' : 'document',
        name: req.file.originalname
    });
});

// Get all chats for a user
router.get('/', (req, res) => {
    const userId = req.query.userId;

    const sql = `
        SELECT c.id, c.type, c.name as group_name, c.updated_at,
               CASE 
                   WHEN c.type = 'private' THEN (
                       SELECT u.id 
                       FROM users u 
                       JOIN chat_participants cp2 ON u.id = cp2.user_id 
                       WHERE cp2.chat_id = c.id AND u.id != ?
                       LIMIT 1
                   )
                   ELSE NULL
               END as other_user_id,
               CASE 
                   WHEN c.type = 'private' THEN (
                       SELECT u.username 
                       FROM users u 
                       JOIN chat_participants cp2 ON u.id = cp2.user_id 
                       WHERE cp2.chat_id = c.id AND u.id != ?
                       LIMIT 1
                   )
                   ELSE c.name 
               END as name,
               (SELECT content FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
               (SELECT type FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_type,
               (SELECT created_at FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time
        FROM chats c
        JOIN chat_participants cp ON c.id = cp.chat_id
        WHERE cp.user_id = ?
        ORDER BY last_message_time DESC
    `;

    db.all(sql, [userId, userId, userId], (err, chats) => {
        if (err) {
            console.error('Error retrieving chats:', err);
            return res.status(500).send("Error retrieving chats.");
        }
        res.status(200).send(chats);
    });
});

// Create a new chat (private or group)
router.post('/', (req, res) => {
    const { userId, otherUserId, type, name, participantIds } = req.body;
    const chatType = type || 'private';

    if (chatType === 'private') {
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
            createChat(chatType, 'Private Chat', [userId, otherUserId]);
        });
    } else {
        // Group Chat
        // Always create a new group chat
        createChat(chatType, name || 'New Group', [userId, ...participantIds]);
    }

    function createChat(type, name, participants) {
        db.run(`INSERT INTO chats (name, type) VALUES (?, ?)`, [name, type], function (err) {
            if (err) return res.status(500).send("Error creating chat.");
            const chatId = this.lastID;

            // Add participants
            const placeholders = participants.map(() => '(?, ?)').join(',');
            const values = participants.flatMap(uid => [chatId, uid]);

            db.run(`INSERT INTO chat_participants (chat_id, user_id) VALUES ${placeholders}`, values, (err) => {
                if (err) return res.status(500).send("Error adding participants.");
                res.status(200).send({ id: chatId, name: name, type: type });
            });
        });
    }
});

// Get messages for a chat
router.get('/:id/messages', (req, res) => {
    const chatId = req.params.id;

    const sql = `
        SELECT m.*, u.username, u.avatar,
               r.content as reply_content, r.sender_id as reply_sender_id
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        LEFT JOIN messages r ON m.reply_to_id = r.id
        WHERE m.chat_id = ?
        ORDER BY m.created_at ASC
    `;

    db.all(sql, [chatId], (err, messages) => {
        if (err) return res.status(500).send("Error retrieving messages.");
        res.status(200).send(messages);
    });
});

// Global Search: Messages, existing chats, and potentially new users
router.get('/search', (req, res) => {
    const { q, userId } = req.query;
    if (!q || !userId) {
        return res.status(400).send("Search query and userId are required.");
    }

    const searchQuery = `%${q}%`;
    const results = {
        messages: [],
        chats: [],
        users: []
    };

    // 1. Search Messages in user's chats
    const messagesSql = `
        SELECT m.*, u.username, u.avatar, c.name as chat_name
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        JOIN chats c ON m.chat_id = c.id
        JOIN chat_participants cp ON m.chat_id = cp.chat_id
        WHERE cp.user_id = ? AND m.content LIKE ?
        ORDER BY m.created_at DESC
        LIMIT 20
    `;

    // 2. Search Existing Chats/Groups
    const chatsSql = `
        SELECT c.*, 
               CASE 
                   WHEN c.type = 'private' THEN (
                       SELECT u.username FROM users u 
                       JOIN chat_participants cp2 ON u.id = cp2.user_id 
                       WHERE cp2.chat_id = c.id AND u.id != ?
                   )
                   ELSE c.name 
               END as name
        FROM chats c
        JOIN chat_participants cp ON c.id = cp.chat_id
        WHERE cp.user_id = ? AND name LIKE ?
        LIMIT 10
    `;

    // 3. Search Users (excluding current user and existing private chats? - keep it simple for now)
    const usersSql = `
        SELECT id, username, email, avatar 
        FROM users 
        WHERE id != ? AND (username LIKE ? OR email LIKE ?)
        LIMIT 10
    `;

    db.all(messagesSql, [userId, searchQuery], (err, messages) => {
        if (err) console.error('Search messages error:', err);
        results.messages = messages || [];

        db.all(chatsSql, [userId, userId, searchQuery], (err, chats) => {
            if (err) console.error('Search chats error:', err);
            results.chats = chats || [];

            db.all(usersSql, [userId, searchQuery, searchQuery], (err, users) => {
                if (err) console.error('Search users error:', err);
                results.users = users || [];
                res.status(200).send(results);
            });
        });
    });
});

module.exports = router;
