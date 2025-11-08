const express = require('express');
const router = express.Router();
const Call = require('../models/Call');

// Mock Twilio service for demonstration
class MockTwilioService {
    async makeCall(phoneNumber) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Mock response
        return {
            sid: 'CA' + Math.random().toString(36).substring(2, 15),
            status: 'completed',
            duration: Math.floor(Math.random() * 60) + 10
        };
    }
}

// POST /api/calls/make - Make a call
router.post('/make', async (req, res) => {
    try {
        const { phoneNumber, aiPrompt } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        // Create call record
        const call = new Call({
            phoneNumber,
            aiPrompt,
            status: 'in-progress'
        });
        await call.save();

        // Mock the call
        const twilioService = new MockTwilioService();
        const callResult = await twilioService.makeCall(phoneNumber);

        // Update call record
        call.status = 'completed';
        call.duration = callResult.duration;
        call.callSid = callResult.sid;
        await call.save();

        res.json({
            message: 'Call completed successfully',
            call: call
        });

    } catch (error) {
        console.error('Call error:', error);
        res.status(500).json({ error: 'Call failed', details: error.message });
    }
});

// POST /api/calls/bulk - Make bulk calls
router.post('/bulk', async (req, res) => {
    try {
        const { phoneNumbers } = req.body;

        if (!phoneNumbers || !Array.isArray(phoneNumbers)) {
            return res.status(400).json({ error: 'Phone numbers array is required' });
        }

        const results = [];

        for (const phoneNumber of phoneNumbers.slice(0, 10)) { // Limit to 10
            const call = new Call({
                phoneNumber,
                status: 'in-progress'
            });
            await call.save();

            // Mock call
            const twilioService = new MockTwilioService();
            const callResult = await twilioService.makeCall(phoneNumber);

            call.status = Math.random() > 0.2 ? 'completed' : 'failed'; // 80% success rate
            call.duration = callResult.duration;
            call.callSid = callResult.sid;
            await call.save();

            results.push(call);
        }

        res.json({
            message: `Processed ${results.length} calls`,
            calls: results
        });

    } catch (error) {
        res.status(500).json({ error: 'Bulk call failed', details: error.message });
    }
});

// GET /api/calls - Get all calls
router.get('/', async (req, res) => {
    try {
        const calls = await Call.find().sort({ createdAt: -1 });
        res.json(calls);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch calls' });
    }
});

// GET /api/calls/stats - Get call statistics
router.get('/stats', async (req, res) => {
    try {
        const totalCalls = await Call.countDocuments();
        const completedCalls = await Call.countDocuments({ status: 'completed' });
        const failedCalls = await Call.countDocuments({ status: 'failed' });
        const pendingCalls = await Call.countDocuments({ status: 'pending' });

        res.json({
            totalCalls,
            completedCalls,
            failedCalls,
            pendingCalls,
            successRate: totalCalls > 0 ? (completedCalls / totalCalls * 100).toFixed(2) : 0
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

module.exports = router;