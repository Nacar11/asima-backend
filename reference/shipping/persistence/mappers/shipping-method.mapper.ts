import { ShippingMethodEntity } from '@/shipping/persistence/entities/shipping-method.entity';
import { ShippingMethod } from '@/shipping/domain/shipping-method';
import { getCauser } from '@/utils/helpers/entity.helper';
import { ShippingDistanceTierMapper } from './shipping-distance-tier.mapper';

/**
 * Mapper for ShippingMethod between domain and persistence
 */
export class ShippingMethodMapper {
  static toDomain(raw: ShippingMethodEntity): ShippingMethod {
    const domainEntity = new ShippingMethod();

    domainEntity.id = raw.id;
    domainEntity.provider_id = raw.provider_id;
    domainEntity.name = raw.name;
    domainEntity.description = raw.description;
    domainEntity.base_fee = Number(raw.base_fee);
    domainEntity.rate_per_km =
      raw.rate_per_km !== null && raw.rate_per_km !== undefined
        ? Number(raw.rate_per_km)
        : null;
    domainEntity.max_distance_km = raw.max_distance_km;
    domainEntity.rate_per_kg =
      raw.rate_per_kg !== null && raw.rate_per_kg !== undefined
        ? Number(raw.rate_per_kg)
        : null;
    domainEntity.volumetric_divisor = raw.volumetric_divisor;
    domainEntity.minimum_fee = Number(raw.minimum_fee);
    domainEntity.free_shipping_threshold =
      raw.free_shipping_threshold !== null &&
      raw.free_shipping_threshold !== undefined
        ? Number(raw.free_shipping_threshold)
        : null;
    domainEntity.free_shipping_max_weight_kg =
      raw.free_shipping_max_weight_kg !== null &&
      raw.free_shipping_max_weight_kg !== undefined
        ? Number(raw.free_shipping_max_weight_kg)
        : null;
    domainEntity.is_active = raw.is_active;
    domainEntity.display_order = raw.display_order;
    domainEntity.created_at = raw.created_at;
    domainEntity.updated_at = raw.updated_at;
    domainEntity.deleted_at = raw.deleted_at;

    if (raw.distance_tiers) {
      domainEntity.distance_tiers = raw.distance_tiers.map((tier) =>
        ShippingDistanceTierMapper.toDomain(tier),
      );
    }

    if (raw.created_by) {
      domainEntity.created_by = getCauser(raw.created_by);
    }

    if (raw.updated_by) {
      domainEntity.updated_by = getCauser(raw.updated_by);
    }

    return domainEntity;
  }

  static toPersistence(
    domainEntity: Partial<ShippingMethod>,
  ): Partial<ShippingMethodEntity> {
    const persistenceEntity: Partial<ShippingMethodEntity> = {};

    if (domainEntity.id !== undefined) {
      persistenceEntity.id = domainEntity.id;
    }

    if (domainEntity.provider_id !== undefined) {
      persistenceEntity.provider_id = domainEntity.provider_id;
    }

    if (domainEntity.name !== undefined) {
      persistenceEntity.name = domainEntity.name;
    }

    if (domainEntity.description !== undefined) {
      persistenceEntity.description = domainEntity.description;
    }

    if (domainEntity.base_fee !== undefined) {
      persistenceEntity.base_fee = domainEntity.base_fee;
    }

    if (domainEntity.rate_per_km !== undefined) {
      persistenceEntity.rate_per_km = domainEntity.rate_per_km;
    }

    if (domainEntity.max_distance_km !== undefined) {
      persistenceEntity.max_distance_km = domainEntity.max_distance_km;
    }

    if (domainEntity.rate_per_kg !== undefined) {
      persistenceEntity.rate_per_kg = domainEntity.rate_per_kg;
    }

    if (domainEntity.volumetric_divisor !== undefined) {
      persistenceEntity.volumetric_divisor = domainEntity.volumetric_divisor;
    }

    if (domainEntity.minimum_fee !== undefined) {
      persistenceEntity.minimum_fee = domainEntity.minimum_fee;
    }

    if (domainEntity.free_shipping_threshold !== undefined) {
      persistenceEntity.free_shipping_threshold =
        domainEntity.free_shipping_threshold;
    }

    if (domainEntity.free_shipping_max_weight_kg !== undefined) {
      persistenceEntity.free_shipping_max_weight_kg =
        domainEntity.free_shipping_max_weight_kg;
    }

    if (domainEntity.is_active !== undefined) {
      persistenceEntity.is_active = domainEntity.is_active;
    }

    if (domainEntity.display_order !== undefined) {
      persistenceEntity.display_order = domainEntity.display_order;
    }

    return persistenceEntity;
  }
}
