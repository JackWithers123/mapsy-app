
export interface Location {
  id: string;
  name: string;
  address: string;
  coordinates: [number, number]; // [longitude, latitude]
}

export interface Route {
  id: string;
  origin: Location;
  destination: Location;
  distance: number; // in meters
  duration: number; // in seconds
  steps: RouteStep[];
  geometry: [number, number][]; // route coordinates
}

export interface RouteStep {
  id: string;
  instruction: string;
  distance: number;
  duration: number;
  coordinates: [number, number][];
}

export interface SearchResult {
  id: string;
  name: string;
  address: string;
  coordinates: [number, number];
  type: string;
}
