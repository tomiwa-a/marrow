export const linkedinSelectors = {
  jobs: {
    inputs: {
      searchBox: 'input[placeholder*="title"]',
      locationInput: 'input[placeholder*="City"]',
    },
    buttons: {
      searchNowButton: 'a:contains("Search now")',
    },
    navigation: {
      preferencesLink: 'a[href*="/jobs/preferences/"]',
      myJobsLink: 'a[href*="/my-items/saved-jobs/"]',
      postJobLink: 'a[href*="/talent/job-posting"]',
    },
  },
  
  jobSearch: {
    cards: {
      jobCard: 'div.job-card-container',
      jobCardLink: 'a.job-card-container__link',
      jobTitle: '.job-card-list__title--link',
      companyName: '.artdeco-entity-lockup__subtitle',
      location: '.job-card-container__metadata-wrapper li',
      companyLogo: '.job-card-container img',
      jobsList: '.scaffold-layout__list ul',
    },
    buttons: {
      easyApplyFilter: 'button[aria-label*="Easy Apply filter"]',
      saveJob: 'button[aria-label*="Dismiss"]',
    },
    inputs: {
      searchBox: 'input[id*="jobs-search-box-keyword"]',
      locationInput: 'input[id*="jobs-search-box-location"]',
    },
    filters: {
      datePosted: 'button[aria-label*="Date posted"]',
      workType: 'button[aria-label*="Remote"]',
      experienceLevel: 'button[aria-label*="Experience level"]',
    },
    details: {
      postedTime: '.job-card-container__footer-item:first-child time',
      easyApplyBadge: 'li.job-card-container__footer-item--highlighted',
      insightText: '.job-card-container__job-insight-text',
    },
    jobsList: '.scaffold-layout__list ul',
    jobCard: 'div.job-card-container',
    jobTitle: '.job-card-list__title--link',
    companyName: '.artdeco-entity-lockup__subtitle',
    location: '.job-card-container__metadata-wrapper li',
    easyApplyButton: 'li.job-card-container__footer-item--highlighted',
    jobDescription: '.jobs-description__content',
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
