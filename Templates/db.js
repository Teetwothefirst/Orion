// // db.js
// const mongoose = require("mongoose");

// mongoose.connect("mongodb://localhost:27017/chatapp", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// })
// .then(() => console.log("MongoDB connected"))
// .catch(err => console.error("MongoDB connection error:", err));

// var mongo = require('mongodb');
// var MongoClient = require('mongodb').MongoClient;
// var url = "mongodb+srv://dexterdavid835:oikHhtXUckk54Gsk@orion.d76iprj.mongodb.net/?retryWrites=true&w=majority&appName=Orion";

// MongoClient.connect(url, function(err, db) {
//   if (err) throw err;
//   console.log("Database created!");
//   db.close();
// });


// const { MongoClient, ServerApiVersion } = require('mongodb');
// const uri = "mongodb+srv://dexterdavid835:oikHhtXUckk54Gsk@orion.d76iprj.mongodb.net/?retryWrites=true&w=majority&appName=Orion";

// // Create a MongoClient with a MongoClientOptions object to set the Stable API version
// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   }
// });

// async function run() {
//   try {
//     // Connect the client to the server	(optional starting in v4.7)
//     await client.connect();
//     // Send a ping to confirm a successful connection
//     await client.db("admin").command({ ping: 1 });
//     console.log("Pinged your deployment. You successfully connected to MongoDB!");
//   } finally {
//     // Ensures that the client will close when you finish/error
//     await client.close();
//   }
// }
// run().catch(console.dir);


// // Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// // Your web app's Firebase configuration
// // For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyBjVR_VCEBsTwtXVAHs_sZrHScZlXw2WIY",
//   authDomain: "drive-4cdc9.firebaseapp.com",
//   projectId: "drive-4cdc9",
//   storageBucket: "drive-4cdc9.firebasestorage.app",
//   messagingSenderId: "424984560826",
//   appId: "1:424984560826:web:c0f6dea27960b244446e83",
//   measurementId: "G-5J4BMCYHBV"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);


// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { addUser, removeUser, getSocketIdByUsername, getUsernameBySocketId, getAllUsers } = require('./user'); // Import new function

const app = express();
app.use(cors()); // Apply CORS to Express routes
app.use(express.json()); // For parsing JSON request bodies

// Corrected: Pass the express app to http.createServer
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*", // WARNING: Change this to your frontend URL(s) in production! e.g., "http://localhost:8080"
        methods: ["GET", "POST"]
    }
});

// Simulated login (no real authentication - improve this for production)
app.post('/api/login', (req, res) => {
    const { username } = req.body;
    if (!username) {
        return res.status(400).json({ error: 'Username required' });
    }
    // In a real app, you'd authenticate the username and password here.
    // For now, we'll just "allow" any username.
    console.log(`Login attempt for: ${username}`);
    res.json({ success: true, username, message: 'Logged in successfully (simulated)' });
});

// Socket.IO for private chat
io.on('connection', (socket) => {
    console.log('New socket connected:', socket.id);

    // When a client "registers" their username with their socket
    socket.on('register', (username) => {
        if (!username) {
            socket.emit('error_message', { error: 'Username cannot be empty for registration.' });
            return;
        }
        // Check if username is already taken by another active socket (optional, but good for unique names)
        if (getSocketIdByUsername(username)) {
            socket.emit('error_message', { error: `Username "${username}" is already taken or online.` });
            return;
        }

        addUser(socket.id, username);
        console.log(`${username} registered with socket ID ${socket.id}`);
        socket.emit('registration_success', { username, id: socket.id, message: 'You are now registered for chat.' });
        // Optionally, inform everyone about a new user or emit a list of online users
        io.emit('online_users', getAllUsers());
    });

    socket.on('private_message', ({ to, message }) => {
        const fromUsername = getUsernameBySocketId(socket.id); // Get sender's username
        if (!fromUsername) {
            socket.emit('error_message', { error: 'You are not registered. Please register your username first.' });
            return;
        }

        const toSocketId = getSocketIdByUsername(to);

        if (toSocketId) {
            // Send to the target user
            io.to(toSocketId).emit('private_message', {
                from: fromUsername, // Use the actual username
                message: message
            });
            // Optionally, send a confirmation to the sender
            socket.emit('message_sent', { to: to, message: message, status: 'delivered' });
        } else {
            socket.emit('error_message', { error: `User "${to}" not online or does not exist.` });
        }
    });

    socket.on('disconnect', () => {
        const disconnectedUsername = removeUser(socket.id); // Get username before removal
        console.log('Disconnected:', socket.id, disconnectedUsername ? `(${disconnectedUsername})` : '');
        if (disconnectedUsername) {
            // Optionally, inform everyone that a user went offline
            io.emit('user_offline', disconnectedUsername);
            io.emit('online_users', getAllUsers()); // Update online users list
        }
    });
});

const PORT = process.env.PORT || 3000; // Use environment variable or default to 3000
server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});