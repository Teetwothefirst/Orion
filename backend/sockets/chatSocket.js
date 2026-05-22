const db = require('../db');
const axios = require('axios');

const sendPushNotification = async (userId, title, body, data = {}) => {
    db.all('SELECT token FROM push_tokens WHERE user_id = ?', [userId], async (err, rows) => {
        if (err || !rows.length) return;

        const messages = rows.map(row => ({
            to: row.token,
            sound: 'default',
            title: title,
            body: body,
            data: data,
        }));

        try {
            await axios.post('https://exp.host/--/api/v2/push/send', messages, {
                headers: {
                    'Accept': 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
            });
            console.log(`Push notification sent to user ${userId}`);
        } catch (error) {
            console.error('Error sending push notification to Expo:', error.response?.data || error.message);
        }
    });
};

module.exports = (io, socket) => {
    console.log('User connected:', socket.id);

    socket.on('user_online', (userId) => {
        socket.userId = userId;
        console.log(`User ${userId} is online`);

        io.emit('user_status', { userId, status: 'online' });

        db.run(`UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?`, [userId]);
    });

    socket.on('join_room', (chatId) => {
        socket.join(chatId);
        console.log(`User ${socket.id} joined room ${chatId}`);
    });

    socket.on('send_message', (data) => {
        const { chatId, senderId, content, type, media_url, reply_to_id, forwarded_from_id, scheduledFor } = data;

        // Permission check for Channels
        db.get('SELECT type FROM chats WHERE id = ?', [chatId], (err, chat) => {
            if (!err && chat && chat.type === 'channel') {
                db.get('SELECT role FROM chat_participants WHERE chat_id = ? AND user_id = ?', [chatId, senderId], (err, participant) => {
                    if (err || !participant || (participant.role !== 'admin' && participant.role !== 'owner')) {
                        console.log(`User ${senderId} tried to post in channel ${chatId} without permission.`);
                        return; // Silently fail or emit error
                    }
                    saveAndBroadcast();
                });
            } else {
                saveAndBroadcast();
            }
        });

        function saveAndBroadcast() {
            const msgType = type || 'text';
            const msgStatus = scheduledFor ? 'scheduled' : 'sent';
            const msgScheduledFor = scheduledFor || null;

            // Save to database
            db.run(`INSERT INTO messages (chat_id, sender_id, content, type, media_url, status, reply_to_id, forwarded_from_id, scheduled_for) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [chatId, senderId, content, msgType, media_url, msgStatus, reply_to_id, forwarded_from_id, msgScheduledFor],
                function (err) {
                    if (err) {
                        console.error(err.message);
                        return;
                    }

                    const lastID = this.lastID;
                    // Fetch message with details (username, avatar, reply context)
                    const fetchSql = `
                        SELECT m.*, u.username, u.avatar,
                               r.content as reply_content, r.sender_id as reply_sender_id
                        FROM messages m
                        JOIN users u ON m.sender_id = u.id
                        LEFT JOIN messages r ON m.reply_to_id = r.id
                        WHERE m.id = ?
                    `;

                    db.get(fetchSql, [lastID], (err, messageData) => {
                        if (err || !messageData) {
                            console.error('Error fetching broadcast data:', err);
                            return;
                        }

                        // Broadcast to room
                        io.to(chatId).emit('receive_message', messageData);

                        // Send push notification to other participants
                        db.all('SELECT user_id FROM chat_participants WHERE chat_id = ? AND user_id != ?', [chatId, senderId], (err, participants) => {
                            if (!err && participants) {
                                participants.forEach(p => {
                                    const notificationBody = msgType === 'text' ? content : `Sent a ${msgType}`;
                                    sendPushNotification(p.user_id, messageData.username, notificationBody, { chatId: parseInt(chatId) });
                                });
                            }
                        });
                    });
                }
            );
        }
    });

    socket.on('message_delivered', (data) => {
        const { messageId, chatId } = data;
        db.run(`UPDATE messages SET status = 'delivered' WHERE id = ? AND status = 'sent'`, [messageId], (err) => {
            if (!err) {
                io.to(chatId).emit('status_update', { messageId, status: 'delivered' });
            }
        });
    });

    socket.on('message_read', (data) => {
        const { chatId, userId } = data;
        // Mark all messages in this chat as read for the user
        db.run(`UPDATE messages SET status = 'read' WHERE chat_id = ? AND sender_id != ? AND status != 'read'`, [chatId, userId], (err) => {
            if (!err) {
                io.to(chatId).emit('chat_read', { chatId, userId });
            }
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        if (socket.userId) {
            const lastSeen = new Date().toISOString();
            db.run(`UPDATE users SET last_seen = ? WHERE id = ?`, [lastSeen, socket.userId], (err) => {
                if (!err) {
                    io.emit('user_status', { userId: socket.userId, status: 'offline', lastSeen });
                }
            });
        }
    });
};
