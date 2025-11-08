const express = require('express');
const router = express.Router();
const Call = require('../models/Call');

// Process AI prompt and extract phone number
router.post('/process-prompt', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // Simple NLP to extract phone number
        const phoneMatch = prompt.match(/\b\d{10,13}\b/);

        if (!phoneMatch) {
            return res.status(400).json({
                error: 'No phone number found in prompt. Please include a number like 18001234567'
            });
        }

        const phoneNumber = phoneMatch[0];

        // Check if it's a test number (starts with 1800)
        if (!phoneNumber.startsWith('1800')) {
            return res.status(400).json({
                error: 'Please use test numbers starting with 1800 for demonstration'
            });
        }

        res.json({
            phoneNumber,
            action: 'make_call',
            confidence: 0.9,
            message: `I'll call ${phoneNumber} for you`
        });

    } catch (error) {
        res.status(500).json({ error: 'AI processing failed', details: error.message });
    }
});

module.exports = router;