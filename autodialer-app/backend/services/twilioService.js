// autodialer-app/backend/services/twilioService.js
const twilio = require('twilio');

class TwilioService {
    constructor() {
        this.client = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );
    }

    async makeCall(phoneNumber) {
        try {
            // Use Twilio's test credentials for development
            const call = await this.client.calls.create({
                url: 'http://demo.twilio.com/docs/voice.xml', // Test URL
                to: phoneNumber,
                from: process.env.TWILIO_PHONE_NUMBER,
                statusCallback: `${process.env.BASE_URL}/api/calls/status`,
                statusCallbackEvent: ['completed']
            });

            return call;
        } catch (error) {
            console.error('Twilio error:', error);
            throw error;
        }
    }
}

module.exports = TwilioService;