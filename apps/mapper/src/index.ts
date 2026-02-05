import { MapperClient } from './client';
import { PageSchema, PageStructure } from '@marrow/schema';
import { buildDiscoveryPrompt } from './prompts/discovery';

export interface PageSnapshot {
  html: string;
  axeSummary: string;
}

export { PageSchema };
export type { PageStructure };

export class Mapper {
  private client: MapperClient;

  constructor(apiKey: string) {
    this.client = new MapperClient(apiKey);
  }

  async analyze(url: string, snapshot: PageSnapshot): Promise<PageStructure> {
    const prompt = buildDiscoveryPrompt(
      url,
      snapshot.html,
      snapshot.axeSummary
    );

    return await this.client.generate(prompt, PageSchema);
  }
}

