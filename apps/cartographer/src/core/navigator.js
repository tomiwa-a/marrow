"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Navigator = void 0;
const stealth_1 = require("./stealth");
class Navigator {
    stealth;
    page = null;
    constructor() {
        this.stealth = new stealth_1.StealthBrowser();
    }
    async init(headless = false) {
        await this.stealth.launch(headless);
        const { page } = await this.stealth.createPage();
        this.page = page;
        return page;
    }
    async goto(url) {
        if (!this.page)
            throw new Error('Page not initialized');
        console.error(`Navigating to: ${url}`);
        await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await this.delay(1000, 3000);
    }
    async scrollDown(count = 3) {
        if (!this.page)
            throw new Error('Page not initialized');
        console.error('Scrolling page...');
        for (let i = 0; i < count; i++) {
            await this.page.evaluate(() => {
                window.scrollBy({
                    top: window.innerHeight * 0.7,
                    behavior: 'smooth'
                });
            });
            await this.delay(800, 2500);
        }
    }
    async close() {
        await this.stealth.close();
    }
    async delay(min, max) {
        const time = Math.floor(Math.random() * (max - min + 1)) + min;
        await new Promise(res => setTimeout(res, time));
    }
}
exports.Navigator = Navigator;
