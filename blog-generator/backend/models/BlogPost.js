const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    topic: String,
    aiModel: {
        type: String,
        default: 'mock'
    },
    wordCount: Number,
    generatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('BlogPost', blogPostSchema);