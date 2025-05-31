// server.js
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(express.json());

// Supabase configuration
// These should be stored in your .env file:
// SUPABASE_URL=https://your-project-ref.supabase.co
// SUPABASE_ANON_KEY=your-anon-key-here
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Test database connection
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('users') // Replace 'users' with any table name you have
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

// CRUD Operations

// CREATE - Add a new user
app.post('/users', async (req, res) => {
  try {
    const { name, email } = req.body;
    
    const { data, error } = await supabase
      .from('usedcon')
      .insert([{ name, email }])
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ 
      message: 'User created successfully', 
      user: data[0] 
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// READ - Get all users
app.get('/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('usedcon')
      .select('*');

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ users: data });
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// READ - Get single user by ID
app.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('usedcon')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: data });
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// UPDATE - Update user by ID
app.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;
    
    const { data, error } = await supabase
      .from('usedcon')
      .update({ name, email })
      .eq('id', id)
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (data.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      message: 'User updated successfully', 
      user: data[0] 
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// DELETE - Delete user by ID
app.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('usedcon')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (data.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      message: 'User deleted successfully', 
      user: data[0] 
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;

// Start server and test connection
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await testConnection();
});

// Export for testing purposes
module.exports = app;