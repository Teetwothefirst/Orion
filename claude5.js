const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcrypt');
var nodemailer = require('nodemailer');
const fs = require("fs");
const path = require("path");
require('dotenv').config()
const { v4: uuidv4 } = require('uuid');


const allowedOrigins = [
  'http://localhost:5500',
  'https://teetwothefirst.github.io'
];

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    // origin: "*",
     origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
    methods: ["GET", "POST"]
  }
});

// Middleware
// app.use(cors());
// Allow requests from your frontend origin
app.use(cors({
 origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

//Database Connection
// supabaseClient.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY // Use service key in backend only!
);

// Test database connection
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact' })
      .limit(1);

    if (error) {
      console.log('❌ Database connection failed:', error.message);
    } else {
      console.log('✅ Connection successful - Database is reachable');
    }
  } catch (err) {
    console.log('❌ Connection error:', err.message);
  }
}
testConnection()
// In-memory storage for active users only (temporary session data)
const activeUsers = new Map(); // Map of socketId -> user info
const emailTemplatePath = path.join(__dirname, "email.html");
const htmlContent = fs.readFileSync(emailTemplatePath, "utf8");

// Utility functions
const generateSessionId = () => Math.random().toString(36).substring(2, 15);

const createRoomId = (userId1, userId2) => {
  return [userId1, userId2].sort().join('-');
};

const generateGroupId = () => 'group_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

const createGroup = async (name, description, createdBy, members = []) => {
  const groupId = generateGroupId();
  const group = {
    id: groupId,
    name: name.trim(),
    description: description ? description.trim() : '',
    created_by: createdBy,
    created_at: new Date(),
    members: [createdBy, ...members.filter(m => m !== createdBy)], // Ensure creator is included
    admins: [createdBy], // Creator is automatically an admin
    is_active: true
  };
  
  try {
    const { data, error } = await supabase
      .from('groups')
      .insert([group])
      .select();
    
    if (error) {
      console.error('Error creating group:', error);
      return null;
    }
    
    return data[0];
  } catch (err) {
    console.error('Error creating group:', err);
    return null;
  }
};

