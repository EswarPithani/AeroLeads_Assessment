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

console.log('MongoDB URI:', MONGODB_URI); // Debug log

const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB connected successfully for Blog Generator');
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        console.log('App will run without database connection');
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

// Enhanced Mock AI Service
const aiService = {
    async generateBlogPost(topic, details = '') {
        console.log(`Generating blog post for topic: "${topic}"`);
        
        // Simulate AI processing time
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const content = `
# ${topic}

## Introduction
Welcome to this comprehensive guide on ${topic}. In today's rapidly evolving technological landscape, understanding ${topic} has become increasingly important for developers, businesses, and enthusiasts alike.

## What is ${topic}?
${topic} represents a significant area in modern technology that has transformed how we approach various challenges and opportunities in the digital space.

### Key Benefits
- **Enhanced Efficiency**: ${topic} enables more streamlined processes
- **Improved Performance**: Better results through optimized approaches  
- **Scalability**: Solutions that grow with your needs
- **Cost-Effectiveness**: Maximizing value while minimizing expenses

## Core Concepts

### Fundamental Principles
The foundation of ${topic} rests on several key principles that ensure its effectiveness and reliability in various applications.

### Implementation Strategies
Successful implementation of ${topic} requires careful planning and execution. Here are some proven strategies:

1. **Start Small**: Begin with a focused implementation
2. **Iterate Quickly**: Learn and adapt through rapid iterations
3. **Measure Results**: Track key metrics to gauge success
4. **Scale Gradually**: Expand implementation based on proven results

## Practical Applications

### Real-World Use Cases
${topic} has been successfully applied across numerous industries and scenarios:

- **Web Development**: Enhancing user experiences and performance
- **Data Analysis**: Processing and interpreting complex datasets
- **Automation**: Streamlining repetitive tasks and processes
- **Innovation**: Driving new solutions and approaches

## Best Practices

### Do's and Don'ts
**Do:**
- Research thoroughly before implementation
- Test extensively in controlled environments
- Document your processes and learnings
- Stay updated with latest developments

**Don't:**
- Rush implementation without proper planning
- Ignore security considerations
- Overlook performance implications
- Disregard user feedback

## Advanced Techniques

### Optimization Strategies
For those looking to take ${topic} to the next level, consider these advanced optimization techniques:

- Performance tuning and benchmarking
- Integration with complementary technologies
- Customization for specific use cases
- Automation and workflow enhancements

## Future Trends

### What's Next for ${topic}?
The future of ${topic} looks promising with several emerging trends:

- Artificial Intelligence integration
- Enhanced security features
- Improved user experiences
- Broader industry adoption

## Conclusion

${topic} represents a powerful approach that continues to evolve and improve. By understanding its core concepts, implementing best practices, and staying informed about emerging trends, you can effectively leverage ${topic} to achieve your goals.

Remember that continuous learning and adaptation are key to success with ${topic}. The landscape is always changing, and staying current will ensure you get the most value from your efforts.

${details ? `\n## Additional Considerations\n${details}` : ''}

---
*This article was generated to provide comprehensive insights into ${topic}. Always verify information and adapt recommendations to your specific context.*
        `.trim();

        return {
            title: topic,
            content: content,
            wordCount: content.split(/\s+/).length,
            topic: topic
        };
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
        
        // Save to database if connected
        let savedPost;
        if (mongoose.connection.readyState === 1) {
            const blogPost = new BlogPost(generatedPost);
            savedPost = await blogPost.save();
            console.log('Post saved to database:', savedPost._id);
        } else {
            savedPost = { ...generatedPost, _id: 'mock-id-' + Date.now() };
            console.log('Database not connected, using mock post');
        }
        
        res.json({
            message: 'Blog post generated successfully',
            post: savedPost
        });
        
    } catch (error) {
        console.error('Error in /api/blog/generate:', error);
        res.status(500).json({ 
            error: 'Failed to generate blog post',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
                
                // Save to database if connected
                let savedPost;
                if (mongoose.connection.readyState === 1) {
                    const blogPost = new BlogPost(generatedPost);
                    savedPost = await blogPost.save();
                } else {
                    savedPost = { ...generatedPost, _id: 'mock-id-' + Date.now() + Math.random() };
                }
                
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
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

app.get('/api/blog/posts', async (req, res) => {
    try {
        let posts;
        if (mongoose.connection.readyState === 1) {
            posts = await BlogPost.find().sort({ generatedAt: -1 });
        } else {
            posts = [];
            console.log('Database not connected, returning empty posts array');
        }
        
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
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not available' });
        }
        
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
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not available' });
        }
        
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
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        version: '1.0.0'
    });
});

// Test route with sample data
app.get('/api/test', async (req, res) => {
    try {
        // Create a test post to verify everything works
        const testPost = {
            title: 'Test Blog Post',
            content: 'This is a test blog post to verify the API is working correctly.',
            topic: 'API Testing',
            wordCount: 15,
            generatedAt: new Date()
        };

        let savedPost;
        if (mongoose.connection.readyState === 1) {
            const blogPost = new BlogPost(testPost);
            savedPost = await blogPost.save();
        }

        res.json({ 
            message: 'Blog Generator API is working!',
            database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
            testPost: savedPost || testPost,
            endpoints: [
                'POST /api/blog/generate',
                'POST /api/blog/generate-bulk', 
                'GET /api/blog/posts',
                'GET /api/blog/posts/:id',
                'DELETE /api/blog/posts/:id',
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
        endpoints: {
            health: '/health',
            test: '/api/test',
            generatePost: 'POST /api/blog/generate',
            generateBulk: 'POST /api/blog/generate-bulk',
            getPosts: 'GET /api/blog/posts',
            getPost: 'GET /api/blog/posts/:id',
            deletePost: 'DELETE /api/blog/posts/:id'
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
});
