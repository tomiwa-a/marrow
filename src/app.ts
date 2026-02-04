import { SessionManager } from "./browser/session";
import { AIAdapter } from "./ai/adapter";
import { LinkedInNavigator } from "./modules/linkedin/navigation";
import { TimeFilters } from "./modules/linkedin/urls";
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

  const navigator = new LinkedInNavigator(page);
  const ai = new AIAdapter("gemini", "ollama");

  console.log("\nSearching for Software Engineer jobs (Remote, Past 24h)...");
  await navigator.searchJobs({
    keywords: "Software Engineer",
    remote: true,
    timePosted: TimeFilters.PAST_24_HOURS,
  });

  console.log("\nScrolling through job listings...");
  await navigator.scrollJobsList(3);

  console.log("\nExtracting visible jobs...");
  const jobs = await navigator.getVisibleJobs();
  console.log(`Found ${jobs.length} jobs:\n`);

  for (let i = 0; i < Math.min(5, jobs.length); i++) {
    const job = jobs[i];
    console.log(`${i + 1}. ${job.title} at ${job.company}`);
    console.log(`   Location: ${job.location}`);
    console.log(`   URL: ${job.url}\n`);
  }

  if (jobs.length > 0) {
    console.log("Clicking first job to view details...");
    await navigator.clickJob(0);

    const description = await navigator.getJobDescription();
    const hasEasyApply = await navigator.hasEasyApply();

    console.log(`\nJob Description Length: ${description.length} characters`);
    console.log(`Has Easy Apply: ${hasEasyApply}`);

    console.log("\nAsking AI if we should apply...");
    const decision = await ai.chat(`
Job Title: ${jobs[0].title}
Company: ${jobs[0].company}
Location: ${jobs[0].location}

Based on this information, should I apply to this job? Respond with "YES" or "NO" and explain why.
`);

    console.log(`\nAI Decision:\n${decision}`);
  }

  await sessionManager.close();
  console.log("\nBrowser closed");
}
