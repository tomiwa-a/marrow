import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

function parseUrl(input: string): { domain: string; url: string } {
  const withProtocol = input.match(/^https?:\/\//) ? input : `https://${input}`;
  
  try {
    const urlObj = new URL(withProtocol);
    const domain = urlObj.hostname.replace(/^www\./, "");
    
    let displayUrl = domain + urlObj.pathname + urlObj.search;
    
    if (displayUrl.endsWith("/") && urlObj.pathname === "/") {
      displayUrl = displayUrl.slice(0, -1);
    }

    return { domain, url: displayUrl };
  } catch (e) {
    const clean = input.toLowerCase().trim();
    return { domain: clean.split(/[/?#]/)[0], url: clean };
  }
}

export const getMap = query({
  args: { urlPattern: v.string() },
  handler: async (ctx, { urlPattern }) => {
    const { domain, url } = parseUrl(urlPattern);
    
    const exactMatch = await ctx.db
      .query("page_maps")
      .withIndex("by_url", (q) => q.eq("url", url))
      .first();
    
    if (exactMatch) {
      return exactMatch;
    }

    return null;
  },
});

export const getElement = query({
  args: { 
    urlPattern: v.string(),
    elementName: v.string(),
  },
  handler: async (ctx, { urlPattern, elementName }) => {
    const { domain, url } = parseUrl(urlPattern);
    
    const exactMatch = await ctx.db
      .query("page_maps")
      .withIndex("by_url", (q) => q.eq("url", url))
      .first();
    
    const map = exactMatch || await ctx.db
      .query("page_maps")
      .withIndex("by_domain", (q) => q.eq("domain", domain))
      .first();
    
    if (!map) {
      return null;
    }
    
    const element = map.elements.find((el) => el.name === elementName);
    return element || null;
  },
});

export const getManifest = query({
  args: { domain: v.string() },
  handler: async (ctx, { domain }) => {
    const normalizedDomain = parseUrl(domain).domain;
    
    const maps = await ctx.db
      .query("page_maps")
      .withIndex("by_domain", (q) => q.eq("domain", normalizedDomain))
      .collect();
    
    return {
      domain: normalizedDomain,
      pages: maps.map((map) => ({
        url: map.url,
        page_type: map.page_type,
        elements: map.elements.map((el) => ({
          name: el.name,
          description: el.description,
        })),
      })),
    };
  },
});

export const saveMap = mutation({
  args: {
    url: v.string(),
    domain: v.string(),
    page_type: v.string(),
    elements: v.array(
      v.object({
        name: v.string(),
        description: v.string(),
        strategies: v.array(
          v.object({
            type: v.string(),
            value: v.string(),
          })
        ),
        confidence_score: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { url: normalizedUrl } = parseUrl(args.url);
    
    const existing = await ctx.db
      .query("page_maps")
      .withIndex("by_url", (q) => q.eq("url", normalizedUrl))
      .first();
    
    if (existing) {
      return { status: "exists", id: existing._id };
    }
    
    const id = await ctx.db.insert("page_maps", {
      url: normalizedUrl,
      domain: parseUrl(args.domain).domain,
      page_type: args.page_type,
      elements: args.elements,
      created_at: new Date().toISOString(),
      usage_count: 0,
    });
    
    await incrementMetric(ctx, "total_maps");
    
    return { status: "created", id };
  },
});

export const trackView = mutation({
  args: { urlPattern: v.string() },
  handler: async (ctx, { urlPattern }) => {
    const { domain, url } = parseUrl(urlPattern);

    const map = await ctx.db
      .query("page_maps")
      .withIndex("by_url", (q) => q.eq("url", url))
      .first();

    if (map) {
      await ctx.db.patch(map._id, {
        usage_count: (map.usage_count || 0) + 1,
      });
      await incrementMetric(ctx, "total_requests");
    }
  },
});

export const getStats = query({
  handler: async (ctx) => {
    const allMaps = await ctx.db.query("page_maps").collect();
    const totalRequests = await getMetric(ctx, "total_requests");
    
    const domainCounts = new Map<string, number>();
    for (const map of allMaps) {
      domainCounts.set(map.domain, (domainCounts.get(map.domain) || 0) + 1);
    }
    
    const topDomains = Array.from(domainCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([domain]) => domain);
    
    return {
      total_maps: allMaps.length,
      total_requests: totalRequests,
      top_domains: topDomains,
    };
  },
});

export const debugListMapsByDomain = query({
  args: { domain: v.string() },
  handler: async (ctx, { domain }) => {
    const normalizedDomain = parseUrl(domain).domain;
    const maps = await ctx.db
      .query("page_maps")
      .withIndex("by_domain", (q) => q.eq("domain", normalizedDomain))
      .collect();

    return {
      domain: normalizedDomain,
      count: maps.length,
      urls: maps.map((map) => map.url).sort(),
    };
  },
});

async function incrementMetric(ctx: any, metric: string) {
  const existing = await ctx.db
    .query("analytics")
    .withIndex("by_metric", (q: any) => q.eq("metric", metric))
    .first();
  
  if (existing) {
    await ctx.db.patch(existing._id, {
      value: existing.value + 1,
      timestamp: new Date().toISOString(),
    });
  } else {
    await ctx.db.insert("analytics", {
      metric,
      value: 1,
      timestamp: new Date().toISOString(),
    });
  }
}

async function getMetric(ctx: any, metric: string): Promise<number> {
  const record = await ctx.db
    .query("analytics")
    .withIndex("by_metric", (q: any) => q.eq("metric", metric))
    .first();
  
  return record?.value || 0;
}
