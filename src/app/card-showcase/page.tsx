'use client';

import { RideCard } from '@/components/rides/ride-card';
import { ActionBar } from '@/components/dashboard/action-bar';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { StatsGrid } from '@/components/dashboard/stats-grid';
import { LeaderLeadsSection } from '@/components/dashboard/leader-leads-section';
import { MyRidesTabs } from '@/app/(app)/my-rides/my-rides-tabs';
import { NotificationsList } from '@/app/(app)/notifications/notifications-list';
import { SeasonDatesCard } from '@/components/manage/season-dates-card';
import { MemberList } from '@/components/manage/member-list';
import { ManageRidesPanel } from '@/components/manage/manage-rides-panel';
import { AnnouncementsPanel } from '@/components/manage/announcements-panel';
import { RecurringRidesPanel } from '@/components/manage/recurring-rides-panel';
import { Bicycle, Users, CalendarDots, ChartLineUp } from '@phosphor-icons/react';
import type { RideWithDetails } from '@/types/database';
import type { Notification } from '@/components/notifications/notification-item';

// ─── Mock Data ──────────────────────────────────────────────────────────────

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowISO = tomorrow.toISOString().split('T')[0];

const nextWeek = new Date();
nextWeek.setDate(nextWeek.getDate() + 7);
const nextWeekISO = nextWeek.toISOString().split('T')[0];

const lastWeek = new Date();
lastWeek.setDate(lastWeek.getDate() - 7);
const lastWeekISO = lastWeek.toISOString().split('T')[0];

