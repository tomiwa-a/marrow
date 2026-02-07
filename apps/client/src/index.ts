import { ConvexHttpClient } from "convex/browser";
import { Cartographer, ExtractDebug, SnapDebug } from "@marrow/cartographer";
import { Mapper } from "@marrow/mapper";
import { PageStructure } from "@marrow/schema";

export interface MapDebug {
  cacheHit: boolean;
  forcedRefresh?: boolean;
  timingsMs: {
    query: number;
    snapshot?: number;
    model?: number;
    save?: number;
    total: number;
  };
  snapshotDebug?: SnapDebug;
}

export interface ExtractContentDebug {
  timingsMs: {
    total: number;
  };
  cartographer: ExtractDebug;
}

export class MarrowClient {
  private registry: ConvexHttpClient;
  private mapper: Mapper;

  constructor(config: { geminiKey: string; registryUrl: string }) {
    this.registry = new ConvexHttpClient(config.registryUrl);
    this.mapper = new Mapper(config.geminiKey);
  }

  async getMap(urlPattern: string): Promise<PageStructure | null> {
    const result = await this.getMapDetailed(urlPattern);
    return result?.map || null;
  }

  async mapPageFresh(urlPattern: string): Promise<PageStructure> {
    const result = await this.mapPageFreshDetailed(urlPattern);
    return result.map;
  }

  async getMapDetailed(
    urlPattern: string,
  ): Promise<{ map: PageStructure; debug: MapDebug } | null> {
    const start = Date.now();
    let t = Date.now();
    const cached = await this.registry.query("maps:getMap" as any, {
      urlPattern,
    });
    const queryMs = Date.now() - t;

    if (cached) {
      console.error("✓ Cache hit");
      this.registry
        .mutation("maps:trackView" as any, { urlPattern })
        .catch(() => {});
      return {
        map: cached as PageStructure,
        debug: {
          cacheHit: true,
          timingsMs: {
            query: queryMs,
            total: Date.now() - start,
          },
        },
      };
    }

    console.error("✗ Cache miss - mapping locally...");
    const { map, snapshotDebug, timingsMs } =
      await this.mapLocallyDetailed(urlPattern);

    t = Date.now();
    await this.registry.mutation("maps:saveMap" as any, {
      url: urlPattern,
      domain: map.domain,
      page_type: map.page_type,
      elements: map.elements,
    });
    const saveMs = Date.now() - t;

    console.error("✓ Uploaded to registry");

    return {
      map,
      debug: {
        cacheHit: false,
        timingsMs: {
          query: queryMs,
          snapshot: timingsMs.snapshot,
          model: timingsMs.model,
          save: saveMs,
          total: Date.now() - start,
        },
        snapshotDebug,
      },
    };
  }

  async mapPageFreshDetailed(
    urlPattern: string,
  ): Promise<{ map: PageStructure; debug: MapDebug }> {
    const start = Date.now();
    const { map, snapshotDebug, timingsMs } =
      await this.mapLocallyDetailed(urlPattern);

    const t = Date.now();
    await this.registry.mutation("maps:saveMap" as any, {
      url: urlPattern,
      domain: map.domain,
      page_type: map.page_type,
      elements: map.elements,
    });
    const saveMs = Date.now() - t;

    return {
      map,
      debug: {
        cacheHit: false,
        forcedRefresh: true,
        timingsMs: {
          query: 0,
          snapshot: timingsMs.snapshot,
          model: timingsMs.model,
          save: saveMs,
          total: Date.now() - start,
        },
        snapshotDebug,
      },
    };
  }

  async getElement(urlPattern: string, elementName: string) {
    return await this.registry.query("maps:getElement" as any, {
      urlPattern,
      elementName,
    });
  }

  async getManifest(domain: string) {
    return await this.registry.query("maps:getManifest" as any, { domain });
  }

  async getStats() {
    return await this.registry.query("maps:getStats" as any);
  }


  private async mapLocallyDetailed(urlPattern: string): Promise<{
    map: PageStructure;
    snapshotDebug: SnapDebug;
    timingsMs: { snapshot: number; model: number };
  }> {
    const fullUrl = urlPattern.startsWith("http")
      ? urlPattern
      : `https://${urlPattern}`;
    const snapshotStart = Date.now();
    const { snapshot, debug } = await Cartographer.snapDetailed(fullUrl);
    const snapshotMs = Date.now() - snapshotStart;

    const modelStart = Date.now();
    const result = await this.mapper.analyze(fullUrl, snapshot);
    const modelMs = Date.now() - modelStart;

    return {
      map: result,
      snapshotDebug: debug,
      timingsMs: {
        snapshot: snapshotMs,
        model: modelMs,
      },
    };
  }

  async extractContent(
    url: string,
    selectors: string[],
  ): Promise<Record<string, string | null>> {
    const { data } = await this.extractContentDetailed(url, selectors);
    return data;
  }

  async extractContentDetailed(
    url: string,
    selectors: string[],
  ): Promise<{
    data: Record<string, string | null>;
    debug: ExtractContentDebug;
  }> {
    const fullUrl = url.startsWith("http") ? url : `https://${url}`;
    const start = Date.now();
    const { data, debug } = await Cartographer.extractDetailed(
      fullUrl,
      selectors,
    );
    return {
      data,
      debug: {
        timingsMs: {
          total: Date.now() - start,
        },
        cartographer: debug,
      },
    };
  }
}
