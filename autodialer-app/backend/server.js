const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    credentials: true
}));

app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/autodialer')
    .then(() => console.log('MongoDB connected for Autodialer'))
    .catch(err => console.log('MongoDB connection error:', err));

// Routes
const callRoutes = require('./routes/calls');
const aiRoutes = require('./routes/ai');
app.use('/api/calls', callRoutes);
app.use('/api/ai', aiRoutes);

// Test route with better error handling
app.get('/', (req, res) => {
    res.json({
        message: 'Autodialer API is running!',
        timestamp: new Date().toISOString()
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`✅ Autodialer server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
});