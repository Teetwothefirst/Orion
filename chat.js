const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");

const app = express();
const PORT = 3000;

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

  // 6. Save user
  const newUser = { id: users.length + 1, username, email, password: hashedPassword };
  users.push(newUser);
  
  // 7. Respond
  res.status(201).json({ message: "User registered successfully." });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
