"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StealthBrowser = void 0;
const puppeteer_extra_plugin_stealth_1 = __importDefault(require("puppeteer-extra-plugin-stealth"));
const { chromium: chromiumExtra } = require('playwright-extra');
chromiumExtra.use((0, puppeteer_extra_plugin_stealth_1.default)());
class StealthBrowser {
    browser = null;
    context = null;
    async launch(headless = false) {
        console.error(`Launching Stealth Browser (Plugin Mode, Headless: ${headless})`);
        this.browser = await chromiumExtra.launch({
            headless,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-infobars',
                '--window-position=0,0',
                '--ignore-certifcate-errors',
                '--ignore-certifcate-errors-spki-list',
                '--disable-blink-features=AutomationControlled',
            ],
        });
        return this.browser;
    }
    async createPage() {
        if (!this.browser) {
            throw new Error('Browser not initialized. Call launch() first.');
        }
        this.context = await this.browser.newContext({
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            viewport: { width: 1280, height: 720 },
            deviceScaleFactor: 2,
            locale: 'en-US',
            timezoneId: 'America/New_York',
        });
        const page = await this.context.newPage();
        return { page: page, context: this.context };
    }
    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}
exports.StealthBrowser = StealthBrowser;
