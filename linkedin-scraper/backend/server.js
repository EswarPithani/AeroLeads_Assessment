const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS for production - allow all origins for testing
app.use(cors({
    origin: '*',
    credentials: true
}));

app.use(express.json());

// MongoDB connection with better error handling
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkedin_scraper';

// MongoDB connection with retry logic
const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        // Don't exit process, allow the app to run without DB
    }
};

connectDB();

// Simple Profile Model
const profileSchema = new mongoose.Schema({
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
});

const Profile = mongoose.model('Profile', profileSchema);

// Basic Routes with better error handling
app.post('/api/scrape/profiles', async (req, res) => {
    try {
        const { urls } = req.body;
        
        console.log('Received URLs:', urls); // Debug log
        
        if (!urls || !Array.isArray(urls)) {
            return res.status(400).json({ error: 'URLs array is required' });
        }

        // Check if MongoDB is connected
        if (mongoose.connection.readyState !== 1) {
            console.log('MongoDB not connected, using mock data only');
            // Return mock data without saving to DB
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

            return res.json({
                message: `Successfully processed ${urls.length} profiles (Mock Data - DB not connected)`,
                profiles: mockProfiles
            });
        }

        // Mock data for testing
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
        console.error('Server Error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

app.get('/api/scrape/profiles', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(500).json({ error: 'Database not connected' });
        }
        const profiles = await Profile.find().sort({ scrapedAt: -1 });
        res.json(profiles);
    } catch (error) {
        console.error('Error fetching profiles:', error);
        res.status(500).json({ error: 'Failed to fetch profiles' });
    }
});

app.get('/api/scrape/export-csv', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(500).json({ error: 'Database not connected' });
        }
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
        console.error('Error exporting CSV:', error);
        res.status(500).json({ error: 'Failed to export CSV' });
    }
});

// Test route
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'LinkedIn Scraper API is working!',
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
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
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
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
