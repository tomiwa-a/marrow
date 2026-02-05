
import { MapperClient } from './client';
import { PageSchema, PageStructure } from './schema';

export { MapperClient, PageSchema };
export type { PageStructure };

if (require.main === module) {
  (async () => {
    try {
      console.log("Initializing Mapper Client...");
      const client = new MapperClient();
      
      console.log("Generating test schema...");
      const prompt = `
        Analyze this accessibility tree snippet and identify the job list:
        <div id="job-results">
            <div class="card job-card">...</div>
            <div class="card job-card">...</div>
        </div>
      `;

      const result = await client.generate(prompt, PageSchema);
      console.log("Generation Result:");
      console.log(JSON.stringify(result, null, 2));
      
    } catch (error) {
      console.error("Run failed:", error);
    }
  })();
}
