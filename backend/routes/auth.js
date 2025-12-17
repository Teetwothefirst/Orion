const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const crypto = require('crypto');

const router = express.Router();
const JWT_SECRET = 'your_jwt_secret_key'; // In production, use environment variable

// Register
router.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8);

    db.run(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`,
        [username, email, hashedPassword],
        function (err) {
            if (err) {
                console.log('Registration Error:', err);
                if (err.message.includes('SQLITE_CONSTRAINT') || err.code === 'SQLITE_CONSTRAINT') {
                    return res.status(409).send("Username or email already exists.");
                }
                return res.status(500).send("There was a problem registering the user.");
            }
            const token = jwt.sign({ id: this.lastID }, JWT_SECRET, { expiresIn: 86400 });
            res.status(200).send({ auth: true, token: token, user: { id: this.lastID, username, email } });
        }
    );
});

// Login
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
        if (err) return res.status(500).send('Error on the server.');
        if (!user) return res.status(404).send('No user found.');

        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) return res.status(401).send({ auth: false, token: null });

        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: 86400 });
        res.status(200).send({ auth: true, token: token, user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar } });
    });
});

// Get all users (except current user)
router.get('/users', (req, res) => {
    const currentUserId = req.query.currentUserId;

    let sql = `SELECT id, username, email, avatar FROM users`;
    let params = [];

    if (currentUserId) {
        sql += ` WHERE id != ?`;
        params.push(currentUserId);
    }

    db.all(sql, params, (err, users) => {
        if (err) return res.status(500).send("Error retrieving users.");
        res.status(200).send(users);
    });
});

const { sendResetEmail, sendPasswordChangedEmail } = require('../utils/mailer');

// Forgot Password
router.post('/forgot-password', (req, res) => {
    const { email } = req.body;
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) return res.status(500).send('Error on the server.');
        if (!user) return res.status(404).send('User not found.');

        // Generate token
        const token = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
        const expiry = Date.now() + 3600000; // 1 hour

        db.run('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?', [token, expiry, user.id], async (err) => {
            if (err) return res.status(500).send('Error updating user.');

            const emailSent = await sendResetEmail(email, token);
            if (emailSent) {
                res.status(200).send({ message: 'Password reset instructions sent to your email.' });
            } else {
                res.status(500).send({ message: 'Failed to send email. Please try again later.' });
            }
        });
    });
});

// ... (existing imports)

// Reset Password
router.post('/reset-password', (req, res) => {
    const { token, newPassword } = req.body;

    db.get('SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > ?', [token, Date.now()], (err, user) => {
        if (err) return res.status(500).send('Error on the server.');
        if (!user) return res.status(400).send('Password reset token is invalid or has expired.');

        const hashedPassword = bcrypt.hashSync(newPassword, 8);

        db.run('UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?', [hashedPassword, user.id], async (err) => {
            if (err) return res.status(500).send('Error updating password.');

            // Send success email
            await sendPasswordChangedEmail(user.email);

            res.status(200).send({ message: 'Password has been reset.' });
        });
    });
});

module.exports = router;
