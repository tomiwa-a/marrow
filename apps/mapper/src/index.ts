import { MapperClient } from './client';
import { PageSchema, PageStructure } from '@marrow/schema';

export { MapperClient, PageSchema };
export type { PageStructure };

if (require.main === module) {
  (async () => {
    try {
      console.log("Initializing Mapper Client...");
      const client = new MapperClient();
      
      console.log("Generating test schema...");
      const prompt = `
        You are an intelligent web scraper.
        Analyze the following HTML snippet and populate the JSON schema.
        
        Context:
        - Domain: example.com
        - Page Type: job_test_case
        
        HTML:
        <div id="job-results">
            <div class="card job-card">
                <h2 class="title">Software Engineer</h2>
                <div class="company">Tech Corp</div>
            </div>
            <div class="card job-card">
                 <h2 class="title">Product Manager</h2>
                 <div class="company">Biz Inc</div>
            </div>
            <button class="next-page">Next</button>
        </div>

        Goal: Identify the 'job_card', 'job_title', 'company', and 'next_button' elements.
        Return the response matching the PageSchema exactly.
      `;

      const result = await client.generate(prompt, PageSchema);
      console.log("Generation Result:");
      console.log(JSON.stringify(result, null, 2));
      
    } catch (error) {
      console.error("Run failed:", error);
    }
  })();
}
