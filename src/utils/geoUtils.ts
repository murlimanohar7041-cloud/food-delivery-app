// Geographic calculations & real GPS location utilities
import { LocationCoords } from '../types';

/**
 * Calculates the great-circle distance between two points on the Earth (Haversine formula).
 * Returns distance in kilometers.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100; // 2 decimal places
}

/**
 * Calculates the compass heading (bearing in degrees 0-360) from point A to point B.
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(dLon);
  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  return Math.round((brng + 360) % 360);
}

/**
 * Estimates arrival time in minutes given distance in km and average speed in km/h.
 */
export function calculateETA(distanceKm: number, avgSpeedKmh = 25): { minutes: number; text: string } {
  if (distanceKm <= 0.08) {
    return { minutes: 1, text: 'Arriving now' };
  }
  const effectiveSpeed = Math.max(15, avgSpeedKmh);
  const hours = distanceKm / effectiveSpeed;
  const mins = Math.max(2, Math.round(hours * 60) + 1);
  if (mins <= 2) return { minutes: 2, text: '2 mins (Arriving now)' };
  return { minutes: mins, text: `${mins} mins` };
}

/**
 * Requests browser/device geolocation with high accuracy and descriptive error handling.
 */
export interface GeolocationResult {
  coords?: LocationCoords & { accuracy?: number; heading?: number; speed?: number };
  error?: string;
  isDenied?: boolean;
}

export function getUserCurrentLocation(options?: { timeoutMs?: number }): Promise<GeolocationResult> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        error: 'Geolocation is not supported by this browser/device.',
        isDenied: false,
      });
      return;
    }

    const timeout = options?.timeoutMs || 15000;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: Math.round(position.coords.accuracy || 0),
            heading: position.coords.heading || undefined,
            speed: position.coords.speed ? Math.round(position.coords.speed * 3.6) : undefined
          },
        });
      },
      (err) => {
        let msg = 'Unable to acquire real GPS location.';
        let denied = false;
        switch (err.code) {
          case err.PERMISSION_DENIED:
            msg = 'GPS/Location permission was denied. Please allow location access in your browser or device settings.';
            denied = true;
            break;
          case err.POSITION_UNAVAILABLE:
            msg = 'GPS signal is currently unavailable or device location is turned off.';
            break;
          case err.TIMEOUT:
            msg = 'GPS location request timed out. Please try again.';
            break;
        }
        resolve({
          error: msg,
          isDenied: denied,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: timeout,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Reverse geocodes lat/lng into human-readable street address using OpenStreetMap Nominatim.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        signal: controller.signal,
        headers: { 'Accept-Language': 'en' }
      }
    );
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.display_name) {
      return data.display_name;
    }
  } catch (e) {
    // Graceful offline/timeout fallback
  }
  return null;
}

/**
 * Real Road Route result using OSRM routing engine.
 */
export interface RoadRouteResult {
  coordinates: [number, number][]; // [lat, lng] array for Leaflet
  distanceKm: number;
  durationMinutes: number;
  source: 'osrm' | 'direct';
}

/**
 * Fetches real road navigation route between origin and destination coordinates.
 */
export async function fetchRealRoadRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<RoadRouteResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        // OSRM returns coordinates as [lng, lat], Leaflet polyline expects [lat, lng]
        const latLngs: [number, number][] = route.geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]]
        );
        const distanceKm = Math.round((route.distance / 1000) * 100) / 100;
        const durationMinutes = Math.max(1, Math.round(route.duration / 60));

        return {
          coordinates: latLngs,
          distanceKm,
          durationMinutes,
          source: 'osrm'
        };
      }
    }
  } catch (e) {
    // Network or OSRM unavailable
  }

  // Fallback: Calculate direct Haversine distance with clean realistic road curvature
  const directDist = calculateDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng);
  const curved = generateCurvedWaypoints(origin, destination, 30);
  const fallbackCoords: [number, number][] = curved.map(p => [p.lat, p.lng]);

  return {
    coordinates: fallbackCoords,
    distanceKm: directDist,
    durationMinutes: calculateETA(directDist).minutes,
    source: 'direct'
  };
}

/**
 * Generates realistic road-like waypoint coordinates between start and end.
 */
export function generateCurvedWaypoints(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  steps = 25
): { lat: number; lng: number }[] {
  const waypoints: { lat: number; lng: number }[] = [];
  
  // Midpoint with slight natural curve
  const midLat = (start.lat + end.lat) / 2 + (end.lng - start.lng) * 0.12;
  const midLng = (start.lng + end.lng) / 2 - (end.lat - start.lat) * 0.12;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat =
      (1 - t) * (1 - t) * start.lat +
      2 * (1 - t) * t * midLat +
      t * t * end.lat;
    const lng =
      (1 - t) * (1 - t) * start.lng +
      2 * (1 - t) * t * midLng +
      t * t * end.lng;
    waypoints.push({ lat, lng });
  }

  return waypoints;
}

// Default Fallback Locations (Used ONLY if GPS is completely denied by user device)
export const DEFAULT_CUSTOMER_LOCATION: LocationCoords = {
  lat: 28.6139,
  lng: 77.2090,
  address: 'Connaught Place, Central Delhi',
};

export const DEFAULT_RESTAURANT_LOCATION = {
  name: 'M-Bites Gourmet Kitchen',
  lat: 28.6315,
  lng: 77.2167,
  address: 'Barakhamba Road, Connaught Place, New Delhi',
};

