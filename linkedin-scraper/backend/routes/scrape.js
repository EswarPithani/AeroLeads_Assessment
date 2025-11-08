const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Mock scraper since LinkedIn scraping is complex
class MockScraper {
    async scrapeProfile(profileUrl) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Mock data for demonstration
        const mockData = {
            name: `User ${Math.random().toString(36).substring(7)}`,
            headline: 'Software Engineer at Tech Company',
            location: 'Mumbai, Maharashtra, India',
            about: 'Experienced software engineer with passion for AI and machine learning.',
            experience: [
                { title: 'Senior Software Engineer', company: 'Tech Corp', duration: '2020-Present' }
            ],
            education: [
                { school: 'University of Technology', degree: 'B.Tech Computer Science', year: '2020' }
            ],
            skills: ['JavaScript', 'Python', 'React', 'Node.js']
        };

        return mockData;
    }
}

// POST /api/scrape/profiles - Scrape multiple profiles
router.post('/profiles', async (req, res) => {
    try {
        const { urls } = req.body;

        if (!urls || !Array.isArray(urls)) {
            return res.status(400).json({ error: 'URLs array is required' });
        }

        const scraper = new MockScraper();
        const profiles = [];

        for (const url of urls.slice(0, 5)) { // Limit to 5 for testing
            console.log(`Scraping: ${url}`);
            const profileData = await scraper.scrapeProfile(url);

            if (profileData) {
                // Save to database
                const profile = new Profile({
                    ...profileData,
                    profileUrl: url
                });
                await profile.save();
                profiles.push(profile);
            }
        }

        res.json({
            message: `Successfully scraped ${profiles.length} profiles`,
            profiles
        });

    } catch (error) {
        console.error('Scraping error:', error);
        res.status(500).json({ error: 'Scraping failed', details: error.message });
    }
});

// GET /api/scrape/profiles - Get all scraped profiles
router.get('/profiles', async (req, res) => {
    try {
        const profiles = await Profile.find().sort({ scrapedAt: -1 });
        res.json(profiles);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch profiles' });
    }
});

// Export to CSV
router.get('/export-csv', async (req, res) => {
    try {
        const profiles = await Profile.find().sort({ scrapedAt: -1 });

        const csvWriter = createCsvWriter({
            path: 'temp-profiles.csv',
            header: [
                { id: 'name', title: 'Name' },
                { id: 'headline', title: 'Headline' },
                { id: 'location', title: 'Location' },
                { id: 'profileUrl', title: 'Profile URL' },
                { id: 'scrapedAt', title: 'Scraped At' }
            ]
        });

        await csvWriter.writeRecords(profiles);

        res.download('temp-profiles.csv', 'linkedin_profiles.csv');
    } catch (error) {
        res.status(500).json({ error: 'Failed to export CSV' });
    }
});

module.exports = router;