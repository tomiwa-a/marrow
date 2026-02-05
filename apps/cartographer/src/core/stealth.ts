
import { chromium, Browser, BrowserContext, Page } from 'playwright';

export class StealthBrowser {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;

  async launch(headless: boolean = false): Promise<Browser> {
    console.log(`Launching Stealth Browser (Headless: ${headless})`);

    this.browser = await chromium.launch({
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

    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
      // @ts-ignore
      window.chrome = { runtime: {} };
      // @ts-ignore
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });
      // @ts-ignore
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3],
      });

      // SPOOF WebGL (Fixes ANGLE/SwiftShader Red Flag)
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter) {
        // 37445: UNMASKED_VENDOR_WEBGL
        // 37446: UNMASKED_RENDERER_WEBGL
        if (parameter === 37445) {
          return 'Intel Inc.';
        }
        if (parameter === 37446) {
          return 'Intel Iris OpenGL Engine';
        }
        return getParameter.apply(this, [parameter]);
      };
    });

    return { page, context: this.context };
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}
