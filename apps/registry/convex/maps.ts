import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

function parseUrl(input: string): { domain: string; url: string } {
  let cleaned = input.toLowerCase().trim();
  cleaned = cleaned.replace(/^https?:\/\//, "");
  cleaned = cleaned.replace(/\/$/, "");
  
  const domain = cleaned.split("/")[0];
  return { domain, url: cleaned };
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
    
    const domainMaps = await ctx.db
      .query("page_maps")
      .withIndex("by_domain", (q) => q.eq("domain", domain))
      .collect();
    
    if (domainMaps.length === 0) {
      return null;
    }
    
    domainMaps.sort((a, b) => b.usage_count - a.usage_count);
    const mostPopular = domainMaps[0];
    
    return mostPopular;
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
