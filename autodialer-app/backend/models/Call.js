const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
    phoneNumber: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'in-progress'],
        default: 'pending'
    },
    duration: Number,
    callSid: String,
    aiPrompt: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Call', callSchema);