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
    jobCard: ".job-card-container",
    jobTitle: ".job-card-list__title",
    companyName: ".job-card-container__company-name",
    location: ".job-card-container__metadata-item",
    easyApplyButton: 'button:has-text("Easy Apply")',
    jobsList: ".jobs-search-results-list",
    jobDescription: ".jobs-description",
  },

  filters: {
    datePosted: 'button:has-text("Date posted")',
    workType: 'button:has-text("Remote")',
    experienceLevel: 'button:has-text("Experience level")',
    applyFilters: 'button:has-text("Show results")',
  },
};
