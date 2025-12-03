const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

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

module.exports = router;
