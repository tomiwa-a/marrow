import * as fs from "fs";
import * as path from "path";
import { Page } from "playwright";
import { LinkedInNavigator } from "./navigation";
import { LLMClient, ToolDefinition } from "../../core/llm";
import { Analyst } from "./analyst";

interface CoordinatorConfig {
  maxSteps?: number;
  modulePath?: string;
}

export class Coordinator {
  private navigator: LinkedInNavigator;
  private llm: LLMClient;
  private analyst: Analyst;
  private tools: ToolDefinition[];
  private maxSteps: number;

  constructor(page: Page, llm: LLMClient, config: CoordinatorConfig = {}) {
    this.navigator = new LinkedInNavigator(page);
    this.llm = llm;
    this.analyst = new Analyst(llm);
    this.maxSteps = config.maxSteps || 20;

    const toolsPath = config.modulePath 
      ? path.resolve(config.modulePath, "tools.json")
      : path.resolve(__dirname, "tools.json");
      
    if (!fs.existsSync(toolsPath)) {
      throw new Error(`Tools definition not found at ${toolsPath}`);
    }
    
    this.tools = JSON.parse(fs.readFileSync(toolsPath, "utf-8"));
  }

  async run() {
    console.log("🧠 Coordinator started.");
    
    await this.navigator.goToJobs();

    for (let step = 0; step < this.maxSteps; step++) {
      console.log(`\n--- Step ${step + 1}/${this.maxSteps} ---`);
      
      const visibleJobs = await this.navigator.getVisibleJobs();
      const jobCount = visibleJobs.length;
      
      const stateDescription = `
      Current Page: LinkedIn Jobs
      Visible Jobs: ${jobCount}
      
      Goal: Find and apply to relevant jobs.
      `;

      const systemPrompt = `
      You are an autonomous agent using a web browser.
      You have access to the following tools to interact with LinkedIn.
      
      Your Goal: Apply to jobs that match the user's profile.
      
      Rules:
      1. If you see jobs, evaluate them one by one.
      2. If you have evaluated all visible jobs, scroll down to get more.
      3. Use 'clickJob(index)' to view details.
      4. Use 'searchJobs' if the current list is empty or irrelevant.
      `;

      const response = await this.llm.chat(systemPrompt, stateDescription, this.tools);

      if (response.toolCalls && response.toolCalls.length > 0) {
        for (const call of response.toolCalls) {
          console.log(`🤖 Action: ${call.name}(${JSON.stringify(call.args)})`);
          await this.executeTool(call.name, call.args);
        }
      } else {
        console.log("🤖 Thought:", response.content);
      }
      
      await this.navigator.delay(2000, 4000);
    }
  }

  private async executeTool(name: string, args: any) {
    if (typeof (this.navigator as any)[name] === "function") {
      try {
        await (this.navigator as any)[name](args);
      } catch (e) {
        console.error(`Failed to execute ${name}:`, e);
      }
    } else {
      console.error(`Unknown tool: ${name}`);
    }
  }
}
