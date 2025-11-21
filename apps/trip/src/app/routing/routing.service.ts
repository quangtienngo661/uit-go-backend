import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  distanceKm: number;
  durationMinutes: number;
  geometry?: number[][];
  steps?: RouteStep[];
}

export interface RouteStep {
  instruction: string;
  streetName: string;
  distance: number;
  duration: number;
}

@Injectable()
export class RoutingService {
  private readonly logger = new Logger(RoutingService.name);
  private readonly osrmUrl: string;
  private readonly useOsrm: boolean;

  constructor() {
    // OSRM URL: http://osrm:5000 trong Docker network, http://localhost:5050 từ host
    this.osrmUrl = process.env.OSRM_URL || 'http://osrm:5000';
    this.useOsrm = process.env.USE_OSRM !== 'false'; // Default: true
  }

  /**
   * Calculate route between two points
   * @param fromLat - Starting latitude
   * @param fromLng - Starting longitude
   * @param toLat - Destination latitude
   * @param toLng - Destination longitude
   * @param profile - Transport mode: 'car', 'bicycle', 'foot' (default: 'car')
   * @returns Route information
   */
  async getRoute(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number,
    profile: 'car' | 'bicycle' | 'foot' = 'car'
  ): Promise<RouteResult> {
    if (!this.useOsrm) {
      this.logger.warn('OSRM is disabled, using Haversine fallback');
      return this.haversineFallback(fromLat, fromLng, toLat, toLng);
    }

    try {
      // OSRM API: longitude,latitude (NOT latitude,longitude!)
      const url = `${this.osrmUrl}/route/v1/${profile}/${fromLng},${fromLat};${toLng},${toLat}`;

      this.logger.debug(`Calling OSRM: ${url}`);

      const { data } = await axios.get(url, {
        params: {
          overview: 'full',
          geometries: 'geojson',
          steps: true,
        },
        timeout: 5000, // 5 second timeout
      });

      if (data.code !== 'Ok') {
        throw new Error(`OSRM error: ${data.message || data.code}`);
      }

      const route = data.routes[0];
      const leg = route.legs[0];

      return {
        distanceMeters: route.distance,
        durationSeconds: route.duration,
        distanceKm: route.distance / 1000,
        durationMinutes: Math.ceil(route.duration / 60),
        geometry: route.geometry?.coordinates || [],
        steps: leg.steps?.map((step: any) => ({
          instruction: step.maneuver?.type || '',
          streetName: step.name || '',
          distance: step.distance || 0,
          duration: step.duration || 0,
        })) || [],
      };
    } catch (error) {
      this.logger.error(`OSRM routing failed: ${error.message}`, error.stack);
      
      // Fallback to Haversine
      this.logger.warn('Falling back to Haversine calculation');
      return this.haversineFallback(fromLat, fromLng, toLat, toLng);
    }
  }

  /**
   * Fallback: Calculate straight-line distance and estimated duration
   */
  private haversineFallback(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number
  ): RouteResult {
    const R = 6371; // Earth radius in km
    const dLat = ((toLat - fromLat) * Math.PI) / 180;
    const dLon = ((toLng - fromLng) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((fromLat * Math.PI) / 180) *
        Math.cos((toLat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;

    // Estimate: 30 km/h average speed in city
    const durationMinutes = Math.ceil((distanceKm / 30) * 60);

    return {
      distanceMeters: distanceKm * 1000,
      durationSeconds: durationMinutes * 60,
      distanceKm,
      durationMinutes,
      geometry: [[fromLng, fromLat], [toLng, toLat]], // Simple straight line
      steps: [],
    };
  }

  /**
   * Find nearest road point from given coordinates
   */
  async findNearestRoad(lat: number, lng: number): Promise<{ lat: number; lng: number }> {
    try {
      const url = `${this.osrmUrl}/nearest/v1/car/${lng},${lat}`;
      const { data } = await axios.get(url, { params: { number: 1 }, timeout: 3000 });

      if (data.code === 'Ok' && data.waypoints?.length > 0) {
        const [lon, lat] = data.waypoints[0].location;
        return { lat, lng: lon };
      }
    } catch (error) {
      this.logger.warn(`Failed to find nearest road: ${error.message}`);
    }

    // Return original coordinates if failed
    return { lat, lng };
  }

  /**
   * Calculate ETA from current location to destination
   */
  async calculateETA(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number
  ): Promise<{ durationMinutes: number; arrivalTime: Date }> {
    const route = await this.getRoute(fromLat, fromLng, toLat, toLng);
    const arrivalTime = new Date(Date.now() + route.durationSeconds * 1000);

    return {
      durationMinutes: route.durationMinutes,
      arrivalTime,
    };
  }

  /**
   * Check if OSRM service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.osrmUrl}/route/v1/car/0,0;1,1`, {
        timeout: 2000,
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }
}
