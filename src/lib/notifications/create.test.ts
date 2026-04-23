import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoisted refs so vi.mock factories can access them (vi.mock is hoisted to top).
const mocks = vi.hoisted(() => ({
  invalidateNotifications: vi.fn(),
  insertSpy: vi.fn(),
  usersMaybeSingle: vi.fn(),
  usersIn: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/cache-tags', () => ({ invalidateNotifications: mocks.invalidateNotifications }));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === 'notifications') {
        return { insert: mocks.insertSpy };
      }
      if (table === 'users') {
        return {
          select: () => ({
            eq: () => ({ maybeSingle: mocks.usersMaybeSingle }),
            in: mocks.usersIn,
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  }),
}));

const { invalidateNotifications, insertSpy, usersMaybeSingle, usersIn } = mocks;

import {
  createNotification,
  createNotifications,
  NOTIFICATION_PRIORITY,
} from '@/lib/notifications/create';

describe('createNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertSpy.mockResolvedValue({ error: null });
  });

  it('inserts with resolved priority and default channel', async () => {
    usersMaybeSingle.mockResolvedValue({
      data: { notification_preferences: { channels: { push: true, email: true } } },
      error: null,
    });

    await createNotification({
      userId: 'user-1',
      type: 'ride_cancelled',
      title: 'Ride Cancelled: Sunday Smash',
      rideId: 'ride-1',
      channel: 'both',
    });

    expect(insertSpy).toHaveBeenCalledWith({
      user_id: 'user-1',
      type: 'ride_cancelled',
      title: 'Ride Cancelled: Sunday Smash',
      body: null,
      ride_id: 'ride-1',
      channel: 'both',
      priority: 'urgent',
    });
    expect(invalidateNotifications).toHaveBeenCalledWith('user-1');
  });

  it('downgrades channel "both" to "push" when user opts out of email', async () => {
    usersMaybeSingle.mockResolvedValue({
      data: { notification_preferences: { channels: { push: true, email: false } } },
      error: null,
    });

    await createNotification({
      userId: 'user-2',
      type: 'ride_cancelled',
      title: 't',
      rideId: 'r',
      channel: 'both',
    });

    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'push', priority: 'urgent' }),
    );
  });

  it('downgrades channel "email" to "push" when user opts out of email (in-app still inserts)', async () => {
    usersMaybeSingle.mockResolvedValue({
      data: { notification_preferences: { channels: { push: true, email: false } } },
      error: null,
    });

    await createNotification({
      userId: 'user-3',
      type: 'announcement',
      title: 't',
      channel: 'email',
    });

    expect(insertSpy).toHaveBeenCalledWith(expect.objectContaining({ channel: 'push' }));
  });

  it('defaults to sensible prefs when user row is missing', async () => {
    usersMaybeSingle.mockResolvedValue({ data: null, error: null });

    await createNotification({
      userId: 'user-4',
      type: 'signup_confirmed',
      title: 't',
      rideId: 'r',
    });

    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'push', priority: 'low' }),
    );
  });
});

describe('createNotifications (batch)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertSpy.mockResolvedValue({ error: null });
  });

  it('no-ops on empty input', async () => {
    await createNotifications([]);
    expect(insertSpy).not.toHaveBeenCalled();
    expect(invalidateNotifications).not.toHaveBeenCalled();
  });

  it('fetches prefs once per unique user and applies per row', async () => {
    usersIn.mockResolvedValue({
      data: [
        { id: 'a', notification_preferences: { channels: { push: true, email: true } } },
        { id: 'b', notification_preferences: { channels: { push: true, email: false } } },
      ],
      error: null,
    });

    await createNotifications([
      { userId: 'a', type: 'ride_cancelled', title: 't', rideId: 'r', channel: 'both' },
      { userId: 'b', type: 'ride_cancelled', title: 't', rideId: 'r', channel: 'both' },
    ]);

    const rows = insertSpy.mock.calls[0][0];
    expect(rows).toEqual([
      expect.objectContaining({ user_id: 'a', channel: 'both', priority: 'urgent' }),
      expect.objectContaining({ user_id: 'b', channel: 'push', priority: 'urgent' }),
    ]);
    expect(invalidateNotifications).toHaveBeenCalledTimes(2);
  });
});

describe('NOTIFICATION_PRIORITY', () => {
  it('assigns urgent to cancellations, removals, weather, and promotion', () => {
    expect(NOTIFICATION_PRIORITY.ride_cancelled).toBe('urgent');
    expect(NOTIFICATION_PRIORITY.rider_removed).toBe('urgent');
    expect(NOTIFICATION_PRIORITY.weather_watch).toBe('urgent');
    expect(NOTIFICATION_PRIORITY.leader_promoted).toBe('urgent');
  });

  it('assigns low to informational self-signup events', () => {
    expect(NOTIFICATION_PRIORITY.signup_confirmed).toBe('low');
    expect(NOTIFICATION_PRIORITY.waitlist_joined).toBe('low');
  });

  it('assigns normal to ride fan-out events', () => {
    expect(NOTIFICATION_PRIORITY.ride_update).toBe('normal');
    expect(NOTIFICATION_PRIORITY.new_ride).toBe('normal');
    expect(NOTIFICATION_PRIORITY.announcement).toBe('normal');
    expect(NOTIFICATION_PRIORITY.waitlist_promoted).toBe('normal');
  });
});
