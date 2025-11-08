import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

// Base URL for your backend API
const API_BASE_URL = 'https://linkedin-scraper-backend-ti3w.onrender.com';

function App() {
    const [urls, setUrls] = useState('');
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        const urlList = urls.split('\n').filter(url => url.trim());

        try {
            const response = await axios.post(`${API_BASE_URL}/api/scrape/profiles`, {
                urls: urlList
            });

            setProfiles(response.data.profiles);
            setMessage(response.data.message);
        } catch (error) {
            setMessage('Error scraping profiles: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/scrape/export-csv`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'linkedin_profiles.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            setMessage('Error exporting CSV: ' + (error.response?.data?.error || error.message));
        }
    };

    const loadSampleData = () => {
        setUrls(`https://www.linkedin.com/in/satyanadella
https://www.linkedin.com/in/sundarpichai
https://www.linkedin.com/in/markzuckerberg
https://www.linkedin.com/in/reidhoffman
https://www.linkedin.com/in/jeffweiner`);
    };

    // Test backend connection
    const testConnection = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/health`);
            setMessage(`✅ Backend connected: ${response.data.status} - ${response.data.service}`);
        } catch (error) {
            setMessage('❌ Backend connection failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="App">
            <h1>LinkedIn Profile Scraper</h1>
            <p className="subtitle">Connected to: {API_BASE_URL}</p>

            <div className="container">
                <div className="button-group">
                    <button type="button" onClick={testConnection} disabled={loading}>
                        {loading ? 'Testing...' : 'Test Backend Connection'}
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="scraper-form">
                    <div className="form-group">
                        <label>Enter LinkedIn Profile URLs (one per line):</label>
                        <textarea
                            value={urls}
                            onChange={(e) => setUrls(e.target.value)}
                            placeholder="https://www.linkedin.com/in/username"
                            rows="10"
                        />
                    </div>

                    <div className="button-group">
                        <button type="submit" disabled={loading || !urls.trim()}>
                            {loading ? 'Scraping...' : 'Scrape Profiles'}
                        </button>
                        <button type="button" onClick={loadSampleData}>
                            Load Sample URLs
                        </button>
                        <button type="button" onClick={() => setUrls('')}>
                            Clear URLs
                        </button>
                    </div>
                </form>

                {message && (
                    <div className={`message ${message.includes('Error') || message.includes('❌') ? 'error' : 'success'}`}>
                        {message}
                    </div>
                )}

                {profiles.length > 0 && (
                    <div className="results">
                        <div className="results-header">
                            <h2>Scraped Profiles ({profiles.length})</h2>
                            <div>
                                <button onClick={handleExportCSV} className="export-btn">
                                    Export to CSV
                                </button>
                                <button onClick={() => setProfiles([])} className="clear-btn">
                                    Clear Results
                                </button>
                            </div>
                        </div>

                        <div className="profiles-list">
                            {profiles.map((profile, index) => (
                                <div key={index} className="profile-card">
                                    <h3>{profile.name || 'No Name'}</h3>
                                    <p><strong>Headline:</strong> {profile.headline || 'N/A'}</p>
                                    <p><strong>Location:</strong> {profile.location || 'N/A'}</p>
                                    <p><strong>About:</strong> {profile.about ? `${profile.about.substring(0, 100)}...` : 'N/A'}</p>
                                    <p><strong>Skills:</strong> {Array.isArray(profile.skills) ? profile.skills.join(', ') : 'N/A'}</p>
                                    <p><strong>URL:</strong> 
                                        <a href={profile.url} target="_blank" rel="noopener noreferrer" className="profile-link">
                                            {profile.url}
                                        </a>
                                    </p>
                                    <p><strong>Scraped:</strong> {new Date(profile.scrapedAt).toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
