import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

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
            const response = await axios.get('http://localhost:5002/api/blog/posts');
            setPosts(response.data);
        } catch (error) {
            console.error('Error fetching posts:', error);
        }
    };

    const handleSingleGenerate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const response = await axios.post('http://localhost:5002/api/blog/generate', {
                topic: singleTopic,
                details: details
            });

            setMessage(response.data.message);
            setSingleTopic('');
            setDetails('');
            fetchPosts();
        } catch (error) {
            setMessage('Error generating post: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkGenerate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        const topicList = topics.split('\n').filter(topic => topic.trim());

        try {
            const response = await axios.post('http://localhost:5002/api/blog/generate-bulk', {
                topics: topicList
            });

            setMessage(response.data.message);
            setTopics('');
            fetchPosts();
        } catch (error) {
            setMessage('Error generating posts: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const loadSampleTopics = () => {
        setTopics(`React Hooks Best Practices
Node.js Performance Optimization
Machine Learning for Beginners
Cloud Computing Trends 2024
Database Design Patterns`);
    };

    const viewPost = async (postId) => {
        try {
            const response = await axios.get(`http://localhost:5002/api/blog/posts/${postId}`);
            setSelectedPost(response.data);
        } catch (error) {
            setMessage('Error fetching post: ' + error.message);
        }
    };

    return (
        <div className="App">
            <h1>AI Blog Generator</h1>

            <div className="container">
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
                            />
                        </div>
                        <div className="form-group">
                            <textarea
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                placeholder="Additional details or specific requirements (optional)"
                                rows="3"
                            />
                        </div>
                        <button type="submit" disabled={loading || !singleTopic}>
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
                            />
                        </div>

                        <div className="button-group">
                            <button type="submit" disabled={loading || !topics}>
                                {loading ? 'Generating...' : 'Generate Posts'}
                            </button>
                            <button type="button" onClick={loadSampleTopics}>
                                Load Sample Topics
                            </button>
                        </div>
                    </form>
                </div>

                {message && <div className="message">{message}</div>}

                <div className="section">
                    <h2>Generated Posts ({posts.length})</h2>
                    <div className="posts-list">
                        {posts.map((post) => (
                            <div key={post._id} className="post-card">
                                <h3>{post.title}</h3>
                                <div className="post-meta">
                                    <span>Words: {post.wordCount}</span>
                                    <span>Generated: {new Date(post.generatedAt).toLocaleString()}</span>
                                </div>
                                <div className="post-preview">
                                    {post.content.substring(0, 200)}...
                                </div>
                                <button onClick={() => viewPost(post._id)} className="view-btn">
                                    View Full Post
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {selectedPost && (
                <div className="modal-overlay" onClick={() => setSelectedPost(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{selectedPost.title}</h2>
                            <button className="close-btn" onClick={() => setSelectedPost(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <pre>{selectedPost.content}</pre>
                        </div>
                        <div className="modal-footer">
                            <span>Word Count: {selectedPost.wordCount}</span>
                            <span>Generated: {new Date(selectedPost.generatedAt).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;