const express = require('express');
const db = require('../db');
const multer = require('multer');
const cloudinary = require('../utils/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

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

// Get all sticker packs
router.get('/stickers', (req, res) => {
    const stickersPath = path.join(__dirname, '../data/stickers.json');
    fs.readFile(stickersPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading stickers:', err);
            return res.status(500).send("Error reading stickers.");
        }
        res.status(200).send(JSON.parse(data));
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

        if (messages.length === 0) {
            return res.status(200).send([]);
        }

        // Fetch reactions for these messages
        const messageIds = messages.map(m => m.id);
        const placeholders = messageIds.map(() => '?').join(',');
        const reactionsSql = `
            SELECT message_id, user_id, emoji
            FROM message_reactions
            WHERE message_id IN (${placeholders})
        `;

        db.all(reactionsSql, messageIds, (err, reactions) => {
            if (err) {
                console.error('Error fetching reactions:', err);
                // Return messages without reactions if error
                return res.status(200).send(messages);
            }

            // Map reactions to messages
            const messagesWithReactions = messages.map(m => {
                const messageReactions = reactions.filter(r => r.message_id === m.id);
                // Group by emoji
                const groupedReactions = {};
                messageReactions.forEach(r => {
                    if (!groupedReactions[r.emoji]) {
                        groupedReactions[r.emoji] = {
                            emoji: r.emoji,
                            count: 0,
                            user_ids: []
                        };
                    }
                    groupedReactions[r.emoji].count++;
                    groupedReactions[r.emoji].user_ids.push(r.user_id);
                });
                return { ...m, reactions: Object.values(groupedReactions) };
            });

            res.status(200).send(messagesWithReactions);
        });
    });
});

// Toggle reaction (Add/Remove)
router.post('/messages/:messageId/react', (req, res) => {
    const messageId = req.params.messageId;
    const { userId, emoji } = req.body;

    // Check if reaction exists
    db.get(`SELECT id FROM message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?`, [messageId, userId, emoji], (err, existing) => {
        if (err) return res.status(500).send("Error checking reaction.");

        const emitUpdate = (action) => {
            // Get chat_id for this message to broadcast
            db.get(`SELECT chat_id FROM messages WHERE id = ?`, [messageId], (err, msg) => {
                if (!err && msg && req.io) {
                    req.io.to(msg.chat_id.toString()).emit('reaction_update', {
                        messageId: parseInt(messageId),
                        userId,
                        emoji,
                        action
                    });
                }
            });
        };

        if (existing) {
            // Remove reaction
            db.run(`DELETE FROM message_reactions WHERE id = ?`, [existing.id], (err) => {
                if (err) return res.status(500).send("Error removing reaction.");
                emitUpdate('removed');
                res.status(200).send({ action: 'removed', messageId, emoji, userId });
            });
        } else {
            // Add reaction
            db.run(`INSERT INTO message_reactions (message_id, user_id, emoji) VALUES (?, ?, ?)`, [messageId, userId, emoji], (err) => {
                if (err) return res.status(500).send("Error adding reaction.");
                emitUpdate('added');
                res.status(200).send({ action: 'added', messageId, emoji, userId });
            });
        }
    });
});

// Delete message
router.delete('/messages/:messageId', (req, res) => {
    const messageId = req.params.messageId;
    const { userId } = req.body;

    // First, verify the user owns this message
    db.get(`SELECT chat_id, sender_id FROM messages WHERE id = ?`, [messageId], (err, message) => {
        if (err) return res.status(500).send("Error checking message ownership.");
        if (!message) return res.status(404).send("Message not found.");
        if (message.sender_id !== userId) return res.status(403).send("You can only delete your own messages.");

        // Delete the message
        db.run(`DELETE FROM messages WHERE id = ?`, [messageId], (err) => {
            if (err) return res.status(500).send("Error deleting message.");

            // Emit socket event to chat room
            if (req.io) {
                req.io.to(message.chat_id.toString()).emit('message_deleted', {
                    messageId: parseInt(messageId),
                    chatId: message.chat_id
                });
            }

            res.status(200).send({ success: true, messageId });
        });
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

// Add participants directly (Admin/Owner only)
router.post('/:id/participants', (req, res) => {
    const chatId = req.params.id;
    const { adminId, userIds } = req.body; // userIds is array of ids

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).send("No users specified.");
    }

    // Check permissions
    db.get(`SELECT role FROM chat_participants WHERE chat_id = ? AND user_id = ?`, [chatId, adminId], (err, participant) => {
        if (err || !participant || (participant.role !== 'admin' && participant.role !== 'owner')) {
            return res.status(403).send("Permission denied. Only admins can add members.");
        }

        // Add users
        const placeholders = userIds.map(() => '(?, ?, \'member\')').join(',');
        const values = userIds.flatMap(uid => [chatId, uid]);

        // Use INSERT OR IGNORE to skip duplicates
        db.run(`INSERT OR IGNORE INTO chat_participants (chat_id, user_id, role) VALUES ${placeholders}`, values, (err) => {
            if (err) {
                console.error('Error adding participants:', err);
                return res.status(500).send("Error adding participants.");
            }
            res.status(200).send({ message: "Participants added successfully" });
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

// Delete a chat (Group only, Admin/Owner only)
router.delete('/:id', (req, res) => {
    const chatId = req.params.id;
    const adminId = req.query.adminId;

    if (!adminId) {
        return res.status(400).send("adminId is required.");
    }

    // Check permissions
    db.get(`SELECT role FROM chat_participants WHERE chat_id = ? AND user_id = ?`, [chatId, adminId], (err, participant) => {
        if (err || !participant || (participant.role !== 'admin' && participant.role !== 'owner')) {
            return res.status(403).send("Permission denied. Only admins or owners can delete the group.");
        }

        // Notify participants before deletion
        req.io.to(chatId.toString()).emit('group_deleted', { chatId: parseInt(chatId) });

        // Manual cascading deletion
        db.serialize(() => {
            db.run(`BEGIN TRANSACTION`);

            // 1. Delete message reactions
            db.run(`DELETE FROM message_reactions WHERE message_id IN (SELECT id FROM messages WHERE chat_id = ?)`, [chatId]);

            // 2. Delete messages
            db.run(`DELETE FROM messages WHERE chat_id = ?`, [chatId]);

            // 3. Delete participants
            db.run(`DELETE FROM chat_participants WHERE chat_id = ?`, [chatId]);

            // 4. Delete the chat itself
            db.run(`DELETE FROM chats WHERE id = ?`, [chatId], (err) => {
                if (err) {
                    db.run(`ROLLBACK`);
                    console.error('Error deleting chat:', err);
                    return res.status(500).send("Error deleting chat.");
                }
                db.run(`COMMIT`);
                res.status(200).send({ message: "Chat deleted successfully" });
            });
        });
    });
});

module.exports = router;
