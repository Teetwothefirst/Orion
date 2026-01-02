const db = require('../db');

module.exports = (io, socket) => {
    console.log('User connected:', socket.id);

    socket.on('user_online', (userId) => {
        socket.userId = userId;
        console.log(`User ${userId} is online`);

        // Broadcast online status to all rooms the user is in? 
        // Simple approach: Broadcast to everyone or let clients handle status checks.
        // Better: Broadcast to all connected sockets that this user is online.
        io.emit('user_status', { userId, status: 'online' });

        // Update last_seen to now (running)
        db.run(`UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?`, [userId]);
    });

    socket.on('join_room', (chatId) => {
        socket.join(chatId);
        console.log(`User ${socket.id} joined room ${chatId}`);
    });

    socket.on('send_message', (data) => {
        const { chatId, senderId, content, type, media_url, reply_to_id, forwarded_from_id } = data;
        const msgType = type || 'text';
        const msgStatus = 'sent';

        // Save to database
        db.run(`INSERT INTO messages (chat_id, sender_id, content, type, media_url, status, reply_to_id, forwarded_from_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [chatId, senderId, content, msgType, media_url, msgStatus, reply_to_id, forwarded_from_id],
            function (err) {
                if (err) {
                    console.error(err.message);
                    return;
                }

                // Fetch sender info to send back with message
                db.get(`SELECT username, avatar FROM users WHERE id = ?`, [senderId], (err, user) => {
                    const messageData = {
                        id: this.lastID,
                        chat_id: chatId,
                        sender_id: senderId,
                        content: content,
                        type: msgType,
                        media_url: media_url,
                        status: msgStatus,
                        reply_to_id: reply_to_id,
                        forwarded_from_id: forwarded_from_id,
                        created_at: new Date().toISOString(),
                        username: user ? user.username : 'Unknown',
                        avatar: user ? user.avatar : null
                    };

                    // Broadcast to room
                    io.to(chatId).emit('receive_message', messageData);
                });
            }
        );
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
