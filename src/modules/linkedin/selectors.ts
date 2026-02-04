export const LinkedInSelectors = {
  jobs: {
    cards: {
      jobCard: 'a[href*="/jobs/view/"]',
      jobCardContainer: 'div[componentkey][data-view-name="job-card"]',
      jobTitle: 'p.d0cf87d0._5fe0d28d',
      companyName: 'p.d0cf87d0._67499df2:has(+ p:contains("•"))',
      location: 'p.d0cf87d0._67499df2:contains("•") ~ p.d0cf87d0._67499df2',
      salary: 'p.d0cf87d0._67499df2:contains("$")',
      companyLogo: 'img[data-loaded="true"]',
      jobsList: 'div[data-testid="JobsHomeFeedModuleListCollection"]',
    },
    
    buttons: {
      easyApplyFilter: 'p:contains("Easy Apply")',
      saveJob: 'button[aria-label*="Dismiss"][data-view-name="dismiss-job"]',
      showAllButton: 'a:contains("Show all")',
      searchNowButton: 'a:contains("Search now")',
    },
    
    inputs: {
      searchBox: 'input[placeholder*="title"]',
      locationInput: 'input[placeholder*="City"]',
    },
    
    filters: {
      datePosted: 'button:has-text("Date posted")',
      workType: 'button:has-text("Remote")',
      experienceLevel: 'button:has-text("Experience level")',
    },
    
    details: {
      postedTime: 'p:contains("ago")',
      earlyApplicant: 'p:contains("Be an early applicant")',
      verifiedBadge: 'svg[id="verified-small"]',
      activelyReviewing: 'svg[id="responsive-medium"]',
    },
    
    jobsList: 'div[data-testid="JobsHomeFeedModuleListCollection"]',
    jobCard: 'a[href*="/jobs/view/"]',
    jobTitle: 'p.d0cf87d0._5fe0d28d',
    companyName: 'p.d0cf87d0._67499df2:has(+ p:contains("•"))',
    location: 'p.d0cf87d0._67499df2:contains("•") ~ p.d0cf87d0._67499df2',
    easyApplyButton: 'p:contains("Easy Apply")',
    jobDescription: '.show-more-less-html__markup',
  },
  
  feed: {
    cards: {
      postCard: 'div[data-urn*="urn:li:activity"]',
      postAuthor: 'span.update-components-actor__name',
      postContent: 'div.feed-shared-update-v2__description',
      postImage: 'img.feed-shared-image__image',
    },
    buttons: {
      likeButton: 'button[aria-label*="Like"]',
      commentButton: 'button[aria-label*="Comment"]',
      shareButton: 'button[aria-label*="Share"]',
      postButton: 'button:contains("Post")',
    },
    inputs: {
      postBox: 'div[aria-label*="share"]',
      commentBox: 'div[aria-label*="comment"]',
    },
  },
  
  myNetwork: {
    cards: {
      invitationCard: 'li[data-view-name*="invitation"]',
      suggestionCard: 'div[data-view-name*="pymk-card"]',
      personName: 'span.discover-person-card__name',
      personHeadline: 'p.discover-person-card__occupation',
    },
    buttons: {
      acceptButton: 'button:contains("Accept")',
      ignoreButton: 'button:contains("Ignore")',
      connectButton: 'button:contains("Connect")',
    },
    navigation: {
      invitationsTab: 'a:contains("Invitations")',
      connectionsTab: 'a:contains("Connections")',
    },
  },
  
  messaging: {
    lists: {
      conversationList: 'ul[aria-label*="Conversations"]',
      conversationItem: 'li[data-view-name*="conversation"]',
    },
    inputs: {
      messageBox: 'div[aria-label*="message"]',
      searchBox: 'input[placeholder*="Search"]',
    },
    buttons: {
      sendButton: 'button[aria-label*="Send"]',
      newMessageButton: 'button:contains("Write a message")',
    },
  },
  
  global: {
    navigation: {
      homeTab: 'a[href="https://www.linkedin.com/"]',
      jobsTab: 'a[href="https://www.linkedin.com/jobs/"]',
      networkTab: 'a[href="https://www.linkedin.com/mynetwork/"]',
      messagingTab: 'a[href="https://www.linkedin.com/messaging/"]',
      notificationsTab: 'a[href="https://www.linkedin.com/notifications/"]',
      meDropdown: 'button[aria-expanded][data-view-name="navigation-settings"]',
      forBusinessDropdown: 'button[aria-label*="For Business"]',
      linkedInLogo: 'svg[id="linkedin-bug-blue-medium"]',
    },
  },
};