const addGroupMember = async (groupId, userId, addedBy) => {
  try {
    // Get group from database
    const { data: group, error: fetchError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();
    
    if (fetchError || !group || !group.is_active) return null;
    
    // Check if the person adding is an admin
    if (!group.admins.includes(addedBy)) return null;
    
    // Check if user is already a member
    if (group.members.includes(userId)) return group;
    
    // Update members array
    const updatedMembers = [...group.members, userId];
    
    const { data, error } = await supabase
      .from('groups')
      .update({ members: updatedMembers })
      .eq('id', groupId)
      .select();
    
    if (error) {
      console.error('Error adding group member:', error);
      return null;
    }
    
    return data[0];
  } catch (err) {
    console.error('Error adding group member:', err);
    return null;
  }
};

const removeGroupMember = async (groupId, userId, removedBy) => {
  try {
    // Get group from database
    const { data: group, error: fetchError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();
    
    if (fetchError || !group || !group.is_active) return null;
    
    // Check if the person removing is an admin or removing themselves
    if (!group.admins.includes(removedBy) && removedBy !== userId) return null;
    
    // Can't remove the creator
    if (userId === group.created_by) return null;
    
    // Update members and admins arrays
    const updatedMembers = group.members.filter(m => m !== userId);
    const updatedAdmins = group.admins.filter(a => a !== userId);
    
    const { data, error } = await supabase
      .from('groups')
      .update({ 
        members: updatedMembers,
        admins: updatedAdmins
      })
      .eq('id', groupId)
      .select();
    
    if (error) {
      console.error('Error removing group member:', error);
      return null;
    }
    
    return data[0];
  } catch (err) {
    console.error('Error removing group member:', err);
    return null;
  }
};

const getUserGroups = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .contains('members', [userId])
      .eq('is_active', true);
    
    if (error) {
      console.error('Error fetching user groups:', error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error('Error fetching user groups:', err);
    return [];
  }
};

const authenticateSocket = async (socket, next) => {
  const sessionId = socket.handshake.auth.sessionId;
  
  if (!sessionId) {
    return next(new Error('Authentication failed'));
  }
  
  try {
    // Check session in database
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('session_id', sessionId)
      .single();
    
    if (sessionError || !sessionData) {
      return next(new Error('Authentication failed'));
    }
    
    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', sessionData.user_id)
      .single();
    
    if (userError || !user) {
      return next(new Error('User not found'));
    }
    
    socket.userId = user.id;
    socket.user = user;
    next();
  } catch (err) {
    console.error('Socket authentication error:', err);
    return next(new Error('Authentication failed'));
  }
};

// Authentication Routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    console.log(username)
    console.log(email)
    console.log(password)
    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .or(`username.eq.${username},email.eq.${email}`)
      .limit(1);
    
    if (checkError) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (existingUser && existingUser.length > 0) {
      return res.status(400).json({ 
        error: 'User with this username or email already exists' 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // //Send them a welcome
      var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'teetwothefirst@gmail.com',
        pass: 'hpwf imcc bavl bxqk'
      },
      //tls idea came from ChatGPT
      tls: {
        rejectUnauthorized: false // <-- Ignore self-signed certs
      }
    });
    
    var mailOptions = {
      from: 'teetwothefirst@gmail.com',
      to: email,
      subject: 'Welcome to Orion Chat',
      html: htmlContent,
    };
    
    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });

    // Create user
    // const userId = Date.now().toString();
    const userId = uuidv4();
    const user = {
      id: userId,
      username,
      email,
      password: hashedPassword,
      created_at: new Date(),
      is_online: false
    };
    
    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .select();
    
    if (error) {
        console.error('Supabase insert error:', error);
        return res.status(500).json({ error: 'Failed to create user' });
    }
    
    res.status(201).json({ 
      message: 'User registered successfully',
      userId: userId 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/login', async (req, res) => {
  console.log('Incoming login request body:', req.body);

    try {
    const { username, password } = req.body;
    
    //Supabase Find User
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Create session
    const sessionId = generateSessionId();

    //supabase session
    const { error: sessionError } = await supabase
      .from('sessions')
      .insert([
        { session_id: sessionId, user_id: user.id, created_at: new Date() }
      ]);
    
    if (sessionError) {
        console.error('Supabase session insert error:', sessionError);
      return res.status(500).json({ error: 'Failed to create session' });
    }
    
    // Update user online status
    await supabase
      .from('users')
      .update({ is_online: true })
      .eq('id', user.id);
    
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
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/logout', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    // Get user from session
    const { data: sessionData } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('session_id', sessionId)
      .single();
    
    if (sessionData) {
      // Update user online status
      await supabase
        .from('users')
        .update({ is_online: false })
        .eq('id', sessionData.user_id);
      
      // Delete session
      await supabase
        .from('sessions')
        .delete()
        .eq('session_id', sessionId);
    }
    
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available users to chat with
app.get('/api/users', async (req, res) => {
  try {
    const sessionId = req.headers.authorization?.replace('Bearer ', '');
    
    if (!sessionId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Verify session
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('session_id', sessionId)
      .single();
    
    if (sessionError || !sessionData) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const currentUserId = sessionData.user_id;
    
    // Get all users except current user
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, is_online')
      .neq('id', currentUserId);
    
    if (error) {
      return res.status(500).json({ error: 'Failed to fetch users' });
    }
    
    res.json({ users: users || [] });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get chat history
app.get('/api/messages/:targetUserId', async (req, res) => {
  try {
    const sessionId = req.headers.authorization?.replace('Bearer ', '');
    
    if (!sessionId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Verify session
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('session_id', sessionId)
      .single();
    
    if (sessionError || !sessionData) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const currentUserId = sessionData.user_id;
    const targetUserId = req.params.targetUserId;
    const roomId = createRoomId(currentUserId, targetUserId);
    
    // Get messages from database
    const { data: messages, error } = await supabase
      .from('private_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('timestamp', { ascending: true });
    
    if (error) {
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }
    
    res.json({ messages: messages || [] });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Group Management Endpoints

// Create a new group
// app.post('/api/groups', async (req, res) => {
//   try {
//     const sessionId = req.headers.authorization?.replace('Bearer ', '');
    
//     if (!sessionId) {
//       return res.status(401).json({ error: 'Unauthorized' });
//     }
    
//     // Verify session
//     const { data: sessionData, error: sessionError } = await supabase
//       .from('sessions')
//       .select('user_id')
//       .eq('session_id', sessionId)
//       .single();
    
//     if (sessionError || !sessionData) {
//       return res.status(401).json({ error: 'Unauthorized' });
//     }
    
//     const currentUserId = sessionData.user_id;
//     const { name, description, members = [] } = req.body;
    
//     if (!name || name.trim().length === 0) {
//       return res.status(400).json({ error: 'Group name is required' });
//     }
    
//     if (name.trim().length > 50) {
//       return res.status(400).json({ error: 'Group name must be 50 characters or less' });
//     }
    
//     // Validate that all members exist
//     if (members.length > 0) {
//       const { data: existingUsers } = await supabase
//         .from('users')
//         .select('id')
//         .in('id', members);
      
//       const validMembers = existingUsers ? existingUsers.map(u => u.id) : [];
//     } else {
//       const validMembers = [];
//     }
    
//     const group = await createGroup(name, description, currentUserId, validMembers);
    
//     if (!group) {
//       return res.status(500).json({ error: 'Failed to create group' });
//     }
    
//     res.status(201).json({ 
//       message: 'Group created successfully',
//       group: {
//         id: group.id,
//         name: group.name,
//         description: group.description,
//         createdBy: group.created_by,
//         createdAt: group.created_at,
//         members: group.members,
//         admins: group.admins
//       }
//     });
//   } catch (error) {
//     console.error('Create group error:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// // Get user's groups
// app.get('/api/groups', async (req, res) => {
//   try {
//     const sessionId = req.headers.authorization?.replace('Bearer ', '');
    
//     if (!sessionId) {
//       return res.status(401).json({ error: 'Unauthorized' });
//     }
    
//     // Verify session
//     const { data: sessionData, error: sessionError } = await supabase
//       .from('sessions')
//       .select('user_id')
//       .eq('session_id', sessionId)
//       .single();
    
//     if (sessionError || !sessionData) {
//       return res.status(401).json({ error: 'Unauthorized' });
//     }
    
//     const currentUserId = sessionData.user_id;
//     const userGroups = await getUserGroups(currentUserId);
    
//     // Get member details for each group
//     const groupsWithDetails = await Promise.all(userGroups.map(async (group) => {
//       const { data: memberDetails } = await supabase
//         .from('users')
//         .select('id, username, is_online')
//         .in('id', group.members);
      
//       return {
//         id: group.id,
//         name: group.name,
//         description: group.description,
//         createdBy: group.created_by,
//         createdAt: group.created_at,
//         members: memberDetails || [],
//         admins: group.admins,
//         isAdmin: group.admins.includes(currentUserId)
//       };
//     }));
    
//     res.json({ groups: groupsWithDetails });
//   } catch (error) {
//     console.error('Get groups error:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// // Add member to group
// app.post('/api/groups/:groupId/members', async (req, res) => {
//   try {
//     const sessionId = req.headers.authorization?.replace('Bearer ', '');
    
//     if (!sessionId) {
//       return res.status(401).json({ error: 'Unauthorized' });
//     }
    
//     // Verify session
//     const { data: sessionData, error: sessionError } = await supabase
//       .from('sessions')
//       .select('user_id')
//       .eq('session_id', sessionId)
//       .single();
    
//     if (sessionError || !sessionData) {
//       return res.status(401).json({ error: 'Unauthorized' });
//     }
    
//     const currentUserId = sessionData.user_id;
//     const { groupId } = req.params;
//     const { userId } = req.body;
    
//     // Check if user exists
//     const { data: user, error: userError } = await supabase
//       .from('users')
//       .select('id')
//       .eq('id', userId)
//       .single();
    
//     if (userError || !user) {
//       return res.status(404).json({ error: 'User not found' });
//     }
    
//     const updatedGroup = await addGroupMember(groupId, userId, currentUserId);
    
//     if (!updatedGroup) {
//       return res.status(403).json({ error: 'Not authorized to add members or group not found' });
//     }
    
//     res.json({ 
//       message: 'Member added successfully',
//       group: updatedGroup
//     });
//   } catch (error) {
//     console.error('Add group member error:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// // Remove member from group
// app.delete('/api/groups/:groupId/members/:userId', async (req, res) => {
//   try {
//     const sessionId = req.headers.authorization?.replace('Bearer ', '');
    
//     if (!sessionId) {
//       return res.status(401).json({ error: 'Unauthorized' });
//     }
    
//     // Verify session
//     const { data: sessionData, error: sessionError } = await supabase
//       .from('sessions')
//       .select('user_id')
//       .eq('session_id', sessionId)
//       .single();
    
//     if (sessionError || !sessionData) {
//       return res.status(401).json({ error: 'Unauthorized' });
//     }
    
//     const currentUserId = sessionData.user_id;
//     const { groupId, userId } = req.params;
    
//     const updatedGroup = await removeGroupMember(groupId, userId, currentUserId);
    
//     if (!updatedGroup) {
//       return res.status(403).json({ error: 'Not authorized to remove members or invalid operation' });
//     }
    
//     res.json({ 
//       message: 'Member removed successfully',
//       group: updatedGroup
//     });
//   } catch (error) {
//     console.error('Remove group member error:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// // Get group messages
// app.get('/api/groups/:groupId/messages', async (req, res) => {
//   try {
//     const sessionId = req.headers.authorization?.replace('Bearer ', '');
    
//     if (!sessionId) {
//       return res.status(401).json({ error: 'Unauthorized' });
//     }
    
//     // Verify session
//     const { data: sessionData, error: sessionError } = await supabase
//       .from('sessions')
//       .select('user_id')
//       .eq('session_id', sessionId)
//       .single();
    
//     if (sessionError || !sessionData) {
//       return res.status(401).json({ error: 'Unauthorized' });
//     }
    
//     const currentUserId = sessionData.user_id;
//     const { groupId } = req.params;
    
//     // Check if user is member of group
//     const { data: group, error: groupError } = await supabase
//       .from('groups')
//       .select('members')
//       .eq('id', groupId)
//       .single();
    
//     if (groupError || !group || !group.members.includes(currentUserId)) {
//       return res.status(403).json({ error: 'Not authorized to view group messages' });
//     }
    
//     // Get group messages
//     const { data: messages, error } = await supabase
//       .from('group_messages')
//       .select('*')
//       .eq('group_id', groupId)
//       .order('timestamp', { ascending: true });
    
//     if (error) {
//       return res.status(500).json({ error: 'Failed to fetch group messages' });
//     }
    
//     res.json({ messages: messages || [] });
//   } catch (error) {
//     console.error('Get group messages error:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });


// GROUP MANAGEMENT ROUTES
// Create a new group

app.post('/api/groups', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { name, description, isPublic = false, selectedUsers = [] } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    // Create the group
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert([{
        name: name.trim(),
        description: description?.trim() || null,
        created_by: req.session.userId,
        is_public: isPublic,
        max_members: 1000
      }])
      .select()
      .single();

    if (groupError) {
      console.error('Error creating group:', groupError);
      return res.status(500).json({ error: 'Failed to create group' });
    }

    // Add creator as owner
    const { error: memberError } = await supabase
      .from('group_members')
      .insert([{
        group_id: group.id,
        user_id: req.session.userId,
        role: 'owner',
        added_by: req.session.userId
      }]);

    if (memberError) {
      console.error('Error adding group owner:', memberError);
      return res.status(500).json({ error: 'Failed to set group owner' });
    }

    // Add selected users as members
    if (selectedUsers.length > 0) {
      const memberInserts = selectedUsers.map(userId => ({
        group_id: group.id,
        user_id: userId,
        role: 'member',
        added_by: req.session.userId
      }));

      const { error: membersError } = await supabase
        .from('group_members')
        .insert(memberInserts);

      if (membersError) {
        console.error('Error adding group members:', membersError);
      }
    }

    res.json({ success: true, group });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's groups
app.get('/api/groups/my', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { data: groups, error } = await supabase
      .from('group_members')
      .select(`
        groups (
          id,
          name,
          description,
          is_public,
          created_at,
          group_avatar
        ),
        role,
        joined_at
      `)
      .eq('user_id', req.session.userId)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching user groups:', error);
      return res.status(500).json({ error: 'Failed to fetch groups' });
    }

    const formattedGroups = groups.map(item => ({
      ...item.groups,
      user_role: item.role,
      joined_at: item.joined_at
    }));

    res.json({ groups: formattedGroups });
  } catch (error) {
    console.error('Get user groups error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get public groups (for discovery)
app.get('/api/groups/public', async (req, res) => {
  try {
    const { data: groups, error } = await supabase
      .from('groups')
      .select(`
        id,
        name,
        description,
        created_at,
        group_avatar,
        created_by,
        users!groups_created_by_fkey (username)
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching public groups:', error);
      return res.status(500).json({ error: 'Failed to fetch public groups' });
    }

    res.json({ groups });
  } catch (error) {
    console.error('Get public groups error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get group details with members
app.get('/api/groups/:groupId', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { groupId } = req.params;

    // Check if user is a member of this group
    const { data: membership, error: memberError } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', req.session.userId)
      .eq('status', 'active')
      .single();

    if (memberError || !membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get group details
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (groupError) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Get group members
    const { data: members, error: membersError } = await supabase
      .from('group_members')
      .select(`
        user_id,
        role,
        joined_at,
        users (username, is_online)
      `)
      .eq('group_id', groupId)
      .eq('status', 'active');

    if (membersError) {
      console.error('Error fetching group members:', membersError);
      return res.status(500).json({ error: 'Failed to fetch group members' });
    }

    res.json({ 
      group,
      members: members.map(m => ({
        id: m.user_id,
        username: m.users.username,
        role: m.role,
        joined_at: m.joined_at,
        is_online: m.users.is_online
      })),
      user_role: membership.role
    });
  } catch (error) {
    console.error('Get group details error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get group messages
app.get('/api/groups/:groupId/messages', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { groupId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Check if user is a member
    const { data: membership, error: memberError } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', req.session.userId)
      .eq('status', 'active')
      .single();

    if (memberError || !membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get messages with pagination
    const { data: messages, error: messagesError } = await supabase
      .from('group_messages')
      .select(`
        id,
        content,
        message_type,
        sent_at,
        sender_id,
        users (username)
      `)
      .eq('group_id', groupId)
      .order('sent_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (messagesError) {
      console.error('Error fetching group messages:', messagesError);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }

    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      message_type: msg.message_type,
      sent_at: msg.sent_at,
      sender_id: msg.sender_id,
      sender_username: msg.users.username
    })).reverse(); // Reverse to show oldest first

    res.json({ messages: formattedMessages });
  } catch (error) {
    console.error('Get group messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Join public group
app.post('/api/groups/:groupId/join', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { groupId } = req.params;

    // Check if group exists and is public
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('is_public, max_members')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (!group.is_public) {
      return res.status(403).json({ error: 'This group is private' });
    }

    // Check if user is already a member
    const { data: existingMember, error: memberCheckError } = await supabase
      .from('group_members')
      .select('id, status')
      .eq('group_id', groupId)
      .eq('user_id', req.session.userId)
      .single();

    if (existingMember) {
      if (existingMember.status === 'active') {
        return res.status(400).json({ error: 'Already a member of this group' });
      }
      // If they left before, reactivate membership
      const { error: updateError } = await supabase
        .from('group_members')
        .update({ status: 'active', joined_at: new Date() })
        .eq('id', existingMember.id);

      if (updateError) {
        return res.status(500).json({ error: 'Failed to rejoin group' });
      }
    } else {
      // Add as new member
      const { error: insertError } = await supabase
        .from('group_members')
        .insert([{
          group_id: groupId,
          user_id: req.session.userId,
          role: 'member',
          added_by: req.session.userId
        }]);

      if (insertError) {
        console.error('Error joining group:', insertError);
        return res.status(500).json({ error: 'Failed to join group' });
      }
    }

    res.json({ success: true, message: 'Successfully joined group' });
  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Leave group
app.delete('/api/groups/:groupId/leave', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { groupId } = req.params;

    // Check membership and role
    const { data: membership, error: memberError } = await supabase
      .from('group_members')
      .select('id, role')
      .eq('group_id', groupId)
      .eq('user_id', req.session.userId)
      .eq('status', 'active')
      .single();

    if (memberError || !membership) {
      return res.status(404).json({ error: 'Not a member of this group' });
    }

    if (membership.role === 'owner') {
      return res.status(400).json({ error: 'Owner cannot leave group. Transfer ownership or delete group.' });
    }

    // Update status to 'left'
    const { error: leaveError } = await supabase
      .from('group_members')
      .update({ status: 'left' })
      .eq('id', membership.id);

    if (leaveError) {
      console.error('Error leaving group:', leaveError);
      return res.status(500).json({ error: 'Failed to leave group' });
    }

    res.json({ success: true, message: 'Successfully left group' });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({ error: 'Server error' });
  }
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
  
  // Update user online status in database
  supabase
    .from('users')
    .update({ is_online: true })
    .eq('id', socket.userId);
  
  // Notify other users that this user is online
  socket.broadcast.emit('userOnline', {
    userId: socket.userId,
    username: socket.user.username
  });
  
  // Join user to their personal room
  socket.join(socket.userId);
  
  // Handle private message
  socket.on('privateMessage', async (data) => {
    try {
      const { targetUserId, message, timestamp } = data;
      
      // Validate target user exists
      const { data: targetUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', targetUserId)
        .single();
      
      if (userError || !targetUser) {
        socket.emit('error', { message: 'Target user not found' });
        return;
      }
      
      // Create room ID for this conversation
      const roomId = createRoomId(socket.userId, targetUserId);
      
      // Create message object
      const messageObj = {
        id: uuidv4(),
        sender_id: socket.userId,
        // sender_username: socket.user.username,
        receiver_id: targetUserId,
        message,
        timestamp: timestamp || new Date(),
        room_id: roomId
      };
      
      // Store message in database
      const { error: insertError } = await supabase
        .from('private_messages')
        .insert([messageObj]);
      
      if (insertError) {
        console.error('Error storing private message:', insertError);
        socket.emit('error', { message: 'Failed to send message' });
        return;
      }
      
      // Send message to target user if they're online
      socket.to(targetUserId).emit('newPrivateMessage', messageObj);
      
      // Confirm message sent to sender
      socket.emit('messageSent', messageObj);
      
      console.log(`Message from ${socket.user.username} to user ${targetUserId}: ${message}`);
    } catch (error) {
      console.error('Private message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
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
//   socket.on('joinChat', async (data) => {
//     try {
//       const { targetUserId } = data;
//       const roomId = createRoomId(socket.userId, targetUserId);
//       socket.join(roomId);
      
//       // Send chat history from database
//       const { data: chatHistory, error } = await supabase
//         .from('private_messages')
//         .select('*')
//         .eq('room_id', roomId)
//         .order('timestamp', { ascending: true });
      
//       if (!error) {
//         socket.emit('chatHistory', { messages: chatHistory || [] });
//       }
//     } catch (error) {
//       console.error('Join chat error:', error);
//     }
//   });
  
//   // Handle joining a group
//   socket.on('joinGroup', async (data) => {
//     try {
//       const { groupId } = data;
      
//       // Check if user is member of group
//       const { data: group, error: groupError } = await supabase
//         .from('groups')
//         .select('members')
//         .eq('id', groupId)
//         .single();
      
//       if (groupError || !group || !group.members.includes(socket.userId)) {
//         socket.emit('error', { message: 'Not authorized to join this group' });
//         return;
//       }
      
//       socket.join(groupId);
      
//       // Send group message history from database
//       const { data: groupHistory, error } = await supabase
//         .from('group_messages')
//         .select('*')
//         .eq('group_id', groupId)
//         .order('timestamp', { ascending: true });
      
//       if (!error) {
//         socket.emit('groupHistory', { groupId, messages: groupHistory || [] });
//       }
//     } catch (error) {
//       console.error('Join group error:', error);
//     }
//   });
  
//   // Handle group message
//   socket.on('groupMessage', async (data) => {
//     try {
//       const { groupId, message, timestamp } = data;
      
//       // Check if user is member of group
//       const { data: group, error: groupError } = await supabase
//         .from('groups')
//         .select('members')
//         .eq('id', groupId)
//         .single();
      
//       if (groupError || !group || !group.members.includes(socket.userId)) {
//         socket.emit('error', { message: 'Not authorized to send messages to this group' });
//         return;
//       }
      
//       // Create message object
//       const messageObj = {
//         id: Date.now().toString(),
//         sender_id: socket.userId,
//         sender_username: socket.user.username,
//         group_id: groupId,
//         message,
//         timestamp: timestamp || new Date(),
//         type: 'group'
//       };
      
//       // Store message in database
//       const { error: insertError } = await supabase
//         .from('group_messages')
//         .insert([messageObj]);
      
//       if (insertError) {
//         console.error('Error storing group message:', insertError);
//         socket.emit('error', { message: 'Failed to send message' });
//         return;
//       }
//     }catch(error){
//         console.log(error)
//     }
// })


// //  
//   // Handle group typing indicators
//   socket.on('groupTyping', (data) => {
//     const { groupId, isTyping } = data;
//     const group = groups.get(groupId);
    
//     if (!group || !group.members.includes(socket.userId)) {
//       return;
//     }
    
//     socket.to(groupId).emit('groupUserTyping', {
//       userId: socket.userId,
//       username: socket.user.username,
//       groupId,
//       isTyping
//     });
//   });
  
//   // Handle group member updates
//   socket.on('groupMemberAdded', (data) => {
//     const { groupId, newMemberId } = data;
//     const group = groups.get(groupId);
    
//     if (group && group.members.includes(newMemberId)) {
//       // Notify all group members about new member
//       io.to(groupId).emit('groupMemberUpdate', {
//         type: 'memberAdded',
//         groupId,
//         userId: newMemberId,
//         group: group
//       });
      
//       // If the new member is online, make them join the room
//       const newMemberSocket = Array.from(activeUsers.entries())
//         .find(([socketId, user]) => user.userId === newMemberId);
      
//       if (newMemberSocket) {
//         io.sockets.sockets.get(newMemberSocket[0])?.join(groupId);
//       }
//     }
//   });
  
//   socket.on('groupMemberRemoved', (data) => {
//     const { groupId, removedMemberId } = data;
    
//     // Notify all group members about removed member
//     io.to(groupId).emit('groupMemberUpdate', {
//       type: 'memberRemoved',
//       groupId,
//       userId: removedMemberId
//     });
    
//     // Remove the user from the socket room
//     const removedMemberSocket = Array.from(activeUsers.entries())
//       .find(([socketId, user]) => user.userId === removedMemberId);
    
//     if (removedMemberSocket) {
//       io.sockets.sockets.get(removedMemberSocket[0])?.leave(groupId);
//     }
//   });
  
// Join group rooms when user connects
socket.on('joinUserGroupRooms', async () => {
  try {
    if (!socket.userId) return;

    // Get all groups the user belongs to
    const { data: userGroups, error } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', socket.userId)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching user groups:', error);
      return;
    }

    // Join all group rooms
    userGroups.forEach(membership => {
      const roomName = `group_${membership.group_id}`;
      socket.join(roomName);
      console.log(`User ${socket.user?.username} joined group room: ${roomName}`);
    });
  } catch (error) {
    console.error('Error joining user group rooms:', error);
  }
});

// Handle group messages
socket.on('groupMessage', async (data) => {
  try {
    const { groupId, message, timestamp } = data;

    if (!socket.userId || !groupId || !message) {
      socket.emit('error', { message: 'Invalid group message data' });
      return;
    }

    // Verify user is a member of the group
    const { data: membership, error: memberError } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', socket.userId)
      .eq('status', 'active')
      .single();

    if (memberError || !membership) {
      socket.emit('error', { message: 'Access denied to this group' });
      return;
    }

    // Create message object
    const messageObj = {
      id: uuidv4(),
      group_id: groupId,
      sender_id: socket.userId,
      content: message.trim(),
      message_type: 'text',
      sent_at: timestamp || new Date()
    };

    // Store message in database
    const { error: insertError } = await supabase
      .from('group_messages')
      .insert([messageObj]);

    if (insertError) {
      console.error('Error storing group message:', insertError);
      socket.emit('error', { message: 'Failed to send message' });
      return;
    }

    // Add sender username to message
    messageObj.sender_username = socket.user.username;

    // Broadcast to all group members
    const roomName = `group_${groupId}`;
    io.to(roomName).emit('newGroupMessage', messageObj);

    console.log(`Group message in ${roomName} from ${socket.user.username}: ${message}`);
  } catch (error) {
    console.error('Group message error:', error);
    socket.emit('error', { message: 'Failed to send group message' });
  }
});

// Handle joining specific group room (when user opens a group chat)
socket.on('joinGroupRoom', async (data) => {
  try {
    const { groupId } = data;
    
    if (!groupId || !socket.userId) return;

    // Verify membership
    const { data: membership, error } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', socket.userId)
      .eq('status', 'active')
      .single();

    if (error || !membership) {
      socket.emit('error', { message: 'Access denied to this group' });
      return;
    }

    const roomName = `group_${groupId}`;
    socket.join(roomName);
    
    // Notify others that user is active in this group
    socket.to(roomName).emit('userJoinedGroupRoom', {
      userId: socket.userId,
      username: socket.user.username,
      groupId
    });

    console.log(`${socket.user.username} joined group room: ${roomName}`);
  } catch (error) {
    console.error('Error joining group room:', error);
  }
});

// Handle leaving group room (when user closes group chat)
socket.on('leaveGroupRoom', (data) => {
  try {
    const { groupId } = data;
    
    if (!groupId) return;

    const roomName = `group_${groupId}`;
    socket.leave(roomName);
    
    // Notify others that user left the group room
    socket.to(roomName).emit('userLeftGroupRoom', {
      userId: socket.userId,
      username: socket.user?.username,
      groupId
    });

    console.log(`${socket.user?.username} left group room: ${roomName}`);
  } catch (error) {
    console.error('Error leaving group room:', error);
  }
});

// Handle group typing indicators
socket.on('typingInGroup', (data) => {
  try {
    const { groupId, isTyping } = data;
    
    if (!groupId || !socket.userId) return;

    const roomName = `group_${groupId}`;
    socket.to(roomName).emit('userTypingInGroup', {
      userId: socket.userId,
      username: socket.user?.username,
      groupId,
      isTyping
    });
  } catch (error) {
    console.error('Error handling group typing:', error);
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











