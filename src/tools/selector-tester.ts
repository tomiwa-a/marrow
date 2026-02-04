import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import { LinkedInSelectors } from "../modules/linkedin/selectors";
import { SelectorTestResult } from "./types";

export class SelectorTester {
  private snapshotsDir: string;

  constructor() {
    this.snapshotsDir = path.join(process.cwd(), "snapshots");
  }

  testSelectors(pageName: string, specificSelector?: string): void {
    const pageDir = path.join(this.snapshotsDir, pageName);
    const htmlPath = path.join(pageDir, "page.html");

    if (!fs.existsSync(htmlPath)) {
      console.error(
        `\nNo snapshot found for "${pageName}". Run: npm run snapshot ${pageName}\n`,
      );
      return;
    }

    const html = fs.readFileSync(htmlPath, "utf-8");
    const $ = cheerio.load(html);

    console.log(`\nTesting selectors for: ${pageName}`);
    console.log(`   Snapshot: ${htmlPath}\n`);

    const results: SelectorTestResult[] = [];

    if (pageName === "jobs" || pageName === "job-detail") {
      const jobSelectors = LinkedInSelectors.jobs;

      if (specificSelector) {
        if (specificSelector in jobSelectors) {
          const selector =
            jobSelectors[specificSelector as keyof typeof jobSelectors];
          const result = this.testSelector($, specificSelector, selector);
          results.push(result);
        } else {
          console.error(
            `\nUnknown selector: ${specificSelector} for page: ${pageName}\n`,
          );
          return;
        }
      } else {
        Object.entries(jobSelectors).forEach(([name, selector]) => {
          const result = this.testSelector($, name, selector);
          results.push(result);
        });
      }
    }

    this.printResults(results);
  }

  private testSelector(
    $: cheerio.Root,
    name: string,
    selector: string,
  ): SelectorTestResult {
    try {
      const elements = $(selector);
      const count = elements.length;
      const found = count > 0;

      const sampleTexts: string[] = [];
      elements.slice(0, 3).each((_, el) => {
        const text = $(el).text().trim().substring(0, 50);
        if (text) sampleTexts.push(text);
      });

      return {
        selector: `${name} (${selector})`,
        found,
        count,
        elements: sampleTexts,
      };
    } catch (error) {
      return {
        selector: `${name} (${selector})`,
        found: false,
        count: 0,
      };
    }
  }

  private printResults(results: SelectorTestResult[]): void {
    console.log("Results:");
    console.log("─".repeat(80));

    let passed = 0;
    let failed = 0;

    results.forEach((result) => {
      const status = result.found ? "[PASS]" : "[FAIL]";
      const color = result.found ? "" : "";

      console.log(
        `${status} ${result.selector.padEnd(50)} ${result.count} elements`,
      );

      if (result.elements && result.elements.length > 0) {
        result.elements.forEach((text, i) => {
          if (i < 2) {
            console.log(`    └─ "${text}${text.length >= 50 ? "..." : ""}"`);
          }
        });
      }

      if (result.found) {
        passed++;
      } else {
        failed++;
      }
    });

    console.log("─".repeat(80));
    console.log(
      `\nSummary: ${passed} passed, ${failed} failed (${results.length} total)\n`,
    );
  }

  listSnapshots(): void {
    if (!fs.existsSync(this.snapshotsDir)) {
      console.log("\nNo snapshots directory found.\n");
      return;
    }

    const snapshots = fs
      .readdirSync(this.snapshotsDir)
      .filter((file) =>
        fs.statSync(path.join(this.snapshotsDir, file)).isDirectory(),
      );

    if (snapshots.length === 0) {
      console.log("\nNo snapshots captured yet.\n");
      return;
    }

    console.log("\nAvailable snapshots:\n");
    snapshots.forEach((snapshot) => {
      const metadataPath = path.join(
        this.snapshotsDir,
        snapshot,
        "metadata.json",
      );
      if (fs.existsSync(metadataPath)) {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
        console.log(`   ${snapshot.padEnd(15)} - ${metadata.timestamp}`);
      } else {
        console.log(`   ${snapshot}`);
      }
    });
    console.log();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const tester = new SelectorTester();

  if (args.length === 0) {
    tester.listSnapshots();
    console.log("Usage:");
    console.log("  npm run test-selectors jobs                    # Test all job selectors");
    console.log("  npm run test-selectors jobs jobCard            # Test specific selector");
    console.log("  npm run test-selectors --list                  # List snapshots\n");
    return;
  }

  const command = args[0];

  if (command === "--list") {
    tester.listSnapshots();
  } else {
    const pageName = args[0];
    const specificSelector = args[1];
    tester.testSelectors(pageName, specificSelector);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
