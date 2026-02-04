import { Page } from "playwright";
import { LinkedInSelectors } from "./selectors";
import { LinkedInUrls, JobSearchParams } from "./urls";

export interface JobListing {
  title: string;
  company: string;
  location: string;
  url: string;
  postedTime?: string;
}

export class LinkedInNavigator {
  constructor(private page: Page) {}

  async goToJobs(): Promise<void> {
    await this.page.goto(LinkedInUrls.jobs());
    await this.page.waitForLoadState("networkidle");
  }

  async searchJobs(params: JobSearchParams): Promise<void> {
    const url = LinkedInUrls.jobSearch(params);
    console.log(`Navigating to: ${url}`);
    await this.page.goto(url);
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(2000);
  }

  async scrollJobsList(scrollCount: number = 3): Promise<void> {
    const jobsList = this.page.locator(LinkedInSelectors.jobs.jobsList);

    for (let i = 0; i < scrollCount; i++) {
      await jobsList.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });
      console.log(`Scrolled jobs list (${i + 1}/${scrollCount})`);
      await this.page.waitForTimeout(1500);
    }
  }

  async getVisibleJobs(): Promise<JobListing[]> {
    const jobCards = await this.page
      .locator(LinkedInSelectors.jobs.jobCard)
      .all();
    const jobs: JobListing[] = [];

    for (const card of jobCards) {
      try {
        const title = await card
          .locator(LinkedInSelectors.jobs.jobTitle)
          .textContent();
        const company = await card
          .locator(LinkedInSelectors.jobs.companyName)
          .textContent();
        const location = await card
          .locator(LinkedInSelectors.jobs.location)
          .first()
          .textContent();
        const link = await card.locator("a").first().getAttribute("href");

        if (title && company && location) {
          jobs.push({
            title: title.trim(),
            company: company.trim(),
            location: location.trim(),
            url: link || "",
          });
        }
      } catch (error) {
        continue;
      }
    }

    return jobs;
  }

  async clickJob(index: number): Promise<void> {
    const jobCards = await this.page
      .locator(LinkedInSelectors.jobs.jobCard)
      .all();
    if (jobCards[index]) {
      await jobCards[index].click();
      await this.page.waitForTimeout(1500);
    }
  }

  async getJobDescription(): Promise<string> {
    try {
      const description = await this.page
        .locator(LinkedInSelectors.jobs.jobDescription)
        .textContent();
      return description?.trim() || "";
    } catch {
      return "";
    }
  }

  async hasEasyApply(): Promise<boolean> {
    const easyApplyButton = this.page.locator(
      LinkedInSelectors.jobs.easyApplyButton,
    );
    return await easyApplyButton.isVisible();
  }

  async clickEasyApply(): Promise<void> {
    await this.page.click(LinkedInSelectors.jobs.easyApplyButton);
    await this.page.waitForTimeout(2000);
  }
}
