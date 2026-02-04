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
      postContainer: '.feed-shared-update-v2',
      postAuthor: '.update-components-actor__name',
      postContent: '.feed-shared-update-v2__description',
      postImage: '.feed-shared-image__image',
      postVideo: '.feed-shared-update-v2__content video',
    },
    buttons: {
      likeButton: 'button[aria-label*="React"]',
      commentButton: 'button[aria-label*="Comment"]',
      repostButton: 'button[aria-label*="Repost"]',
      shareButton: 'button[aria-label*="Share"]',
      sendButton: 'button[aria-label*="Send"]',
    },
    inputs: {
      postBox: '.share-box-feed-entry__trigger',
      commentBox: '.comments-comment-texteditor',
    },
    details: {
      reactionCount: '.social-details-social-counts__reactions',
      commentCount: '.social-details-social-counts__comments',
      timestamp: 'time.update-components-actor__sub-description',
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
      conversationList: '.msg-conversations-container__conversations-list',
      conversationItem: '.msg-conversation-listitem',
      messageList: '.msg-s-message-list',
      messageItem: '.msg-s-message-list__event',
    },
    cards: {
      conversationCard: '.msg-conversation-card',
      participantName: '.msg-conversation-listitem__participant-names',
      lastMessage: '.msg-conversation-listitem__message-snippet',
      timestamp: '.msg-conversation-listitem__time-stamp',
    },
    inputs: {
      messageBox: '.msg-form__contenteditable',
      searchBox: 'input[placeholder*="Search messages"]',
    },
    buttons: {
      sendButton: '.msg-form__send-button',
      attachButton: 'button[aria-label*="Attach"]',
      emojiButton: 'button[aria-label*="emoji"]',
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
