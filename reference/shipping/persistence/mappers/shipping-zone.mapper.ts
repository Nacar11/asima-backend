import { ShippingZoneEntity } from '@/shipping/persistence/entities/shipping-zone.entity';
import { ShippingZoneAreaEntity } from '@/shipping/persistence/entities/shipping-zone-area.entity';
import {
  ShippingZone,
  ShippingZoneArea,
} from '@/shipping/domain/shipping-zone';
import { getCauser } from '@/utils/helpers/entity.helper';

/**
 * Mapper for ShippingZone between domain and persistence
 */
export class ShippingZoneMapper {
  static toDomain(raw: ShippingZoneEntity): ShippingZone {
    const domainEntity = new ShippingZone();

    domainEntity.id = raw.id;
    domainEntity.provider_id = raw.provider_id;
    domainEntity.name = raw.name;
    domainEntity.description = raw.description;
    domainEntity.is_default = raw.is_default;
    domainEntity.is_active = raw.is_active;
    domainEntity.priority = raw.priority;
    domainEntity.created_at = raw.created_at;
    domainEntity.updated_at = raw.updated_at;
    domainEntity.deleted_at = raw.deleted_at;

    if (raw.areas) {
      domainEntity.areas = raw.areas.map((area) =>
        ShippingZoneMapper.areaToDomain(area),
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

  static areaToDomain(raw: ShippingZoneAreaEntity): ShippingZoneArea {
    const domainEntity = new ShippingZoneArea();

    domainEntity.id = raw.id;
    domainEntity.zone_id = raw.zone_id;
    domainEntity.area_type = raw.area_type;
    domainEntity.area_value = raw.area_value;
    domainEntity.created_at = raw.created_at;

    return domainEntity;
  }

  static toPersistence(
    domainEntity: Partial<ShippingZone>,
  ): Partial<ShippingZoneEntity> {
    const persistenceEntity: Partial<ShippingZoneEntity> = {};

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

    if (domainEntity.is_default !== undefined) {
      persistenceEntity.is_default = domainEntity.is_default;
    }

    if (domainEntity.is_active !== undefined) {
      persistenceEntity.is_active = domainEntity.is_active;
    }

    if (domainEntity.priority !== undefined) {
      persistenceEntity.priority = domainEntity.priority;
    }

    return persistenceEntity;
  }
}
