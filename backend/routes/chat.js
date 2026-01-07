const express = require('express');
const db = require('../db');
const multer = require('multer');
const cloudinary = require('../utils/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const crypto = require('crypto');

const router = express.Router();

const generateInviteCode = () => crypto.randomBytes(6).toString('hex');

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
        SELECT c.id, c.type, c.name as group_name, c.updated_at, c.invite_code,
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
            return res.status(500).send("Error retrieving chats: " + err.message);
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
            if (err) {
                console.error('Error checking existing chat:', err);
                return res.status(500).send("Error checking existing chat: " + err.message);
            }
            if (chat) {
                return res.status(200).send(chat);
            }
            createChat(chatType, 'Private Chat', [userId, otherUserId], userId);
        });
    } else {
        // Group Chat
        // Always create a new group chat
        createChat(chatType, name || 'New Group', [userId, ...participantIds], userId);
    }

    function createChat(type, name, participants, creatorId) {
        const inviteCode = type !== 'private' ? generateInviteCode() : null;
        db.run(`INSERT INTO chats (name, type, creator_id, invite_code) VALUES (?, ?, ?, ?)`,
            [name, type, creatorId, inviteCode], function (err) {
                if (err) {
                    console.error('Error inserting chat:', err);
                    return res.status(500).send("Error creating chat entry: " + err.message);
                }
                const chatId = this.lastID;
                if (!chatId) {
                    console.error('Failed to get lastID after chat insertion');
                    return res.status(500).send("Error: Internal ID generation failure.");
                }

                // Add owner
                db.run(`INSERT INTO chat_participants (chat_id, user_id, role) VALUES (?, ?, 'owner')`, [chatId, creatorId], (err) => {
                    if (err) {
                        console.error('Error adding owner:', err);
                        return res.status(500).send("Error adding owner to chat: " + err.message);
                    }

                    const memberIds = participants.filter(id => id !== creatorId);
                    if (memberIds.length > 0) {
                        const placeholders = memberIds.map(() => '(?, ?, \'member\')').join(',');
                        const values = memberIds.flatMap(uid => [chatId, uid]);
                        db.run(`INSERT INTO chat_participants (chat_id, user_id, role) VALUES ${placeholders}`, values, (err) => {
                            if (err) {
                                console.error('Error adding members:', err);
                                return res.status(500).send("Error adding members to chat: " + err.message);
                            }
                            res.status(200).send({ id: chatId, name: name, type: type, invite_code: inviteCode });
                        });
                    } else {
                        res.status(200).send({ id: chatId, name: name, type: type, invite_code: inviteCode });
                    }
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

// Get chat info by invite code
router.get('/invite/:code', (req, res) => {
    const code = req.params.code;
    const sql = `SELECT id, name, type, avatar FROM chats WHERE invite_code = ?`;
    db.get(sql, [code], (err, chat) => {
        if (err || !chat) return res.status(404).send("Invite code not found.");
        res.status(200).send(chat);
    });
});

// Join chat by invite code
router.post('/join/:code', (req, res) => {
    const code = req.params.code;
    const { userId } = req.body;

    db.get(`SELECT id FROM chats WHERE invite_code = ?`, [code], (err, chat) => {
        if (err || !chat) return res.status(404).send("Invalid invite code.");

        // Check if already a participant
        db.get(`SELECT * FROM chat_participants WHERE chat_id = ? AND user_id = ?`, [chat.id, userId], (err, participant) => {
            if (participant) return res.status(200).send({ message: "Already a participant", chatId: chat.id });

            db.run(`INSERT INTO chat_participants (chat_id, user_id, role) VALUES (?, ?, 'member')`, [chat.id, userId], (err) => {
                if (err) return res.status(500).send("Error joining group.");
                res.status(200).send({ message: "Successfully joined group", chatId: chat.id });
            });
        });
    });
});

// Update participant role (Admin/Owner only)
router.post('/:id/role', (req, res) => {
    const chatId = req.params.id;
    const { adminId, targetUserId, role } = req.body; // role: 'admin' or 'member'

    // Check if requester is admin or owner
    const checkSql = `SELECT role FROM chat_participants WHERE chat_id = ? AND user_id = ?`;
    db.get(checkSql, [chatId, adminId], (err, participant) => {
        if (err || !participant || (participant.role !== 'admin' && participant.role !== 'owner')) {
            return res.status(403).send("Permission denied.");
        }

        db.run(`UPDATE chat_participants SET role = ? WHERE chat_id = ? AND user_id = ?`, [role, chatId, targetUserId], (err) => {
            if (err) return res.status(500).send("Error updating role.");
            res.status(200).send({ message: "Role updated successfully" });
        });
    });
});

// Kick participant (Admin/Owner only)
router.delete('/:id/participants/:userId', (req, res) => {
    const chatId = req.params.id;
    const targetUserId = req.params.userId;
    const adminId = req.query.adminId;

    db.get(`SELECT role FROM chat_participants WHERE chat_id = ? AND user_id = ?`, [chatId, adminId], (err, participant) => {
        if (err || !participant || (participant.role !== 'admin' && participant.role !== 'owner')) {
            return res.status(403).send("Permission denied.");
        }

        // Cannot kick the owner or another admin if you are just an admin
        db.get(`SELECT role FROM chat_participants WHERE chat_id = ? AND user_id = ?`, [chatId, targetUserId], (err, target) => {
            if (target && target.role === 'owner') return res.status(403).send("Cannot kick the owner.");
            if (participant.role === 'admin' && target && target.role === 'admin') return res.status(403).send("Admins cannot kick other admins.");

            db.run(`DELETE FROM chat_participants WHERE chat_id = ? AND user_id = ?`, [chatId, targetUserId], (err) => {
                if (err) return res.status(500).send("Error removing participant.");
                res.status(200).send({ message: "Participant removed successfully" });
            });
        });
    });
});

// Get all participants for a chat
router.get('/:id/participants', (req, res) => {
    const chatId = req.params.id;
    const sql = `
        SELECT u.id, u.username, u.avatar, cp.role 
        FROM users u
        JOIN chat_participants cp ON u.id = cp.user_id
        WHERE cp.chat_id = ?
    `;
    db.all(sql, [chatId], (err, participants) => {
        if (err) return res.status(500).send("Error retrieving participants.");
        res.status(200).send(participants);
    });
});

module.exports = router;
