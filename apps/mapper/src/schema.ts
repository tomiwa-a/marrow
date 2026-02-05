
import { z } from 'zod';

export const StrategySchema = z.object({
  type: z.enum(['selector', 'xpath', 'aria', 'vision_hint']).describe("The method used to identify the element"),
  value: z.string().describe("The actual value for the strategy (e.g. CSS selector, XPath expression)")
});

export const ElementSchema = z.object({
  description: z.string().describe("A brief description of what this element is"),
  strategies: z.array(StrategySchema).describe("List of identification strategies in order of preference"),
  confidence_score: z.number().min(0).max(1).describe("Confidence score between 0 and 1")
});

export const PageSchema = z.object({
  domain: z.string().describe("The domain of the page being analyzed"),
  page_type: z.string().describe("The type of page (e.g. 'job_search', 'job_detail')"),
  last_updated: z.string().datetime().describe("ISO 8601 timestamp of when this analysis was generated"),
  elements: z.record(z.string(), ElementSchema).describe("Map of semantic element names (e.g. 'easy_apply_button') to their definitions")
});

export type PageStructure = z.infer<typeof PageSchema>;
