import { ShippingProviderEntity } from '@/shipping/persistence/entities/shipping-provider.entity';
import { ShippingProvider } from '@/shipping/domain/shipping-provider';
import { getCauser } from '@/utils/helpers/entity.helper';
import { ShippingMethodMapper } from './shipping-method.mapper';

/**
 * Mapper for ShippingProvider between domain and persistence
 */
export class ShippingProviderMapper {
  static toDomain(raw: ShippingProviderEntity): ShippingProvider {
    const domainEntity = new ShippingProvider();

    domainEntity.id = raw.id;
    domainEntity.name = raw.name;
    domainEntity.code = raw.code;
    domainEntity.description = raw.description;
    domainEntity.provider_type = raw.provider_type;
    domainEntity.is_active = raw.is_active;
    domainEntity.is_default = raw.is_default;
    domainEntity.display_order = raw.display_order;
    domainEntity.created_at = raw.created_at;
    domainEntity.updated_at = raw.updated_at;
    domainEntity.deleted_at = raw.deleted_at;

    if (raw.methods) {
      domainEntity.methods = raw.methods.map((method) =>
        ShippingMethodMapper.toDomain(method),
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
    domainEntity: Partial<ShippingProvider>,
  ): Partial<ShippingProviderEntity> {
    const persistenceEntity: Partial<ShippingProviderEntity> = {};

    if (domainEntity.id !== undefined) {
      persistenceEntity.id = domainEntity.id;
    }

    if (domainEntity.name !== undefined) {
      persistenceEntity.name = domainEntity.name;
    }

    if (domainEntity.code !== undefined) {
      persistenceEntity.code = domainEntity.code;
    }

    if (domainEntity.description !== undefined) {
      persistenceEntity.description = domainEntity.description;
    }

    if (domainEntity.provider_type !== undefined) {
      persistenceEntity.provider_type = domainEntity.provider_type;
    }

    if (domainEntity.is_active !== undefined) {
      persistenceEntity.is_active = domainEntity.is_active;
    }

    if (domainEntity.is_default !== undefined) {
      persistenceEntity.is_default = domainEntity.is_default;
    }

    if (domainEntity.display_order !== undefined) {
      persistenceEntity.display_order = domainEntity.display_order;
    }

    return persistenceEntity;
  }
}
