import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// Base URL for your backend API
const API_BASE_URL = 'https://blog-generator-backend-d1zx.onrender.com';

function App() {
    const [singleTopic, setSingleTopic] = useState('');
    const [topics, setTopics] = useState('');
    const [details, setDetails] = useState('');
    const [posts, setPosts] = useState([]);
    const [selectedPost, setSelectedPost] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            console.log('Fetching posts...');
            const response = await axios.get(`${API_BASE_URL}/api/blog/posts`, {
                timeout: 15000
            });
            console.log('Posts fetched:', response.data);
            setPosts(response.data);
        } catch (error) {
            console.error('Error fetching posts:', error);
            setMessage('Error fetching posts: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleSingleGenerate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            console.log('Generating single post for:', singleTopic);
            const response = await axios.post(`${API_BASE_URL}/api/blog/generate`, {
                topic: singleTopic,
                details: details
            }, {
                timeout: 60000
            });

            console.log('Single generation response:', response.data);
            setMessage(response.data.message);
            setSingleTopic('');
            setDetails('');
            
            // Wait a bit before fetching to ensure the post is saved
            setTimeout(() => {
                fetchPosts();
            }, 1000);
            
        } catch (error) {
            console.error('Generation error:', error);
            setMessage('Error generating post: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleBulkGenerate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        const topicList = topics.split('\n').filter(topic => topic.trim());
        console.log('Generating bulk posts for:', topicList);

        try {
            const response = await axios.post(`${API_BASE_URL}/api/blog/generate-bulk`, {
                topics: topicList
            }, {
                timeout: 120000
            });

            console.log('Bulk generation response:', response.data);
            setMessage(response.data.message);
            setTopics('');
            
            // Wait a bit before fetching to ensure posts are saved
            setTimeout(() => {
                fetchPosts();
            }, 2000);
            
        } catch (error) {
            console.error('Bulk generation error:', error);
            setMessage('Error generating posts: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const loadSampleTopics = () => {
        setTopics(`React Hooks Best Practices
Node.js Performance Optimization
Machine Learning for Beginners
Cloud Computing Trends 2024
Database Design Patterns
Python Web Development
JavaScript ES6 Features
DevOps CI/CD Pipelines
Microservices Architecture
AI in Software Development`);
    };

    const viewPost = async (postId) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/blog/posts/${postId}`, {
                timeout: 15000
            });
            setSelectedPost(response.data);
        } catch (error) {
            setMessage('Error fetching post: ' + (error.response?.data?.error || error.message));
        }
    };

    const deletePost = async (postId) => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            try {
                await axios.delete(`${API_BASE_URL}/api/blog/posts/${postId}`);
                setMessage('Post deleted successfully');
                fetchPosts(); // Refresh the list
            } catch (error) {
                setMessage('Error deleting post: ' + (error.response?.data?.error || error.message));
            }
        }
    };

    const testConnection = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/health`, {
                timeout: 10000
            });
            setMessage(`✅ Backend connected: ${response.data.status} - Database: ${response.data.database}`);
        } catch (error) {
            setMessage('❌ Backend connection failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const clearAllPosts = async () => {
        if (window.confirm('Are you sure you want to clear all posts? This action cannot be undone.')) {
            try {
                // Delete posts one by one (since we don't have a bulk delete endpoint)
                for (const post of posts) {
                    await axios.delete(`${API_BASE_URL}/api/blog/posts/${post._id}`);
                }
                setMessage('All posts cleared successfully');
                setPosts([]);
            } catch (error) {
                setMessage('Error clearing posts: ' + (error.response?.data?.error || error.message));
            }
        }
    };

    return (
        <div className="App">
            <h1>AI Blog Generator</h1>
            <p className="subtitle">Backend: {API_BASE_URL}</p>

            <div className="container">
                <div className="button-group">
                    <button type="button" onClick={testConnection} disabled={loading}>
                        {loading ? 'Testing...' : 'Test Backend Connection'}
                    </button>
                    <button type="button" onClick={fetchPosts} disabled={loading}>
                        Refresh Posts
                    </button>
                    {posts.length > 0 && (
                        <button type="button" onClick={clearAllPosts} disabled={loading} className="clear-all-btn">
                            Clear All Posts
                        </button>
                    )}
                </div>

                <div className="section">
                    <h2>Generate Single Post</h2>
                    <form onSubmit={handleSingleGenerate} className="single-form">
                        <div className="form-group">
                            <input
                                type="text"
                                value={singleTopic}
                                onChange={(e) => setSingleTopic(e.target.value)}
                                placeholder="Enter blog topic (e.g., 'React Best Practices')"
                                className="topic-input"
                                disabled={loading}
                            />
                        </div>
                        <div className="form-group">
                            <textarea
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                placeholder="Additional details or specific requirements (optional)"
                                rows="3"
                                disabled={loading}
                            />
                        </div>
                        <button type="submit" disabled={loading || !singleTopic.trim()}>
                            {loading ? 'Generating...' : 'Generate Post'}
                        </button>
                    </form>
                </div>

                <div className="section">
                    <h2>Generate Multiple Posts</h2>
                    <form onSubmit={handleBulkGenerate} className="bulk-form">
                        <div className="form-group">
                            <label>Enter Topics (one per line):</label>
                            <textarea
                                value={topics}
                                onChange={(e) => setTopics(e.target.value)}
                                placeholder="React Hooks Best Practices"
                                rows="6"
                                disabled={loading}
                            />
                        </div>

                        <div className="button-group">
                            <button type="submit" disabled={loading || !topics.trim()}>
                                {loading ? 'Generating...' : 'Generate Posts'}
                            </button>
                            <button type="button" onClick={loadSampleTopics} disabled={loading}>
                                Load Sample Topics
                            </button>
                            <button type="button" onClick={() => setTopics('')} disabled={loading}>
                                Clear Topics
                            </button>
                        </div>
                    </form>
                </div>

                {message && (
                    <div className={`message ${message.includes('Error') || message.includes('❌') ? 'error' : 'success'}`}>
                        {message}
                    </div>
                )}

                <div className="section">
                    <div className="section-header">
                        <h2>Generated Posts ({posts.length})</h2>
                        <div className="section-actions">
                            <button onClick={fetchPosts} className="refresh-btn" disabled={loading}>
                                ↻ Refresh
                            </button>
                            {posts.length > 0 && (
                                <button onClick={() => setPosts([])} className="clear-btn">
                                    Clear View
                                </button>
                            )}
                        </div>
                    </div>
                    
                    {posts.length === 0 ? (
                        <div className="no-posts">
                            <p>No posts generated yet. Start by generating some blog posts above!</p>
                            <p className="hint">If you just generated posts, click "Refresh Posts" to load them.</p>
                        </div>
                    ) : (
                        <div className="posts-list">
                            {posts.map((post, index) => (
                                <div key={post._id || index} className="post-card">
                                    <div className="post-header">
                                        <h3>{post.title || 'Untitled Post'}</h3>
                                        <button 
                                            onClick={() => deletePost(post._id)} 
                                            className="delete-btn"
                                            title="Delete post"
                                            disabled={loading}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                    <div className="post-meta">
                                        <span>Topic: {post.topic || 'General'}</span>
                                        <span>Words: {post.wordCount || 'N/A'}</span>
                                        <span>Generated: {new Date(post.generatedAt).toLocaleString()}</span>
                                    </div>
                                    <div className="post-preview">
                                        {post.content ? 
                                            `${post.content.substring(0, 200)}...` : 
                                            'No content available'
                                        }
                                    </div>
                                    <div className="post-actions">
                                        <button 
                                            onClick={() => viewPost(post._id)} 
                                            className="view-btn"
                                            disabled={loading}
                                        >
                                            View Full Post
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {selectedPost && (
                <div className="modal-overlay" onClick={() => setSelectedPost(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{selectedPost.title || 'Untitled Post'}</h2>
                            <button className="close-btn" onClick={() => setSelectedPost(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="post-content">
                                {selectedPost.content ? (
                                    <pre>{selectedPost.content}</pre>
                                ) : (
                                    <p>No content available for this post.</p>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <span>Topic: {selectedPost.topic || 'General'}</span>
                            <span>Word Count: {selectedPost.wordCount || 'N/A'}</span>
                            <span>Generated: {new Date(selectedPost.generatedAt).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
