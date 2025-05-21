const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
var nodemailer = require('nodemailer');
const fs = require("fs");
const path = require("path");

require('./db.js')
const app = express();
const PORT = 3000;

const emailTemplatePath = path.join(__dirname, "email.html");
const htmlContent = fs.readFileSync(emailTemplatePath, "utf8");
// Simulated in-memory database
const users = [];

app.use(bodyParser.json());

// Helper: Validate email format
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Helper: Validate password strength
function isStrongPassword(password) {
  return password.length >= 6;
}




app.post("/api/signup", async (req, res) => {
  const { username, email, password } = req.body;

  // 1. Check for missing fields
  if (!username || !email || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }

  // 2. Validate email format
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Invalid email format." });
  }

  // 3. Validate password strength
  if (!isStrongPassword(password)) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  // 4. Check if user/email already exists
  const existingUser = users.find(
    (user) => user.email === email || user.username === username
  );
  if (existingUser) {
    return res.status(409).json({ error: "Username or email already taken." });
  }

  // 5. Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  //6 Send Mail to welcome user
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
  // text: 'Start chatting with these easy steps \n 1. Login to your account 2. Add Friends in your contact list 3. Start Chatting. That was easy!'
  // html: '<h1>Welcome</h1><p>That was easy!</p>'
  html: htmlContent,
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});


  // 7. Save user
  const newUser = { id: users.length + 1, username, email, password: hashedPassword };
  users.push(newUser);
  
  // 7. Respond
  res.status(201).json({ message: "User registered successfully." });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
