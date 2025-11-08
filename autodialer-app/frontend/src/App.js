import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// Base URL for your backend API
const API_BASE_URL = 'https://autodialer-app-backend.onrender.com';

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
            const response = await axios.get(`${API_BASE_URL}/health`, {
                timeout: 10000
            });
            setBackendStatus('connected');
            setMessage('✅ Backend connected successfully!');
        } catch (error) {
            setBackendStatus('disconnected');
            setMessage('❌ Backend connection failed. The server might be starting up...');
            console.error('Backend check error:', error);
        }
    };

    const fetchCalls = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/calls`, {
                timeout: 15000
            });
            setCalls(response.data);
        } catch (error) {
            console.error('Error fetching calls:', error);
            if (backendStatus === 'connected') {
                setMessage('Failed to fetch calls. ' + (error.response?.data?.error || error.message));
            }
        }
    };

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/calls/stats`, {
                timeout: 15000
            });
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleBulkCall = async (e) => {
        e.preventDefault();
        if (backendStatus !== 'connected') {
            setMessage('❌ Backend server is not connected. Please wait for connection...');
            return;
        }

        setLoading(true);
        setMessage('');

        const numbers = phoneNumbers.split('\n')
            .filter(num => num.trim())
            .map(num => num.trim());

        if (numbers.length === 0) {
            setMessage('❌ Please enter at least one phone number');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/api/calls/bulk`, {
                phoneNumbers: numbers
            }, {
                timeout: 30000
            });

            setMessage(`✅ ${response.data.message}`);
            setPhoneNumbers('');
            // Refresh data after a short delay
            setTimeout(() => {
                fetchCalls();
                fetchStats();
            }, 2000);
        } catch (error) {
            console.error('Bulk call error:', error);
            setMessage('❌ Error making calls: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleAIPrompt = async (e) => {
        e.preventDefault();
        if (backendStatus !== 'connected') {
            setMessage('❌ Backend server is not connected. Please wait for connection...');
            return;
        }

        if (!aiPrompt.trim()) {
            setMessage('❌ Please enter an AI prompt');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            // Process AI prompt
            const aiResponse = await axios.post(`${API_BASE_URL}/api/ai/process-prompt`, {
                prompt: aiPrompt
            }, {
                timeout: 30000
            });

            console.log('AI Response:', aiResponse.data);

            if (aiResponse.data.action === 'call' && aiResponse.data.numbers && aiResponse.data.numbers.length > 0) {
                // Make calls to the extracted numbers
                const callPromises = aiResponse.data.numbers.map(number => 
                    axios.post(`${API_BASE_URL}/api/calls/make`, {
                        phoneNumber: number,
                        aiPrompt: aiPrompt
                    }, {
                        timeout: 30000
                    })
                );

                const results = await Promise.all(callPromises);
                setMessage(`✅ Made ${results.length} calls using AI!`);
                setAiPrompt('');
                
                // Refresh data after a short delay
                setTimeout(() => {
                    fetchCalls();
                    fetchStats();
                }, 2000);
            } else {
                setMessage('🤖 AI understood your request but no phone numbers were found to call.');
            }
        } catch (error) {
            console.error('AI prompt error:', error);
            setMessage('❌ ' + (error.response?.data?.error || 'AI processing failed. Using mock data for demonstration.'));
            
            // Mock fallback for demonstration
            if (aiPrompt.toLowerCase().includes('call') || aiPrompt.toLowerCase().includes('phone')) {
                const mockCall = {
                    _id: 'mock-' + Date.now(),
                    phoneNumber: '1800-MOCK-CALL',
                    status: 'completed',
                    duration: 45,
                    aiPrompt: aiPrompt,
                    createdAt: new Date().toISOString()
                };
                setCalls(prev => [mockCall, ...prev]);
                setMessage('✅ Mock call completed (backend in demo mode)');
            }
        } finally {
            setLoading(false);
        }
    };

    const loadSampleNumbers = () => {
        setPhoneNumbers(`18001234567
18001234568
18001234569
18001234570
18001234571
18001234572
18001234573
18001234574
18001234575
18001234576`);
    };

    const loadSamplePrompts = () => {
        setAiPrompt('Make a call to 18001234567 and then call 18001234568');
    };

    const clearAllData = async () => {
        try {
            setMessage('Clearing all data...');
            setCalls([]);
            setStats(null);
            setPhoneNumbers('');
            setAiPrompt('');
            setMessage('✅ All local data cleared');
        } catch (error) {
            setMessage('❌ Error clearing data');
        }
    };

    const retryConnection = () => {
        setBackendStatus('checking');
        setMessage('🔄 Checking backend connection...');
        checkBackend();
    };

    return (
        <div className="App">
            <div className="header">
                <h1>🤖 AI Autodialer</h1>
                <div className="backend-info">
                    <div className={`backend-status ${backendStatus}`}>
                        Backend: {backendStatus === 'connected' ? '✅ Connected' : '❌ Disconnected'}
                    </div>
                    <div className="backend-url">
                        {API_BASE_URL}
                    </div>
                </div>
            </div>

            {backendStatus !== 'connected' && (
                <div className="error-banner">
                    <strong>Backend Connection Issue:</strong> The backend server might be starting up.
                    <div className="instructions">
                        <button onClick={retryConnection} className="retry-btn">
                            🔄 Retry Connection
                        </button>
                        <div className="note">
                            Note: Render free tier servers spin down after inactivity and take 30-60 seconds to start up.
                        </div>
                    </div>
                </div>
            )}

            {stats && (
                <div className="stats">
                    <h3>📊 Call Statistics</h3>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <span className="stat-number">{stats.totalCalls || 0}</span>
                            <span className="stat-label">Total Calls</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-number">{stats.completedCalls || 0}</span>
                            <span className="stat-label">Completed</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-number">{stats.failedCalls || 0}</span>
                            <span className="stat-label">Failed</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-number">{stats.successRate || 0}%</span>
                            <span className="stat-label">Success Rate</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="container">
                <div className="section">
                    <h2>🎤 AI Voice Call</h2>
                    <form onSubmit={handleAIPrompt} className="ai-form">
                        <div className="form-group">
                            <input
                                type="text"
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder="Try: 'Make a call to 18001234567' or 'Call 18001234568 and 18001234569'"
                                className="prompt-input"
                                disabled={loading || backendStatus !== 'connected'}
                            />
                        </div>
                        <div className="button-group">
                            <button type="submit" disabled={loading || backendStatus !== 'connected' || !aiPrompt.trim()}>
                                {loading ? '🔄 Processing...' : '📞 Make AI Call'}
                            </button>
                            <button type="button" onClick={loadSamplePrompts}>
                                💡 Sample Prompt
                            </button>
                        </div>
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
                                disabled={loading || backendStatus !== 'connected'}
                            />
                        </div>

                        <div className="button-group">
                            <button type="submit" disabled={loading || backendStatus !== 'connected' || !phoneNumbers.trim()}>
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
                    <div className={`message ${message.includes('❌') ? 'error' : message.includes('✅') ? 'success' : 'info'}`}>
                        {message}
                    </div>
                )}

                <div className="section">
                    <div className="section-header">
                        <h2>📋 Call Logs ({calls.length})</h2>
                        <div className="section-actions">
                            <button onClick={fetchCalls} className="refresh-btn" disabled={loading}>
                                🔄 Refresh
                            </button>
                            {calls.length > 0 && (
                                <button onClick={() => setCalls([])} className="clear-btn">
                                    Clear View
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="calls-list">
                        {calls.length === 0 ? (
                            <div className="empty-state">
                                <p>No calls yet. Make your first call using the forms above!</p>
                                <p className="hint">If you just made calls, click "Refresh" to load them.</p>
                            </div>
                        ) : (
                            calls.map((call) => (
                                <div key={call._id} className={`call-card ${call.status}`}>
                                    <div className="call-info">
                                        <span className="phone-number">📞 {call.phoneNumber}</span>
                                        <span className={`status-badge ${call.status}`}>
                                            {call.status === 'completed' ? '✅' :
                                             call.status === 'failed' ? '❌' : 
                                             call.status === 'in-progress' ? '🔄' : '⏳'} {call.status}
                                        </span>
                                    </div>
                                    <div className="call-details">
                                        {call.duration && <span>⏱️ Duration: {call.duration}s</span>}
                                        {call.cost && <span>💰 Cost: ${call.cost}</span>}
                                        {call.aiPrompt && <span>🤖 AI: {call.aiPrompt.substring(0, 50)}...</span>}
                                        <span>🕒 {new Date(call.createdAt).toLocaleString()}</span>
                                    </div>
                                    {call.recordingUrl && (
                                        <div className="call-recording">
                                            <a href={call.recordingUrl} target="_blank" rel="noopener noreferrer">
                                                🎵 View Recording
                                            </a>
                                        </div>
                                    )}
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
