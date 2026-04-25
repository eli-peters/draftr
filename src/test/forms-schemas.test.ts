import { describe, expect, it } from 'vitest';

import {
  announcementSchema,
  inviteMemberSchema,
  rideSchema,
  setupProfileSchema,
  signInSchema,
  waitlistSchema,
} from '@/lib/forms/schemas';

describe('signInSchema', () => {
  it('rejects an empty email', () => {
    const result = signInSchema.safeParse({ email: '', password: 'a' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = signInSchema.safeParse({ email: 'not-an-email', password: 'pw' });
    expect(result.success).toBe(false);
  });

  it('accepts a valid pair', () => {
    const result = signInSchema.safeParse({ email: 'a@b.com', password: 'pw' });
    expect(result.success).toBe(true);
  });
});

describe('setupProfileSchema', () => {
  const valid = {
    password: 'longenough',
    full_name: 'Eli Peters',
    bio: '',
  };

  it('accepts valid input', () => {
    expect(setupProfileSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a one-word name', () => {
    expect(setupProfileSchema.safeParse({ ...valid, full_name: 'Eli' }).success).toBe(false);
  });

  it('rejects an empty name', () => {
    expect(setupProfileSchema.safeParse({ ...valid, full_name: '   ' }).success).toBe(false);
  });

  it('rejects a short password', () => {
    expect(setupProfileSchema.safeParse({ ...valid, password: 'short' }).success).toBe(false);
  });

  it('rejects an oversized bio', () => {
    expect(setupProfileSchema.safeParse({ ...valid, bio: 'x'.repeat(501) }).success).toBe(false);
  });
});

describe('waitlistSchema', () => {
  it('rejects empty', () => {
    expect(waitlistSchema.safeParse({ email: '' }).success).toBe(false);
  });
  it('accepts a valid email', () => {
    expect(waitlistSchema.safeParse({ email: 'a@b.com' }).success).toBe(true);
  });
});

describe('inviteMemberSchema', () => {
  it('accepts a valid invite', () => {
    const result = inviteMemberSchema.safeParse({ email: 'eli@example.com', role: 'rider' });
    expect(result.success).toBe(true);
  });
  it('rejects an unknown role', () => {
    const result = inviteMemberSchema.safeParse({ email: 'a@b.com', role: 'mystery' });
    expect(result.success).toBe(false);
  });
  it('rejects a malformed email', () => {
    const result = inviteMemberSchema.safeParse({ email: 'not-email', role: 'rider' });
    expect(result.success).toBe(false);
  });
});

describe('announcementSchema', () => {
  const valid = {
    title: 'Saturday ride moved',
    body: 'Heads up, weather pushed start to 9am.',
    announcement_type: 'general' as const,
    is_dismissible: true,
    is_pinned: false,
  };

  it('accepts valid input', () => {
    expect(announcementSchema.safeParse(valid).success).toBe(true);
  });
  it('rejects empty title', () => {
    expect(announcementSchema.safeParse({ ...valid, title: '   ' }).success).toBe(false);
  });
  it('rejects empty body', () => {
    expect(announcementSchema.safeParse({ ...valid, body: '   ' }).success).toBe(false);
  });
  it('rejects oversized body', () => {
    expect(announcementSchema.safeParse({ ...valid, body: 'x'.repeat(501) }).success).toBe(false);
  });
  it('rejects unknown type', () => {
    expect(announcementSchema.safeParse({ ...valid, announcement_type: 'mystery' }).success).toBe(
      false,
    );
  });
});

describe('rideSchema', () => {
  const valid = {
    routeUrl: 'https://www.strava.com/routes/123',
    title: 'Saturday Spin',
    capacity: '12',
    paceGroupId: 'pace-1',
    rideDate: '2026-05-01',
    startTime: '08:00',
    selectedCoLeaders: [],
    routeName: '',
    routePolyline: '',
  };

  it('accepts a valid Strava URL', () => {
    expect(rideSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts a Ride With GPS URL', () => {
    expect(
      rideSchema.safeParse({ ...valid, routeUrl: 'https://ridewithgps.com/routes/1' }).success,
    ).toBe(true);
  });

  it('rejects a non-Strava/RWGPS URL', () => {
    expect(rideSchema.safeParse({ ...valid, routeUrl: 'https://google.com/maps' }).success).toBe(
      false,
    );
  });

  it('rejects an empty title', () => {
    expect(rideSchema.safeParse({ ...valid, title: '   ' }).success).toBe(false);
  });

  it('rejects capacity below 1', () => {
    expect(rideSchema.safeParse({ ...valid, capacity: '0' }).success).toBe(false);
  });
});
