import { describe, it, expect } from 'vitest';
import { parseRouteUrl } from '@/lib/rides/parse-route-url';

describe('parseRouteUrl', () => {
  it('returns null for empty string', () => {
    expect(parseRouteUrl('')).toBeNull();
  });

  it('returns null for invalid URL', () => {
    expect(parseRouteUrl('not-a-url')).toBeNull();
  });

  it('returns null for unrecognized domain', () => {
    expect(parseRouteUrl('https://example.com/routes/123')).toBeNull();
  });

  // Strava routes
  it('parses strava.com/routes/{id}', () => {
    expect(parseRouteUrl('https://www.strava.com/routes/12345678')).toEqual({
      service: 'strava',
      type: 'route',
      id: '12345678',
    });
  });

  it('parses strava.com without www', () => {
    expect(parseRouteUrl('https://strava.com/routes/12345678')).toEqual({
      service: 'strava',
      type: 'route',
      id: '12345678',
    });
  });

  // Strava activities
  it('parses strava.com/activities/{id}', () => {
    expect(parseRouteUrl('https://www.strava.com/activities/99887766')).toEqual({
      service: 'strava',
      type: 'activity',
      id: '99887766',
    });
  });

  // Strava edge cases
  it('returns null for strava.com with non-numeric id', () => {
    expect(parseRouteUrl('https://strava.com/routes/abc')).toBeNull();
  });

  it('returns null for strava.com with unrecognized resource', () => {
    expect(parseRouteUrl('https://strava.com/segments/12345')).toBeNull();
  });

  it('handles strava URL with trailing slash', () => {
    expect(parseRouteUrl('https://strava.com/routes/12345/')).toEqual({
      service: 'strava',
      type: 'route',
      id: '12345',
    });
  });

  it('handles strava URL with query params', () => {
    expect(parseRouteUrl('https://strava.com/routes/12345?share=true')).toEqual({
      service: 'strava',
      type: 'route',
      id: '12345',
    });
  });

  // RideWithGPS routes
  it('parses ridewithgps.com/routes/{id}', () => {
    expect(parseRouteUrl('https://ridewithgps.com/routes/44556677')).toEqual({
      service: 'ridewithgps',
      type: 'route',
      id: '44556677',
    });
  });

  it('parses ridewithgps.com with www', () => {
    expect(parseRouteUrl('https://www.ridewithgps.com/routes/44556677')).toEqual({
      service: 'ridewithgps',
      type: 'route',
      id: '44556677',
    });
  });

  // RideWithGPS trips
  it('parses ridewithgps.com/trips/{id}', () => {
    expect(parseRouteUrl('https://ridewithgps.com/trips/11223344')).toEqual({
      service: 'ridewithgps',
      type: 'trip',
      id: '11223344',
    });
  });

  // RideWithGPS edge cases
  it('returns null for ridewithgps.com with non-numeric id', () => {
    expect(parseRouteUrl('https://ridewithgps.com/routes/abc')).toBeNull();
  });

  it('returns null for ridewithgps.com with unrecognized resource', () => {
    expect(parseRouteUrl('https://ridewithgps.com/users/12345')).toBeNull();
  });
});
