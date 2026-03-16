/**
 * App-level content and copy.
 * All user-facing strings live here — never inline in components.
 * Structured for future CMS migration.
 */

export const appContent = {
  meta: {
    title: "Draftr",
    description: "Ride coordination for cycling clubs",
    shortName: "Draftr",
  },

  nav: {
    home: "Home",
    rides: "Rides",
    myRides: "My Rides",
    notifications: "Notifications",
    profile: "Profile",
    manage: "Manage",
  },

  header: {
    viewAllNotifications: "View All",
    signOut: "Sign Out",
    profile: "Profile",
    noNotifications: "No new notifications",
  },

  auth: {
    signIn: {
      heading: "Welcome to Draftr",
      subheading: "Sign in to find your next ride",
      emailLabel: "Email",
      passwordLabel: "Password",
      submitButton: "Sign In",
      forgotPassword: "Forgot password?",
    },
    setupProfile: {
      heading: "Set up your profile",
      subheading: "Tell us about yourself so we can match you with the right rides",
      nameLabel: "Full name",
      displayNameLabel: "Display name",
      bioLabel: "Bio",
      paceLabel: "Preferred pace",
      submitButton: "Get Started",
    },
  },

  dashboard: {
    noRides: "No upcoming rides",
    noRidesDescription: "Check back soon — ride leaders will post new rides here.",
    greeting: {
      morning: "Good morning",
      afternoon: "Good afternoon",
      evening: "Good evening",
    },
    greetingWithName: (greeting: string, name: string) =>
      name ? `${greeting}, ${name}` : greeting,
    actionBar: {
      yourNextRide: "Your Next Ride",
      nextLedRide: "Your Next Led Ride",
      spotsLeft: (remaining: number) => `${remaining} spots left`,
      signedUp: (count: number, capacity: number | null) =>
        capacity != null ? `${count}/${capacity} signed up` : `${count} signed up`,
    },
    feed: {
      heading: "Upcoming Rides",
    },
    // Legacy keys — used by dashboard components that may be repurposed later
    nextRide: "Your Next Ride",
    viewRide: "View Ride",
    spotsLeft: (remaining: number) => `${remaining} spots left`,
    leader: {
      yourLeads: "Your Upcoming Leads",
      noLeads: "You're not leading any upcoming rides",
      noLeadsDescription: "Create a ride to get started.",
      signups: (count: number) => `${count} signed up`,
      createRide: "Create Ride",
    },
    admin: {
      clubOverview: "Club Overview",
      quickActions: "Quick Actions",
      createRide: "Create Ride",
      inviteMember: "Invite Member",
      viewMembers: "View Members",
    },
  },

  rides: {
    feed: {
      heading: "Upcoming Rides",
      emptyState: {
        title: "No upcoming rides",
        description: "Check back soon — ride leaders will post new rides here.",
      },
    },
    status: {
      weatherWatch: "Weather Watch",
      weatherWatchDescription: "Weather Watch — this ride may be affected by weather conditions.",
      cancelled: "Cancelled",
    },
    detail: {
      signUp: "Sign Up",
      joinWaitlist: "Join Waitlist",
      cancelSignUp: "Cancel Sign-Up",
      spotsRemaining: (remaining: number, total: number) =>
        `${remaining}/${total} spots remaining`,
      signedUp: "You're signed up!",
      cancelled: "This ride has been cancelled",
      ridersHeading: (count: number, capacity: number | null) =>
        capacity != null ? `Riders (${count}/${capacity})` : `Riders (${count})`,
    },
    create: {
      heading: "Create a Ride",
      submitButton: "Publish Ride",
    },
    edit: {
      heading: "Edit Ride",
      cancelRide: "Cancel This Ride",
      cancelConfirm: (title: string) => `Cancel "${title}"? All signed-up riders will be notified.`,
      cancelReasonLabel: "Reason (optional)",
      cancelReasonPlaceholder: "Weather, insufficient signups, etc.",
      confirmCancel: "Yes, Cancel Ride",
      keepRide: "Keep Ride",
    },
    form: {
      title: "Title",
      date: "Date",
      startTime: "Start time",
      meetingLocation: "Meeting Location",
      paceGroup: "Pace Group",
      distance: "Distance (km)",
      elevation: "Elevation (m)",
      capacity: "Capacity",
      routeName: "Route Name",
      routeLink: "Route Link",
      isDropRide: "This is a drop ride",
      tags: "Tags",
      description: "Description",
      organiserNotes: "Organiser Notes",
      selectLocation: "Select location...",
      selectPace: "Select pace...",
      required: "Title, date, and start time are required.",
      descriptionPlaceholder: "Brief description of the ride...",
      organiserNotesPlaceholder: "Notes for riders (meeting point details, things to bring, etc.)...",
    },
    roster: {
      noSignups: "No signups yet.",
      waitlisted: "Waitlisted",
    },
  },

  myRides: {
    heading: "My Rides",
    tabs: {
      upcoming: "Upcoming",
      past: "Past",
      waitlisted: "Waitlisted",
    },
    emptyState: {
      upcoming: {
        title: "No upcoming rides",
        description: "Browse the ride feed and sign up for your next one.",
        cta: "Browse Rides",
      },
      past: {
        title: "No past rides yet",
        description: "Your completed rides will show up here.",
      },
      waitlisted: {
        title: "No waitlisted rides",
        description: "If a ride is full, you'll be added to the waitlist automatically.",
      },
    },
    signedUpOn: "Signed up",
    waitlistPosition: (position: number) => `#${position} on waitlist`,
  },

  profile: {
    heading: "Profile",
    editButton: "Edit Profile",
    signOut: "Sign Out",
    recentRides: "Recent Rides",
    noRidesYet: "No rides yet — sign up for your first one!",
    stats: {
      totalRides: "Total Rides",
      thisMonth: "This Month",
      distance: "Distance",
      elevation: "Elevation",
    },
    sections: {
      about: "About",
      preferences: "Preferences",
      paceGroup: "Preferred Pace",
      memberSince: "Member since",
      role: "Role",
    },
    roles: {
      rider: "Rider",
      ride_leader: "Ride Leader",
      admin: "Admin",
    },
  },

  settings: {
    appearance: {
      heading: "Appearance",
      options: {
        system: "System",
        light: "Light",
        dark: "Dark",
      },
      systemDescription: "Matches your device setting",
    },
  },

  notifications: {
    heading: "Notifications",
    markAllRead: "Mark all read",
    emptyState: {
      title: "All caught up",
      description: "You'll see ride updates and announcements here.",
    },
    types: {
      ride_update: "Ride Update",
      ride_cancelled: "Ride Cancelled",
      weather_watch: "Weather Watch",
      signup_confirmed: "Sign-Up Confirmed",
      waitlist_promoted: "Waitlist Update",
      announcement: "Announcement",
    },
  },

  manage: {
    heading: "Manage",
    sections: {
      rides: "Rides",
      members: "Members",
      club: "Club Settings",
    },
    rides: {
      createRide: "Create Ride",
      upcoming: "Upcoming Rides",
      past: "Past Rides",
      drafts: "Drafts",
      noRides: "No rides to manage. Create your first one!",
    },
    members: {
      heading: "Members",
      inviteButton: "Invite Member",
      totalMembers: (count: number) => `${count} members`,
      roles: {
        rider: "Rider",
        ride_leader: "Leader",
        admin: "Admin",
      },
      status: {
        active: "Active",
        pending: "Pending",
        inactive: "Inactive",
      },
      invite: {
        emailLabel: "Email address",
        emailPlaceholder: "rider@example.com",
        roleLabel: "Role",
        sendButton: "Send Invite",
        successTitle: "Invite sent!",
        successMessage: (email: string) => `An invite email has been sent to ${email}`,
        inviteAnother: "Invite Another",
        done: "Done",
        alreadyInvited: "This email has already been invited.",
        rateLimited: "Too many invites sent. Please wait a few minutes and try again.",
      },
    },
    stats: {
      totalRides: "Total Rides",
      activeMembers: "Active Members",
      signupsThisWeek: "Sign-ups This Week",
      avgRiders: "Avg. Riders/Ride",
    },
  },

  common: {
    loading: "Loading...",
    error: "Something went wrong",
    retry: "Try again",
    cancel: "Cancel",
    save: "Save",
    back: "Back",
  },
} as const;
