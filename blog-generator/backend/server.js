const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS configuration
app.use(cors({
    origin: '*',
    credentials: true
}));

app.use(express.json());

// MongoDB connection with better error handling
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/blog_generator';

const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully for Blog Generator');
    } catch (error) {
        console.error('MongoDB connection error:', error);
    }
};

connectDB();

// Blog Post Schema
const blogPostSchema = new mongoose.Schema({
    title: String,
    content: String,
    topic: String,
    wordCount: Number,
    generatedAt: {
        type: Date,
        default: Date.now
    }
});

const BlogPost = mongoose.model('BlogPost', blogPostSchema);

// Mock AI Service (replace with actual AI API)
const aiService = {
    async generateBlogPost(topic, details = '') {
        // Mock AI response - replace with actual Gemini/OpenAI API
        return {
            title: topic,
            content: `This is a comprehensive blog post about ${topic}. ${details ? `Additional details: ${details}` : ''}
            
## Introduction
${topic} is an important topic in today's technology landscape. This article will explore various aspects and provide practical insights.

## Main Content
Here we discuss the key concepts and practical applications of ${topic}. 

### Key Features
- Feature 1: Important aspect of ${topic}
- Feature 2: Another crucial element
- Feature 3: Practical implementation tips

### Best Practices
When working with ${topic}, consider these best practices:
1. Practice 1 for better results
2. Practice 2 to avoid common pitfalls
3. Practice 3 for optimal performance

## Conclusion
${topic} offers significant benefits when implemented correctly. By following the guidelines in this article, you can effectively leverage ${topic} in your projects.

Remember that continuous learning and practice are key to mastering ${topic}.`,
            wordCount: 350,
            topic: topic
        };
    }
};

// Routes
app.post('/api/blog/generate', async (req, res) => {
    try {
        const { topic, details } = req.body;
        
        console.log('Generating blog post for topic:', topic);
        
        if (!topic) {
            return res.status(400).json({ error: 'Topic is required' });
        }

        // Generate blog post using AI service
        const generatedPost = await aiService.generateBlogPost(topic, details);
        
        // Save to database
        const blogPost = new BlogPost(generatedPost);
        const savedPost = await blogPost.save();
        
        res.json({
            message: 'Blog post generated successfully',
            post: savedPost
        });
        
    } catch (error) {
        console.error('Error generating blog post:', error);
        res.status(500).json({ 
            error: 'Failed to generate blog post',
            details: error.message 
        });
    }
});

app.post('/api/blog/generate-bulk', async (req, res) => {
    try {
        const { topics } = req.body;
        
        console.log('Generating bulk posts for topics:', topics);
        
        if (!topics || !Array.isArray(topics)) {
            return res.status(400).json({ error: 'Topics array is required' });
        }

        const generatedPosts = [];
        
        // Generate posts for each topic
        for (const topic of topics) {
            const generatedPost = await aiService.generateBlogPost(topic);
            const blogPost = new BlogPost(generatedPost);
            const savedPost = await blogPost.save();
            generatedPosts.push(savedPost);
        }
        
        res.json({
            message: `Successfully generated ${generatedPosts.length} blog posts`,
            posts: generatedPosts
        });
        
    } catch (error) {
        console.error('Error generating bulk posts:', error);
        res.status(500).json({ 
            error: 'Failed to generate bulk posts',
            details: error.message 
        });
    }
});

app.get('/api/blog/posts', async (req, res) => {
    try {
        const posts = await BlogPost.find().sort({ generatedAt: -1 });
        res.json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ 
            error: 'Failed to fetch posts',
            details: error.message 
        });
    }
});

app.get('/api/blog/posts/:id', async (req, res) => {
    try {
        const post = await BlogPost.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        res.json(post);
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({ 
            error: 'Failed to fetch post',
            details: error.message 
        });
    }
});

app.delete('/api/blog/posts/:id', async (req, res) => {
    try {
        const post = await BlogPost.findByIdAndDelete(req.params.id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ 
            error: 'Failed to delete post',
            details: error.message 
        });
    }
});

// Health check route
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'Blog Generator API',
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
});

// Test route
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Blog Generator API is working!',
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        endpoints: [
            'POST /api/blog/generate',
            'POST /api/blog/generate-bulk', 
            'GET /api/blog/posts',
            'GET /api/blog/posts/:id',
            'DELETE /api/blog/posts/:id',
            'GET /health'
        ]
    });
});

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Blog Generator API',
        version: '1.0.0',
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        endpoints: {
            health: '/health',
            test: '/api/test',
            generatePost: 'POST /api/blog/generate',
            generateBulk: 'POST /api/blog/generate-bulk',
            getPosts: 'GET /api/blog/posts',
            getPost: 'GET /api/blog/posts/:id',
            deletePost: 'DELETE /api/blog/posts/:id'
        },
        usage: 'Send POST request to /api/blog/generate with { "topic": "Your Topic", "details": "Optional details" }'
    });
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Blog Generator API running on port ${PORT}`);
    console.log(`📍 Health check: https://blog-generator-backend-d1zx.onrender.com/health`);
    console.log(`📍 Test endpoint: https://blog-generator-backend-d1zx.onrender.com/api/test`);
});
