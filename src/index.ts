import dotenv from "dotenv";
import { SessionManager } from "./browser/session";
import readline from "readline";

dotenv.config();

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

async function main() {
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
    console.log("Navigated to LinkedIn feed");

    await page.waitForTimeout(3000);
  }

  console.log("\nPhase 2 Complete - LinkedIn session persisted!");

  await sessionManager.close();
  console.log("Browser closed");
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
