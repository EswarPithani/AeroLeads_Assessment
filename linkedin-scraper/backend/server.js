const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/linkedin_scraper')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Routes
const scrapeRoutes = require('./routes/scrape');
app.use('/api/scrape', scrapeRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'LinkedIn Scraper API is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Scraper server running on port ${PORT}`);
});