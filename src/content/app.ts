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
    nextRide: "Your Next Ride",
    comingUp: "Coming Up",
    recentRides: "Recent Rides",
    yourStats: "Your Stats",
    noNextRide: "Nothing on the books yet",
    noNextRideDescription: "Browse rides and sign up for your next one.",
    viewRide: "View Ride",
    spotsLeft: (remaining: number) => `${remaining} spots left`,
    greeting: {
      morning: "Good morning",
      afternoon: "Good afternoon",
      evening: "Good evening",
    },
    greetingWithName: (greeting: string, name: string) =>
      name ? `${greeting}, ${name}` : greeting,
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
    detail: {
      signUp: "Sign Up",
      cancelSignUp: "Cancel Sign-Up",
      spotsRemaining: (remaining: number, total: number) =>
        `${remaining}/${total} spots remaining`,
      signedUp: "You're signed up!",
      cancelled: "This ride has been cancelled",
    },
    create: {
      heading: "Create a Ride",
      submitButton: "Publish Ride",
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
      invite: "Invite Member",
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
