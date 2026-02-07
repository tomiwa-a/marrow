import { Page, Response } from "playwright";
import { AuthDetectionResult, AuthSignal, AuthDetectorOptions } from "./types";

const DEFAULT_LOGIN_SELECTORS = [
  'input[type="password"]',
  'form[action*="login"]',
  'form[action*="signin"]',
  'button[type="submit"]:has-text("Log in")',
  'button[type="submit"]:has-text("Sign in")',
];

const DEFAULT_AUTH_WALL_SELECTORS = [
  ".login-required",
  ".auth-gate",
  ".sign-in-prompt",
  "[data-testid='login-form']",
];

export class AuthDetector {
  private options: Required<AuthDetectorOptions>;

  constructor(options: AuthDetectorOptions = {}) {
    this.options = {
      confidenceThreshold: options.confidenceThreshold ?? 0.7,
      loginFormSelectors: options.loginFormSelectors ?? DEFAULT_LOGIN_SELECTORS,
      authWallSelectors: options.authWallSelectors ?? DEFAULT_AUTH_WALL_SELECTORS,
    };
  }

  async detect(
    page: Page,
    targetUrl: string,
    response: Response | null
  ): Promise<AuthDetectionResult> {
    const signals: AuthSignal[] = [];
    const redirectChain: string[] = [];
    const finalUrl = page.url();

    if (response) {
      const httpSignals = this.checkHttpStatus(response);
      signals.push(...httpSignals);

      const chain = response.request().redirectedFrom();
      let current = chain;
      while (current) {
        redirectChain.unshift(current.url());
        current = current.redirectedFrom();
      }
    }

    const urlSignals = this.checkUrlDivergence(targetUrl, finalUrl);
    signals.push(...urlSignals);

    const domSignals = await this.checkDomSignals(page);
    signals.push(...domSignals);

    const totalWeight = signals.reduce((sum, s) => sum + s.weight, 0);
    const maxPossibleWeight = 1.0;
    const confidence = Math.min(totalWeight / maxPossibleWeight, 1.0);
    const required = confidence >= this.options.confidenceThreshold;

    return {
      required,
      confidence,
      signals,
      redirectChain,
      finalUrl,
    };
  }

  private checkHttpStatus(response: Response): AuthSignal[] {
    const signals: AuthSignal[] = [];
    const status = response.status();

    if (status === 401) {
      signals.push({
        type: "http_status",
        description: "HTTP 401 Unauthorized",
        weight: 0.9,
      });
    }

    if (status === 403) {
      signals.push({
        type: "http_status",
        description: "HTTP 403 Forbidden",
        weight: 0.8,
      });
    }

    return signals;
  }

  private checkUrlDivergence(targetUrl: string, finalUrl: string): AuthSignal[] {
    const signals: AuthSignal[] = [];

    const loginPatterns = ["/login", "/signin", "/auth", "/sso", "/oauth"];
    const finalPath = new URL(finalUrl).pathname.toLowerCase();

    for (const pattern of loginPatterns) {
      if (finalPath.includes(pattern)) {
        signals.push({
          type: "url_redirect",
          description: `Redirected to login page: ${pattern}`,
          weight: 0.7,
        });
        break;
      }
    }

    try {
      const targetHost = new URL(targetUrl).hostname;
      const finalHost = new URL(finalUrl).hostname;
      if (targetHost !== finalHost) {
        signals.push({
          type: "url_redirect",
          description: `Cross-domain redirect: ${targetHost} -> ${finalHost}`,
          weight: 0.5,
        });
      }
    } catch {
      // Invalid URL, skip
    }

    return signals;
  }

  private async checkDomSignals(page: Page): Promise<AuthSignal[]> {
    const signals: AuthSignal[] = [];

    for (const selector of this.options.loginFormSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          signals.push({
            type: "dom_element",
            description: `Login form detected: ${selector}`,
            weight: 0.6,
          });
          break;
        }
      } catch {
        // Selector failed, continue
      }
    }

    for (const selector of this.options.authWallSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          signals.push({
            type: "dom_element",
            description: `Auth wall detected: ${selector}`,
            weight: 0.5,
          });
          break;
        }
      } catch {
        // Selector failed, continue
      }
    }

    return signals;
  }

  isAuthRequired(result: AuthDetectionResult): boolean {
    return result.required;
  }

  getConfidenceThreshold(): number {
    return this.options.confidenceThreshold;
  }

  setConfidenceThreshold(threshold: number): void {
    this.options.confidenceThreshold = threshold;
  }
}
