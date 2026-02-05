import { ConvexHttpClient } from "convex/browser";
import { Navigator, ContextExtractor } from "../../apps/cartographer/src/index";
import { MapperClient } from "../../apps/mapper/src/client";
import { PageSchema, PageStructure } from "@marrow/schema";
import { buildDiscoveryPrompt } from "../../apps/mapper/src/prompts/discovery";

export class MarrowClient {
  private registry: ConvexHttpClient;
  private mapper: MapperClient;
  
  constructor(config: {
    geminiKey: string;
    registryUrl: string;
  }) {
    this.registry = new ConvexHttpClient(config.registryUrl);
    this.mapper = new MapperClient(config.geminiKey);
  }
  
  async getMap(urlPattern: string): Promise<PageStructure | null> {
    const cached = await this.registry.query("maps:getMap" as any, { urlPattern });
    
    if (cached) {
      console.log("✓ Cache hit");
      return cached as PageStructure;
    }
    
    console.log("✗ Cache miss - mapping locally...");
    const map = await this.mapLocally(urlPattern);
    
    await this.registry.mutation("maps:saveMap" as any, {
      url: map.domain,
      domain: map.domain,
      page_type: map.page_type,
      elements: map.elements,
    });
    console.log("✓ Uploaded to registry");
    
    return map;
  }
  
  async getElement(urlPattern: string, elementName: string) {
    return await this.registry.query("maps:getElement" as any, { urlPattern, elementName });
  }
  
  async getManifest(domain: string) {
    return await this.registry.query("maps:getManifest" as any, { domain });
  }
  
  async getStats() {
    return await this.registry.query("maps:getStats" as any);
  }
  
  private async mapLocally(urlPattern: string): Promise<PageStructure> {
    const navigator = new Navigator();
    const extractor = new ContextExtractor();
    
    await navigator.init(false);
    
    const fullUrl = urlPattern.startsWith("http") ? urlPattern : `https://${urlPattern}`;
    await navigator.goto(fullUrl);
    
    const html = await extractor.getCleanHTML(navigator.page!);
    const axTree = await extractor.getAXTree(navigator.page!);
    
    const axeSummary = JSON.stringify({
      violations: axTree.violations.slice(0, 3),
      passes: axTree.passes.length,
      incomplete: axTree.incomplete.length,
    }, null, 2);
    
    const prompt = buildDiscoveryPrompt(fullUrl, html.slice(0, 15000), axeSummary);
    const result = await this.mapper.generate(prompt, PageSchema);
    
    await navigator.close();
    return result;
  }
}
