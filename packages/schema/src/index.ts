
import { z } from 'zod';

export const StrategySchema = z.object({
  type: z.enum(['selector', 'xpath', 'aria', 'data_attr', 'text_content']).describe("The method used to identify the element. Prefer 'selector' for CSS, 'data_attr' for data-* attributes."),
  value: z.string().describe("The actual value for the strategy (e.g. CSS selector '.job-card', XPath '//div[@class=\"job\"]', data attribute 'data-testid=\"job-item\"')")
});

export const ElementSchema = z.object({
  name: z.string().describe("The semantic name of the element (e.g. 'job_card', 'next_button', 'list_container'). Use snake_case."),
  description: z.string().describe("A brief description of what this element is and its purpose on the page"),
  strategies: z.array(StrategySchema)
    .min(2)
    .describe("MUST provide at least 2 distinct strategies. Order by stability: 1) CSS Selector or data-* attribute (most stable), 2) XPath or text content (fallback)"),
  confidence_score: z.number().min(0).max(1).describe("Confidence score between 0 and 1 based on selector stability and uniqueness")
});

export const PageSchema = z.object({
  domain: z.string().describe("The domain of the page being analyzed"),
  page_type: z.string().describe("The type of page (e.g. 'job_search', 'job_detail')"),
  last_updated: z.string().datetime().describe("ISO 8601 timestamp of when this analysis was generated"),
  elements: z.array(ElementSchema).describe("List of semantic elements identified on the page")
});

export type PageStructure = z.infer<typeof PageSchema>;
