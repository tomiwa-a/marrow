import { SessionManager } from "./browser/session";
import { AIAdapter } from "./ai/adapter";
import { Agent } from "./core/agent";
import readline from "readline";

async function waitForUserInput(prompt: string): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(prompt, () => {
      rl.close();
      resolve();
    });
  });
}

export async function run() {
  console.log("Launching Marrow...\n");

  const sessionManager = new SessionManager();
  const context = await sessionManager.init(process.env.HEADLESS === "true");

  const page = await context.newPage();

  if (!sessionManager.sessionExists()) {
    console.log("Opening LinkedIn for manual login...");
    await page.goto("https://www.linkedin.com/login");

    console.log("\n=================================");
    console.log("Please log in to LinkedIn manually");
    console.log("Complete any 2FA if required");
    console.log("=================================\n");

    await waitForUserInput("Press Enter after you've logged in...");

    await sessionManager.saveSession();
    console.log("\nSession saved successfully!");
  } else {
    console.log("Using saved session...");
    await page.goto("https://www.linkedin.com/feed/");
  }

  const ai = new AIAdapter("gemini", "ollama");
  const agent = new Agent(page, ai);

  const success = await agent.navigate(
    "Find the jobs/search section and navigate to it",
  );

  if (success) {
    console.log("\nNavigation successful!");
  } else {
    console.log("\nNavigation failed - max iterations reached");
  }

  await sessionManager.close();
  console.log("Browser closed");
}
