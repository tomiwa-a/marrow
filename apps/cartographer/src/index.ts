import { Navigator } from "./core/navigator";
import { ContextExtractor } from "./core/extractor";

export interface PageSnapshot {
  html: string;
  axeSummary: string;
}

export interface SnapDebug {
  timingsMs: {
    init: number;
    goto: number;
    html: number;
    axe: number;
    total: number;
  };
  finalUrl: string;
  htmlLength: number;
  axeCounts: {
    violations: number;
    passes: number;
    incomplete: number;
  };
}

export interface ExtractSelectorDebug {
  selector: string;
  found: boolean;
  textLength: number;
  error?: string;
}

export interface ExtractDebug {
  timingsMs: {
    init: number;
    goto: number;
    extract: number;
    total: number;
  };
  finalUrl: string;
  selectors: ExtractSelectorDebug[];
}

export class Cartographer {
  static async snap(url: string, headless = true): Promise<PageSnapshot> {
    const { snapshot } = await this.snapDetailed(url, headless);
    return snapshot;
  }

  static async snapDetailed(
    url: string,
    headless = true,
  ): Promise<{ snapshot: PageSnapshot; debug: SnapDebug }> {
    const navigator = new Navigator();
    const extractor = new ContextExtractor();
    const start = Date.now();
    const timings = {
      init: 0,
      goto: 0,
      html: 0,
      axe: 0,
      total: 0,
    };

    try {
      let t = Date.now();
      await navigator.init(headless);
      timings.init = Date.now() - t;

      t = Date.now();
      await navigator.goto(url);
      timings.goto = Date.now() - t;

      t = Date.now();
      const html = await extractor.getCleanHTML(navigator.page!);
      timings.html = Date.now() - t;

      t = Date.now();
      const axTree = await extractor.getAXTree(navigator.page!);
      timings.axe = Date.now() - t;

      const axeSummary = JSON.stringify(
        {
          violations: axTree.violations.slice(0, 3),
          passes: axTree.passes.length,
          incomplete: axTree.incomplete.length,
        },
        null,
        2,
      );

      timings.total = Date.now() - start;

      return {
        snapshot: {
          html: html.slice(0, 15000),
          axeSummary,
        },
        debug: {
          timingsMs: timings,
          finalUrl: navigator.page?.url() || url,
          htmlLength: html.length,
          axeCounts: {
            violations: axTree.violations.length,
            passes: axTree.passes.length,
            incomplete: axTree.incomplete.length,
          },
        },
      };
    } finally {
      await navigator.close();
    }
  }

  static async extract(
    url: string,
    selectors: string[],
    headless = true,
  ): Promise<Record<string, string | null>> {
    const { data } = await this.extractDetailed(url, selectors, headless);
    return data;
  }

  static async extractDetailed(
    url: string,
    selectors: string[],
    headless = true,
  ): Promise<{ data: Record<string, string | null>; debug: ExtractDebug }> {
    const navigator = new Navigator();
    const start = Date.now();
    const timings = {
      init: 0,
      goto: 0,
      extract: 0,
      total: 0,
    };
    const selectorDebug: ExtractSelectorDebug[] = [];

    try {
      let t = Date.now();
      await navigator.init(headless);
      timings.init = Date.now() - t;

      t = Date.now();
      await navigator.goto(url);
      timings.goto = Date.now() - t;

      if (!navigator.page) throw new Error("Page not initialized");

      const results: Record<string, string | null> = {};

      t = Date.now();
      for (const selector of selectors) {
        try {
          const content = await navigator.page.evaluate((sel) => {
            const el = document.querySelector(sel);
            return el ? (el as HTMLElement).innerText.trim() : null;
          }, selector);
          results[selector] = content;
          selectorDebug.push({
            selector,
            found: content !== null,
            textLength: content ? content.length : 0,
          });
        } catch (e: any) {
          console.error(`Failed to extract selector: ${selector}`, e);
          results[selector] = null;
          selectorDebug.push({
            selector,
            found: false,
            textLength: 0,
            error: e?.message || "Unknown error",
          });
        }
      }
      timings.extract = Date.now() - t;
      timings.total = Date.now() - start;

      return {
        data: results,
        debug: {
          timingsMs: timings,
          finalUrl: navigator.page.url(),
          selectors: selectorDebug,
        },
      };
    } finally {
      await navigator.close();
    }
  }
}
