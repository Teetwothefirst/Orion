const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const db = require('./db');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const chatSocket = require('./sockets/chatSocket');

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

// Routes
app.use('/auth', authRoutes);
app.use('/chats', chatRoutes);

// Socket.io
io.on('connection', (socket) => {
    chatSocket(io, socket);
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Access locally via: http://localhost:${PORT}`);
    console.log(`Access from other devices via: http://<your-ip-address>:${PORT}`);
});
