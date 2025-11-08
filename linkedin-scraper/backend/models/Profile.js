const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    name: {
        type: String,
        default: ''
    },
    headline: {
        type: String,
        default: ''
    },
    location: {
        type: String,
        default: ''
    },
    about: {
        type: String,
        default: ''
    },
    experience: [{
        title: String,
        company: String,
        duration: String
    }],
    education: [{
        school: String,
        degree: String,
        year: String
    }],
    skills: [String],
    profileUrl: {
        type: String,
        required: true
    },
    scrapedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Profile', profileSchema);