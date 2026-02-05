import { Page } from "playwright";

export interface Coordinates {
  x: number;
  y: number;
}

export interface Action {
  type: "click" | "type" | "scroll" | "wait";
  coordinates?: Coordinates;
  text?: string;
  amount?: number;
  milliseconds?: number;
}

export class BrowserActions {
  constructor(private page: Page) {}

  async click(x: number, y: number): Promise<void> {
    await this.page.mouse.click(x, y);
  }

  async type(text: string): Promise<void> {
    await this.page.keyboard.type(text, { delay: 100 });
  }

  async scroll(amount: number = 500): Promise<void> {
    await this.page.mouse.wheel(0, amount);
  }

  async wait(milliseconds: number): Promise<void> {
    await this.page.waitForTimeout(milliseconds);
  }

  async executeAction(action: Action): Promise<void> {
    switch (action.type) {
      case "click":
        if (!action.coordinates) {
          throw new Error("Click action requires coordinates");
        }
        await this.click(action.coordinates.x, action.coordinates.y);
        break;
      case "type":
        if (!action.text) {
          throw new Error("Type action requires text");
        }
        await this.type(action.text);
        break;
      case "scroll":
        await this.scroll(action.amount || 500);
        break;
      case "wait":
        await this.wait(action.milliseconds || 1000);
        break;
      default:
        throw new Error(`Unknown action type: ${(action as Action).type}`);
    }
  }
}
