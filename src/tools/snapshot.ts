import { Page } from "playwright";
import { SessionManager } from "../browser/session";
import { LinkedInUrls, TimeFilters } from "../modules/linkedin/urls";
import { LinkedInSelectors } from "../modules/linkedin/selectors";
import { SnapshotData, PageConfig } from "./types";
import * as fs from "fs";
import * as path from "path";

const PAGE_CONFIGS: Record<string, PageConfig> = {
  jobs: {
    name: "jobs",
    url: LinkedInUrls.jobSearch({
      keywords: "Software Engineer",
      remote: true,
      timePosted: TimeFilters.PAST_24_HOURS,
    }),
    waitForSelector: LinkedInSelectors.jobs.jobCard,
    description: "LinkedIn Jobs Search Page",
  },
  "job-detail": {
    name: "job-detail",
    url: LinkedInUrls.jobs(),
    waitForSelector: LinkedInSelectors.jobs.jobDescription,
    description: "LinkedIn Job Detail View (requires manual click)",
  },
  feed: {
    name: "feed",
    url: LinkedInUrls.feed(),
    waitForSelector: "div[role='main']",
    description: "LinkedIn Feed Page",
  },
};

export class PageSnapshot {
  private snapshotsDir: string;

  constructor() {
    this.snapshotsDir = path.join(process.cwd(), "snapshots");
  }

  async capture(pageName: string): Promise<void> {
    const config = PAGE_CONFIGS[pageName];
    if (!config) {
      throw new Error(
        `Unknown page: ${pageName}. Available: ${Object.keys(PAGE_CONFIGS).join(", ")}`,
      );
    }

    console.log(`\nCapturing snapshot: ${config.description}`);
    console.log(`   URL: ${config.url}\n`);

    const sessionManager = new SessionManager();
    const context = await sessionManager.init(false);
    const page = await context.newPage();

    try {
      console.log("   → Navigating to page...");
      await page.goto(config.url, { waitUntil: "load" });

      console.log(`   → Waiting for: ${config.waitForSelector}`);
      await page.waitForSelector(config.waitForSelector, { timeout: 15000 });

      await page.waitForTimeout(2000);

      console.log("   → Capturing HTML...");
      const html = await page.content();

      console.log("   → Capturing accessibility tree...");
      let accessibilityTree = null;
      try {
        accessibilityTree = await (page as any).accessibility.snapshot();
      } catch (error) {
        console.log("      (Accessibility tree not available, skipping)");
      }

      const viewport = page.viewportSize();
      const userAgent = await page.evaluate(() => navigator.userAgent);

      const snapshot: SnapshotData = {
        html,
        accessibilityTree,
        metadata: {
          pageName: config.name,
          url: config.url,
          timestamp: new Date().toISOString(),
          viewport: viewport || { width: 1280, height: 720 },
          userAgent,
        },
      };

      console.log("   → Saving snapshot...");
      this.saveSnapshot(config.name, snapshot);

      console.log(`\nSnapshot saved to: snapshots/${config.name}/\n`);
    } catch (error) {
      console.error(`\nFailed to capture snapshot:`, error);
      throw error;
    } finally {
      await sessionManager.close();
    }
  }

  async captureAll(): Promise<void> {
    console.log(`\nCapturing all page snapshots...\n`);

    for (const pageName of Object.keys(PAGE_CONFIGS)) {
      try {
        await this.capture(pageName);
      } catch (error) {
        console.error(`Failed to capture ${pageName}, continuing...`);
      }
    }

    console.log(`\nAll snapshots captured!\n`);
  }

  private saveSnapshot(pageName: string, snapshot: SnapshotData): void {
    const pageDir = path.join(this.snapshotsDir, pageName);

    if (!fs.existsSync(pageDir)) {
      fs.mkdirSync(pageDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(pageDir, "page.html"),
      snapshot.html,
      "utf-8",
    );

    fs.writeFileSync(
      path.join(pageDir, "accessibility.json"),
      JSON.stringify(snapshot.accessibilityTree, null, 2),
      "utf-8",
    );

    fs.writeFileSync(
      path.join(pageDir, "metadata.json"),
      JSON.stringify(snapshot.metadata, null, 2),
      "utf-8",
    );
  }

  listAvailablePages(): void {
    console.log("\nAvailable pages to snapshot:\n");
    Object.entries(PAGE_CONFIGS).forEach(([key, config]) => {
      console.log(`   ${key.padEnd(15)} - ${config.description}`);
    });
    console.log();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const snapshot = new PageSnapshot();

  if (args.length === 0) {
    snapshot.listAvailablePages();
    console.log("Usage:");
    console.log("  npm run snapshot jobs              # Capture jobs page");
    console.log("  npm run snapshot --all             # Capture all pages");
    console.log("  npm run snapshot --list            # List available pages\n");
    return;
  }

  const command = args[0];

  if (command === "--list") {
    snapshot.listAvailablePages();
  } else if (command === "--all") {
    await snapshot.captureAll();
  } else {
    await snapshot.capture(command);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
