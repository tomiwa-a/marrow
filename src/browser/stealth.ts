
import { Page, ElementHandle } from "playwright";

interface Point {
  x: number;
  y: number;
}

export class StealthEngine {
  constructor(private page: Page) {}

  /**
   * Generates a random point within a bounding box
   */
  private getRandomPointInBox(box: { x: number; y: number; width: number; height: number }): Point {
    const padding = Math.min(box.width, box.height) * 0.1;
    return {
      x: box.x + padding + Math.random() * (box.width - 2 * padding),
      y: box.y + padding + Math.random() * (box.height - 2 * padding),
    };
  }

  /**
   * Calculates a cubic Bezier point
   */
  private cubicBezier(t: number, p0: number, p1: number, p2: number, p3: number): number {
    return (
      Math.pow(1 - t, 3) * p0 +
      3 * Math.pow(1 - t, 2) * t * p1 +
      3 * (1 - t) * Math.pow(t, 2) * p2 +
      Math.pow(t, 3) * p3
    );
  }

  async moveMouseTo(selector: string) {
    const element = await this.page.$(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);

    const box = await element.boundingBox();
    if (!box) throw new Error(`Element is not visible: ${selector}`);

    const end = this.getRandomPointInBox(box);
    // Use more steps for longer distances to simulate drag/mouse movement weight
    const steps = Math.floor(Math.random() * 50) + 20; 
    await this.page.mouse.move(end.x, end.y, { steps });
  }

  async click(selector: string) {
    await this.moveMouseTo(selector);
    // Hesitation before click is a key human trait (micro-adjustment)
    await this.randomDelay(100, 300);
    await this.page.click(selector, { delay: Math.floor(Math.random() * 100) + 50 });
  }

  async type(selector: string, text: string) {
    await this.click(selector);
    
    for (const char of text) {
      // Variable delay between keystrokes mimics human typing rhythm
      await this.page.keyboard.type(char, { delay: Math.random() * 100 + 30 });
      
      // Occasional "thinking" pauses
      if (Math.random() < 0.05) {
        await this.randomDelay(200, 500);
      }
    }
  }

  async scroll(direction: 'up' | 'down', amount: 'page' | 'random' = 'random') {
    let scrollAmount = 0;
    
    if (amount === 'page') {
      const viewport = this.page.viewportSize();
      scrollAmount = (viewport?.height || 800) * 0.8;
    } else {
      scrollAmount = Math.floor(Math.random() * 400) + 200;
    }
    
    if (direction === 'up') scrollAmount *= -1;

    // Smooth scroll prevents instant teleportation which flags bots
    await this.page.evaluate(async (y) => {
        return new Promise<void>((resolve) => {
            window.scrollBy({ top: y, behavior: 'smooth' });
            setTimeout(resolve, 500); 
        });
    }, scrollAmount);
    
    // Pause to "read" content after scrolling
    await this.randomDelay(500, 1500);
  }

  async randomDelay(min: number, max: number) {
    const delay = Math.floor(Math.random() * (max - min) + min);
    await this.page.waitForTimeout(delay);
  }
}
