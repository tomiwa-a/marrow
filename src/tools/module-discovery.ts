import * as fs from "fs";
import * as path from "path";

export interface ModuleInfo {
  name: string;
  path: string;
  hasUrls: boolean;
  hasSelectors: boolean;
  hasConfig: boolean;
}

export interface PageDefinition {
  name: string;
  urlMethod: string;
  params?: any;
}

export class ModuleDiscovery {
  private modulesDir: string;

  constructor() {
    this.modulesDir = path.join(process.cwd(), "src", "modules");
  }

  listModules(): ModuleInfo[] {
    if (!fs.existsSync(this.modulesDir)) {
      return [];
    }

    const dirs = fs
      .readdirSync(this.modulesDir)
      .filter((file) =>
        fs.statSync(path.join(this.modulesDir, file)).isDirectory(),
      );

    return dirs.map((dir) => {
      const modulePath = path.join(this.modulesDir, dir);
      return {
        name: dir,
        path: modulePath,
        hasUrls: fs.existsSync(path.join(modulePath, "urls.ts")),
        hasSelectors: fs.existsSync(path.join(modulePath, "selectors.ts")),
        hasConfig: fs.existsSync(path.join(modulePath, "snapshot-config.ts")),
      };
    });
  }

  async getModulePages(moduleName: string): Promise<PageDefinition[]> {
    const moduleInfo = this.listModules().find((m) => m.name === moduleName);

    if (!moduleInfo) {
      throw new Error(`Module "${moduleName}" not found`);
    }

    if (!moduleInfo.hasUrls) {
      throw new Error(`Module "${moduleName}" missing urls.ts`);
    }

    const urlsPath = path.join(moduleInfo.path, "urls.ts");
    const urlsContent = fs.readFileSync(urlsPath, "utf-8");

    const pages: PageDefinition[] = [];
    const methodRegex = /static\s+(\w+)\s*\([^)]*\)\s*:\s*string/g;
    let match;

    while ((match = methodRegex.exec(urlsContent)) !== null) {
      const methodName = match[1];
      pages.push({
        name: methodName,
        urlMethod: methodName,
      });
    }

    if (moduleInfo.hasConfig) {
      try {
        const configModule = await import(
          path.join(moduleInfo.path, "snapshot-config")
        );
        const snapshotParams = configModule.SnapshotParams || {};

        pages.forEach((page) => {
          if (snapshotParams[page.name]) {
            page.params = snapshotParams[page.name];
          }
        });
      } catch (error) {
        console.log(
          `   Warning: Could not load snapshot-config for ${moduleName}`,
        );
      }
    }

    return pages;
  }

  async loadModuleUrls(moduleName: string): Promise<any> {
    const moduleInfo = this.listModules().find((m) => m.name === moduleName);

    if (!moduleInfo) {
      throw new Error(`Module "${moduleName}" not found`);
    }

    const urlsModule = await import(path.join(moduleInfo.path, "urls"));
    
    const possibleNames = [
      `${moduleName.charAt(0).toUpperCase()}${moduleName.slice(1)}Urls`,
      `${moduleName.toUpperCase()}Urls`,
      "LinkedInUrls",
    ];

    for (const className of possibleNames) {
      if (urlsModule[className]) {
        return urlsModule[className];
      }
    }

    throw new Error(
      `No Urls class found in urls.ts. Tried: ${possibleNames.join(", ")}`,
    );
  }
}
