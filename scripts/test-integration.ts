
import { Navigator, ContextExtractor } from '../apps/cartographer/src/index';
import { MapperClient } from '../apps/mapper/src/client';
import { PageSchema, PageStructure } from '@marrow/schema';
import fs from 'fs';
import path from 'path';

async function runIntegration() {
  const navigator = new Navigator();
  const extractor = new ContextExtractor();
  const mapper = new MapperClient();

  const targetUrl = process.argv[2] || 'https://news.ycombinator.com/';
  console.log(`\n=== Starting Integration Test: ${targetUrl} ===\n`);

  try {
    // 1. Cartographer: Navigate and Extract
    console.log('1. [Cartographer] Launching Browser...');
    await navigator.init(false); // Headless for speed, or true for debug
    
    console.log(`2. [Cartographer] Navigating to ${targetUrl}...`);
    await navigator.goto(targetUrl);
    
    console.log('3. [Cartographer] Extracting Snapshots...');
    const axTree = await extractor.getAXTree(navigator.page!);
    const html = await extractor.getCleanHTML(navigator.page!);
    
    // 2. Mapper: AI Analysis
    console.log('4. [Mapper] Analyzing with Gemini 2.0...');
    const prompt = `
      You are an intelligent web scraper (Marrow V2).
      Analyze the webpage context below and identify key interactive components.
      
      TARGET: ${targetUrl}
      GOAL: Identify universal elements like lists of items, navigation buttons, and main content areas.
      
      HTML Snippet (Truncated):
      ${html.slice(0, 15000)}

      Accessibility Tree (Summary):
      ${JSON.stringify(axTree.violations.slice(0, 3))}
    `;

    const result = await mapper.generate(prompt, PageSchema);
    
    // 3. Save Output
    const snapshotDir = path.resolve(__dirname, '../data/snapshots');
    if (!fs.existsSync(snapshotDir)) {
      fs.mkdirSync(snapshotDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `snapshot-${timestamp}.json`;
    const filepath = path.join(snapshotDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(result, null, 2));
    
    console.log(`\n=== SUCCESS ===`);
    console.log(`Output saved to: ${filepath}`);
    console.log(`Elements Found: ${result.elements.length}`);
    result.elements.forEach(el => console.log(` - [${el.confidence_score}] ${el.name}: ${el.description}`));

  } catch (error) {
    console.error('\n=== FAILURE ===', error);
  } finally {
    await navigator.close();
  }
}

if (require.main === module) {
  runIntegration();
}
