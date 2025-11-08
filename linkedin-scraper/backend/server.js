const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS for production
app.use(cors({
    origin: [
        'https://your-linkedin-scraper-frontend.onrender.com',
        'http://localhost:3000'
    ],
    credentials: true
}));

app.use(express.json());

// MongoDB connection with production URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkedin_scraper';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected for LinkedIn Scraper'))
  .catch(err => console.log('MongoDB connection error:', err));

// Routes
const scrapeRoutes = require('./routes/scrape');
app.use('/api/scrape', scrapeRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'LinkedIn Scraper API',
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ LinkedIn Scraper API running on port ${PORT}`);
});
