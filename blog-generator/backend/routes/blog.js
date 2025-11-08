const express = require('express');
const router = express.Router();
const BlogPost = require('../models/BlogPost');

// Mock AI service for demonstration
class MockAIService {
    async generateBlogPost(topic, details = '') {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 3000));

        const mockContent = `
# ${topic}

## Introduction
This is a comprehensive blog post about ${topic}. ${details}

## Main Content
${topic} is an important topic in today's technology landscape. It has revolutionized the way we think about software development and has opened up new possibilities for innovation.

### Key Features
- Feature 1: Important aspect of ${topic}
- Feature 2: Another crucial element
- Feature 3: Additional benefit for developers

### Code Example
Here's a simple code example related to ${topic}:

\`\`\`javascript
// Example code for ${topic}
function example() {
  console.log("Hello, ${topic}!");
  return true;
}
\`\`\`

## Conclusion
In conclusion, ${topic} represents a significant advancement in technology. Understanding its principles and applications can greatly benefit any developer's career.

## Additional Resources
- Official documentation
- Community forums
- Tutorial videos
    `.trim();

        return mockContent;
    }

    async generateMultiplePosts(topics) {
        const posts = [];
        for (const topic of topics) {
            const content = await this.generateBlogPost(topic);
            posts.push({ topic, content });
        }
        return posts;
    }
}

// POST /api/blog/generate - Generate single blog post
router.post('/generate', async (req, res) => {
    try {
        const { topic, details } = req.body;

        if (!topic) {
            return res.status(400).json({ error: 'Topic is required' });
        }

        const aiService = new MockAIService();
        const content = await aiService.generateBlogPost(topic, details);

        // Save to database
        const blogPost = new BlogPost({
            title: topic,
            content: content,
            topic: topic,
            wordCount: content.split(' ').length,
            aiModel: 'mock-ai'
        });
        await blogPost.save();

        res.json({
            message: 'Blog post generated successfully',
            post: blogPost
        });

    } catch (error) {
        console.error('Generation error:', error);
        res.status(500).json({ error: 'Blog generation failed', details: error.message });
    }
});

// POST /api/blog/generate-bulk - Generate multiple blog posts
router.post('/generate-bulk', async (req, res) => {
    try {
        const { topics } = req.body;

        if (!topics || !Array.isArray(topics)) {
            return res.status(400).json({ error: 'Topics array is required' });
        }

        const aiService = new MockAIService();
        const generatedPosts = await aiService.generateMultiplePosts(topics.slice(0, 5)); // Limit to 5

        const savedPosts = [];
        for (const post of generatedPosts) {
            const blogPost = new BlogPost({
                title: post.topic,
                content: post.content,
                topic: post.topic,
                wordCount: post.content.split(' ').length,
                aiModel: 'mock-ai'
            });
            await blogPost.save();
            savedPosts.push(blogPost);
        }

        res.json({
            message: `Generated ${savedPosts.length} blog posts`,
            posts: savedPosts
        });

    } catch (error) {
        res.status(500).json({ error: 'Bulk generation failed', details: error.message });
    }
});

// GET /api/blog/posts - Get all blog posts
router.get('/posts', async (req, res) => {
    try {
        const posts = await BlogPost.find().sort({ generatedAt: -1 });
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

// GET /api/blog/posts/:id - Get single blog post
router.get('/posts/:id', async (req, res) => {
    try {
        const post = await BlogPost.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        res.json(post);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch post' });
    }
});

module.exports = router;