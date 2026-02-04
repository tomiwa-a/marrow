
import { Page } from "playwright";
import { LinkedInNavigator } from "../modules/linkedin/navigation";
import { TimeFilters } from "../modules/linkedin/urls";

export async function run(page: Page) {
  console.log("Starting LinkedIn Navigation Demo (Full Flow)\n");
  
  const nav = new LinkedInNavigator(page);

  try {
    // 1. Feed
    console.log("1. [Nav] Going to Feed...");
    await nav.goToFeed();
    console.log("   ✓ Feed loaded");

    // 2. Jobs
    console.log("\n2. [Nav] Going to Jobs...");
    await nav.goToJobs();
    console.log("   ✓ Jobs dashboard loaded");

    // 3. Search
    console.log("\n3. [Action] Searching for jobs...");
    await nav.searchJobs({
      keywords: "Software Engineer",
      remote: true,
      timePosted: TimeFilters.PAST_24_HOURS
    });
    console.log("   ✓ Search executed");

    // 4. Scroll
    console.log("\n4. [Action] Scrolling list...");
    await nav.scrollJobsList(2);
    console.log("   ✓ Scroll complete");

    // 5. Extract
    console.log("\n5. [Data] Extracting jobs...");
    const jobs = await nav.getVisibleJobs();
    console.log(`   ✓ Found ${jobs.length} visible jobs`);
    
    if (jobs.length > 0) {
        console.log(`   Sample: ${jobs[0].title} at ${jobs[0].company}`);
        
        // 6. Click
        console.log("\n6. [Action] Clicking first job...");
        await nav.clickJob(0);
        console.log("   ✓ Job clicked");
        
        // 7. Description
        console.log("\n7. [Data] Reading description...");
        const desc = await nav.getJobDescription();
        console.log(`   ✓ Got description (${desc.length} chars)`);
    }

    // 8. Messaging
    console.log("\n8. [Nav] Going to Messaging...");
    await nav.goToMessaging();
    console.log("   ✓ Messaging loaded");

    // 9. My Network
    console.log("\n9. [Nav] Going to My Network...");
    await nav.goToMyNetwork();
    console.log("   ✓ My Network loaded");

    console.log("\n✨ Demo Complete!");
    
  } catch (error) {
    console.error("\n❌ Demo Failed:", error);
    throw error;
  }
}
