/**
 * Single source of truth for character-count limits across every form input
 * in the app. Schemas, components, and the database CHECK constraints in
 * `supabase/migrations/00027_input_length_limits.sql` all reference these
 * numbers. Update here when limits change and the rest follows.
 */
export const inputLimits = {
  ride: {
    title: 80,
    description: 250,
    cancellationReason: 300,
  },
  announcement: {
    title: 120,
    body: 500,
  },
  comment: {
    body: 500,
  },
  profile: {
    firstName: 60,
    lastName: 60,
    fullName: 120,
    bio: 300,
    emergencyContactName: 100,
    emergencyContactRelationship: 50,
    paceGroupPref: 60,
  },
  address: {
    line: 120,
    city: 80,
    region: 80,
    postalCode: 20,
    country: 80,
  },
} as const;

/**
 * Counter visibility rule: render the character counter only when the user
 * is within ~20% of the limit, with a 20-char floor so very short inputs
 * still show the counter near the end.
 */
export function counterDisclosureThreshold(max: number): number {
  return Math.max(20, Math.round(max * 0.2));
}

/** Whether the counter should be visible given current length and max. */
export function shouldShowCounter(length: number, max: number): boolean {
  return max - length <= counterDisclosureThreshold(max);
}
