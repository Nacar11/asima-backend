import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShippingMethodZoneRateEntity } from '@/shipping/persistence/entities/shipping-method-zone-rate.entity';

export interface ZoneRateOverride {
  base_fee: number | null;
  rate_per_km: number | null;
  rate_per_kg: number | null;
  max_distance_km: number | null;
  minimum_fee: number | null;
  free_shipping_threshold: number | null;
}

/**
 * Repository for ShippingMethodZoneRate persistence operations
 */
@Injectable()
export class ShippingZoneRateRepository {
  constructor(
    @InjectRepository(ShippingMethodZoneRateEntity)
    private readonly repository: Repository<ShippingMethodZoneRateEntity>,
  ) {}

  private toNumberOrNull(value: unknown): number | null {
    if (value === null || value === undefined) {
      return null;
    }
    return Number(value);
  }

  /**
   * Find active zone rate override for a specific method and zone
   */
  async findByMethodAndZone(
    methodId: number,
    zoneId: number,
  ): Promise<ZoneRateOverride | null> {
    const entity = await this.repository.findOne({
      where: {
        method_id: methodId,
        zone_id: zoneId,
        is_active: true,
      },
    });

    if (!entity) {
      return null;
    }

    return {
      base_fee: this.toNumberOrNull(entity.base_fee),
      rate_per_km: this.toNumberOrNull(entity.rate_per_km),
      rate_per_kg: this.toNumberOrNull(entity.rate_per_kg),
      max_distance_km: this.toNumberOrNull(entity.max_distance_km),
      minimum_fee: this.toNumberOrNull(entity.minimum_fee),
      free_shipping_threshold: this.toNumberOrNull(
        entity.free_shipping_threshold,
      ),
    };
  }

  /**
   * Find all zone rates for a method
   */
  async findByMethodId(
    methodId: number,
  ): Promise<ShippingMethodZoneRateEntity[]> {
    return this.repository.find({
      where: { method_id: methodId, is_active: true },
      relations: ['zone'],
    });
  }

  /**
   * Create a new zone rate override
   */
  async create(
    data: Partial<ShippingMethodZoneRateEntity>,
  ): Promise<ShippingMethodZoneRateEntity> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  /**
   * Update a zone rate override
   */
  async update(
    id: number,
    data: Partial<ShippingMethodZoneRateEntity>,
  ): Promise<ShippingMethodZoneRateEntity | null> {
    await this.repository.update(id, data);
    return this.repository.findOne({ where: { id } });
  }

  /**
   * Delete a zone rate override
   */
  async remove(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
