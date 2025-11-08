const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blog_generator')
    .then(() => console.log('MongoDB connected for Blog Generator'))
    .catch(err => console.log('MongoDB connection error:', err));

// Routes
const blogRoutes = require('./routes/blog');
app.use('/api/blog', blogRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Blog Generator API is running!' });
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
    console.log(`Blog generator server running on port ${PORT}`);
});