const mockRide: RideWithDetails = {
  id: 'ride-1',
  club_id: 'club-1',
  created_by: 'user-1',
  title: 'Saturday Morning Social',
  description: 'A relaxed group ride through the river valley.',
  ride_date: tomorrowISO,
  start_time: '07:30:00',
  end_time: '10:00:00',
  meeting_location_id: 'loc-1',
  pace_group_id: 'pg-1',
  distance_km: 65,
  elevation_m: 420,
  capacity: 20,
  route_url: null,
  route_name: null,
  is_drop_ride: false,
  organiser_notes: null,
  status: 'scheduled',
  cancellation_reason: null,
  template_id: 'tmpl-1',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  meeting_location: {
    id: 'loc-1',
    club_id: 'club-1',
    name: 'Britannia Park',
    address: '2985 Carling Ave',
    latitude: null,
    longitude: null,
    notes: null,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  pace_group: {
    id: 'pg-1',
    club_id: 'club-1',
    name: 'B Group (28–32 km/h)',
    moving_pace_min: 28,
    moving_pace_max: 32,
    strava_pace_min: null,
    strava_pace_max: null,
    typical_distance_min: 50,
    typical_distance_max: 80,
    is_drop_ride: false,
    sort_order: 2,
    created_at: '2026-01-01T00:00:00Z',
  },
  tags: [
    { id: 'tag-1', club_id: 'club-1', name: 'Social', color: '#22c55e', sort_order: 1 },
    { id: 'tag-2', club_id: 'club-1', name: 'No-Drop', color: '#3b82f6', sort_order: 2 },
  ],
  signup_count: 14,
  creator: { id: 'user-1', full_name: 'Alex Johnson', display_name: null, avatar_url: null },
};

const mockWeatherRide: RideWithDetails = {
  ...mockRide,
  id: 'ride-weather',
  title: 'Wednesday Hammer Fest',
  status: 'weather_watch',
  ride_date: nextWeekISO,
  start_time: '18:00:00',
  distance_km: 45,
  elevation_m: 280,
  capacity: 15,
  signup_count: 12,
  is_drop_ride: true,
  pace_group: {
    ...mockRide.pace_group!,
    id: 'pg-2',
    name: 'A Group (32+ km/h)',
    is_drop_ride: true,
  },
  tags: [{ id: 'tag-3', club_id: 'club-1', name: 'Competitive', color: '#ef4444', sort_order: 3 }],
};

const mockUserRides = {
  upcoming: [
    {
      id: 'ride-1',
      title: 'Saturday Morning Social',
      ride_date: tomorrowISO,
      start_time: '07:30:00',
      pace_group_name: 'B Group (28–32 km/h)',
      meeting_location_name: 'Britannia Park',
      distance_km: 65,
      signup_count: 14,
      capacity: 20,
      signed_up_at: '2026-03-15T10:00:00Z',
      waitlist_position: null,
    },
    {
      id: 'ride-2',
      title: 'Sunday Recovery Spin',
      ride_date: nextWeekISO,
      start_time: '09:00:00',
      pace_group_name: 'C Group (24–28 km/h)',
      meeting_location_name: "Mooney's Bay",
      distance_km: 40,
      signup_count: 8,
      capacity: 12,
      signed_up_at: '2026-03-16T10:00:00Z',
      waitlist_position: null,
    },
  ],
  past: [
    {
      id: 'ride-past',
      title: 'Friday Coffee Ride',
      ride_date: lastWeekISO,
      start_time: '06:30:00',
      pace_group_name: 'B Group',
      meeting_location_name: "Dow's Lake",
      distance_km: 35,
      signup_count: 10,
      capacity: 15,
      signed_up_at: '2026-03-10T08:00:00Z',
      waitlist_position: null,
    },
  ],
  waitlisted: [
    {
      id: 'ride-wait',
      title: 'Wednesday Hammer Fest',
      ride_date: nextWeekISO,
      start_time: '18:00:00',
      pace_group_name: 'A Group (32+ km/h)',
      meeting_location_name: 'Britannia Park',
      distance_km: 45,
      signup_count: 15,
      capacity: 15,
      signed_up_at: '2026-03-18T12:00:00Z',
      waitlist_position: 2,
    },
  ],
};

const mockNotifications: Notification[] = [
  {
    id: 'n-1',
    type: 'signup_confirmed',
    title: "You're signed up for Saturday Morning Social",
    body: "You're confirmed for the ride on Saturday. See you at Britannia Park at 7:30 AM.",
    ride_id: 'ride-1',
    is_read: false,
    sent_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'n-2',
    type: 'weather_watch',
    title: 'Weather watch for Wednesday Hammer Fest',
    body: 'Rain is forecast. The ride leader will update by 4 PM.',
    ride_id: 'ride-weather',
    is_read: false,
    sent_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: 'n-3',
    type: 'announcement',
    title: 'Season opener BBQ — April 5',
    body: "Join us for the annual kickoff at Mooney's Bay. Bikes and burgers!",
    ride_id: null,
    is_read: true,
    sent_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'n-4',
    type: 'waitlist_promoted',
    title: "You've been promoted from the waitlist!",
    body: "A spot opened up on Sunday Recovery Spin. You're now confirmed.",
    ride_id: 'ride-2',
    is_read: true,
    sent_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

const mockMembers = [
  {
    user_id: 'user-1',
    full_name: 'Alex Johnson',
    display_name: null,
    email: 'alex@example.com',
    avatar_url: null,
    preferred_pace_group: 'B Group',
    role: 'admin',
    status: 'active',
    joined_at: '2025-04-01T00:00:00Z',
  },
  {
    user_id: 'user-2',
    full_name: 'Sam Rivera',
    display_name: 'Sammy',
    email: 'sam@example.com',
    avatar_url: null,
    preferred_pace_group: 'A Group',
    role: 'ride_leader',
    status: 'active',
    joined_at: '2025-06-15T00:00:00Z',
  },
  {
    user_id: 'user-3',
    full_name: 'Jordan Chen',
    display_name: null,
    email: 'jordan@example.com',
    avatar_url: null,
    preferred_pace_group: 'C Group',
    role: 'rider',
    status: 'pending',
    joined_at: '2026-03-18T00:00:00Z',
  },
  {
    user_id: 'user-4',
    full_name: 'Taylor Kim',
    display_name: null,
    email: 'taylor@example.com',
    avatar_url: null,
    preferred_pace_group: null,
    role: 'rider',
    status: 'inactive',
    joined_at: '2025-02-01T00:00:00Z',
  },
];

const mockManageRides = [
  {
    id: 'ride-1',
    title: 'Saturday Morning Social',
    ride_date: tomorrowISO,
    start_time: '07:30:00',
    status: 'scheduled',
    capacity: 20,
    distance_km: 65,
    template_id: 'tmpl-1',
    meeting_location_name: 'Britannia Park',
    pace_group_id: 'pg-1',
    pace_group_name: 'B Group',
    tags: [{ id: 'tag-1', name: 'Social', color: '#22c55e' }],
    signup_count: 14,
    created_by_name: 'Alex Johnson',
  },
  {
    id: 'ride-weather',
    title: 'Wednesday Hammer Fest',
    ride_date: nextWeekISO,
    start_time: '18:00:00',
    status: 'weather_watch',
    capacity: 15,
    distance_km: 45,
    template_id: null,
    meeting_location_name: 'Britannia Park',
    pace_group_id: 'pg-2',
    pace_group_name: 'A Group',
    tags: [{ id: 'tag-3', name: 'Competitive', color: '#ef4444' }],
    signup_count: 12,
    created_by_name: 'Sam Rivera',
  },
  {
    id: 'ride-cancelled',
    title: 'Cancelled: Thursday Night Crit',
    ride_date: lastWeekISO,
    start_time: '19:00:00',
    status: 'cancelled',
    capacity: 25,
    distance_km: 30,
    template_id: null,
    meeting_location_name: 'Velodrome',
    pace_group_id: null,
    pace_group_name: null,
    tags: [],
    signup_count: 0,
    created_by_name: 'Alex Johnson',
  },
];

const mockAnnouncements = [
  {
    id: 'ann-1',
    title: 'Season Opener BBQ — April 5',
    body: "Join us for the annual kickoff at Mooney's Bay pavilion. Bikes optional, burgers mandatory. Families welcome! We'll have a short club update at 1 PM followed by food and drinks.",
    is_pinned: true,
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    created_by_name: 'Alex Johnson',
  },
  {
    id: 'ann-2',
    title: 'New kit order — deadline March 30',
    body: 'The new club kit design is finalized. Place your order by March 30 to guarantee sizing. Payment via e-transfer.',
    is_pinned: false,
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    created_by_name: 'Sam Rivera',
  },
];

const mockRecurringRides = [
  {
    id: 'rc-1',
    title: 'Saturday Morning Social',
    description: null,
    day_of_week: 6,
    start_time: '07:30:00',
    is_drop_ride: false,
    is_active: true,
    recurrence: 'weekly',
    season_start_date: '2026-04-01',
    season_end_date: '2026-10-31',
    default_distance_km: 65,
    default_capacity: 20,
    meeting_location_name: 'Britannia Park',
    pace_group_name: 'B Group',
  },
  {
    id: 'rc-2',
    title: 'Wednesday Hammer Fest',
    description: null,
    day_of_week: 3,
    start_time: '18:00:00',
    is_drop_ride: true,
    is_active: false,
    recurrence: 'weekly',
    season_start_date: '2026-05-01',
    season_end_date: '2026-09-30',
    default_distance_km: 45,
    default_capacity: 15,
    meeting_location_name: 'Britannia Park',
    pace_group_name: 'A Group',
  },
];

const mockPaceGroups = [
  { id: 'pg-1', name: 'B Group (28–32 km/h)' },
  { id: 'pg-2', name: 'A Group (32+ km/h)' },
  { id: 'pg-3', name: 'C Group (24–28 km/h)' },
];

const mockLocations = [
  { id: 'loc-1', name: 'Britannia Park' },
  { id: 'loc-2', name: "Mooney's Bay" },
];

const mockTags = [
  { id: 'tag-1', name: 'Social', color: '#22c55e' },
  { id: 'tag-2', name: 'No-Drop', color: '#3b82f6' },
  { id: 'tag-3', name: 'Competitive', color: '#ef4444' },
];

// ─── Showcase Page ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold text-foreground mb-4 pb-2 border-b border-border">
        {title}
      </h2>
      <div className="max-w-md">{children}</div>
    </section>
  );
}

export default function CardShowcasePage() {
  return (
    <div className="p-6 pb-24">
      <h1 className="text-4xl font-bold text-foreground mb-2">Card Audit</h1>
      <p className="text-base text-muted-foreground mb-10">
        Every card component in the Draftr app, rendered with mock data.
      </p>

      {/* 1. Ride Card */}
      <Section title="1. Ride Card">
        <RideCard ride={mockRide} />
        <RideCard ride={mockWeatherRide} />
      </Section>

      {/* 2. Action Bar */}
      <Section title="2. Action Bar">
        <ActionBar
          nextSignup={{
            id: 'ride-1',
            title: 'Saturday Morning Social',
            ride_date: tomorrowISO,
            start_time: '07:30:00',
            meeting_location_name: 'Britannia Park',
            pace_group_name: 'B Group',
            signup_count: 14,
            capacity: 20,
          }}
          nextLedRide={{
            id: 'ride-2',
            title: 'Sunday Recovery Spin',
            ride_date: nextWeekISO,
            start_time: '09:00:00',
            meeting_location_name: "Mooney's Bay",
            signup_count: 8,
            capacity: 12,
          }}
          nextWaitlistedRide={{
            id: 'ride-wait',
            title: 'Wednesday Hammer Fest',
            ride_date: nextWeekISO,
            start_time: '18:00:00',
            meeting_location_name: 'Britannia Park',
            waitlist_position: 2,
          }}
          weatherWatchRide={{
            id: 'ride-weather',
            title: 'Wednesday Hammer Fest',
            ride_date: nextWeekISO,
            start_time: '18:00:00',
          }}
          pendingMemberCount={3}
          ridesNeedingLeaderCount={2}
          userRole="admin"
        />
      </Section>

      {/* 3. Quick Actions */}
      <Section title="3. Quick Actions">
        <QuickActions role="admin" />
      </Section>

      {/* 4. Stats Grid */}
      <Section title="4. Stats Grid">
        <div className="max-w-none">
          <StatsGrid
            stats={[
              { label: 'Total Rides', value: 142, icon: Bicycle },
              { label: 'Active Members', value: 38, icon: Users },
              { label: 'Signups This Week', value: 27, icon: CalendarDots },
              { label: 'Avg Distance', value: 52.4, suffix: ' km', decimals: 1, icon: ChartLineUp },
            ]}
          />
        </div>
      </Section>

      {/* 5. Leader Leads Section */}
      <Section title="5. Leader Leads Section">
        <LeaderLeadsSection
          leads={[
            {
              id: 'ride-1',
              title: 'Saturday Morning Social',
              ride_date: tomorrowISO,
              start_time: '07:30',
              signup_count: 14,
              capacity: 20,
              pace_group: 'B Group',
              location: 'Britannia Park',
            },
            {
              id: 'ride-2',
              title: 'Sunday Recovery Spin',
              ride_date: nextWeekISO,
              start_time: '09:00',
              signup_count: 8,
              capacity: 12,
              pace_group: 'C Group',
              location: "Mooney's Bay",
            },
          ]}
        />
      </Section>

      {/* 6. My Rides Tabs */}
      <Section title="6. My Rides Tabs">
        <MyRidesTabs
          upcoming={mockUserRides.upcoming}
          past={mockUserRides.past}
          waitlisted={mockUserRides.waitlisted}
        />
      </Section>

      {/* 7. Notifications List */}
      <Section title="7. Notifications List">
        <NotificationsList
          notifications={mockNotifications}
          heading="Notifications"
          markAllReadLabel="Mark all read"
          emptyTitle="All caught up"
          emptyDescription="No notifications yet"
        />
      </Section>

      {/* 8. Season Dates Card */}
      <Section title="8. Season Dates Card">
        <SeasonDatesCard clubId="club-1" seasonStart="2026-04-01" seasonEnd="2026-10-31" />
      </Section>

      {/* 9. Member List */}
      <Section title="9. Member List">
        <div className="max-w-none">
          <MemberList members={mockMembers} clubId="club-1" currentUserId="user-1" />
        </div>
      </Section>

      {/* 10. Manage Rides Panel */}
      <Section title="10. Manage Rides Panel">
        <ManageRidesPanel rides={mockManageRides} paceGroups={mockPaceGroups} tags={mockTags} />
      </Section>

      {/* 11. Announcements Panel */}
      <Section title="11. Announcements Panel">
        <AnnouncementsPanel announcements={mockAnnouncements} clubId="club-1" />
      </Section>

      {/* 12. Recurring Rides Panel */}
      <Section title="12. Recurring Rides Panel">
        <RecurringRidesPanel
          recurringRides={mockRecurringRides}
          clubId="club-1"
          meetingLocations={mockLocations}
          paceGroups={mockPaceGroups}
        />
      </Section>
    </div>
  );
}
