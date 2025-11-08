// blog-generator/backend/services/aiService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIService {
    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }

    async generateBlogPost(topic, details = '') {
        try {
            const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });

            const prompt = `Write a comprehensive blog post about ${topic}. ${details}
            Requirements:
            - Minimum 500 words
            - Professional technical writing style
            - Include code examples if relevant
            - Use proper headings and structure
            - Make it engaging and informative`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('AI generation error:', error);
            throw error;
        }
    }
}

module.exports = AIService;