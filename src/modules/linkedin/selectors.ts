export const LinkedInSelectors = {
  navigation: {
    jobsTab: 'a[href*="/jobs/"]',
    networkTab: 'a[href*="/mynetwork/"]',
    messagingTab: 'a[href*="/messaging/"]',
    notificationsTab: 'a[href*="/notifications/"]',
    meDropdown: 'button[aria-label*="View Profile"]',
  },

  jobs: {
    searchBox: 'input[aria-label*="Search by title"]',
    searchButton: 'button[aria-label*="Search"]',
    jobCard: 'div[data-job-id]',
    jobTitle: 'h3.base-search-card__title',
    companyName: 'h4.base-search-card__subtitle',
    location: '.job-search-card__location',
    easyApplyButton: 'button:has-text("Easy Apply")',
    jobsList: '.jobs-search-results__list-item',
    jobDescription: '.show-more-less-html__markup',
  },

  filters: {
    datePosted: 'button:has-text("Date posted")',
    workType: 'button:has-text("Remote")',
    experienceLevel: 'button:has-text("Experience level")',
    applyFilters: 'button:has-text("Show results")',
  },
};
