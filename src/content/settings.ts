export const settingsContent = {
  heading: 'Settings',

  preferences: {
    title: 'Preferences',
    rows: {
      distance: {
        label: 'Distance',
        options: { km: 'km', mi: 'mi' },
      },
      elevation: {
        label: 'Elevation',
        options: { m: 'm', ft: 'ft' },
      },
      temperature: {
        label: 'Temperature',
        options: { celsius: '°C', fahrenheit: '°F' },
      },
      timeFormat: {
        label: 'Time format',
        options: { '12h': '12h', '24h': '24h' },
      },
      appearance: {
        label: 'Appearance',
        options: { system: 'System', light: 'Light', dark: 'Dark' },
      },
    },
  },

  rideDefaults: {
    title: 'Ride Defaults',
    rows: {
      paceGroup: {
        label: 'Default pace group',
        placeholder: 'No default',
        description: 'Pre-fills your pace group when signing up for rides',
      },
    },
  },

  notifications: {
    title: 'Notifications',
    channels: {
      push: {
        label: 'Push notifications',
        description: 'Receive alerts on this device',
      },
      email: {
        label: 'Email notifications',
        descriptionTemplate: (email: string) => `Receive alerts at ${email}`,
      },
    },
  },

  privacy: {
    title: 'Privacy',
    rows: {
      showOnRoster: {
        label: 'Show me on club roster',
        description:
          'Your profile stays hidden from the public roster — leaders still see your signups',
      },
      showLastRide: {
        label: 'Show my last ride on profile',
        description: 'Controls whether other members can see your recent rides',
      },
    },
  },

  connections: {
    title: 'Connections',
    subtitle: 'Link your accounts to import routes when creating rides.',
    connectButton: (name: string) => `Connect ${name}`,
    disconnectButton: 'Disconnect',
    connected: 'Connected',
    connectedAs: (name: string) => `Connected as ${name}`,
    disconnectConfirmTitle: (name: string) => `Disconnect ${name}?`,
    disconnectConfirm: (name: string) =>
      `Disconnect your ${name} account? Your imported routes will remain.`,
    connecting: 'Connecting...',
    disconnecting: 'Disconnecting...',
    connectError: (name: string) => `Failed to connect ${name}. Please try again.`,
    disconnectError: (name: string) => `Failed to disconnect ${name}. Please try again.`,
    connectSuccess: (name: string) => `${name} connected successfully!`,
    disconnectSuccess: (name: string) => `${name} disconnected.`,
    cancel: 'Cancel',
  },

  account: {
    title: 'Account',
    rows: {
      email: {
        label: 'Email',
        description:
          'Linked to your club registration — reach out to an admin if you need to update it',
      },
      changePassword: {
        label: 'Change password',
        description: "We'll email you a link to set a new one",
      },
      signOut: {
        label: 'Sign out',
        description: 'You can always sign back in later.',
      },
    },
    passwordResetSuccess: (email: string) => `Password reset link sent to ${email}`,
    passwordResetError: "Couldn't send reset email. Please try again.",
    signOutConfirm: 'Sign out of Draftr?',
    signOutConfirmAction: 'Sign out',
    cancel: 'Cancel',
  },
};
