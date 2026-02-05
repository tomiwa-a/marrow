
import { Page } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';

export class ContextExtractor {
  
  async getAXTree(page: Page) {
    if (!page) {
        throw new Error("Page is undefined");
    }
    
    const results = await new AxeBuilder({ page })
      .include('body') 
      .analyze();

    return results; 
  }

  async getCleanHTML(page: Page) {
    return await page.content();
  }
}
