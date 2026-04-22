import type { CardState } from '@/components/rides/ride-card-parts';

export interface MockAvatar {
  full_name: string;
  avatar_url: string | null;
}

export interface MockRide {
  id: string;
  title: string;
  paceName: string;
  paceSortOrder: number;
  distanceKm: number;
  elevationM: number;
  durationMin: number;
  startLocation: string;
  startTime: string;
  countdownLabel: string;
  dayLabel: string;
  signupCount: number;
  capacity: number | null;
  waitlistPosition: number | null;
  avatars: MockAvatar[];
  state: CardState;
  weather: { condition: 'clear' | 'overcast' | 'rain'; tempC: number } | null;
  /** Normalized [x, y] coordinates in 0–100 space for the SVG polyline. */
  routeShape: [number, number][];
  isOpen: boolean;
}

const avatarsPool: MockAvatar[] = [
  { full_name: 'Maya Chen', avatar_url: null },
  { full_name: 'Jordan Smith', avatar_url: null },
  { full_name: 'Priya Okafor', avatar_url: null },
  { full_name: 'Lucas Park', avatar_url: null },
  { full_name: 'Nadia Rahman', avatar_url: null },
  { full_name: 'Sam Weiss', avatar_url: null },
  { full_name: 'Iris Laurent', avatar_url: null },
  { full_name: 'Theo Vega', avatar_url: null },
  { full_name: 'Anya Petrov', avatar_url: null },
  { full_name: 'Max Toda', avatar_url: null },
];

const humberLoop: [number, number][] = [
  [8, 78],
  [12, 64],
  [18, 52],
  [26, 44],
  [34, 36],
  [44, 30],
  [54, 28],
  [62, 32],
  [70, 40],
  [76, 50],
  [78, 62],
  [74, 72],
  [66, 80],
  [56, 84],
  [44, 86],
  [32, 84],
  [22, 82],
  [14, 80],
];

const frenchmansOutBack: [number, number][] = [
  [6, 70],
  [14, 66],
  [24, 62],
  [36, 58],
  [48, 54],
  [58, 48],
  [68, 42],
  [78, 36],
  [86, 32],
  [92, 30],
  [86, 38],
  [78, 44],
  [68, 50],
  [58, 56],
  [48, 62],
  [36, 66],
  [24, 70],
  [14, 74],
  [6, 78],
];

const scarboroughBluffs: [number, number][] = [
  [10, 82],
  [20, 74],
  [28, 62],
  [38, 50],
  [48, 40],
  [58, 32],
  [66, 28],
  [74, 32],
  [80, 42],
  [84, 54],
  [80, 66],
  [72, 74],
  [62, 78],
  [50, 76],
  [38, 72],
  [28, 74],
  [18, 78],
  [10, 82],
];

const burlingtonWaterfront: [number, number][] = [
  [4, 60],
  [14, 56],
  [26, 52],
  [38, 48],
  [50, 46],
  [62, 44],
  [74, 42],
  [84, 40],
  [92, 38],
  [84, 48],
  [74, 52],
  [62, 56],
  [50, 58],
  [38, 62],
  [26, 66],
  [14, 70],
  [4, 74],
];

const highParkCriterium: [number, number][] = [
  [28, 74],
  [22, 62],
  [22, 48],
  [28, 36],
  [40, 28],
  [54, 26],
  [66, 30],
  [74, 42],
  [74, 56],
  [68, 68],
  [58, 76],
  [44, 78],
  [32, 76],
  [28, 74],
];

const baseAvatars = avatarsPool.slice(0, 8);

export const mockRides: Record<string, MockRide> = {
  humberConfirmed: {
    id: 'mock-humber',
    title: 'Humber River Out & Back',
    paceName: 'Intermediate B',
    paceSortOrder: 3,
    distanceKm: 78.7,
    elevationM: 420,
    durationMin: 180,
    startLocation: 'High Park',
    startTime: '9:00 AM',
    countdownLabel: 'in 14 hours',
    dayLabel: 'Tomorrow',
    signupCount: 10,
    capacity: 14,
    waitlistPosition: null,
    avatars: baseAvatars,
    state: 'confirmed',
    weather: { condition: 'clear', tempC: 16 },
    routeShape: humberLoop,
    isOpen: false,
  },
  frenchmansWaitlist: {
    id: 'mock-frenchmans',
    title: "Frenchman's Bay Ride",
    paceName: 'Advanced B',
    paceSortOrder: 5,
    distanceKm: 104.1,
    elevationM: 680,
    durationMin: 240,
    startLocation: 'High Park',
    startTime: '9:00 AM',
    countdownLabel: 'in 14 hours',
    dayLabel: 'Tomorrow',
    signupCount: 7,
    capacity: 7,
    waitlistPosition: 1,
    avatars: avatarsPool.slice(2, 10),
    state: 'waitlisted',
    weather: { condition: 'clear', tempC: 14 },
    routeShape: frenchmansOutBack,
    isOpen: false,
  },
  scarboroughOpen: {
    id: 'mock-scarborough',
    title: 'Scarborough Bluffs Blast',
    paceName: 'Advanced B',
    paceSortOrder: 5,
    distanceKm: 54.6,
    elevationM: 310,
    durationMin: 130,
    startLocation: 'Woodbine Park',
    startTime: '9:00 AM',
    countdownLabel: 'Thursday',
    dayLabel: 'Thursday, April 23',
    signupCount: 4,
    capacity: 16,
    waitlistPosition: null,
    avatars: avatarsPool.slice(1, 5),
    state: 'default',
    weather: { condition: 'overcast', tempC: 12 },
    routeShape: scarboroughBluffs,
    isOpen: true,
  },
  burlingtonWeather: {
    id: 'mock-burlington',
    title: 'Burlington Waterfront Ride',
    paceName: 'Advanced B',
    paceSortOrder: 5,
    distanceKm: 78.7,
    elevationM: 240,
    durationMin: 195,
    startLocation: 'Marie Curtis Park',
    startTime: '8:30 AM',
    countdownLabel: 'Tuesday',
    dayLabel: 'Tuesday, April 21',
    signupCount: 6,
    capacity: 12,
    waitlistPosition: null,
    avatars: avatarsPool.slice(0, 6),
    state: 'weather_watch',
    weather: { condition: 'rain', tempC: 9 },
    routeShape: burlingtonWaterfront,
    isOpen: false,
  },
  highParkCrit: {
    id: 'mock-highpark',
    title: 'High Park Crit Laps',
    paceName: 'Intermediate A',
    paceSortOrder: 2,
    distanceKm: 36.2,
    elevationM: 180,
    durationMin: 85,
    startLocation: 'High Park Loop',
    startTime: '6:30 AM',
    countdownLabel: 'Friday',
    dayLabel: 'Friday, April 24',
    signupCount: 8,
    capacity: 20,
    waitlistPosition: null,
    avatars: avatarsPool.slice(3, 9),
    state: 'default',
    weather: { condition: 'clear', tempC: 11 },
    routeShape: highParkCriterium,
    isOpen: true,
  },
};

export type MockRideKey = keyof typeof mockRides;
