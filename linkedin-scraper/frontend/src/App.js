import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

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
            const response = await axios.post('http://localhost:5000/api/scrape/profiles', {
                urls: urlList
            });

            setProfiles(response.data.profiles);
            setMessage(response.data.message);
        } catch (error) {
            setMessage('Error scraping profiles: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/scrape/export-csv', {
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
            setMessage('Error exporting CSV: ' + error.message);
        }
    };

    const loadSampleData = () => {
        setUrls(`https://www.linkedin.com/in/johndoe
https://www.linkedin.com/in/janesmith
https://www.linkedin.com/in/mikeross
https://www.linkedin.com/in/sarawilson
https://www.linkedin.com/in/davidlee`);
    };

    return (
        <div className="App">
            <h1>LinkedIn Profile Scraper</h1>

            <div className="container">
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
                        <button type="submit" disabled={loading}>
                            {loading ? 'Scraping...' : 'Scrape Profiles'}
                        </button>
                        <button type="button" onClick={loadSampleData}>
                            Load Sample URLs
                        </button>
                    </div>
                </form>

                {message && <div className="message">{message}</div>}

                {profiles.length > 0 && (
                    <div className="results">
                        <div className="results-header">
                            <h2>Scraped Profiles ({profiles.length})</h2>
                            <button onClick={handleExportCSV} className="export-btn">
                                Export to CSV
                            </button>
                        </div>

                        <div className="profiles-list">
                            {profiles.map((profile, index) => (
                                <div key={index} className="profile-card">
                                    <h3>{profile.name}</h3>
                                    <p><strong>Headline:</strong> {profile.headline}</p>
                                    <p><strong>Location:</strong> {profile.location}</p>
                                    <p><strong>URL:</strong>
                                        <a href={profile.profileUrl} target="_blank" rel="noopener noreferrer">
                                            {profile.profileUrl}
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