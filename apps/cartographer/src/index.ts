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
}

