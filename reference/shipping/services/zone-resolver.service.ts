import { Injectable } from '@nestjs/common';
import { ShippingZoneRepository } from '@/shipping/persistence/repositories/shipping-zone.repository';
import { ShippingZone } from '@/shipping/domain/shipping-zone';
import { AreaType } from '@/shipping/domain/enums/shipping.enum';

/**
 * Address data for zone resolution
 */
export interface AddressData {
  country?: string;
  region?: string;
  province?: string;
  city?: string;
  postal_code?: string;
}

/**
 * Service to resolve which shipping zone an address belongs to
 * Matches address components against zone areas by priority
 */
@Injectable()
export class ZoneResolverService {
  constructor(private readonly zoneRepository: ShippingZoneRepository) {}

  /**
   * Resolve which zone an address belongs to for a given provider
   * @param providerId The shipping provider ID
   * @param address Address data to match against zones
   * @returns Matching zone or default zone, null if no match
   */
  async resolveZone(
    providerId: number,
    address: AddressData,
  ): Promise<ShippingZone | null> {
    // Get all active zones for the provider, ordered by priority
    const zones = await this.zoneRepository.findActiveByProviderId(providerId);

    if (zones.length === 0) {
      return null;
    }

    // Try to find a matching zone based on address components
    for (const zone of zones) {
      if (zone.is_default) {
        continue; // Skip default zone in first pass
      }

      if (this.matchesZone(zone, address)) {
        return zone;
      }
    }

    // Fall back to default zone if no specific match
    return this.zoneRepository.findDefaultZone(providerId);
  }

  /**
   * Check if an address matches a zone's areas
   * More specific matches (postal_code > city > province > region > country) take precedence
   */
  private matchesZone(zone: ShippingZone, address: AddressData): boolean {
    if (!zone.areas || zone.areas.length === 0) {
      return false;
    }

    // Check each area in the zone for a match
    for (const area of zone.areas) {
      const addressValue = this.getAddressValueForType(address, area.area_type);

      if (
        addressValue &&
        this.normalizeValue(addressValue) ===
          this.normalizeValue(area.area_value)
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get the corresponding address value for an area type
   */
  private getAddressValueForType(
    address: AddressData,
    areaType: AreaType,
  ): string | undefined {
    switch (areaType) {
      case AreaType.COUNTRY:
        return address.country;
      case AreaType.REGION:
        return address.region;
      case AreaType.PROVINCE:
        return address.province;
      case AreaType.CITY:
        return address.city;
      case AreaType.POSTAL_CODE:
        return address.postal_code;
      default:
        return undefined;
    }
  }

  /**
   * Normalize a value for comparison (lowercase, trim whitespace)
   */
  private normalizeValue(value: string): string {
    return value.toLowerCase().trim();
  }
}
