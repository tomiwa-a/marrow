import { chromium, Browser, Page, BrowserContext } from "playwright";
import { SessionVault } from "./SessionVault";
import { EscalationOptions, EscalationResult } from "./types";

const DEFAULT_SUCCESS_INDICATORS = [
  'button[aria-label*="profile"]',
  'img[alt*="avatar"]',
  '[data-testid="user-menu"]',
  '.user-profile',
  '.avatar',
  'a[href*="/logout"]',
  'a[href*="/signout"]',
];

export class BrowserEscalator {
  private options: Required<EscalationOptions>;
  private sessionVault: SessionVault;

  constructor(options: EscalationOptions = {}) {
    this.options = {
      timeoutMs: options.timeoutMs ?? 300000,
      pollIntervalMs: options.pollIntervalMs ?? 1000,
      successIndicators: options.successIndicators ?? DEFAULT_SUCCESS_INDICATORS,
    };
    this.sessionVault = new SessionVault();
  }

  async escalate(url: string): Promise<EscalationResult> {
    const domain = new URL(url).hostname;
    let browser: Browser | null = null;
    let context: BrowserContext | null = null;

    try {
      console.log(`[Escalation] Opening browser for login: ${domain}`);

      browser = await chromium.launch({ headless: false });
      context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
      });

      const page = await context.newPage();
      await page.goto(url, { waitUntil: "networkidle" });

      console.log(`[Escalation] Waiting for login completion...`);
      console.log(`[Escalation] Timeout: ${this.options.timeoutMs / 1000}s`);

      const loginSuccess = await this.waitForLogin(page);

      if (!loginSuccess) {
        return {
          success: false,
          domain,
          sessionCaptured: false,
          error: "Login timeout or cancelled",
        };
      }

      console.log(`[Escalation] Login detected, capturing session...`);

      const storageState = await context.storageState();
      await this.sessionVault.save(domain, storageState);

      console.log(`[Escalation] Session saved for ${domain}`);

      return {
        success: true,
        domain,
        sessionCaptured: true,
      };
    } catch (error: any) {
      return {
        success: false,
        domain,
        sessionCaptured: false,
        error: error.message,
      };
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  private async waitForLogin(page: Page): Promise<boolean> {
    const startTime = Date.now();
    const initialUrl = page.url();

    while (Date.now() - startTime < this.options.timeoutMs) {
      try {
        const isClosed = page.isClosed();
        if (isClosed) {
          return false;
        }

        const currentUrl = page.url();
        const urlChanged = this.hasLeftLoginPage(initialUrl, currentUrl);

        if (urlChanged) {
          const hasSuccessIndicator = await this.checkSuccessIndicators(page);
          if (hasSuccessIndicator) {
            return true;
          }
        }

        for (const selector of this.options.successIndicators) {
          try {
            const element = await page.$(selector);
            if (element) {
              return true;
            }
          } catch {
            continue;
          }
        }

        await page.waitForTimeout(this.options.pollIntervalMs);
      } catch {
        return false;
      }
    }

    return false;
  }

  private hasLeftLoginPage(initialUrl: string, currentUrl: string): boolean {
    const loginPatterns = ["/login", "/signin", "/auth", "/sso", "/oauth"];

    const initialPath = new URL(initialUrl).pathname.toLowerCase();
    const currentPath = new URL(currentUrl).pathname.toLowerCase();

    const wasOnLogin = loginPatterns.some((p) => initialPath.includes(p));
    const stillOnLogin = loginPatterns.some((p) => currentPath.includes(p));

    return wasOnLogin && !stillOnLogin;
  }

  private async checkSuccessIndicators(page: Page): Promise<boolean> {
    for (const selector of this.options.successIndicators) {
      try {
        const element = await page.$(selector);
        if (element) {
          return true;
        }
      } catch {
        continue;
      }
    }
    return false;
  }

  async escalateWithSession(
    url: string,
    existingSession: any
  ): Promise<EscalationResult> {
    const domain = new URL(url).hostname;
    let browser: Browser | null = null;
    let context: BrowserContext | null = null;

    try {
      browser = await chromium.launch({ headless: false });
      context = await browser.newContext({
        storageState: existingSession,
        viewport: { width: 1280, height: 720 },
      });

      const page = await context.newPage();
      await page.goto(url, { waitUntil: "networkidle" });

      const hasSuccessIndicator = await this.checkSuccessIndicators(page);

      if (hasSuccessIndicator) {
        console.log(`[Escalation] Session still valid for ${domain}`);
        return {
          success: true,
          domain,
          sessionCaptured: false,
        };
      }

      console.log(`[Escalation] Session expired, waiting for re-login...`);

      const loginSuccess = await this.waitForLogin(page);

      if (!loginSuccess) {
        return {
          success: false,
          domain,
          sessionCaptured: false,
          error: "Re-login timeout or cancelled",
        };
      }

      const storageState = await context.storageState();
      await this.sessionVault.save(domain, storageState);

      return {
        success: true,
        domain,
        sessionCaptured: true,
      };
    } catch (error: any) {
      return {
        success: false,
        domain,
        sessionCaptured: false,
        error: error.message,
      };
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
