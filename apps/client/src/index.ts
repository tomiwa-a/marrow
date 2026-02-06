import { ConvexHttpClient } from "convex/browser";
import { Cartographer } from "@marrow/cartographer";
import { Mapper } from "@marrow/mapper";
import { PageStructure } from "@marrow/schema";

export class MarrowClient {
  private registry: ConvexHttpClient;
  private mapper: Mapper;
  
  constructor(config: {
    geminiKey: string;
    registryUrl: string;
  }) {
    this.registry = new ConvexHttpClient(config.registryUrl);
    this.mapper = new Mapper(config.geminiKey);
  }
  
  async getMap(urlPattern: string): Promise<PageStructure | null> {
    const cached = await this.registry.query("maps:getMap" as any, { urlPattern });
    
    if (cached) {
      console.error("✓ Cache hit");
      // Fire-and-forget analytics
      this.registry.mutation("maps:trackView" as any, { urlPattern }).catch(() => {});
      return cached as PageStructure;
    }
    
    console.error("✗ Cache miss - mapping locally...");
    const map = await this.mapLocally(urlPattern);
    
    await this.registry.mutation("maps:saveMap" as any, {
      url: urlPattern,
      domain: map.domain,
      page_type: map.page_type,
      elements: map.elements,
    });
    console.error("✓ Uploaded to registry");
    
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
    const fullUrl = urlPattern.startsWith("http") ? urlPattern : `https://${urlPattern}`;
    
    const snapshot = await Cartographer.snap(fullUrl);
    const result = await this.mapper.analyze(fullUrl, snapshot);
    
    return result;
  }

  async extractContent(url: string, selectors: string[]): Promise<Record<string, string | null>> {
    const fullUrl = url.startsWith("http") ? url : `https://${url}`;
    return await Cartographer.extract(fullUrl, selectors);
  }
}


