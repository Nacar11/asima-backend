import { ShippingDistanceTierEntity } from '@/shipping/persistence/entities/shipping-distance-tier.entity';
import { ShippingDistanceTier } from '@/shipping/domain/shipping-distance-tier';

/**
 * Mapper for ShippingDistanceTier between domain and persistence
 */
export class ShippingDistanceTierMapper {
  static toDomain(raw: ShippingDistanceTierEntity): ShippingDistanceTier {
    const domainEntity = new ShippingDistanceTier();

    domainEntity.id = raw.id;
    domainEntity.method_id = raw.method_id;
    domainEntity.min_distance_km = Number(raw.min_distance_km);
    domainEntity.max_distance_km =
      raw.max_distance_km !== null && raw.max_distance_km !== undefined
        ? Number(raw.max_distance_km)
        : null;
    domainEntity.fee = Number(raw.fee);
    domainEntity.display_order = raw.display_order;
    domainEntity.created_at = raw.created_at;
    domainEntity.updated_at = raw.updated_at;

    return domainEntity;
  }

  static toPersistence(
    domainEntity: Partial<ShippingDistanceTier>,
  ): Partial<ShippingDistanceTierEntity> {
    const persistenceEntity: Partial<ShippingDistanceTierEntity> = {};

    if (domainEntity.id !== undefined) {
      persistenceEntity.id = domainEntity.id;
    }

    if (domainEntity.method_id !== undefined) {
      persistenceEntity.method_id = domainEntity.method_id;
    }

    if (domainEntity.min_distance_km !== undefined) {
      persistenceEntity.min_distance_km = domainEntity.min_distance_km;
    }

    if (domainEntity.max_distance_km !== undefined) {
      persistenceEntity.max_distance_km = domainEntity.max_distance_km;
    }

    if (domainEntity.fee !== undefined) {
      persistenceEntity.fee = domainEntity.fee;
    }

    if (domainEntity.display_order !== undefined) {
      persistenceEntity.display_order = domainEntity.display_order;
    }

    return persistenceEntity;
  }
}
