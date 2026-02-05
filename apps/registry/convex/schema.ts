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

  users: defineTable({
    user_id: v.string(),
    email: v.optional(v.string()),
    
    total_requests: v.number(),
    maps_created: v.number(),
    
    created_at: v.string(),
    last_active: v.string(),
  })
    .index("by_user_id", ["user_id"])
    .index("by_last_active", ["last_active"]),
});
