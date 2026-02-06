import { Navigator } from './core/navigator';
import { ContextExtractor } from './core/extractor';

export interface PageSnapshot {
  html: string;
  axeSummary: string;
}

export class Cartographer {
  static async snap(url: string, headless = true): Promise<PageSnapshot> {
    const navigator = new Navigator();
    const extractor = new ContextExtractor();

    try {
      await navigator.init(headless);
      await navigator.goto(url);

      const html = await extractor.getCleanHTML(navigator.page!);
      const axTree = await extractor.getAXTree(navigator.page!);

      const axeSummary = JSON.stringify({
        violations: axTree.violations.slice(0, 3),
        passes: axTree.passes.length,
        incomplete: axTree.incomplete.length,
      }, null, 2);

      return {
        html: html.slice(0, 15000), 
        axeSummary,
      };

    } finally {
      await navigator.close();
    }
  }

  static async extract(url: string, selectors: string[], headless = true): Promise<Record<string, string | null>> {
    const navigator = new Navigator();
    try {
      await navigator.init(headless);
      await navigator.goto(url);
      
      if (!navigator.page) throw new Error("Page not initialized");

      const results: Record<string, string | null> = {};

      for (const selector of selectors) {
        try {
          const content = await navigator.page.evaluate((sel) => {
            const el = document.querySelector(sel);
            return el ? (el as HTMLElement).innerText.trim() : null;
          }, selector);
          results[selector] = content;
        } catch (e) {
          console.error(`Failed to extract selector: ${selector}`, e);
          results[selector] = null;
        }
      }

      return results;

    } finally {
      await navigator.close();
    }
  }
}

