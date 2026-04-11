'use client';

import { createContext, useContext } from 'react';
import { defaultUserPreferences, type UserPreferences } from '@/types/user-preferences';

const UserPrefsContext = createContext<UserPreferences | undefined>(undefined);

interface UserPrefsProviderProps {
  children: React.ReactNode;
  initialPrefs: UserPreferences;
}

export function UserPrefsProvider({ children, initialPrefs }: UserPrefsProviderProps) {
  return <UserPrefsContext.Provider value={initialPrefs}>{children}</UserPrefsContext.Provider>;
}

/** Returns the current user's preferences. Falls back to defaults outside the provider. */
export function useUserPrefs(): UserPreferences {
  return useContext(UserPrefsContext) ?? defaultUserPreferences;
}
