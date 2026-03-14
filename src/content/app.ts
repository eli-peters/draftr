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
    rides: "Rides",
    myRides: "My Rides",
    notifications: "Notifications",
    profile: "Profile",
    manage: "Manage",
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

  profile: {
    heading: "Profile",
    editButton: "Edit Profile",
    recentRides: "Recent Rides",
    noRidesYet: "No rides yet — sign up for your first one!",
  },

  notifications: {
    heading: "Notifications",
    emptyState: {
      title: "All caught up",
      description: "You'll see ride updates and announcements here.",
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
