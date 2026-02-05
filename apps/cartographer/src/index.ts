import { Navigator } from './core/navigator';
import { ContextExtractor } from './core/extractor';

export { Navigator, ContextExtractor };

async function main() {
  const navigator = new Navigator();
  const extractor = new ContextExtractor();

  try {
    await navigator.init(false);

    console.log('Testing Stealth...');
    await navigator.goto('https://bot.sannysoft.com/');
    await navigator.scrollDown(1);
    
    console.log('Visiting Hacker News...');
    await navigator.goto('https://news.ycombinator.com/');
    
    const results = await extractor.getAXTree(navigator.page!);
    console.log('Axe Analysis Complete:');
    console.log(`Violations: ${results.violations.length}`);
    console.log(`Passes: ${results.passes.length}`);
    if (results.violations.length > 0) {
        console.log('First Violation:', JSON.stringify(results.violations[0], null, 2));
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    console.log('Closing browser...');
    await navigator.close();
  }
}

if (require.main === module) {
  main();
}
