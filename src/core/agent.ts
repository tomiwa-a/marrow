import { Page } from "playwright";
import { AIAdapter } from "../ai/adapter";
import { BrowserActions, Action } from "../browser/actions";

export interface AgentConfig {
  maxIterations?: number;
  screenshotQuality?: number;
}

export class Agent {
  private ai: AIAdapter;
  private actions: BrowserActions;
  private config: AgentConfig;

  constructor(
    private page: Page,
    ai: AIAdapter,
    config: AgentConfig = {},
  ) {
    this.ai = ai;
    this.actions = new BrowserActions(page);
    this.config = {
      maxIterations: config.maxIterations || 10,
      screenshotQuality: config.screenshotQuality || 60,
    };
  }

  private async captureScreenshot(): Promise<string> {
    const screenshot = await this.page.screenshot({
      type: "jpeg",
      quality: this.config.screenshotQuality,
    });
    return (screenshot as Buffer).toString("base64");
  }

  private parseAction(response: string): Action | null {
    const clickMatch = response.match(/click.*?(\d+).*?(\d+)/i);
    if (clickMatch) {
      return {
        type: "click",
        coordinates: {
          x: parseInt(clickMatch[1]),
          y: parseInt(clickMatch[2]),
        },
      };
    }

    if (response.match(/type|enter|input/i)) {
      const textMatch = response.match(/["']([^"']+)["']/);
      if (textMatch) {
        return {
          type: "type",
          text: textMatch[1],
        };
      }
    }

    if (response.match(/scroll/i)) {
      return {
        type: "scroll",
        amount: 500,
      };
    }

    return null;
  }

  async navigate(goal: string): Promise<boolean> {
    console.log(`\nAgent Goal: ${goal}\n`);

    for (let i = 0; i < (this.config.maxIterations || 10); i++) {
      console.log(`Iteration ${i + 1}/${this.config.maxIterations}`);

      const screenshot = await this.captureScreenshot();
      console.log("Screenshot captured");

      const prompt = `Goal: ${goal}

Current page screenshot attached.

What should I do next? If the goal is achieved, say "GOAL_ACHIEVED".

Respond with a specific action like:
- "Click at coordinates (X, Y)" to click an element
- "Type 'text'" to enter text
- "Scroll down" to scroll
- "GOAL_ACHIEVED" if done`;

      const response = await this.ai.chatWithImage(prompt, screenshot);
      console.log(`AI Response: ${response}\n`);

      if (response.includes("GOAL_ACHIEVED")) {
        console.log("Goal achieved!");
        return true;
      }

      const action = this.parseAction(response);
      if (!action) {
        console.log("Could not parse action from AI response, retrying...");
        continue;
      }

      console.log(`Executing action: ${JSON.stringify(action)}`);
      await this.actions.executeAction(action);
      await this.actions.wait(2000);
    }

    console.log("Max iterations reached without achieving goal");
    return false;
  }
}
