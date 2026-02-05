
import { Page } from "playwright";
import { linkedinSelectors } from "./selectors";
import { linkedinUrls } from "./urls";

function flattenSelectors(obj: any, prefix = ""): Record<string, string> {
  let result: Record<string, string> = {};
  for (const key in obj) {
    if (typeof obj[key] === "string") {
      result[prefix + key] = obj[key];
    } else if (typeof obj[key] === "object") {
      Object.assign(result, flattenSelectors(obj[key], prefix + key + "."));
    }
  }
  return result;
}


function randomDelay(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

async function humanDelay(page: Page) {
  const delay = randomDelay(3000, 7000);
  console.log(`   (Waiting ${delay}ms for safety...)`);
  await page.waitForTimeout(delay);
}

export async function run(page: Page, targetPage?: string) {
  console.log("Running Live Selector Tests...");

  const pageConfigs: Record<string, () => string> = {
    jobs: () => linkedinUrls.jobs(),
    jobSearch: () => linkedinUrls.jobSearch({ keywords: "Software Engineer", remote: true }),
    feed: () => linkedinUrls.feed(),
    myNetwork: () => linkedinUrls.myNetwork(),
    messaging: () => linkedinUrls.messaging(),
  };

  const pagesToTest = targetPage ? [targetPage] : [...Object.keys(pageConfigs), 'global'];

  for (const pageName of pagesToTest) {
    if (pageName === 'global') {
        continue;
    }

    // Add safety delay between pages if not the first one or if we are iterating
    if (pagesToTest.length > 1) {
        await humanDelay(page);
    }

    if (!pageConfigs[pageName]) {
      console.warn(`\n⚠ Unknown page: ${pageName}`);
      continue;
    }

    const url = pageConfigs[pageName]();
    console.log(`\n----------------------------------------`);
    console.log(`Testing Page: ${pageName}`);
    console.log(`URL: ${url}`);
    console.log(`----------------------------------------`);

    try {
      await page.goto(url);
      await page.waitForLoadState("domcontentloaded");
      // Initial wait for dynamic content
      await humanDelay(page);

      const selectors = (linkedinSelectors as any)[pageName];
      if (!selectors) {
        console.log(`⚠ No selectors defined for ${pageName}`);
        continue;
      }


      const flatSelectors = flattenSelectors(selectors);
      const total = Object.keys(flatSelectors).length;
      let passed = 0;

      for (const [name, selector] of Object.entries(flatSelectors)) {
        try {
          const elements = await page.$$(selector);
          const count = elements.length;
          if (count > 0) {
            console.log(`✓ ${name}: found ${count}`);
            passed++;
          } else {
            console.log(`✗ ${name}: NOT FOUND (${selector})`);
          }
        } catch (error) {
          console.log(`✗ ${name}: ERROR (${selector})`);
        }
      }
      console.log(`\nResult for ${pageName}: ${passed}/${total} passed`);

    } catch (error) {
      console.error(`Error testing ${pageName}:`, error);
    }
  }

  // Test Global Selectors if requested or running all
  if (!targetPage || targetPage === 'global') {
     console.log(`\n----------------------------------------`);
     console.log(`Testing Page: global (on Feed)`);
     console.log(`----------------------------------------`);
     
     if (page.url() !== linkedinUrls.feed()) {
         await page.goto(linkedinUrls.feed());
         await page.waitForLoadState("domcontentloaded");
         await page.waitForTimeout(3000);
     }

     const flatSelectors = flattenSelectors(linkedinSelectors.global);
     const total = Object.keys(flatSelectors).length;
     let passed = 0;

      for (const [name, selector] of Object.entries(flatSelectors)) {
        try {
          const elements = await page.$$(selector);
          const count = elements.length;
          if (count > 0) {
            console.log(`✓ ${name}: found ${count}`);
            passed++;
          } else {
            console.log(`✗ ${name}: NOT FOUND (${selector})`);
          }
        } catch (error) {
          console.log(`✗ ${name}: ERROR (${selector})`);
        }
      }
      console.log(`\nResult for global: ${passed}/${total} passed`);
  }
}
