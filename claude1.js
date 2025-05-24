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
// app.use(cors());
// Allow requests from your frontend origin
app.use(cors({
  origin: 'http://127.0.0.1:5500',
  // credentials: true // if you're sending cookies or auth headers
}));
app.use(express.json());
app.use(express.static('public'));

// In-memory storage (in production, use a database)
const users = new Map();
const sessions = new Map();
const messages = new Map(); // Map of roomId -> messages array
const activeUsers = new Map(); // Map of socketId -> user info
const groups = new Map(); // Map of groupId -> group object
const groupMessages = new Map(); // Map of groupId -> messages array

// Utility functions
const generateSessionId = () => Math.random().toString(36).substring(2, 15);

const createRoomId = (userId1, userId2) => {
  return [userId1, userId2].sort().join('-');
};

const generateGroupId = () => 'group_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

const createGroup = (name, description, createdBy, members = []) => {
  const groupId = generateGroupId();
  const group = {
    id: groupId,
    name: name.trim(),
    description: description ? description.trim() : '',
    createdBy,
    createdAt: new Date(),
    members: [createdBy, ...members.filter(m => m !== createdBy)], // Ensure creator is included
    admins: [createdBy], // Creator is automatically an admin
    isActive: true
  };
  
  groups.set(groupId, group);
  groupMessages.set(groupId, []);
  return group;
};

const addGroupMember = (groupId, userId, addedBy) => {
  const group = groups.get(groupId);
  if (!group || !group.isActive) return null;
  
  // Check if the person adding is an admin
  if (!group.admins.includes(addedBy)) return null;
  
  // Check if user is already a member
  if (group.members.includes(userId)) return group;
  
  group.members.push(userId);
  return group;
};

const removeGroupMember = (groupId, userId, removedBy) => {
  const group = groups.get(groupId);
  if (!group || !group.isActive) return null;
  
  // Check if the person removing is an admin or removing themselves
  if (!group.admins.includes(removedBy) && removedBy !== userId) return null;
  
  // Can't remove the creator
  if (userId === group.createdBy) return null;
  
  group.members = group.members.filter(m => m !== userId);
  group.admins = group.admins.filter(a => a !== userId);
  
  return group;
};

const getUserGroups = (userId) => {
  return Array.from(groups.values()).filter(group => 
    group.isActive && group.members.includes(userId)
  );
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

// Group Management Endpoints

// Create a new group
app.post('/api/groups', (req, res) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const currentUserId = sessions.get(sessionId);
  const { name, description, members = [] } = req.body;
  
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Group name is required' });
  }
  
  if (name.trim().length > 50) {
    return res.status(400).json({ error: 'Group name must be 50 characters or less' });
  }
  
  // Validate that all members exist
  const validMembers = members.filter(memberId => users.has(memberId));
  
  const group = createGroup(name, description, currentUserId, validMembers);
  
  res.status(201).json({ 
    message: 'Group created successfully',
    group: {
      id: group.id,
      name: group.name,
      description: group.description,
      createdBy: group.createdBy,
      createdAt: group.createdAt,
      members: group.members,
      admins: group.admins
    }
  });
});

// Get user's groups
app.get('/api/groups', (req, res) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const currentUserId = sessions.get(sessionId);
  const userGroups = getUserGroups(currentUserId);
  
  const groupsWithDetails = userGroups.map(group => {
    const memberDetails = group.members.map(memberId => {
      const user = users.get(memberId);
      return user ? {
        id: user.id,
        username: user.username,
        isOnline: user.isOnline
      } : null;
    }).filter(Boolean);
    
    return {
      id: group.id,
      name: group.name,
      description: group.description,
      createdBy: group.createdBy,
      createdAt: group.createdAt,
      members: memberDetails,
      admins: group.admins,
      isAdmin: group.admins.includes(currentUserId)
    };
  });
  
  res.json({ groups: groupsWithDetails });
});

// Add member to group
app.post('/api/groups/:groupId/members', (req, res) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const currentUserId = sessions.get(sessionId);
  const { groupId } = req.params;
  const { userId } = req.body;
  
  if (!users.has(userId)) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const updatedGroup = addGroupMember(groupId, userId, currentUserId);
  
  if (!updatedGroup) {
    return res.status(403).json({ error: 'Not authorized to add members or group not found' });
  }
  
  res.json({ 
    message: 'Member added successfully',
    group: updatedGroup
  });
});

