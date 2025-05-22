const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory storage (in production, use a database)
const users = new Map();
const sessions = new Map();
const messages = new Map(); // Map of roomId -> messages array
const activeUsers = new Map(); // Map of socketId -> user info

// Utility functions
const generateSessionId = () => Math.random().toString(36).substring(2, 15);

const createRoomId = (userId1, userId2) => {
  return [userId1, userId2].sort().join('-');
};

const authenticateSocket = (socket, next) => {
  const sessionId = socket.handshake.auth.sessionId;
  
  if (!sessionId || !sessions.has(sessionId)) {
    return next(new Error('Authentication failed'));
  }
  
  const userId = sessions.get(sessionId);
  const user = users.get(userId);
  
  if (!user) {
    return next(new Error('User not found'));
  }
  
  socket.userId = userId;
  socket.user = user;
  next();
};

// Authentication Routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = Array.from(users.values()).find(
      user => user.username === username || user.email === email
    );
    
    if (existingUser) {
      return res.status(400).json({ 
        error: 'User with this username or email already exists' 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const userId = Date.now().toString();
    const user = {
      id: userId,
      username,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      isOnline: false
    };
    
    users.set(userId, user);
    
    res.status(201).json({ 
      message: 'User registered successfully',
      userId: userId 
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const user = Array.from(users.values()).find(
      user => user.username === username
    );
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Create session
    const sessionId = generateSessionId();
    sessions.set(sessionId, user.id);
    
    // Update user online status
    user.isOnline = true;
    
    res.json({
      message: 'Login successful',
      sessionId,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/logout', (req, res) => {
  const { sessionId } = req.body;
  
  if (sessions.has(sessionId)) {
    const userId = sessions.get(sessionId);
    const user = users.get(userId);
    
    if (user) {
      user.isOnline = false;
    }
    
    sessions.delete(sessionId);
  }
  
  res.json({ message: 'Logout successful' });
});

// Get available users to chat with
app.get('/api/users', (req, res) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const currentUserId = sessions.get(sessionId);
  const availableUsers = Array.from(users.values())
    .filter(user => user.id !== currentUserId)
    .map(user => ({
      id: user.id,
      username: user.username,
      isOnline: user.isOnline
    }));
  
  res.json({ users: availableUsers });
});

// Get chat history
app.get('/api/messages/:targetUserId', (req, res) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const currentUserId = sessions.get(sessionId);
  const targetUserId = req.params.targetUserId;
  const roomId = createRoomId(currentUserId, targetUserId);
  
  const chatMessages = messages.get(roomId) || [];
  
  res.json({ messages: chatMessages });
});

// Socket.io connection handling
io.use(authenticateSocket);

io.on('connection', (socket) => {
  console.log(`User ${socket.user.username} connected`);
  
  // Store active user
  activeUsers.set(socket.id, {
    userId: socket.userId,
    username: socket.user.username,
    socketId: socket.id
  });
  
  // Update user online status
  socket.user.isOnline = true;
  
  // Notify other users that this user is online
  socket.broadcast.emit('userOnline', {
    userId: socket.userId,
    username: socket.user.username
  });
  
  // Join user to their personal room
  socket.join(socket.userId);
  
  // Handle private message
  socket.on('privateMessage', (data) => {
    const { targetUserId, message, timestamp } = data;
    
    // Validate target user exists
    if (!users.has(targetUserId)) {
      socket.emit('error', { message: 'Target user not found' });
      return;
    }
    
    // Create room ID for this conversation
    const roomId = createRoomId(socket.userId, targetUserId);
    
    // Create message object
    const messageObj = {
      id: Date.now().toString(),
      senderId: socket.userId,
      senderUsername: socket.user.username,
      targetUserId,
      message,
      timestamp: timestamp || new Date(),
      roomId
    };
    
    // Store message
    if (!messages.has(roomId)) {
      messages.set(roomId, []);
    }
    messages.get(roomId).push(messageObj);
    
    // Send message to target user if they're online
    socket.to(targetUserId).emit('newPrivateMessage', messageObj);
    
    // Confirm message sent to sender
    socket.emit('messageSent', messageObj);
    
    console.log(`Message from ${socket.user.username} to user ${targetUserId}: ${message}`);
  });
  
  // Handle typing indicators
  socket.on('typing', (data) => {
    const { targetUserId, isTyping } = data;
    socket.to(targetUserId).emit('userTyping', {
      userId: socket.userId,
      username: socket.user.username,
      isTyping
    });
  });
  
  // Handle joining a specific chat room
  socket.on('joinChat', (data) => {
    const { targetUserId } = data;
    const roomId = createRoomId(socket.userId, targetUserId);
    socket.join(roomId);
    
    // Send chat history
    const chatHistory = messages.get(roomId) || [];
    socket.emit('chatHistory', { messages: chatHistory });
  });
  
  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log(`User ${socket.user.username} disconnected`);
    
    // Remove from active users
    activeUsers.delete(socket.id);
    
    // Update user online status if no other connections
    const userStillConnected = Array.from(activeUsers.values())
      .some(user => user.userId === socket.userId);
    
    if (!userStillConnected) {
      socket.user.isOnline = false;
      
      // Notify other users that this user is offline
      socket.broadcast.emit('userOffline', {
        userId: socket.userId,
        username: socket.user.username
      });
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready for connections`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});