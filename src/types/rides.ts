export interface MeetingLocation {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface RideFormInitialData {
  title: string;
  description: string;
  ride_date: string;
  start_time: string;
  pace_group_id: string;
  distance_km: string;
  elevation_m: string;
  capacity: string;
  route_name: string;
  route_url: string;
  route_polyline: string;
  is_drop_ride: boolean;
  start_location_name?: string;
  start_location_address?: string;
  start_latitude?: number | null;
  start_longitude?: number | null;
}
