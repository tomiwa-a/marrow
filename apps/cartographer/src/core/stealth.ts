
import { Browser, BrowserContext, Page } from 'playwright';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';

const { chromium: chromiumExtra } = require('playwright-extra');
chromiumExtra.use(stealthPlugin());

export class StealthBrowser {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;

  async launch(headless: boolean = false): Promise<Browser> {
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

    return this.browser as unknown as Browser;
  }

  async createPage(): Promise<{ page: Page; context: BrowserContext }> {
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
    return { page: page as unknown as Page, context: this.context };
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}
