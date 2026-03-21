/**
 * App-level content and copy.
 * All user-facing strings live here — never inline in components.
 * Structured for future CMS migration.
 */

export const appContent = {
  meta: {
    title: 'Draftr',
    description: 'Ride coordination for cycling clubs',
    shortName: 'Draftr',
  },

  nav: {
    home: 'Home',
    rides: 'Rides',
    myRides: 'My Schedule',
    notifications: 'Notifications',
    profile: 'Profile',
    manage: 'Manage',
  },

  header: {
    viewAllNotifications: 'View All',
    signOut: 'Sign Out',
    profile: 'Profile',
    noNotifications: 'No new notifications',
  },

  auth: {
    signIn: {
      heading: 'Welcome to Draftr',
      subheading: 'Sign in to find your next ride',
      emailLabel: 'Email',
      passwordLabel: 'Password',
      submitButton: 'Sign In',
      forgotPassword: 'Forgot password?',
    },
    setupProfile: {
      heading: 'Set up your profile',
      subheading: 'Tell us about yourself so we can match you with the right rides',
      nameLabel: 'Full name',
      displayNameLabel: 'Display name',
      displayNamePlaceholder: 'How you want to be called',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Create a password (min. 6 characters)',
      bioLabel: 'Bio',
      bioPlaceholder: 'Tell others a bit about yourself...',
      paceLabel: 'Preferred pace',
      noPreference: 'No preference',
      submitButton: 'Get Started',
    },
    confirm: {
      expiredLink: 'The invite link may have expired. Please ask your admin for a new invite.',
    },
  },

  dashboard: {
    noRides: 'No upcoming rides',
    noRidesDescription: 'Check back soon — ride leaders will post new rides here.',
    greeting: {
      morning: 'Good morning',
      afternoon: 'Good afternoon',
      evening: 'Good evening',
    },
    greetingWithName: (greeting: string, name: string) =>
      name ? `${greeting}, ${name}` : greeting,
    actionBar: {
      yourNextRide: 'Your Next Ride',
      nextLedRide: 'Your Next Led Ride',
      spotsLeft: (remaining: number) => `${remaining} spots left`,
      signedUp: (count: number, capacity: number | null) =>
        capacity != null ? `${count}/${capacity} signed up` : `${count} signed up`,
      waitlistPosition: 'Waitlisted',
      waitlistDetail: (position: number, rideTitle: string) =>
        `#${position} on waitlist for ${rideTitle}`,
      pendingApprovals: 'Pending Approvals',
      pendingApprovalsCount: (count: number) =>
        `${count} member${count === 1 ? '' : 's'} waiting for approval`,
      ridesNeedingLeader: 'Rides Need a Leader',
      ridesNeedingLeaderCount: (count: number) =>
        `${count} ride${count === 1 ? '' : 's'} this week without a leader`,
      weatherWatch: 'Weather Watch',
      weatherWatchDetail: (rideTitle: string) =>
        `${rideTitle} may be affected by weather conditions`,
    },
    feed: {
      heading: 'Upcoming Rides',
    },
    announcementBanner: {
      dismiss: 'Dismiss',
    },
    // Legacy keys — used by dashboard components that may be repurposed later
    nextRide: 'Your Next Ride',
    viewRide: 'View Ride',
    spotsLeft: (remaining: number) => `${remaining} spots left`,
    leader: {
      yourLeads: 'Your Upcoming Leads',
      noLeads: "You're not leading any upcoming rides",
      noLeadsDescription: 'Create a ride to get started.',
      signups: (count: number) => `${count} signed up`,
      createRide: 'Create Ride',
    },
    admin: {
      clubOverview: 'Club Overview',
      quickActions: 'Quick Actions',
      createRide: 'Create Ride',
      inviteMember: 'Invite Member',
      viewMembers: 'View Members',
    },
  },

  rides: {
    feed: {
      heading: 'Upcoming Rides',
      emptyState: {
        title: 'No upcoming rides',
        description: 'Check back soon — ride leaders will post new rides here.',
      },
    },
    filter: {
      button: 'Filter',
      heading: 'Filter Rides',
      paceGroupLabel: 'Pace Group',
      tagsLabel: 'Tags',
      dateRangeLabel: 'Date Range',
      dateFrom: 'From',
      dateTo: 'To',
      sortLabel: 'Sort By',
      clearAll: 'Clear Filters',
      apply: 'Show Rides',
      activeCount: (count: number) => `${count}`,
      showingCount: (filtered: number) => `Showing ${filtered} result${filtered === 1 ? '' : 's'}`,
      noResults: {
        title: 'No matching rides',
        description: 'Try adjusting your filters to see more rides.',
      },
      sort: {
        dateAsc: 'Date (soonest first)',
        dateDesc: 'Date (latest first)',
        distanceAsc: 'Distance (shortest first)',
        distanceDesc: 'Distance (longest first)',
      },
    },
    card: {
      drop: 'Drop',
      riders: 'riders',
      distance: 'distance',
      elevation: 'elevation',
      time: 'time',
      joinRide: 'Join ride',
      spotsRemaining: (remaining: number) => `${remaining} spots left`,
      ledBy: (name: string) => `Led by ${name}`,
    },
    status: {
      weatherWatch: 'Weather Watch',
      weatherWatchDescription: 'Weather Watch — this ride may be affected by weather conditions.',
      cancelled: 'Cancelled',
    },
    detail: {
      createdBy: (name: string) => `Created by ${name}`,
      signUp: 'Sign Up',
      joinWaitlist: 'Join Waitlist',
      cancelSignUp: 'Cancel Sign-Up',
      spotsRemaining: (remaining: number, total: number) => `${remaining}/${total} spots remaining`,
      spotsFilled: (confirmed: number, capacity: number) => `${confirmed}/${capacity} spots filled`,
      signedUpCount: (count: number) => `${count} signed up`,
      waitlistedCount: (count: number) => `${count} waitlisted`,
      confirmedCount: (count: number) => `${count} confirmed`,
      dropRide: 'Drop ride',
      noDrop: 'No-drop',
      viewRoute: 'View Route',
      organiserNotesHeading: 'Notes from the organiser',
      signedUp: "You're signed up!",
      cancelled: 'This ride has been cancelled',
      cancelledLocked: 'Cancelled rides cannot be edited.',
      duplicateAsNew: 'Duplicate as New Ride',
      ridersHeading: (confirmed: number, waitlisted: number, capacity: number | null) => {
        const parts: string[] = [];
        if (capacity != null) {
          parts.push(`${confirmed} confirmed`);
        } else {
          parts.push(`${confirmed} signed up`);
        }
        if (waitlisted > 0) {
          parts.push(`${waitlisted} waitlisted`);
        }
        return `Riders — ${parts.join(' · ')}`;
      },
    },
    create: {
      heading: 'Create a Ride',
      submitButton: 'Publish Ride',
    },
    recurring: {
      toggle: 'Make this a recurring ride',
      frequency: 'Repeat',
      badge: 'Recurring',
      endCondition: 'Ends',
      endAfter: 'After',
      occurrences: 'occurrences',
      endOnDate: 'On date',
      endNever: 'Never',
    },
    edit: {
      heading: 'Edit Ride',
      duplicateRide: 'Duplicate Ride',
      recurringPrompt: 'This ride is part of a recurring series.',
      editThisOnly: 'Edit this ride only',
      editAllFuture: 'Edit all future rides',
      cancelRide: 'Cancel This Ride',
      cancelConfirm: (title: string) => `Cancel "${title}"? All signed-up riders will be notified.`,
      cancelReasonLabel: 'Reason (optional)',
      cancelReasonPlaceholder: 'Weather, insufficient signups, etc.',
      confirmCancel: 'Yes, Cancel Ride',
      keepRide: 'Keep Ride',
      signups: 'Signups',
      addWalkUp: 'Add Walk-Up Rider',
      walkUpPlaceholder: 'Select a member...',
      walkUpAdded: 'Rider added successfully',
    },
    form: {
      title: 'Title',
      date: 'Date',
      startTime: 'Start time',
      meetingLocation: 'Meeting Location',
      paceGroup: 'Pace Group',
      distance: 'Distance (km)',
      elevation: 'Elevation (m)',
      capacity: 'Capacity',
      routeName: 'Route Name',
      routeLink: 'Route Link',
      isDropRide: 'This is a drop ride',
      tags: 'Tags',
      description: 'Description',
      organiserNotes: 'Organiser Notes',
      selectLocation: 'Select location...',
      selectPace: 'Select pace...',
      required: 'Title, date, and start time are required.',
      descriptionPlaceholder: 'Brief description of the ride...',
      organiserNotesPlaceholder:
        'Notes for riders (meeting point details, things to bring, etc.)...',
    },
    roster: {
      noSignups: 'No signups yet.',
      waitlisted: 'Waitlisted',
      leader: 'Leader',
    },
    comments: {
      heading: 'Comments',
      placeholder: 'Add a comment...',
      submit: 'Post',
      edit: 'Edit',
      save: 'Save',
      cancelEdit: 'Cancel',
      delete: 'Delete',
      deleteConfirm: 'Delete this comment?',
      edited: '(edited)',
      charLimit: (current: number, max: number) => `${current}/${max}`,
      noComments: 'No comments yet. Be the first!',
    },
    pickups: {
      heading: 'Pickup Points',
    },
  },

  myRides: {
    heading: 'My Schedule',
    sections: {
      upcoming: 'Upcoming',
      past: 'Past',
    },
    emptyState: {
      upcoming: {
        title: 'No upcoming rides',
        description: 'Browse the ride feed and sign up for your next one.',
        cta: 'Browse Rides',
      },
      past: {
        title: 'No past rides yet',
        description: 'Your completed rides will show up here.',
      },
    },
    status: {
      confirmed: 'CONFIRMED',
      waitlisted: (position: number) => `WAITLISTED \u00b7 #${position}`,
      completed: 'COMPLETED',
    },
    actions: {
      cancelSignup: 'Cancel signup',
      leaveWaitlist: 'Leave waitlist',
      getDirections: 'Get directions',
      viewDetails: 'View details',
    },
    signedUpOn: 'Signed up',
    waitlistPosition: (position: number) => `#${position} on waitlist`,
  },

  profile: {
    heading: 'Profile',
    editButton: 'Edit Profile',
    signOut: 'Sign Out',
    recentRides: 'Recent Rides',
    noRidesYet: 'No rides yet — sign up for your first one!',
    stats: {
      totalRides: 'Total Rides',
      thisMonth: 'This Month',
      distance: 'Distance',
      elevation: 'Elevation',
    },
    noBio: 'No bio yet',
    sections: {
      about: 'About',
      preferences: 'Preferences',
      paceGroup: 'Preferred Pace',
      memberSince: 'Member since',
      role: 'Role',
      emergencyContact: 'Emergency Contact',
    },
    emergencyContact: {
      nameLabel: 'Emergency Contact Name',
      namePlaceholder: 'Full name',
      phoneLabel: 'Emergency Contact Phone',
      phonePlaceholder: '+1 555-123-4567',
      phonePrefix: '+1',
      phoneInputPlaceholder: '555-123-4567',
      phoneInvalidError: 'Please enter a valid 10-digit phone number',
      noContact: 'No emergency contact set',
      visibilityNote: 'Only visible to ride leaders and admins',
    },
    avatar: {
      uploadButton: 'Change Photo',
      uploading: 'Uploading...',
      removeButton: 'Remove Photo',
      removing: 'Removing...',
      removeConfirm: "Remove your profile photo? You'll revert to your initials.",
    },
    publicProfile: {
      deactivated: 'This member is no longer active.',
    },
    roles: {
      rider: 'Rider',
      ride_leader: 'Ride Leader',
      admin: 'Admin',
    },
  },

  settings: {
    appearance: {
      heading: 'Appearance',
      options: {
        system: 'System',
        light: 'Light',
        dark: 'Dark',
      },
      systemDescription: 'Matches your device setting',
    },
  },

  notifications: {
    heading: 'Notifications',
    markAllRead: 'Mark all read',
    emptyState: {
      title: 'All caught up',
      description: "You'll see ride updates and announcements here.",
    },
    types: {
      ride_update: 'Ride Update',
      ride_cancelled: 'Ride Cancelled',
      weather_watch: 'Weather Watch',
      signup_confirmed: 'Sign-Up Confirmed',
      waitlist_promoted: 'Waitlist Update',
      waitlist_joined: 'Waitlist Alert',
      announcement: 'Announcement',
    },
  },

  manage: {
    heading: 'Manage',
    sections: {
      rides: 'Rides',
      members: 'Members',
      club: 'Club Settings',
    },
    rides: {
      createRide: 'Create Ride',
      upcoming: 'Upcoming',
      past: 'Past',
      cancelled: 'Cancelled',
      drafts: 'Drafts',
      noRides: 'No rides to manage. Create your first one!',
      noUpcomingRides: 'No upcoming rides',
      noPastRides: 'No past rides',
      noCancelledRides: 'No cancelled rides',
      createdBy: (name: string) => `Created by ${name}`,
    },
    members: {
      heading: 'Members',
      inviteButton: 'Invite Member',
      totalMembers: (count: number) => `${count} members`,
      roles: {
        rider: 'Rider',
        ride_leader: 'Leader',
        admin: 'Admin',
      },
      you: 'You',
      status: {
        active: 'Active',
        pending: 'Pending',
        inactive: 'Inactive',
      },
      invite: {
        emailLabel: 'Email address',
        emailPlaceholder: 'rider@example.com',
        roleLabel: 'Role',
        sendButton: 'Send Invite',
        successTitle: 'Invite created!',
        successMessage: 'Share the invite link below with the new member.',
        inviteAnother: 'Invite Another',
        done: 'Done',
        alreadyInvited: 'This email has already been invited.',
        rateLimited: 'Too many invites sent. Please wait a few minutes and try again.',
      },
    },
    stats: {
      totalRides: 'Total Rides',
      activeMembers: 'Active Members',
      signupsThisWeek: 'Sign-ups This Week',
      avgRiders: 'Avg. Riders/Ride',
    },
    season: {
      heading: 'Season Dates',
      description: 'Set your club’s season start and end dates below.',
      startLabel: 'Season Start',
      endLabel: 'Season End',
      save: 'Save Season Dates',
      saved: 'Season dates saved',
      noSeason: 'No season dates configured — recurring rides will generate indefinitely.',
    },
    memberActions: {
      searchPlaceholder: 'Search members...',
      editRole: 'Change Role',
      deactivate: 'Deactivate',
      reactivate: 'Reactivate',
      approve: 'Approve',
      confirmDeactivate: (name: string) => `Deactivate ${name}? They will lose access to the app.`,
      filterAll: 'All',
      sortAlpha: 'A–Z',
      sortNewest: 'Newest',
      joinedDate: (date: string) => `Joined ${date}`,
    },
    announcements: {
      heading: 'Announcements',
      create: 'New Announcement',
      titleLabel: 'Title',
      titlePlaceholder: 'Announcement title...',
      bodyLabel: 'Message',
      bodyPlaceholder: 'Write your announcement...',
      pin: 'Pin',
      unpin: 'Unpin',
      delete: 'Delete',
      edit: 'Edit',
      noAnnouncements: 'No announcements yet.',
      pinned: 'Pinned',
    },
    recurringRides: {
      heading: 'Recurring Rides',
      create: 'New Recurring Ride',
      noRecurring: 'No recurring rides set up yet.',
      delete: 'Delete',
      pause: 'Pause',
      resume: 'Resume',
      paused: 'Paused',
      generateNow: 'Generate Rides Now',
      generated: (count: number) => `${count} ride${count === 1 ? '' : 's'} generated`,
      seasonLabel: 'Season',
      seasonStartLabel: 'Season Start',
      seasonEndLabel: 'Season End',
      weeksAheadLabel: 'Generate rides ahead (weeks)',
      recurrence: {
        weekly: 'Weekly',
        biweekly: 'Bi-weekly',
        monthly: 'Monthly',
      },
      dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    },
  },

  common: {
    loading: 'Loading...',
    error: 'Something went wrong',
    retry: 'Try again',
    cancel: 'Cancel',
    save: 'Save',
    back: 'Back',
    notAuthenticated: 'Not authenticated',
    today: 'Today',
    tomorrow: 'Tomorrow',
  },

  errors: {
    accountDeactivated: 'Your account has been deactivated. Please contact your club admin.',
    signInFailed: 'Sign-in failed',
    rideNotFound: 'Ride not found',
    rideCancelled: 'This ride has been cancelled',
    createRideFailed: 'Failed to create ride',
    notAuthorized: 'You do not have permission to perform this action',
    cannotDeactivateSelf: 'Cannot deactivate yourself',
    lastAdmin: 'Cannot change role — this is the only admin in the club.',
    noFileProvided: 'No file provided',
    commentEmpty: 'Comment cannot be empty.',
    commentNotFound: 'Comment not found.',
    commentTooLong: (max: number) => `Comment must be ${max} characters or fewer.`,
  },

  notificationMessages: {
    signupConfirmed: {
      title: (rideTitle: string) => `You're signed up for ${rideTitle}`,
    },
    walkUpAdded: {
      title: (rideTitle: string) => `You've been signed up for ${rideTitle}`,
      body: 'A ride leader added you to this ride.',
    },
    waitlistPromoted: {
      title: (rideTitle: string) => `You're in! Spot opened for ${rideTitle}`,
      body: "A spot opened up and you've been promoted from the waitlist.",
    },
    waitlistJoined: {
      title: (rideTitle: string) => `Waitlist growing for ${rideTitle}`,
      body: 'A rider joined the waitlist. Consider increasing capacity or adding another ride.',
    },
    newRidePosted: {
      title: (rideTitle: string) => `New Ride: ${rideTitle}`,
      body: 'A new ride has been posted. Tap to view details and sign up.',
    },
    rideUpdated: {
      title: (rideTitle: string) => `Ride Updated: ${rideTitle}`,
      body: 'The ride details have been updated. Tap to see changes.',
    },
    rideCancelled: {
      title: (rideTitle: string) => `Ride Cancelled: ${rideTitle}`,
      defaultBody: 'This ride has been cancelled by the organiser.',
    },
  },
} as const;
