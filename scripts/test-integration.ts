import { MarrowClient } from '../apps/client/src/index';
import fs from 'fs';
import path from 'path';

async function runIntegration() {
  const targetUrl = process.argv[2] || 'https://news.ycombinator.com/';
  console.log(`\n=== Starting Integration Test: ${targetUrl} ===\n`);

  const registryUrl = process.env.CONVEX_URL || 'http://localhost:3000';
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!geminiKey) {
    console.error('ERROR: GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY must be set');
    process.exit(1);
  }

  const marrow = new MarrowClient({
    geminiKey,
    registryUrl,
  });

  try {
    console.log('1. [Registry] Checking for cached map...');
    const result = await marrow.getMap(targetUrl);

    if (!result) {
      console.error('ERROR: Failed to get map');
      process.exit(1);
    }

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
    process.exit(1);
  }
}

if (require.main === module) {
  runIntegration();
}
