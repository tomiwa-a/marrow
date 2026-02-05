
import { Page } from 'playwright';

export class ContextExtractor {
  
  async getAXTree(page: Page) {
    if (!page) {
        throw new Error("Page is undefined");
    }

    const snapshot = await page.accessibility.snapshot({
      interestingOnly: true 
    });

    return snapshot;
  }

  async getCleanHTML(page: Page) {
    return await page.content();
  }
}
