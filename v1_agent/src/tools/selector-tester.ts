import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import { SelectorTestResult } from "./types";

interface FlattenedSelector {
  path: string;
  selector: string;
}

export class SelectorTester {
  private snapshotsDir: string;
  private modulesDir: string;

  constructor() {
    this.snapshotsDir = path.join(process.cwd(), "snapshots");
    this.modulesDir = path.join(process.cwd(), "src", "modules");
  }

  async testModule(moduleName: string, specificPage?: string): Promise<void> {
    const selectors = await this.loadModuleSelectors(moduleName);
    const pages = this.getModulePages(moduleName);

    if (pages.length === 0) {
      console.error(`\nNo snapshots found for module: ${moduleName}\n`);
      return;
    }

    const pagesToTest = specificPage ? [specificPage] : pages;

    console.log(`\nTesting module: ${moduleName}\n`);

    for (const page of pagesToTest) {
      if (!pages.includes(page)) {
        console.error(`\nPage "${page}" not found in ${moduleName} snapshots\n`);
        continue;
      }

      await this.testPage(moduleName, page, selectors);
    }
  }

  private async testPage(
    moduleName: string,
    page: string,
    selectors: any,
  ): Promise<void> {
    const pageDir = path.join(this.snapshotsDir, moduleName, page);
    const htmlPath = path.join(pageDir, "page.html");

    if (!fs.existsSync(htmlPath)) {
      console.error(`\nSnapshot not found: ${htmlPath}\n`);
      return;
    }

    const html = fs.readFileSync(htmlPath, "utf-8");
    const $ = cheerio.load(html);

    console.log("─".repeat(80));
    console.log(`Page: ${page} (${htmlPath})`);
    console.log();

    const pageSelectors = selectors[page] || {};
    const flattened = this.flattenSelectors(pageSelectors);

    if (flattened.length === 0) {
      console.log(`  No selectors defined for page: ${page}\n`);
      return;
    }

    const results = this.testSelectors($, flattened);
    this.printCategorizedResults(results);
  }

  private flattenSelectors(
    obj: any,
    prefix: string = "",
  ): FlattenedSelector[] {
    const result: FlattenedSelector[] = [];

    for (const [key, value] of Object.entries(obj)) {
      const newPath = prefix ? `${prefix}.${key}` : key;

      if (typeof value === "string") {
        result.push({ path: newPath, selector: value });
      } else if (typeof value === "object" && value !== null) {
        result.push(...this.flattenSelectors(value, newPath));
      }
    }

    return result;
  }

  private testSelectors(
    $: cheerio.Root,
    selectors: FlattenedSelector[],
  ): Map<string, SelectorTestResult[]> {
    const results = new Map<string, SelectorTestResult[]>();

    selectors.forEach(({ path, selector }) => {
      const parts = path.split(".");
      const category = parts[0];
      const selectorName = parts.slice(1).join(".");

      try {
        const elements = $(selector);
        const count = elements.length;
        const found = count > 0;

        const sampleTexts: string[] = [];
        elements.slice(0, 2).each((_, el) => {
          const text = $(el).text().trim().substring(0, 50);
          if (text) sampleTexts.push(text);
        });

        const result: SelectorTestResult = {
          selector: `${selectorName} (${selector})`,
          found,
          count,
          elements: sampleTexts,
        };

        if (!results.has(category)) {
          results.set(category, []);
        }
        results.get(category)!.push(result);
      } catch (error) {
        const result: SelectorTestResult = {
          selector: `${selectorName} (${selector})`,
          found: false,
          count: 0,
        };

        if (!results.has(category)) {
          results.set(category, []);
        }
        results.get(category)!.push(result);
      }
    });

    return results;
  }

  private printCategorizedResults(
    results: Map<string, SelectorTestResult[]>,
  ): void {
    let totalPassed = 0;
    let totalFailed = 0;

    results.forEach((categoryResults, category) => {
      console.log(`  ${category}:`);

      categoryResults.forEach((result) => {
        const status = result.found ? "✓" : "✗";
        const name = result.selector.split(" (")[0];
        const count = result.count > 0 ? `(${result.count})` : "";

        console.log(`    ${status} ${name.padEnd(30)} ${count}`);

        if (result.found) {
          totalPassed++;
        } else {
          totalFailed++;
        }
      });

      console.log();
    });

    const total = totalPassed + totalFailed;
    const percentage = total > 0 ? Math.round((totalPassed / total) * 100) : 0;

    console.log(`  Summary: ${totalPassed}/${total} passed (${percentage}%)\n`);
  }

  private async loadModuleSelectors(moduleName: string): Promise<any> {
    const selectorsPath = path.join(
      this.modulesDir,
      moduleName,
      "selectors.ts",
    );

    if (!fs.existsSync(selectorsPath)) {
      throw new Error(`Selectors not found: ${selectorsPath}`);
    }

    const selectorsModule = await import(
      path.join(this.modulesDir, moduleName, "selectors")
    );

    const selectorsExportName = `${moduleName}Selectors`;

    if (!selectorsModule[selectorsExportName]) {
      throw new Error(
        `Could not find export "${selectorsExportName}" in ${selectorsPath}. Export name must match module folder name.`,
      );
    }

    return selectorsModule[selectorsExportName];
  }

  private getModulePages(moduleName: string): string[] {
    const moduleSnapshotsDir = path.join(this.snapshotsDir, moduleName);

    if (!fs.existsSync(moduleSnapshotsDir)) {
      return [];
    }

    return fs
      .readdirSync(moduleSnapshotsDir)
      .filter((file) =>
        fs.statSync(path.join(moduleSnapshotsDir, file)).isDirectory(),
      );
  }

  listModules(): void {
    if (!fs.existsSync(this.snapshotsDir)) {
      console.log("\nNo snapshots directory found.\n");
      return;
    }

    const modules = fs
      .readdirSync(this.snapshotsDir)
      .filter((file) =>
        fs.statSync(path.join(this.snapshotsDir, file)).isDirectory(),
      );

    if (modules.length === 0) {
      console.log("\nNo modules with snapshots found.\n");
      return;
    }

    console.log("\nAvailable modules:\n");
    modules.forEach((module) => {
      const pages = this.getModulePages(module);
      console.log(`   ${module.padEnd(15)} (${pages.length} pages)`);
      pages.forEach((page) => console.log(`      - ${page}`));
    });
    console.log();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const tester = new SelectorTester();

  if (args.length === 0 || args[0] === "--list") {
    tester.listModules();
    console.log("Usage:");
    console.log("  npm run test-selectors linkedin              # Test all pages");
    console.log("  npm run test-selectors linkedin jobs         # Test specific page");
    console.log("  npm run test-selectors --list                # List modules\n");
    return;
  }

  const moduleName = args[0];
  const specificPage = args[1];

  await tester.testModule(moduleName, specificPage);
}

if (require.main === module) {
  main().catch(console.error);
}
