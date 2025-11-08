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

console.log('MongoDB URI:', MONGODB_URI);

const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully for Blog Generator');
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        console.log('App will run with in-memory storage');
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

// In-memory storage as fallback
let memoryPosts = [];

// Enhanced Mock AI Service
const aiService = {
    async generateBlogPost(topic, details = '') {
        console.log(`Generating blog post for topic: "${topic}"`);
        
        // Simulate AI processing time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const content = `
# ${topic}

## Introduction
Welcome to this comprehensive guide on ${topic}. In today's rapidly evolving technological landscape, understanding ${topic} has become increasingly important.

## Main Content
${topic} represents a significant area in modern technology that has transformed how we approach various challenges.

### Key Benefits
- **Enhanced Efficiency**: ${topic} enables more streamlined processes
- **Improved Performance**: Better results through optimized approaches  
- **Scalability**: Solutions that grow with your needs

## Core Concepts
The foundation of ${topic} rests on several key principles that ensure its effectiveness and reliability.

## Practical Applications
${topic} has been successfully applied across numerous industries and scenarios.

## Conclusion
${topic} represents a powerful approach that continues to evolve and improve. By understanding its core concepts and implementing best practices, you can effectively leverage ${topic} to achieve your goals.

${details ? `\n## Additional Considerations\n${details}` : ''}

---
*This article was generated to provide insights into ${topic}.*
        `.trim();

        return {
            title: topic,
            content: content,
            wordCount: content.split(/\s+/).length,
            topic: topic,
            generatedAt: new Date()
        };
    }
};

// Save post to storage (database or memory)
const savePost = async (postData) => {
    try {
        if (mongoose.connection.readyState === 1) {
            // Save to MongoDB
            const blogPost = new BlogPost(postData);
            const savedPost = await blogPost.save();
            console.log('Post saved to MongoDB:', savedPost._id);
            return savedPost;
        } else {
            // Save to memory
            const memoryPost = {
                ...postData,
                _id: 'mem-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
            };
            memoryPosts.unshift(memoryPost); // Add to beginning
            console.log('Post saved to memory:', memoryPost._id);
            return memoryPost;
        }
    } catch (error) {
        console.error('Error saving post:', error);
        // Fallback to memory storage
        const memoryPost = {
            ...postData,
            _id: 'mem-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
        };
        memoryPosts.unshift(memoryPost);
        return memoryPost;
    }
};

// Get all posts from storage
const getAllPosts = async () => {
    try {
        if (mongoose.connection.readyState === 1) {
            // Get from MongoDB
            const posts = await BlogPost.find().sort({ generatedAt: -1 });
            console.log('Retrieved posts from MongoDB:', posts.length);
            return posts;
        } else {
            // Get from memory
            console.log('Retrieved posts from memory:', memoryPosts.length);
            return memoryPosts;
        }
    } catch (error) {
        console.error('Error fetching posts:', error);
        // Fallback to memory storage
        return memoryPosts;
    }
};

// Get single post by ID
const getPostById = async (id) => {
    try {
        if (mongoose.connection.readyState === 1) {
            return await BlogPost.findById(id);
        } else {
            return memoryPosts.find(post => post._id === id);
        }
    } catch (error) {
        console.error('Error fetching post by ID:', error);
        return memoryPosts.find(post => post._id === id);
    }
};

// Delete post by ID
const deletePostById = async (id) => {
    try {
        if (mongoose.connection.readyState === 1) {
            return await BlogPost.findByIdAndDelete(id);
        } else {
            const index = memoryPosts.findIndex(post => post._id === id);
            if (index !== -1) {
                return memoryPosts.splice(index, 1)[0];
            }
            return null;
        }
    } catch (error) {
        console.error('Error deleting post:', error);
        const index = memoryPosts.findIndex(post => post._id === id);
        if (index !== -1) {
            return memoryPosts.splice(index, 1)[0];
        }
        return null;
    }
};

// Enhanced Routes with better error handling
app.post('/api/blog/generate', async (req, res) => {
    try {
        console.log('Received generate request:', req.body);
        
        const { topic, details } = req.body;
        
        if (!topic || typeof topic !== 'string') {
            return res.status(400).json({ 
                error: 'Valid topic string is required',
                received: topic
            });
        }

        // Generate blog post using AI service
        const generatedPost = await aiService.generateBlogPost(topic, details);
        
        // Save to storage
        const savedPost = await savePost(generatedPost);
        
        res.json({
            message: 'Blog post generated successfully',
            post: savedPost
        });
        
    } catch (error) {
        console.error('Error in /api/blog/generate:', error);
        res.status(500).json({ 
            error: 'Failed to generate blog post',
            details: error.message
        });
    }
});

app.post('/api/blog/generate-bulk', async (req, res) => {
    try {
        console.log('Received bulk generate request:', req.body);
        
        const { topics } = req.body;
        
        if (!topics || !Array.isArray(topics)) {
            return res.status(400).json({ 
                error: 'Topics array is required',
                received: topics
            });
        }

        if (topics.length === 0) {
            return res.status(400).json({ 
                error: 'Topics array cannot be empty'
            });
        }

        const generatedPosts = [];
        
        // Generate posts for each topic
        for (const topic of topics) {
            if (topic && typeof topic === 'string' && topic.trim()) {
                const generatedPost = await aiService.generateBlogPost(topic.trim());
                const savedPost = await savePost(generatedPost);
                generatedPosts.push(savedPost);
            }
        }
        
        console.log(`Generated ${generatedPosts.length} posts successfully`);
        
        res.json({
            message: `Successfully generated ${generatedPosts.length} blog posts`,
            posts: generatedPosts
        });
        
    } catch (error) {
        console.error('Error in /api/blog/generate-bulk:', error);
        res.status(500).json({ 
            error: 'Failed to generate bulk posts',
            details: error.message
        });
    }
});

app.get('/api/blog/posts', async (req, res) => {
    try {
        const posts = await getAllPosts();
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
        const post = await getPostById(req.params.id);
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
        const post = await deletePostById(req.params.id);
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

// Clear all posts (for testing)
app.delete('/api/blog/posts', async (req, res) => {
    try {
        if (mongoose.connection.readyState === 1) {
            await BlogPost.deleteMany({});
        }
        memoryPosts = [];
        res.json({ message: 'All posts cleared successfully' });
    } catch (error) {
        console.error('Error clearing posts:', error);
        res.status(500).json({ 
            error: 'Failed to clear posts',
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
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        memoryPosts: memoryPosts.length,
        version: '1.0.0'
    });
});

// Test route with sample data
app.get('/api/test', async (req, res) => {
    try {
        // Create a test post to verify everything works
        const testPostData = {
            title: 'Test Blog Post',
            content: 'This is a test blog post to verify the API is working correctly.',
            topic: 'API Testing',
            wordCount: 15,
            generatedAt: new Date()
        };

        const savedPost = await savePost(testPostData);

        res.json({ 
            message: 'Blog Generator API is working!',
            database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
            storage: mongoose.connection.readyState === 1 ? 'MongoDB' : 'Memory',
            testPost: savedPost,
            totalPosts: (await getAllPosts()).length,
            endpoints: [
                'POST /api/blog/generate',
                'POST /api/blog/generate-bulk', 
                'GET /api/blog/posts',
                'GET /api/blog/posts/:id',
                'DELETE /api/blog/posts/:id',
                'DELETE /api/blog/posts (clear all)',
                'GET /health'
            ]
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Test failed',
            details: error.message
        });
    }
});

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Blog Generator API',
        version: '1.0.0',
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        storage: mongoose.connection.readyState === 1 ? 'MongoDB' : 'Memory',
        endpoints: {
            health: '/health',
            test: '/api/test',
            generatePost: 'POST /api/blog/generate',
            generateBulk: 'POST /api/blog/generate-bulk',
            getPosts: 'GET /api/blog/posts',
            getPost: 'GET /api/blog/posts/:id',
            deletePost: 'DELETE /api/blog/posts/:id',
            clearAll: 'DELETE /api/blog/posts'
        },
        usage: {
            single: 'POST /api/blog/generate with { "topic": "Your Topic", "details": "Optional details" }',
            bulk: 'POST /api/blog/generate-bulk with { "topics": ["Topic 1", "Topic 2"] }'
        }
    });
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Blog Generator API running on port ${PORT}`);
    console.log(`📍 Health check: https://blog-generator-backend-d1zx.onrender.com/health`);
    console.log(`📍 Test endpoint: https://blog-generator-backend-d1zx.onrender.com/api/test`);
    console.log(`📍 Database status: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    console.log(`📍 Storage: ${mongoose.connection.readyState === 1 ? 'MongoDB' : 'Memory'}`);
});
