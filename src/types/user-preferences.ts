export interface UserPreferences {
  distance_unit: 'km' | 'mi';
  elevation_unit: 'm' | 'ft';
  temperature_unit: 'celsius' | 'fahrenheit';
  time_format: '12h' | '24h';
}

export const defaultUserPreferences: UserPreferences = {
  distance_unit: 'km',
  elevation_unit: 'm',
  temperature_unit: 'celsius',
  time_format: '24h',
};
