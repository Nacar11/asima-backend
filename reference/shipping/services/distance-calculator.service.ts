import { Injectable } from '@nestjs/common';

/**
 * Service for calculating distance between two geographic coordinates
 * Uses the Haversine formula with a road distance multiplier
 */
@Injectable()
export class DistanceCalculatorService {
  /** Earth's radius in kilometers */
  private readonly EARTH_RADIUS_KM = 6371;

  /**
   * Road distance multiplier to approximate actual road distance
   * from straight-line distance (typically 1.3-1.5 for urban areas)
   */
  private readonly ROAD_DISTANCE_MULTIPLIER = 1.4;

  /**
   * Calculate the distance between two points using Haversine formula
   * Returns approximate road distance (straight-line × multiplier)
   *
   * @param lat1 - Latitude of origin point
   * @param lng1 - Longitude of origin point
   * @param lat2 - Latitude of destination point
   * @param lng2 - Longitude of destination point
   * @returns Distance in kilometers
   */
  calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straightLineDistance = this.EARTH_RADIUS_KM * c;

    // Multiply by road distance factor to approximate actual road distance
    const roadDistance = straightLineDistance * this.ROAD_DISTANCE_MULTIPLIER;

    // Round to 2 decimal places
    return Math.round(roadDistance * 100) / 100;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Check if coordinates are valid
   */
  isValidCoordinates(
    lat: number | null | undefined,
    lng: number | null | undefined,
  ): boolean {
    if (
      lat === null ||
      lat === undefined ||
      lng === null ||
      lng === undefined
    ) {
      return false;
    }

    // Latitude must be between -90 and 90
    if (lat < -90 || lat > 90) {
      return false;
    }

    // Longitude must be between -180 and 180
    if (lng < -180 || lng > 180) {
      return false;
    }

    return true;
  }
}
