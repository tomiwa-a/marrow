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
      postAuthor: '.update-components-actor__title',
      postContent: '.feed-shared-update-v2__description',
      postImage: '.update-components-image__image',
      postVideo: '.update-components-video__video, video',
    },
    buttons: {
      likeButton: 'button.react-button__trigger',
      commentButton: 'button.comment-button',
      repostButton: 'button.repost-button, button[aria-label*="Repost"]',
      shareButton: 'button.share-button, button[aria-label*="Share"]',
      sendButton: 'button.send-privately-button',
    },
    inputs: {
      postBox: '.share-box-feed-entry__top-bar button',
      commentBox: '.comments-comment-box__editor-text-area',
    },
    details: {
      reactionCount: '.social-details-social-counts__reactions-count',
      commentCount: '.social-details-social-counts__comments',
      timestamp: '.update-components-actor__sub-description',
    },
  },
  
  myNetwork: {
    cards: {
      invitationCard: 'div[data-view-name="invitation-card"]',
      suggestionCard: 'div[data-view-name="cohort-card"]',
      personName: 'span[aria-hidden="true"]',
      personHeadline: 'div.artdeco-entity-lockup__subtitle, p:not(:has(span))',
    },
    buttons: {
      acceptButton: 'button[aria-label*="Accept"]',
      ignoreButton: 'button[aria-label*="Ignore"]',
      connectButton: 'button[aria-label*="Invite"]',
    },
    navigation: {
      invitationsTab: 'button[data-view-name="my-network-grow-sub-tab"]',
      connectionsTab: 'a[href*="/mynetwork/invite-connect/connections/"]',
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
      lastMessage: '.msg-conversation-card__message-snippet',
      timestamp: '.msg-conversation-listitem__time-stamp',
    },
    inputs: {
      messageBox: '.msg-form__contenteditable',
      searchBox: 'input[placeholder*="Search messages"]',
    },
    buttons: {
      sendButton: '.msg-form__send-button',
      attachButton: 'button[aria-label*="Attach"]',
      emojiButton: 'button.msg-form__footer-action', // General class for footer actions, need to be specific if possible or take the first/specific one
    },
  },
  
  global: {
    navigation: {
      homeTab: 'a.global-nav__primary-link[href*="linkedin.com/feed"]',
      jobsTab: 'a.global-nav__primary-link[href*="linkedin.com/jobs"]',
      networkTab: 'a.global-nav__primary-link[href*="linkedin.com/mynetwork"]',
      messagingTab: 'a.global-nav__primary-link[href*="linkedin.com/messaging"]',
      notificationsTab: 'a.global-nav__primary-link[href*="linkedin.com/notifications"]',
      meDropdown: 'button.global-nav__primary-link-me-menu-trigger',
      forBusinessDropdown: 'button.global-nav__primary-link-app-launcher-menu-trigger',
      linkedInLogo: 'li.global-nav__primary-item a[href*="/feed"] svg, .global-nav__logo svg',
    },
  },
};
