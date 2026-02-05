import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  page_maps: defineTable({
    url: v.string(),
    domain: v.string(),
    page_type: v.string(),
    
    elements: v.array(v.object({
      name: v.string(),
      description: v.string(),
      strategies: v.array(v.object({
        type: v.string(),
        value: v.string(),
      })),
      confidence_score: v.number(),
    })),
    
    created_at: v.string(),
    last_validated: v.optional(v.string()),
    validation_status: v.optional(v.string()),
    
    usage_count: v.number(),
  })
    .index("by_url", ["url"])
    .index("by_domain", ["domain"])
    .index("by_usage", ["usage_count"]),

  analytics: defineTable({
    metric: v.string(),
    value: v.number(),
    timestamp: v.string(),
  })
    .index("by_metric", ["metric"])
    .index("by_timestamp", ["timestamp"]),
});
