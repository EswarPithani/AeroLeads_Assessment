import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
    const [phoneNumbers, setPhoneNumbers] = useState('');
    const [aiPrompt, setAiPrompt] = useState('');
    const [calls, setCalls] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [backendStatus, setBackendStatus] = useState('checking');

    useEffect(() => {
        checkBackend();
        fetchCalls();
        fetchStats();
    }, []);

    const checkBackend = async () => {
        try {
            const response = await axios.get('http://localhost:5001/health');
            setBackendStatus('connected');
        } catch (error) {
            setBackendStatus('disconnected');
            setMessage('❌ Backend server is not running. Please start the backend server first.');
        }
    };

    const fetchCalls = async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/calls');
            setCalls(response.data);
        } catch (error) {
            console.error('Error fetching calls:', error);
            setMessage('Failed to fetch calls. Make sure backend is running.');
        }
    };

    const fetchStats = async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/calls/stats');
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleBulkCall = async (e) => {
        e.preventDefault();
        if (backendStatus !== 'connected') {
            setMessage('❌ Backend server is not connected. Please start the backend first.');
            return;
        }

        setLoading(true);
        setMessage('');

        const numbers = phoneNumbers.split('\n')
            .filter(num => num.trim())
            .map(num => num.trim());

        try {
            const response = await axios.post('http://localhost:5001/api/calls/bulk', {
                phoneNumbers: numbers
            });

            setMessage(`✅ ${response.data.message}`);
            fetchCalls();
            fetchStats();
        } catch (error) {
            setMessage('❌ Error making calls: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleAIPrompt = async (e) => {
        e.preventDefault();
        if (backendStatus !== 'connected') {
            setMessage('❌ Backend server is not connected. Please start the backend first.');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            // Process AI prompt
            const aiResponse = await axios.post('http://localhost:5001/api/ai/process-prompt', {
                prompt: aiPrompt
            });

            if (aiResponse.data.action === 'make_call') {
                // Make the call
                const callResponse = await axios.post('http://localhost:5001/api/calls/make', {
                    phoneNumber: aiResponse.data.phoneNumber,
                    aiPrompt: aiPrompt
                });

                setMessage(`✅ ${callResponse.data.message}`);
                setAiPrompt('');
                fetchCalls();
                fetchStats();
            }
        } catch (error) {
            setMessage('❌ ' + (error.response?.data?.error || 'AI processing failed'));
        } finally {
            setLoading(false);
        }
    };

    const loadSampleNumbers = () => {
        setPhoneNumbers(`18001234567
18001234568
18001234569
18001234570
18001234571`);
    };

    const clearAllData = async () => {
        try {
            setMessage('Clearing all data...');
            // This would typically call a DELETE endpoint
            setCalls([]);
            setStats(null);
            setMessage('✅ All data cleared');
        } catch (error) {
            setMessage('❌ Error clearing data');
        }
    };

    return (
        <div className="App">
            <div className="header">
                <h1>🤖 AI Autodialer</h1>
                <div className={`backend-status ${backendStatus}`}>
                    Backend: {backendStatus === 'connected' ? '✅ Connected' : '❌ Disconnected'}
                </div>
            </div>

            {backendStatus !== 'connected' && (
                <div className="error-banner">
                    <strong>Backend Server Required:</strong> Please run the backend server first.
                    <div className="instructions">
                        <code>cd autodialer-app/backend && npm run dev</code>
                    </div>
                </div>
            )}

            {stats && (
                <div className="stats">
                    <h3>📊 Call Statistics</h3>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <span className="stat-number">{stats.totalCalls}</span>
                            <span className="stat-label">Total Calls</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-number">{stats.completedCalls}</span>
                            <span className="stat-label">Completed</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-number">{stats.failedCalls}</span>
                            <span className="stat-label">Failed</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-number">{stats.successRate}%</span>
                            <span className="stat-label">Success Rate</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="container">
                <div className="section">
                    <h2>🎤 AI Voice Call</h2>
                    <form onSubmit={handleAIPrompt} className="ai-form">
                        <input
                            type="text"
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder="Try: 'Make a call to 18001234567'"
                            className="prompt-input"
                            disabled={backendStatus !== 'connected'}
                        />
                        <button type="submit" disabled={loading || backendStatus !== 'connected'}>
                            {loading ? '🔄 Processing...' : '📞 Make AI Call'}
                        </button>
                    </form>
                </div>

                <div className="section">
                    <h2>📞 Bulk Call Numbers</h2>
                    <form onSubmit={handleBulkCall} className="bulk-form">
                        <div className="form-group">
                            <label>Enter Phone Numbers (one per line, use 1800 numbers for testing):</label>
                            <textarea
                                value={phoneNumbers}
                                onChange={(e) => setPhoneNumbers(e.target.value)}
                                placeholder="18001234567"
                                rows="6"
                                disabled={backendStatus !== 'connected'}
                            />
                        </div>

                        <div className="button-group">
                            <button type="submit" disabled={loading || backendStatus !== 'connected'}>
                                {loading ? '📞 Calling...' : '🚀 Make Bulk Calls'}
                            </button>
                            <button type="button" onClick={loadSampleNumbers}>
                                📋 Load Sample Numbers
                            </button>
                            <button type="button" onClick={clearAllData} className="clear-btn">
                                🗑️ Clear Data
                            </button>
                        </div>
                    </form>
                </div>

                {message && (
                    <div className={`message ${message.includes('❌') ? 'error' : 'success'}`}>
                        {message}
                    </div>
                )}

                <div className="section">
                    <div className="section-header">
                        <h2>📋 Call Logs ({calls.length})</h2>
                        <button onClick={fetchCalls} className="refresh-btn">
                            🔄 Refresh
                        </button>
                    </div>
                    <div className="calls-list">
                        {calls.length === 0 ? (
                            <div className="empty-state">
                                <p>No calls yet. Make your first call using the forms above!</p>
                            </div>
                        ) : (
                            calls.map((call) => (
                                <div key={call._id} className={`call-card ${call.status}`}>
                                    <div className="call-info">
                                        <span className="phone-number">📞 {call.phoneNumber}</span>
                                        <span className={`status-badge ${call.status}`}>
                                            {call.status === 'completed' ? '✅' :
                                                call.status === 'failed' ? '❌' : '🔄'} {call.status}
                                        </span>
                                    </div>
                                    <div className="call-details">
                                        {call.duration && <span>⏱️ Duration: {call.duration}s</span>}
                                        {call.aiPrompt && <span>🤖 AI: {call.aiPrompt}</span>}
                                        <span>🕒 {new Date(call.createdAt).toLocaleString()}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;