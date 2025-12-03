const db = require('../db');

module.exports = (io, socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_room', (chatId) => {
        socket.join(chatId);
        console.log(`User ${socket.id} joined room ${chatId}`);
    });

    socket.on('send_message', (data) => {
        const { chatId, senderId, content } = data;

        // Save to database
        db.run(`INSERT INTO messages (chat_id, sender_id, content) VALUES (?, ?, ?)`,
            [chatId, senderId, content],
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

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
};
