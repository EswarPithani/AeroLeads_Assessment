// linkedin-scraper/backend/utils/scraper.js
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

class LinkedInScraper {
    constructor() {
        this.driver = null;
    }

    async init() {
        let options = new chrome.Options();
        options.addArguments('--headless');
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-dev-shm-usage');

        this.driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();
    }

    async scrapeProfile(profileUrl) {
        try {
            await this.driver.get(profileUrl);
            await this.driver.sleep(3000);

            // Extract profile data
            const profileData = {
                name: await this.extractText('h1'),
                headline: await this.extractText('.text-body-medium'),
                about: await this.extractText('.display-flex ph5 pv3'),
                location: await this.extractText('.text-body-small.inline.t-black--light.break-words')
            };

            return profileData;
        } catch (error) {
            console.error('Scraping error:', error);
            return null;
        }
    }

    async extractText(selector) {
        try {
            const element = await this.driver.findElement(By.css(selector));
            return await element.getText();
        } catch (error) {
            return '';
        }
    }

    async close() {
        if (this.driver) {
            await this.driver.quit();
        }
    }
}

module.exports = LinkedInScraper;