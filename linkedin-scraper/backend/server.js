const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS for production - allow all origins for testing
app.use(cors({
    origin: '*', // Change this to specific domains in production
    credentials: true
}));

app.use(express.json());

// MongoDB connection with production URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkedin_scraper';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected for LinkedIn Scraper'))
  .catch(err => console.log('MongoDB connection error:', err));

// Simple Profile Model (create models/Profile.js)
const Profile = mongoose.model('Profile', new mongoose.Schema({
  name: String,
  headline: String,
  location: String,
  about: String,
  experience: Array,
  education: Array,
  skills: Array,
  url: String,
  scrapedAt: {
    type: Date,
    default: Date.now
  }
}));

// Basic Routes (instead of separate file for now)
app.post('/api/scrape/profiles', async (req, res) => {
  try {
    const { urls } = req.body;
    
    if (!urls || !Array.isArray(urls)) {
      return res.status(400).json({ error: 'URLs array is required' });
    }

    // Mock data for testing - replace with actual scraping later
    const mockProfiles = urls.map(url => ({
      name: 'John Doe',
      headline: 'Software Engineer at Tech Company',
      location: 'San Francisco, California',
      about: 'Experienced software engineer with passion for AI and machine learning.',
      experience: [
        {
          title: 'Senior Software Engineer',
          company: 'Tech Corp',
          duration: '2020 - Present'
        }
      ],
      education: [
        {
          school: 'Stanford University',
          degree: 'BS Computer Science',
          field: 'Computer Science'
        }
      ],
      skills: ['JavaScript', 'Node.js', 'React', 'Python'],
      url: url,
      scrapedAt: new Date()
    }));

    // Save to database
    const savedProfiles = await Profile.insertMany(mockProfiles);
    
    res.json({
      message: `Successfully processed ${urls.length} profiles`,
      profiles: savedProfiles
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/scrape/profiles', async (req, res) => {
  try {
    const profiles = await Profile.find().sort({ scrapedAt: -1 });
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profiles' });
  }
});

app.get('/api/scrape/export-csv', async (req, res) => {
  try {
    const profiles = await Profile.find();
    
    let csv = 'Name,Headline,Location,About,Skills,URL\n';
    
    profiles.forEach(profile => {
      const skills = Array.isArray(profile.skills) ? profile.skills.join('; ') : '';
      csv += `"${profile.name || ''}","${profile.headline || ''}","${profile.location || ''}","${profile.about || ''}","${skills}","${profile.url}"\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=linkedin_profiles.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'LinkedIn Scraper API is working!',
    endpoints: [
      'POST /api/scrape/profiles',
      'GET /api/scrape/profiles', 
      'GET /api/scrape/export-csv',
      'GET /health'
    ]
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'LinkedIn Scraper API',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to LinkedIn Scraper API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      test: '/api/test',
      scrapeProfiles: 'POST /api/scrape/profiles',
      getProfiles: 'GET /api/scrape/profiles',
      exportCSV: 'GET /api/scrape/export-csv'
    },
    usage: 'Send POST request to /api/scrape/profiles with { "urls": ["url1", "url2"] }'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ LinkedIn Scraper API running on port ${PORT}`);
  console.log(`📍 Health check: https://linkedin-scraper-backend-ti3w.onrender.com/health`);
  console.log(`📍 Test endpoint: https://linkedin-scraper-backend-ti3w.onrender.com/api/test`);
});
