import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const eqCalls: Array<[string, unknown]> = [];
  const chain = {
    eqCalls,
    deleteSpy: vi.fn(),
    invalidateNotifications: vi.fn(),
  };
  return chain;
});

vi.mock('@/lib/cache-tags', () => ({ invalidateNotifications: mocks.invalidateNotifications }));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({ delete: mocks.deleteSpy }),
  }),
}));

const { eqCalls, deleteSpy, invalidateNotifications } = mocks;

import { removeUnreadReversible } from '@/lib/notifications/reversal';

describe('removeUnreadReversible', () => {
  beforeEach(() => {
    deleteSpy.mockReset();
    invalidateNotifications.mockReset();
    eqCalls.length = 0;
    // Build a thenable chain that records .eq() calls and resolves on await
    const chain: {
      eq: (col: string, val: unknown) => unknown;
      then: (r: (v: { error: null }) => void) => void;
    } = {
      eq: (col, val) => {
        eqCalls.push([col, val]);
        return chain;
      },
      then: (resolve) => resolve({ error: null }),
    };
    deleteSpy.mockReturnValue(chain);
  });

  it('deletes unread rows matching (user, type, ride) and invalidates cache', async () => {
    await removeUnreadReversible({
      userId: 'user-1',
      type: 'waitlist_joined',
      rideId: 'ride-1',
    });

    expect(deleteSpy).toHaveBeenCalledOnce();
    expect(eqCalls).toEqual([
      ['user_id', 'user-1'],
      ['type', 'waitlist_joined'],
      ['ride_id', 'ride-1'],
      ['is_read', false],
    ]);
    expect(invalidateNotifications).toHaveBeenCalledWith('user-1');
  });
});
