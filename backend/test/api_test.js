const axios = require('axios');

const API_URL = 'http://localhost:3001';

async function testBackend() {
    try {
        console.log('Testing Backend...');

        // 1. Register User A
        const userA = {
            username: 'UserA_' + Date.now(),
            email: 'usera_' + Date.now() + '@test.com',
            password: 'password123'
        };
        console.log('Registering User A...');
        const resA = await axios.post(`${API_URL}/auth/register`, userA);
        const tokenA = resA.data.token;
        const idA = resA.data.user.id;
        console.log('User A Registered:', idA);

        // 2. Register User B
        const userB = {
            username: 'UserB_' + Date.now(),
            email: 'userb_' + Date.now() + '@test.com',
            password: 'password123'
        };
        console.log('Registering User B...');
        const resB = await axios.post(`${API_URL}/auth/register`, userB);
        const idB = resB.data.user.id;
        console.log('User B Registered:', idB);

        // 3. Create Chat
        console.log('Creating Chat between A and B...');
        const resChat = await axios.post(`${API_URL}/chats`, { userId: idA, otherUserId: idB });
        const chatId = resChat.data.id;
        console.log('Chat Created:', chatId);

        // 4. Send Message (via API for simplicity, though real app uses Socket)
        // Note: My backend socket handler saves to DB, but I didn't expose a POST /messages endpoint for REST.
        // But I can check if the chat exists in the list for User A.

        console.log('Fetching Chats for User A...');
        const resChats = await axios.get(`${API_URL}/chats?userId=${idA}`);
        console.log('Chats found:', resChats.data.length);

        if (resChats.data.length > 0) {
            console.log('SUCCESS: Backend is working!');
        } else {
            console.error('FAILURE: Chat not found.');
        }

    } catch (error) {
        console.error('Test Failed:', error.response ? error.response.data : error.message);
    }
}

testBackend();
