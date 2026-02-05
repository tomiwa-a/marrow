
import { SessionManager } from "./browser/session";
import { run as runLinkedin } from "./modules/linkedin/test";

async function playground() {
  const args = process.argv.slice(2);
  const moduleName = args[0];
  const pageName = args[1]; // Optional specific page to test

  if (!moduleName) {
    console.log("Usage: npm run playground <module_name> [page_name]");
    console.log("Available modules: linkedin");
    console.log("Example: npm run playground linkedin feed");
    process.exit(1);
  }

  console.log(`Starting Playground for module: ${moduleName} ${pageName ? `(Page: ${pageName})` : '(All pages)'}\n`);

  const sessionManager = new SessionManager();
  const context = await sessionManager.init(false);
  const page = await context.newPage();

  try {
    switch (moduleName) {
      case "linkedin":
        await runLinkedin(page, pageName);
        break;
      case "demo":
        const { run: runDemo } = await import("./playground/linkedin-demo");
        await runDemo(page);
        break;
      case "browse":
        const { run: runBrowse } = await import("./playground/jobs-browsing");
        await runBrowse(page);
        break;
      case "brain":
        const { Coordinator } = await import("./modules/linkedin/coordinator");
        const { LLMClient } = await import("./core/llm");
        const path = await import("path");
        
        // Initialize AI
        console.log("🧠 Initializing AI Brain...");
        const llm = new LLMClient();
        
        // Initialize Coordinator
        const modulePath = path.resolve(__dirname, "modules/linkedin");
        const coordinator = new Coordinator(page, llm, { 
          modulePath,
          maxSteps: 10 
        });
        
        await coordinator.run();
        break;
      default:
        console.error(`Unknown module: ${moduleName}`);
        console.log("Available modules: linkedin, demo, browse, brain");
        break;
    }
  } catch (error) {
    console.error("✗ Error running playground:", error);
  } finally {
    await sessionManager.close();
    console.log("\nBrowser closed");
  }
}

playground();

