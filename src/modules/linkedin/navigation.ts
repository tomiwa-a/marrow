import { Page } from "playwright";
import { linkedinSelectors } from "./selectors";
import { linkedinUrls, JobSearchParams } from "./urls";
import { StealthEngine } from "../../browser/stealth";

export interface JobListing {
  title: string;
  company: string;
  location: string;
  url: string;
  postedTime?: string;
}

export class LinkedInNavigator {
  private stealth: StealthEngine;

  constructor(private page: Page) {
    this.stealth = new StealthEngine(page);
  }

  /**
   * Navigates to the LinkedIn Jobs dashboard.
   */
  async goToJobs(): Promise<void> {
    await this.page.goto(linkedinUrls.jobs());
    await this.page.waitForLoadState("domcontentloaded");
    await this.stealth.randomDelay(2000, 4000);
    
    // Wait for "My Jobs" link which is always present on the dashboard
    await this.page.waitForSelector(linkedinSelectors.jobs.navigation.myJobsLink, {
      timeout: 10000,
    });
  }

  /**
   * Navigates to the main LinkedIn Feed.
   */
  async goToFeed(): Promise<void> {
    await this.page.goto(linkedinUrls.feed());
    await this.page.waitForLoadState("domcontentloaded");
    await this.stealth.randomDelay(2000, 4000);
  }

  /**
   * Navigates to the Messaging section.
   */
  async goToMessaging(): Promise<void> {
    await this.page.goto(linkedinUrls.messaging());
    await this.page.waitForLoadState("domcontentloaded");
    await this.stealth.randomDelay(2000, 4000);
  }

  /**
   * Navigates to the My Network section.
   */
  async goToMyNetwork(): Promise<void> {
    await this.page.goto(linkedinUrls.myNetwork());
    await this.page.waitForLoadState("domcontentloaded");
    await this.stealth.randomDelay(2000, 4000);
  }

  /**
   * Performs a job search with specific filters.
   * @param params - Search parameters including keywords, location, and filters.
   */
  async searchJobs(params: JobSearchParams): Promise<void> {
    const url = linkedinUrls.jobSearch(params);
    console.log(`Navigating to: ${url}`);
    await this.page.goto(url, { waitUntil: "domcontentloaded" });
    
    await this.stealth.randomDelay(3000, 5000);

    await this.page.waitForSelector(linkedinSelectors.jobSearch.jobCard, {
      timeout: 15000,
    });
  }

  /**
   * Scrolls the jobs list by a specified number of "pages".
   * @param scrollCount - Number of times to scroll down (default: 3).
   */
  async scrollJobsList(scrollCount: number = 3): Promise<void> {
    for (let i = 0; i < scrollCount; i++) {
      await this.scroll('down');
      console.log(`Scrolled page (${i + 1}/${scrollCount})`);
    }
  }

  /**
   * Scrolls the page or specific container in a given direction.
   * @param direction - Direction to scroll ('up' or 'down').
   */
  async scroll(direction: 'up' | 'down'): Promise<void> {
      const jobsListSelector = linkedinSelectors.jobSearch.jobsList;
      
      try {
          await this.page.hover(jobsListSelector);
          
          const deltaY = direction === 'up' ? -500 : 500;
          await this.page.mouse.wheel(0, deltaY);
          
          await this.stealth.randomDelay(1000, 2000);
          
      } catch (e) {
          console.log("   (Scroll fallback to window)");
          await this.stealth.scroll(direction, 'random');
      }
  }

