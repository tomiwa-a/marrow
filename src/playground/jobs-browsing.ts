import { Page } from "playwright";
import { LinkedInNavigator } from "../modules/linkedin/navigation";
import { TimeFilters } from "../modules/linkedin/urls";

export async function run(page: Page) {
  console.log("Starting Random Job Browsing Demo\n");
  
  const nav = new LinkedInNavigator(page);

  try {
    console.log("1. [Nav] Going to Jobs...");
    await nav.goToJobs();

    console.log("2. [Action] Searching...");
    await nav.searchJobs({
      keywords: "Software Engineer",
      remote: true,
      timePosted: TimeFilters.PAST_WEEK
    });

    console.log("\n--- Infinite Scroll Phase (Target: 20+ jobs) ---");
    
    let scrollAttempts = 0;
    while (scrollAttempts < 10) {
        const jobs = await nav.getVisibleJobs();
        console.log(`   Current visible jobs: ${jobs.length}`);
        
        if (jobs.length >= 20) {
            console.log("   Target reached!");
            break;
        }
        
        console.log(`   Scrolling down to load more... (${scrollAttempts + 1}/10)`);
        await nav.scroll('down');
        await new Promise(r => setTimeout(r, 2000));
        scrollAttempts++;
    }

    console.log("\n--- Applying to ALL collected jobs ---");
    
    const finalJobs = await nav.getVisibleJobs();
    console.log(`   Total Candidates: ${finalJobs.length}`);
    
    for (let i = 0; i < finalJobs.length; i++) {
        const job = finalJobs[i];
        console.log(`\nProcessing Job ${i + 1}/${finalJobs.length}: ${job.title}`);
        
        try {
            await nav.clickJob(i);
            
            const desc = await nav.getJobDescription();
            console.log(`   Description extracted (${desc.length} chars)`);
            
            await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));
            
        } catch (e) {
            console.error(`   Failed to process job ${i + 1}:`, e);
        }
    }

    console.log("\n✨ Browsing Session Complete!");
    
  } catch (error) {
    console.error("\n❌ Browsing Failed:", error);
    throw error;
  }
}
