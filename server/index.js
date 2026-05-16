const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

const http = require('http');
const { Server } = require('socket.io');

// 1. Load environment variables
dotenv.config();

// 2. Import Route Files & Sockets
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const escrowRoutes = require('./routes/escrowRoutes');
const messageRoutes = require('./routes/messageRoutes');
const chatSocket = require('./sockets/chat');
const proposalRoutes = require('./routes/proposalRoutes'); 
const reviewRoutes = require('./routes/reviewRoutes');// Imported the socket logic

// 3. Initialize Express
const app = express();

// --- 4. UPGRADE TO HTTP SERVER FOR SOCKETS ---
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Make 'io' accessible to our standard Express controllers
app.set('io', io);

// Attach our chat room logic to the socket server
chatSocket(io);

// 5. Global Middleware
app.use(cors()); // Allows your React frontend to talk to this API
app.use(express.json()); // Parses incoming JSON data in the request body

// 6. Mount the Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/escrow', escrowRoutes); // Webhook is now safely inside here!
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);

// 7. Basic Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Internal Server Error',
    });
});

// 8. Database Connection & Server Start
const PORT = process.env.PORT || 5000;

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB successfully');

        // 🚨 CRITICAL FIX: Changed app.listen to server.listen 🚨
        server.listen(PORT, () => {
            console.log(`🚀 Server & Sockets are running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err.message);
    });