  /**
   * Extracts job data from the currently visible list.
   * @returns Array of found job listings.
   */
  async getVisibleJobs(): Promise<JobListing[]> {
    await this.stealth.randomDelay(1000, 2000);

    const jobCards = await this.page
      .locator(linkedinSelectors.jobSearch.jobCard)
      .all();
    const jobs: JobListing[] = [];

    for (const card of jobCards) {
      try {
        const title = await card
          .locator(linkedinSelectors.jobSearch.jobTitle)
          .textContent();
        const company = await card
          .locator(linkedinSelectors.jobSearch.companyName)
          .textContent();
        
        const locationLocator = card.locator(linkedinSelectors.jobSearch.location);
        const location = (await locationLocator.count()) > 0 
            ? await locationLocator.first().textContent() 
            : "Unknown";
            
        const link = await card.locator("a").first().getAttribute("href");

        if (title && company) {
          jobs.push({
            title: title.trim(),
            company: company.trim(),
            location: location?.trim() || "Unknown",
            url: link || "",
          });
        }
      } catch (error) {
        continue;
      }
    }

    return jobs;
  }

  /**
   * Clicks on a specific job card by its index in the visible list.
   * @param index - The 0-based index of the job to click.
   */
  async clickJob(index: number): Promise<void> {
    const listSelector = linkedinSelectors.jobSearch.jobsList;
    const cardClass = linkedinSelectors.jobSearch.jobCard; 
    
    const cardSelector = `${listSelector} > li:nth-child(${index + 1}) ${cardClass}`;
      
    console.log(`Clicking job #${index + 1}`);
    
    try {
        await this.stealth.click(cardSelector);
    } catch (e) {
        console.error(`Failed to click job ${index + 1}.`);
        throw e;
    }
  }

  /**
   * Extracts the full description text from the currently selected job.
   * @returns The job description text.
   */
  async getJobDescription(): Promise<string> {
    try {
      await this.page.waitForSelector(linkedinSelectors.jobSearch.jobDescription, { timeout: 5000 });
      await this.stealth.randomDelay(1000, 2500);
      
      const description = await this.page
        .locator(linkedinSelectors.jobSearch.jobDescription)
        .textContent();
      return description?.trim() || "";
    } catch {
      return "";
    }
  }

  /**
   * Checks if the "Easy Apply" button is visible.
   * @returns visible status.
   */
  async hasEasyApply(): Promise<boolean> {
    const easyApplyButton = this.page.locator(
      linkedinSelectors.jobSearch.easyApplyButton,
    );
    return await easyApplyButton.isVisible();
  }

  /**
   * Clicks the "Easy Apply" button if available.
   */
  async clickEasyApply(): Promise<void> {
    if (await this.hasEasyApply()) {
        console.log("Clicking Easy Apply...");
        await this.stealth.click(linkedinSelectors.jobSearch.easyApplyButton);
    } else {
        console.log("Easy Apply button not found.");
    }
  }

  /**
   * Clicks the "Next" button in the application modal
   */
  async nextStep(): Promise<void> {
    const nextButton = this.page.locator('button[aria-label="Continue to next step"]');
    if (await nextButton.isVisible()) {
        await this.stealth.click('button[aria-label="Continue to next step"]');
        await this.stealth.randomDelay(1000, 2000);
    }
  }

  /**
   * Clicks "Review" if available
   */
  async reviewApplication(): Promise<void> {
    const reviewButton = this.page.locator('button[aria-label="Review your application"]');
    if (await reviewButton.isVisible()) {
        await this.stealth.click('button[aria-label="Review your application"]');
        await this.stealth.randomDelay(1000, 2000);
    }
  }

  /**
   * Submits the application
   */
  async submitApplication(): Promise<void> {
    const submitButton = this.page.locator('button[aria-label="Submit application"]');
    if (await submitButton.isVisible()) {
        console.log("Submitting application...");
        await this.stealth.click('button[aria-label="Submit application"]');
        await this.stealth.randomDelay(2000, 4000);
    }
  }

  /**
   * Dismisses the success modal or application window
   */
  async dismissModal(): Promise<void> {
    const closeButton = this.page.locator('button[aria-label="Dismiss"]');
    if (await closeButton.isVisible()) {
        await this.stealth.click('button[aria-label="Dismiss"]');
    }
  }
}
