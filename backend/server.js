const express = require('express');
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const db = require('./db');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const usersRoutes = require('./routes/users');
const supportRoutes = require('./routes/support');
const chatSocket = require('./sockets/chatSocket');
const { sendBugReportEmail } = require('./utils/mailer');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for mobile app
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// Middleware to attach io to req
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/chats', chatRoutes);
app.use('/users', usersRoutes);
app.use('/support', supportRoutes);
app.use('/keys', require('./routes/keys'));

// Socket.io
io.on('connection', (socket) => {
    chatSocket(io, socket);
});

// Scheduler for scheduled messages
setInterval(() => {
    const now = new Date().toISOString();
    db.all(`SELECT * FROM messages WHERE status = 'scheduled' AND scheduled_for <= ?`, [now], (err, messages) => {
        if (err) {
            console.error('Error checking scheduled messages:', err);
            return;
        }
        messages.forEach(msg => {
            // Update status to sent
            db.run(`UPDATE messages SET status = 'sent', scheduled_for = NULL WHERE id = ?`, [msg.id], (updateErr) => {
                if (!updateErr) {
                    console.log(`Sending scheduled message ${msg.id}`);
                    const fetchSql = `
                        SELECT m.*, u.username, u.avatar,
                               r.content as reply_content, r.sender_id as reply_sender_id
                        FROM messages m
                        JOIN users u ON m.sender_id = u.id
                        LEFT JOIN messages r ON m.reply_to_id = r.id
                        WHERE m.id = ?
                    `;
                    db.get(fetchSql, [msg.id], (fetchErr, fullMsg) => {
                        if (!fetchErr && fullMsg) {
                            io.to(fullMsg.chat_id).emit('receive_message', fullMsg);
                        }
                    });
                }
            });
        });
    });
}, 60000); // Check every minute

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Automatic Crash Reporting for Backend
process.on('uncaughtException', async (error) => {
    console.error('CRITICAL ERROR: Uncaught Exception:', error);
    await sendBugReportEmail({
        user: 'Backend System',
        description: 'Backend Uncaught Exception',
        deviceInfo: {
            platform: process.platform,
            arch: process.arch,
            version: process.version,
            memory: process.memoryUsage()
        },
        isCrash: true,
        stackTrace: error.stack
    });
    process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
    console.error('CRITICAL ERROR: Unhandled Rejection at:', promise, 'reason:', reason);
    await sendBugReportEmail({
        user: 'Backend System',
        description: 'Backend Unhandled Rejection',
        deviceInfo: {
            platform: process.platform,
            arch: process.arch,
            version: process.version,
        },
        isCrash: true,
        stackTrace: reason instanceof Error ? reason.stack : String(reason)
    });
});
