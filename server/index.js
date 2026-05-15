const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

const http = require('http');
const { Server } = require('socket.io');

// 1. Load environment variables
dotenv.config();

// 2. Import Route Files
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const escrowRoutes = require('./routes/escrowRoutes');
const escrowController = require('./controllers/escrowController');

// 3. Initialize Express
const app = express();

// 4. Global Middleware
app.use(cors()); // Allows your React frontend to talk to this API
app.post(
    '/api/escrow/webhook',
    express.raw({ type: 'application/json' }),
    escrowController.razorpayWebhook
);
app.use(express.json()); // Parses incoming JSON data in the request body

// 5. Mount the Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/escrow', escrowRoutes);
// 6. Basic Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Internal Server Error',
    });
});

// 7. Database Connection & Server Start
const PORT = process.env.PORT || 5000;

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB successfully');
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err.message);
    });