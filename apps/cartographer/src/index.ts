
import { Navigator } from './core/navigator';
import { ContextExtractor } from './core/extractor';

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
    
    const tree = await extractor.getAXTree(navigator.page!);
    console.log('AXTree Captured (First 5 nodes):');
    console.log(JSON.stringify(tree?.children?.slice(0, 5), null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    console.log('Closing browser...');
    await navigator.close();
  }
}

main();
