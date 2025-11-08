// autodialer-app/frontend/src/components/AIPrompt.js
import React, { useState } from 'react';

const AIPrompt = ({ onMakeCall }) => {
    const [prompt, setPrompt] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Simple NLP to extract phone number
        const phoneMatch = prompt.match(/\b\d{10,13}\b/);
        if (phoneMatch) {
            await onMakeCall(phoneMatch[0]);
            setPrompt('');
        } else {
            alert('Please include a valid phone number in your prompt');
        }
    };

    return (
        <div className="ai-prompt">
            <h3>AI Voice Call</h3>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Say: 'Make a call to 18001234567'"
                    className="prompt-input"
                />
                <button type="submit">Make Call</button>
            </form>
        </div>
    );
};

export default AIPrompt;