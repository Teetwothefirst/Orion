const axios = require('axios');

const API_URL = 'http://localhost:3001';

async function testDuplicateRegistration() {
    try {
        console.log('Testing Duplicate Registration...');

        const user = {
            username: 'DuplicateUser_' + Date.now(),
            email: 'duplicate_' + Date.now() + '@test.com',
            password: 'password123'
        };

        console.log('Registering User first time...');
        await axios.post(`${API_URL}/auth/register`, user);
        console.log('First registration successful.');

        console.log('Registering User second time (expecting 409)...');
        try {
            await axios.post(`${API_URL}/auth/register`, user);
            console.error('FAILURE: Second registration should have failed.');
        } catch (error) {
            if (error.response && error.response.status === 409) {
                console.log('SUCCESS: Caught expected 409 Conflict error.');
                console.log('Error message:', error.response.data);
            } else {
                console.error('FAILURE: Caught unexpected error:', error.message);
                if (error.response) console.error('Status:', error.response.status, 'Data:', error.response.data);
            }
        }

    } catch (error) {
        console.error('Test Failed:', error.message);
    }
}

testDuplicateRegistration();
