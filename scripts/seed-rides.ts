/**
 * Seed script: generate realistic ride data for development/testing.
 * Wipes existing rides and regenerates ~60 rides with varied temporal
 * distribution, signups, comments, and reactions.
 *
 * Usage: npx tsx scripts/seed-rides.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('✗ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: readonly T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(1));
}

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 60 * 60 * 1000);
}

function daysAgo(d: number): Date {
  return new Date(Date.now() - d * 24 * 60 * 60 * 1000);
}

// ─── Content ─────────────────────────────────────────────────────────────────

const RIDE_TITLES = [
  'Morning Espresso Loop',
  'Lakeshore Sunrise Ride',
  'Don Valley Classic',
  'Saturday Social Spin',
  'Humber River Out & Back',
  'Rouge Valley Ramble',
  'Scarborough Bluffs Blast',
  'Etobicoke Creek Roll',
  'Highland Creek Hustle',
  'Credit River Cruise',
  'Caledon Hills Crusher',
  'Halton Hills Gran Fondo',
  'Bronte Creek Loop',
  'Burlington Waterfront Ride',
  'Oakville Evening Hammerfest',
  'Port Credit Sunset Spin',
  'Queensway Criterium Sim',
  'Leslie Spit Recon',
  'Tommy Thompson Loop',
  'Bayview Brevet Prep',
  'Brimley Hill Repeats',
  'Lawrence Park Tempo',
  'Thornhill Tuesday Ride',
  'North York Chain Gang',
  'Richmond Hill Roaster',
  'Markham Morning Blast',
  'Whitby Waterfront Cruise',
  'Oshawa Distance Day',
  'Ajax to Pickering Loop',
  "Frenchman's Bay Ride",
  'Cobourg Coastal Classic',
  'Port Hope Hill Climb',
  'Barrie Base Miles',
  'Newmarket Intervals',
  'Aurora Dawn Patrol',
  'King City Kicker',
  'Nobleton Nightmare',
  'Peel Loop Recovery',
  'Speed River Circuit',
  'Mono Hills Mashup',
  'Dundas Valley Descent',
  'Hamilton Harbour Loop',
];

const START_LOCATIONS: Array<{
  name: string;
  address: string;
  lat: number;
  lng: number;
}> = [
  {
    name: 'High Park',
    address: '1873 Bloor St W, Toronto, ON',
    lat: 43.6465,
    lng: -79.4637,
  },
  {
    name: 'Evergreen Brick Works',
    address: '550 Bayview Ave, Toronto, ON',
    lat: 43.6853,
    lng: -79.359,
  },
  {
    name: 'Tommy Thompson Park',
    address: '1 Leslie St, Toronto, ON',
    lat: 43.6285,
    lng: -79.3363,
  },
  {
    name: 'Humber Bay Park East',
    address: '100 Humber Bay Park Rd E, Toronto, ON',
    lat: 43.6246,
    lng: -79.4695,
  },
  {
    name: 'Woodbine Beach',
    address: '1675 Lake Shore Blvd E, Toronto, ON',
    lat: 43.6595,
    lng: -79.3114,
  },
  {
    name: 'Sunnybrook Park',
    address: '1132 Leslie St, Toronto, ON',
    lat: 43.7201,
    lng: -79.3509,
  },
  {
    name: 'Cherry Beach',
    address: '1 Cherry St, Toronto, ON',
    lat: 43.638,
    lng: -79.3508,
  },
  {
    name: 'Ontario Place',
    address: '955 Lake Shore Blvd W, Toronto, ON',
    lat: 43.6283,
    lng: -79.4163,
  },
  {
    name: 'Earl Bales Park',
    address: '4169 Bathurst St, Toronto, ON',
    lat: 43.7558,
    lng: -79.4311,
  },
  {
    name: 'Centennial Park',
    address: '256 Centennial Park Rd, Etobicoke, ON',
    lat: 43.6454,
    lng: -79.5801,
  },
];

const START_TIMES = ['06:30:00', '07:00:00', '07:30:00', '08:00:00', '08:30:00', '09:00:00'];

const END_TIMES = ['09:30:00', '10:00:00', '10:30:00', '11:00:00', '11:30:00', '12:00:00'];

const COMMENTS = [
  'Great legs everyone — see you next week!',
  'That headwind on the return was brutal.',
  'Perfect conditions this morning.',
  "Who's bringing the coffee next time?",
  'Solid pace. Legs are toast.',
  'Really enjoyed the new route section.',
  'Thanks for the lead today — smooth pacing.',
  'The climb at km 38 nearly broke me.',
  'Good one today folks. Proper suffering.',
  'Legs felt surprisingly fresh.',
  'The regroup at the top was appreciated!',
  "Best ride of the month. Let's do it again.",
  'Thanks for waiting at the lights — great group.',
  'Weather held up perfectly.',
  'That last 10 km was a slog into the wind.',
  'Perfect amount of climbing today.',
  'Strava says 38 avg — not bad for that route.',
  'See you all Saturday for the longer one.',
];

// Seed route URLs — realistic RideWithGPS and Strava route URLs for variety
const ROUTE_URLS = [
  'https://ridewithgps.com/routes/47823610',
  'https://ridewithgps.com/routes/51204733',
  'https://ridewithgps.com/routes/38901254',
  'https://ridewithgps.com/routes/62847193',
  'https://ridewithgps.com/routes/44502817',
  'https://ridewithgps.com/routes/58137092',
  'https://ridewithgps.com/routes/71203845',
  'https://ridewithgps.com/routes/29408561',
  'https://www.strava.com/routes/3087654210',
  'https://www.strava.com/routes/2974501836',
  'https://www.strava.com/routes/3152076489',
  'https://www.strava.com/routes/2841309672',
  'https://www.strava.com/routes/3204817365',
  'https://www.strava.com/routes/2963045781',
];

const ROUTE_NAMES = [
  'Don Valley Loop',
  'Lakeshore Classic',
  'Humber River Out-and-Back',
  'Highland Creek Route',
  'Credit River Classic',
  'Caledon Hills Loop',
  'Burlington Waterfront',
  'Scarborough Bluffs Route',
  'North York Spin',
  'Tommy Thompson Circuit',
  'Leslie Spit Loop',
  'Bayview Corridor',
  'Etobicoke Creek Route',
  'Rouge Valley Classic',
];

const CANCELLATION_REASONS = [
  'Heavy rain forecast for the morning — safety first.',
  'Strong winds and thunderstorm warning issued. Rescheduling next week.',
  'Ice on roads reported along the route. Cancelled for safety.',
  'Ride leader unavailable due to illness. See you next week.',
  'Air quality advisory in effect. Ride postponed.',
  'Severe weather warning in effect. Stay safe.',
];

const REACTION_TYPES = ['thumbs_up', 'fire', 'heart', 'cycling'] as const;

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Draftr Ride Seeder\n');

  // 1. Fetch club
  const { data: clubs, error: clubErr } = await supabase.from('clubs').select('id, name').limit(1);

  if (clubErr || !clubs?.length) {
    console.error('✗ No clubs found. Run initial migration first.');
    process.exit(1);
  }
  const clubId = clubs[0].id;
  console.log(`✓ Club: ${clubs[0].name} (${clubId})`);

  // 2. Fetch ride leaders / admins
  const { data: leaderMemberships, error: leaderErr } = await supabase
    .from('club_memberships')
    .select('user_id, role, users(full_name)')
    .eq('club_id', clubId)
    .in('role', ['ride_leader', 'admin'])
    .eq('status', 'active');

  if (leaderErr || !leaderMemberships?.length) {
    console.error('✗ No ride leaders or admins found. Seed users first.');
    process.exit(1);
  }

  type LeaderMembership = {
    user_id: string;
    role: string;
    users: { full_name: string }[] | { full_name: string } | null;
  };

  const leaders = (leaderMemberships as unknown as LeaderMembership[]).map((m) => {
    const user = Array.isArray(m.users) ? m.users[0] : m.users;
    return {
      id: m.user_id,
      name: user?.full_name ?? 'Unknown',
      role: m.role,
    };
  });

  console.log(`✓ Leaders: ${leaders.length} found`);
  leaders.forEach((l) => console.log(`    - ${l.name} (${l.role})`));

  // 3. Fetch all active members for signup variety
  const { data: allMemberships, error: allMemberErr } = await supabase
    .from('club_memberships')
    .select('user_id')
    .eq('club_id', clubId)
    .eq('status', 'active');

  if (allMemberErr || !allMemberships?.length) {
    console.error('✗ No active members found.');
    process.exit(1);
  }

  type AllMembership = { user_id: string };
  const allUserIds = (allMemberships as AllMembership[]).map((m) => m.user_id);
  console.log(`✓ Members: ${allUserIds.length} active`);

  // 4. Fetch pace groups
  const { data: paceGroups, error: paceErr } = await supabase
    .from('pace_groups')
    .select('id, name')
    .eq('club_id', clubId)
    .order('sort_order');

  if (paceErr || !paceGroups?.length) {
    console.error('✗ No pace groups found. Seed pace groups first.');
    process.exit(1);
  }
  type PaceGroup = { id: string; name: string };
  console.log(`✓ Pace groups: ${(paceGroups as PaceGroup[]).map((p) => p.name).join(', ')}`);

  // 5. Wipe existing rides (signups, comments, reactions cascade via FK)
  const { count: deletedCount, error: deleteErr } = await supabase
    .from('rides')
    .delete({ count: 'exact' })
    .eq('club_id', clubId);

  if (deleteErr) {
    console.error('✗ Delete failed:', deleteErr.message);
    process.exit(1);
  }
  console.log(
    `\n✓ Cleanup: deleted ${deletedCount ?? 0} existing rides (+ cascaded signups, comments, reactions)\n`,
  );

  // ─── Build ride definitions ───────────────────────────────────────────────

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  type RideDef = {
    club_id: string;
    created_by: string;
    title: string;
    description: null;
    ride_date: string;
    start_time: string;
    end_time: string;
    pace_group_id: string;
    distance_km: number;
    elevation_m: number;
    capacity: number | null;
    route_url: string;
    route_name: string;
    is_drop_ride: boolean;
    status: 'scheduled' | 'weather_watch' | 'completed' | 'cancelled';
    cancellation_reason?: string;
    start_location_name: string;
    start_location_address: string;
    start_latitude: number;
    start_longitude: number;
  };

  const rideDefs: RideDef[] = [];

  // Past — completed (20 rides, spread across last 90 days)
  for (let i = 0; i < 20; i++) {
    const loc = pick(START_LOCATIONS);
    rideDefs.push({
      club_id: clubId,
      created_by: pick(leaders).id,
      title: pick(RIDE_TITLES),
      description: null,
      ride_date: formatDate(addDays(today, -randInt(2, 90))),
      start_time: pick(START_TIMES),
      end_time: pick(END_TIMES),
      pace_group_id: pick(paceGroups).id,
      distance_km: randFloat(30, 125),
      elevation_m: randInt(100, 1500),
      capacity: pick([null, null, 12, 15, 20, 25]),
      route_url: pick(ROUTE_URLS),
      route_name: pick(ROUTE_NAMES),
      is_drop_ride: Math.random() < 0.2,
      status: 'completed',
      start_location_name: loc.name,
      start_location_address: loc.address,
      start_latitude: loc.lat,
      start_longitude: loc.lng,
    });
  }

  // Past — cancelled (5 rides)
  for (let i = 0; i < 5; i++) {
    const loc = pick(START_LOCATIONS);
    rideDefs.push({
      club_id: clubId,
      created_by: pick(leaders).id,
      title: pick(RIDE_TITLES),
      description: null,
      ride_date: formatDate(addDays(today, -randInt(3, 80))),
      start_time: pick(START_TIMES),
      end_time: pick(END_TIMES),
      pace_group_id: pick(paceGroups).id,
      distance_km: randFloat(40, 100),
      elevation_m: randInt(100, 1000),
      capacity: pick([null, 12, 15, 20]),
      route_url: pick(ROUTE_URLS),
      route_name: pick(ROUTE_NAMES),
      is_drop_ride: false,
      status: 'cancelled',
      cancellation_reason: pick(CANCELLATION_REASONS),
      start_location_name: loc.name,
      start_location_address: loc.address,
      start_latitude: loc.lat,
      start_longitude: loc.lng,
    });
  }

  // In-progress (2 rides — today, start time already passed, end time still ahead)
  const currentHour = now.getHours();
  const inProgressStartHours = [Math.max(currentHour - 2, 5), Math.max(currentHour - 3, 5)];
  const inProgressEndHours = [currentHour + 1, currentHour + 2];

  for (let i = 0; i < 2; i++) {
    const loc = pick(START_LOCATIONS);
    const startH = inProgressStartHours[i];
    const endH = inProgressEndHours[i];
    rideDefs.push({
      club_id: clubId,
      created_by: pick(leaders).id,
      title: pick(RIDE_TITLES),
      description: null,
      ride_date: formatDate(today),
      start_time: `${String(startH).padStart(2, '0')}:${i === 0 ? '00' : '30'}:00`,
      end_time: `${String(endH).padStart(2, '0')}:${i === 0 ? '30' : '00'}:00`,
      pace_group_id: pick(paceGroups).id,
      distance_km: randFloat(40, 90),
      elevation_m: randInt(200, 900),
      capacity: pick([null, 15, 20]),
      route_url: pick(ROUTE_URLS),
      route_name: pick(ROUTE_NAMES),
      is_drop_ride: i === 1,
      status: 'scheduled',
      start_location_name: loc.name,
      start_location_address: loc.address,
      start_latitude: loc.lat,
      start_longitude: loc.lng,
    });
  }

  // Future (21 rides — tomorrow through ~6 weeks out, varied spacing)
  const futureDays = [1, 2, 3, 4, 5, 7, 8, 9, 10, 12, 14, 16, 18, 21, 23, 25, 28, 30, 35, 40, 42];
  for (const daysAhead of futureDays) {
    const loc = pick(START_LOCATIONS);
    rideDefs.push({
      club_id: clubId,
      created_by: pick(leaders).id,
      title: pick(RIDE_TITLES),
      description: null,
      ride_date: formatDate(addDays(today, daysAhead)),
      start_time: pick(START_TIMES),
      end_time: pick(END_TIMES),
      pace_group_id: pick(paceGroups).id,
      distance_km: randFloat(25, 135),
      elevation_m: randInt(80, 1600),
      capacity: pick([null, null, 12, 15, 20, 25]),
      route_url: pick(ROUTE_URLS),
      route_name: pick(ROUTE_NAMES),
      is_drop_ride: Math.random() < 0.15,
      status: pick(['scheduled', 'scheduled', 'scheduled', 'weather_watch']),
      start_location_name: loc.name,
      start_location_address: loc.address,
      start_latitude: loc.lat,
      start_longitude: loc.lng,
    });
  }

  // Insert rides
  const { data: insertedRides, error: insertErr } = await supabase
    .from('rides')
    .insert(rideDefs)
    .select('id, status, ride_date, capacity, created_by');

  if (insertErr || !insertedRides) {
    console.error('✗ Failed to insert rides:', insertErr?.message);
    process.exit(1);
  }

  const rideCount = insertedRides.length;
  console.log(`✓ Seeding: inserted ${rideCount} rides`);

  // ─── Signups, comments, reactions ────────────────────────────────────────

  type SignupRow = {
    ride_id: string;
    user_id: string;
    status: string;
    signed_up_at: string;
    checked_in_at?: string;
    cancelled_at?: string;
  };

  type CommentRow = {
    ride_id: string;
    user_id: string;
    body: string;
    created_at: string;
    updated_at: string;
  };

  type ReactionRow = {
    ride_id: string;
    user_id: string;
    reaction: string;
    created_at: string;
  };

  const signups: SignupRow[] = [];
  const comments: CommentRow[] = [];
  const reactions: ReactionRow[] = [];

  for (const ride of insertedRides) {
    const rideDate = new Date(ride.ride_date + 'T00:00:00');
    const isPast = rideDate < today;
    const isToday = rideDate.getTime() === today.getTime();
    const isFuture = rideDate > today;
    const isCompleted = ride.status === 'completed';
    const isCancelled = ride.status === 'cancelled';
    const capacity: number | null = ride.capacity;

    if (isPast && (isCompleted || isCancelled)) {
      const targetCount = isCompleted
        ? randInt(6, Math.min(18, allUserIds.length))
        : randInt(3, Math.min(10, allUserIds.length));
      const riders = pickN(allUserIds, targetCount);

      let confirmedSlots = 0;

      for (const userId of riders) {
        const signedUpAt = addDays(rideDate, -randInt(1, 12));

        if (isCancelled) {
          signups.push({
            ride_id: ride.id,
            user_id: userId,
            status: 'cancelled',
            signed_up_at: signedUpAt.toISOString(),
            cancelled_at: rideDate.toISOString(),
          });
          continue;
        }

        // Completed ride — realistic mix
        const rand = Math.random();
        if (rand < 0.08) {
          // No-show / late cancel
          signups.push({
            ride_id: ride.id,
            user_id: userId,
            status: 'cancelled',
            signed_up_at: signedUpAt.toISOString(),
            cancelled_at: addDays(rideDate, -randInt(0, 2)).toISOString(),
          });
        } else if (capacity && confirmedSlots >= capacity) {
          signups.push({
            ride_id: ride.id,
            user_id: userId,
            status: 'waitlisted',
            signed_up_at: signedUpAt.toISOString(),
          });
        } else {
          const status = Math.random() < 0.75 ? 'checked_in' : 'confirmed';
          const row: SignupRow = {
            ride_id: ride.id,
            user_id: userId,
            status,
            signed_up_at: signedUpAt.toISOString(),
          };
          if (status === 'checked_in') {
            row.checked_in_at = rideDate.toISOString();
          }
          signups.push(row);
          confirmedSlots++;
        }
      }

      // Comments on completed rides (~70% of rides get some)
      if (isCompleted && Math.random() < 0.7) {
        const commenters = pickN(riders, randInt(1, 4));
        for (const userId of commenters) {
          const ts = new Date(rideDate.getTime() + randInt(1, 8) * 3600 * 1000);
          comments.push({
            ride_id: ride.id,
            user_id: userId,
            body: pick(COMMENTS),
            created_at: ts.toISOString(),
            updated_at: ts.toISOString(),
          });
        }
      }

      // Reactions on completed rides (~60% of rides)
      if (isCompleted && Math.random() < 0.6) {
        const reactors = pickN(riders, randInt(2, 8));
        const used = new Set<string>();
        for (const userId of reactors) {
          const reaction = pick(REACTION_TYPES);
          const key = `${ride.id}:${userId}:${reaction}`;
          if (used.has(key)) continue;
          used.add(key);
          const ts = new Date(rideDate.getTime() + randInt(1, 48) * 3600 * 1000);
          reactions.push({
            ride_id: ride.id,
            user_id: userId,
            reaction,
            created_at: ts.toISOString(),
          });
        }
      }
    } else if (isToday) {
      // In-progress rides — mostly checked_in
      const riders = pickN(allUserIds, randInt(8, Math.min(18, allUserIds.length)));
      for (const userId of riders) {
        const signedUpAt = daysAgo(randInt(1, 7));
        const checkedIn = Math.random() < 0.65;
        const row: SignupRow = {
          ride_id: ride.id,
          user_id: userId,
          status: checkedIn ? 'checked_in' : 'confirmed',
          signed_up_at: signedUpAt.toISOString(),
        };
        if (checkedIn) {
          row.checked_in_at = hoursAgo(randInt(1, 3)).toISOString();
        }
        signups.push(row);
      }
    } else if (isFuture) {
      // Future rides — partial signups, some with waitlist
      const cap = capacity ?? 999;
      const wantSignups = capacity
        ? randInt(Math.floor(capacity * 0.4), Math.floor(capacity * 1.25))
        : randInt(2, 12);
      const riders = pickN(allUserIds, Math.min(wantSignups, allUserIds.length));

      let confirmedSlots = 0;
      for (const userId of riders) {
        const signedUpAt = new Date(Date.now() - randInt(0, 5) * 24 * 60 * 60 * 1000);
        const isWaitlisted = confirmedSlots >= cap;
        signups.push({
          ride_id: ride.id,
          user_id: userId,
          status: isWaitlisted ? 'waitlisted' : 'confirmed',
          signed_up_at: signedUpAt.toISOString(),
        });
        if (!isWaitlisted) confirmedSlots++;
      }
    }
  }

  // Insert signups
  if (signups.length > 0) {
    const { error: signupErr } = await supabase.from('ride_signups').insert(signups);
    if (signupErr) {
      console.error('✗ Signup insert failed:', signupErr.message);
    } else {
      console.log(`✓ Signups:   ${signups.length} inserted`);
    }
  }

  // Insert comments
  if (comments.length > 0) {
    const { error: commentErr } = await supabase.from('ride_comments').insert(comments);
    if (commentErr) {
      console.error('✗ Comment insert failed:', commentErr.message);
    } else {
      console.log(`✓ Comments:  ${comments.length} inserted`);
    }
  }

  // Insert reactions
  if (reactions.length > 0) {
    const { error: reactionErr } = await supabase.from('ride_reactions').insert(reactions);
    if (reactionErr) {
      console.error('✗ Reaction insert failed:', reactionErr.message);
    } else {
      console.log(`✓ Reactions: ${reactions.length} inserted`);
    }
  }

  // ─── Summary ─────────────────────────────────────────────────────────────

  type InsertedRide = {
    id: string;
    status: string;
    ride_date: string;
    capacity: number | null;
    created_by: string;
  };

  const typedRides = insertedRides as InsertedRide[];
  const completed = typedRides.filter((r) => r.status === 'completed').length;
  const cancelled = typedRides.filter((r) => r.status === 'cancelled').length;
  const todayRides = typedRides.filter(
    (r) => new Date(r.ride_date + 'T00:00:00').getTime() === today.getTime(),
  ).length;
  const future = typedRides.filter((r) => new Date(r.ride_date + 'T00:00:00') > today).length;

  console.log('\n─── Summary ────────────────────────────────────────────────');
  console.log(`  Past completed:  ${completed}`);
  console.log(`  Past cancelled:  ${cancelled}`);
  console.log(`  In-progress:     ${todayRides}`);
  console.log(`  Future:          ${future}`);
  console.log(`  Total rides:     ${rideCount}`);
  console.log(`  Total signups:   ${signups.length}`);
  console.log(`  Total comments:  ${comments.length}`);
  console.log(`  Total reactions: ${reactions.length}`);
  console.log('────────────────────────────────────────────────────────────');
  console.log('✓ Done\n');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
