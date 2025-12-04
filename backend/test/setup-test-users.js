const axios = require('axios');

const API_URL = 'http://127.0.0.1:3001';

// Test users to create
const testUsers = [
    { username: 'Alice Johnson', email: 'alice@test.com', password: 'password123' },
    { username: 'Bob Smith', email: 'bob@test.com', password: 'password123' },
    { username: 'Charlie Brown', email: 'charlie@test.com', password: 'password123' },
    { username: 'Diana Prince', email: 'diana@test.com', password: 'password123' }
];

async function setupTestUsers() {
    console.log('🚀 Setting up test users...\n');

    const registeredUsers = [];

    // Register all test users
    for (const user of testUsers) {
        try {
            const response = await axios.post(`${API_URL}/auth/register`, user);
            registeredUsers.push({
                ...response.data.user,
                token: response.data.token
            });
            console.log(`✅ Registered: ${user.username} (ID: ${response.data.user.id})`);
        } catch (error) {
            if (error.response?.status === 500) {
                // User might already exist, try to login
                try {
                    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
                        email: user.email,
                        password: user.password
                    });
                    registeredUsers.push({
                        ...loginResponse.data.user,
                        token: loginResponse.data.token
                    });
                    console.log(`ℹ️  Already exists: ${user.username} (ID: ${loginResponse.data.user.id})`);
                } catch (loginError) {
                    console.error(`❌ Failed to register/login: ${user.username}`);
                }
            }
        }
    }

    console.log('\n📱 Creating chats between users...\n');

    // Create chats between users
    const chats = [];

    // Alice <-> Bob
    if (registeredUsers.length >= 2) {
        try {
            const chat1 = await axios.post(`${API_URL}/chats`, {
                userId: registeredUsers[0].id,
                otherUserId: registeredUsers[1].id
            });
            chats.push(chat1.data);
            console.log(`✅ Created chat: ${registeredUsers[0].username} <-> ${registeredUsers[1].username}`);
        } catch (error) {
            console.error(`❌ Failed to create chat between Alice and Bob`);
        }
    }

    // Alice <-> Charlie
    if (registeredUsers.length >= 3) {
        try {
            const chat2 = await axios.post(`${API_URL}/chats`, {
                userId: registeredUsers[0].id,
                otherUserId: registeredUsers[2].id
            });
            chats.push(chat2.data);
            console.log(`✅ Created chat: ${registeredUsers[0].username} <-> ${registeredUsers[2].username}`);
        } catch (error) {
            console.error(`❌ Failed to create chat between Alice and Charlie`);
        }
    }

    // Bob <-> Diana
    if (registeredUsers.length >= 4) {
        try {
            const chat3 = await axios.post(`${API_URL}/chats`, {
                userId: registeredUsers[1].id,
                otherUserId: registeredUsers[3].id
            });
            chats.push(chat3.data);
            console.log(`✅ Created chat: ${registeredUsers[1].username} <-> ${registeredUsers[3].username}`);
        } catch (error) {
            console.error(`❌ Failed to create chat between Bob and Diana`);
        }
    }

    console.log('\n✨ Test setup complete!\n');
    console.log('📋 Test User Credentials:');
    console.log('─'.repeat(50));
    testUsers.forEach(user => {
        console.log(`Email: ${user.email} | Password: ${user.password}`);
    });
    console.log('─'.repeat(50));
    console.log('\n💡 You can now login with any of these accounts in the desktop app!');
}

// Run the setup
setupTestUsers().catch(error => {
    console.error('Error setting up test users:', error.message);
});
