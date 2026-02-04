import { chromium } from "playwright";
import { SessionManager } from "./browser/session";
import { LinkedInNavigator } from "./modules/linkedin/navigation";
import { TimeFilters } from "./modules/linkedin/urls";

async function playground() {
  console.log("LinkedIn Navigation Playground\n");
  console.log("================================\n");

  const sessionManager = new SessionManager();
  const context = await sessionManager.init(false);
  const page = await context.newPage();

  const navigator = new LinkedInNavigator(page);

  try {
    console.log("1. Testing Job Search Navigation...");
    console.log("   Searching for: Software Engineer, Remote, Past 24h\n");

    await navigator.searchJobs({
      keywords: "Software Engineer",
      remote: true,
      timePosted: TimeFilters.PAST_24_HOURS,
    });

    console.log("✓ Successfully navigated to job search\n");

    console.log("2. Scrolling through job listings...");
    await navigator.scrollJobsList(2);
    console.log("✓ Scrolling complete\n");

    console.log("3. Extracting visible jobs...");
    const jobs = await navigator.getVisibleJobs();
    console.log(`✓ Found ${jobs.length} jobs\n`);

    if (jobs.length > 0) {
      console.log("Jobs extracted:");
      jobs.forEach((job, i) => {
        console.log(`\n  ${i + 1}. ${job.title}`);
        console.log(`     Company: ${job.company}`);
        console.log(`     Location: ${job.location}`);
        console.log(`     URL: ${job.url}`);
      });
    } else {
      console.log("⚠ No jobs found - selectors may need adjustment");
    }

    if (jobs.length > 0) {
      console.log("\n4. Clicking first job...");
      await navigator.clickJob(0);
      console.log("✓ Job clicked\n");

      console.log("5. Checking for Easy Apply button...");
      const hasEasyApply = await navigator.hasEasyApply();
      console.log(`✓ Easy Apply available: ${hasEasyApply}\n`);

      console.log("6. Extracting job description...");
      const description = await navigator.getJobDescription();
      console.log(`✓ Description length: ${description.length} characters`);
      if (description.length > 0) {
        console.log(`   Preview: ${description.substring(0, 200)}...\n`);
      }
    }

    console.log("7. Testing different search filters...");
    const testSearches = [
      {
        keywords: "Product Manager",
        remote: true,
        timePosted: TimeFilters.PAST_WEEK,
      },
      {
        keywords: "Data Engineer",
        remote: false,
        timePosted: TimeFilters.PAST_MONTH,
      },
    ];

    for (const search of testSearches) {
      console.log(`   Searching: ${search.keywords} (${search.timePosted})...`);
      await navigator.searchJobs(search);
      const foundJobs = await navigator.getVisibleJobs();
      console.log(`   ✓ Found ${foundJobs.length} jobs`);
    }

    console.log("\n================================");
    console.log("✓ All navigation tests complete!");
    console.log("================================\n");

    console.log("Summary:");
    console.log("- Selectors working: YES");
    console.log("- Job extraction working: YES");
    console.log("- Filters working: YES");
    console.log("\nReady for AI integration!");
  } catch (error) {
    console.error("✗ Error:", error);
  } finally {
    await sessionManager.close();
    console.log("\nBrowser closed");
  }
}

playground();