// Remove member from group
app.delete('/api/groups/:groupId/members/:userId', (req, res) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const currentUserId = sessions.get(sessionId);
  const { groupId, userId } = req.params;
  
  const updatedGroup = removeGroupMember(groupId, userId, currentUserId);
  
  if (!updatedGroup) {
    return res.status(403).json({ error: 'Not authorized to remove members or invalid operation' });
  }
  
  res.json({ 
    message: 'Member removed successfully',
    group: updatedGroup
  });
});

// Get group messages
app.get('/api/groups/:groupId/messages', (req, res) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const currentUserId = sessions.get(sessionId);
  const { groupId } = req.params;
  
  const group = groups.get(groupId);
  if (!group || !group.members.includes(currentUserId)) {
    return res.status(403).json({ error: 'Not authorized to view group messages' });
  }
  
  const messages = groupMessages.get(groupId) || [];
  
  res.json({ messages });
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
  
  // Handle joining a group
  socket.on('joinGroup', (data) => {
    const { groupId } = data;
    const group = groups.get(groupId);
    
    if (!group || !group.members.includes(socket.userId)) {
      socket.emit('error', { message: 'Not authorized to join this group' });
      return;
    }
    
    socket.join(groupId);
    
    // Send group message history
    const groupHistory = groupMessages.get(groupId) || [];
    socket.emit('groupHistory', { groupId, messages: groupHistory });
  });
  
  // Handle group message
  socket.on('groupMessage', (data) => {
    const { groupId, message, timestamp } = data;
    const group = groups.get(groupId);
    
    if (!group || !group.members.includes(socket.userId)) {
      socket.emit('error', { message: 'Not authorized to send messages to this group' });
      return;
    }
    
    // Create message object
    const messageObj = {
      id: Date.now().toString(),
      senderId: socket.userId,
      senderUsername: socket.user.username,
      groupId,
      message,
      timestamp: timestamp || new Date(),
      type: 'group'
    };
    
    // Store message
    if (!groupMessages.has(groupId)) {
      groupMessages.set(groupId, []);
    }
    groupMessages.get(groupId).push(messageObj);
    
    // Send message to all group members
    socket.to(groupId).emit('newGroupMessage', messageObj);
    
    // Confirm message sent to sender
    socket.emit('groupMessageSent', messageObj);
    
    console.log(`Group message from ${socket.user.username} to group ${groupId}: ${message}`);
  });
  
  // Handle group typing indicators
  socket.on('groupTyping', (data) => {
    const { groupId, isTyping } = data;
    const group = groups.get(groupId);
    
    if (!group || !group.members.includes(socket.userId)) {
      return;
    }
    
    socket.to(groupId).emit('groupUserTyping', {
      userId: socket.userId,
      username: socket.user.username,
      groupId,
      isTyping
    });
  });
  
  // Handle group member updates
  socket.on('groupMemberAdded', (data) => {
    const { groupId, newMemberId } = data;
    const group = groups.get(groupId);
    
    if (group && group.members.includes(newMemberId)) {
      // Notify all group members about new member
      io.to(groupId).emit('groupMemberUpdate', {
        type: 'memberAdded',
        groupId,
        userId: newMemberId,
        group: group
      });
      
      // If the new member is online, make them join the room
      const newMemberSocket = Array.from(activeUsers.entries())
        .find(([socketId, user]) => user.userId === newMemberId);
      
      if (newMemberSocket) {
        io.sockets.sockets.get(newMemberSocket[0])?.join(groupId);
      }
    }
  });
  
  socket.on('groupMemberRemoved', (data) => {
    const { groupId, removedMemberId } = data;
    
    // Notify all group members about removed member
    io.to(groupId).emit('groupMemberUpdate', {
      type: 'memberRemoved',
      groupId,
      userId: removedMemberId
    });
    
    // Remove the user from the socket room
    const removedMemberSocket = Array.from(activeUsers.entries())
      .find(([socketId, user]) => user.userId === removedMemberId);
    
    if (removedMemberSocket) {
      io.sockets.sockets.get(removedMemberSocket[0])?.leave(groupId);
    }
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