import { Browser, BrowserContext, chromium } from "playwright";
import fs from "fs";
import path from "path";

const SESSION_DIR = path.join(process.cwd(), "data");
const LINKEDIN_SESSION_PATH = path.join(SESSION_DIR, "linkedin-auth.json");

export class SessionManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;

  async init(headless: boolean = false) {
    this.browser = await chromium.launch({
      headless,
      slowMo: 100,
    });

    const hasSession = this.sessionExists();

    if (hasSession) {
      console.log("Loading saved session...");
      this.context = await this.browser.newContext({
        storageState: LINKEDIN_SESSION_PATH,
      });
    } else {
      console.log("No saved session found, creating new context...");
      this.context = await this.browser.newContext();
    }

    return this.context;
  }

  sessionExists(): boolean {
    return fs.existsSync(LINKEDIN_SESSION_PATH);
  }

  async saveSession() {
    if (!this.context) {
      throw new Error("No context to save");
    }

    if (!fs.existsSync(SESSION_DIR)) {
      fs.mkdirSync(SESSION_DIR, { recursive: true });
    }

    await this.context.storageState({ path: LINKEDIN_SESSION_PATH });
    console.log("Session saved to:", LINKEDIN_SESSION_PATH);
  }

  async deleteSession() {
    if (fs.existsSync(LINKEDIN_SESSION_PATH)) {
      fs.unlinkSync(LINKEDIN_SESSION_PATH);
      console.log("Session deleted");
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  getContext(): BrowserContext {
    if (!this.context) {
      throw new Error("Context not initialized");
    }
    return this.context;
  }
}
