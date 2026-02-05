import { Page } from "playwright";
import { SessionManager } from "../browser/session";
import { SnapshotData } from "./types";
import { ModuleDiscovery, PageDefinition } from "./module-discovery";
import * as fs from "fs";
import * as path from "path";

export class PageSnapshot {
  private snapshotsDir: string;
  private moduleDiscovery: ModuleDiscovery;

  constructor() {
    this.snapshotsDir = path.join(process.cwd(), "snapshots");
    this.moduleDiscovery = new ModuleDiscovery();
  }

  async captureModule(moduleName: string, specificPage?: string): Promise<void> {
    console.log(`\nCapturing snapshots for module: ${moduleName}\n`);

    const pages = await this.moduleDiscovery.getModulePages(moduleName);
    const urlsClass = await this.moduleDiscovery.loadModuleUrls(moduleName);

    const pagesToCapture = specificPage
      ? pages.filter((p) => p.name === specificPage)
      : pages;

    if (pagesToCapture.length === 0) {
      if (specificPage) {
        throw new Error(
          `Page "${specificPage}" not found in module "${moduleName}"`,
        );
      }
      throw new Error(`No pages found in module "${moduleName}"`);
    }

    const sessionManager = new SessionManager();
    const context = await sessionManager.init(false);
    const page = await context.newPage();

    try {
      for (const pageConfig of pagesToCapture) {
        await this.capturePage(
          page,
          moduleName,
          pageConfig,
          urlsClass,
        );
      }
    } finally {
      await sessionManager.close();
    }

    console.log(`\nAll snapshots captured for ${moduleName}!\n`);
  }

  private async capturePage(
    page: Page,
    moduleName: string,
    pageConfig: PageDefinition,
    urlsClass: any,
  ): Promise<void> {
    try {
      console.log(`   Capturing: ${pageConfig.name}`);

      let url: string;
      if (pageConfig.params) {
        url = urlsClass[pageConfig.urlMethod](pageConfig.params);
      } else {
        url = urlsClass[pageConfig.urlMethod]();
      }

      console.log(`   → Navigating to: ${url}`);
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForTimeout(3000);

      console.log(`   → Capturing HTML...`);
      const html = await page.content();

      console.log(`   → Capturing DOM tree...`);
      const domTree = await this.captureDomTree(page);

      const viewport = page.viewportSize();
      const userAgent = await page.evaluate(() => navigator.userAgent);

      const snapshot: SnapshotData = {
        html,
        domTree,
        metadata: {
          pageName: pageConfig.name,
          url,
          timestamp: new Date().toISOString(),
          viewport: viewport || { width: 1280, height: 720 },
          userAgent,
        },
      };

      console.log(`   → Saving snapshot...`);
      this.saveSnapshot(moduleName, pageConfig.name, snapshot);
      console.log(`   [OK] Saved to snapshots/${moduleName}/${pageConfig.name}/\n`);
    } catch (error) {
      console.error(`   [FAIL] Error capturing ${pageConfig.name}:`, error);
    }
  }

  private async captureDomTree(page: Page): Promise<any> {
    try {
      return await page.evaluate(() => {
        function buildTree(el: Element, depth: number = 0): any {
          if (depth > 10) return null;

          const attributes: Record<string, string> = {};
          Array.from(el.attributes).forEach((attr) => {
            attributes[attr.name] = attr.value;
          });

          return {
            tag: el.tagName.toLowerCase(),
            attributes,
            text: el.textContent?.trim().substring(0, 100),
            childCount: el.children.length,
            children:
              depth < 5
                ? Array.from(el.children)
                    .slice(0, 20)
                    .map((child) => buildTree(child, depth + 1))
                    .filter(Boolean)
                : [],
          };
        }
        return buildTree(document.body);
      });
    } catch (error) {
      console.log(`      Warning: DOM tree capture failed, skipping`);
      return null;
    }
  }

  private saveSnapshot(
    moduleName: string,
    pageName: string,
    snapshot: SnapshotData,
  ): void {
    const pageDir = path.join(this.snapshotsDir, moduleName, pageName);

    if (!fs.existsSync(pageDir)) {
      fs.mkdirSync(pageDir, { recursive: true });
    }

    fs.writeFileSync(path.join(pageDir, "page.html"), snapshot.html, "utf-8");

    fs.writeFileSync(
      path.join(pageDir, "dom-tree.json"),
      JSON.stringify(snapshot.domTree, null, 2),
      "utf-8",
    );

    fs.writeFileSync(
      path.join(pageDir, "metadata.json"),
      JSON.stringify(snapshot.metadata, null, 2),
      "utf-8",
    );
  }

  listModules(): void {
    console.log("\nAvailable modules:\n");
    const modules = this.moduleDiscovery.listModules();

    if (modules.length === 0) {
      console.log("   No modules found in src/modules/\n");
      return;
    }

    modules.forEach((mod) => {
      const status = mod.hasUrls && mod.hasSelectors ? "[READY]" : "[INCOMPLETE]";
      console.log(`   ${status} ${mod.name}`);
      if (!mod.hasUrls) console.log(`         Missing: urls.ts`);
      if (!mod.hasSelectors) console.log(`         Missing: selectors.ts`);
    });
    console.log();
  }

  async listPages(moduleName: string): Promise<void> {
    console.log(`\nAvailable pages in ${moduleName}:\n`);
    const pages = await this.moduleDiscovery.getModulePages(moduleName);

    pages.forEach((page) => {
      const hasParams = page.params ? "[WITH PARAMS]" : "";
      console.log(`   ${page.name} ${hasParams}`);
      if (page.params) {
        console.log(`      ${JSON.stringify(page.params)}`);
      }
    });
    console.log();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const snapshot = new PageSnapshot();

  if (args.length === 0 || args[0] === "--help") {
    console.log("\nUsage:");
    console.log("  npm run snapshot linkedin              # Capture all LinkedIn pages");
    console.log("  npm run snapshot linkedin jobs         # Capture specific page");
    console.log("  npm run snapshot --list                # List available modules");
    console.log("  npm run snapshot --pages linkedin      # List pages in module\n");
    return;
  }

  const command = args[0];

  if (command === "--list") {
    snapshot.listModules();
  } else if (command === "--pages") {
    if (!args[1]) {
      console.error("\nError: Module name required\n");
      return;
    }
    await snapshot.listPages(args[1]);
  } else {
    const moduleName = args[0];
    const specificPage = args[1];
    await snapshot.captureModule(moduleName, specificPage);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
