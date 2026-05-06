import { StoreUnavailability } from '@/store-unavailability/domain/store-unavailability';
import { StoreUnavailabilityEntity } from '@/store-unavailability/persistence/entities/store-unavailability.entity';
import { getCauser } from '@/utils/helpers/entity.helper';
import { SellerMapper } from '@/sellers/persistence/mappers/seller.mapper';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';

/**
 * Store Unavailability Mapper.
 *
 * Simplified: No member-specific unavailability (seller is the provider).
 *
 * @version 2
 * @since 1.0.0
 */
export class StoreUnavailabilityMapper {
  static toDomain(raw: StoreUnavailabilityEntity): StoreUnavailability {
    const domain = new StoreUnavailability();
    domain.id = raw.id;
    domain.seller_id = raw.seller_id;
    domain.service_id = raw.service_id ?? null;
    domain.unavailable_date = raw.unavailable_date;
    domain.end_date = raw.end_date ?? null;
    domain.start_time = raw.start_time ?? null;
    domain.end_time = raw.end_time ?? null;
    domain.is_full_day = raw.is_full_day;
    domain.reason = raw.reason ?? null;
    domain.block_type = raw.block_type ?? 'maintenance';
    domain.open_play_event_id = raw.open_play_event_id ?? null;
    domain.status = raw.status;
    if (raw.seller) domain.seller = SellerMapper.toDomain(raw.seller);
    if (raw.created_by) domain.created_by = getCauser(raw.created_by);
    if (raw.updated_by) domain.updated_by = getCauser(raw.updated_by);
    if (raw.deleted_by) domain.deleted_by = getCauser(raw.deleted_by);
    domain.created_at = raw.created_at;
    domain.updated_at = raw.updated_at;
    domain.deleted_at = raw.deleted_at ?? null;
    return domain;
  }

  static toPersistence(domain: StoreUnavailability): StoreUnavailabilityEntity {
    const entity = new StoreUnavailabilityEntity();
    if (domain.id) entity.id = domain.id;
    entity.seller_id = domain.seller_id;
    entity.service_id = domain.service_id ?? null;
    entity.unavailable_date = domain.unavailable_date;
    entity.end_date = domain.end_date ?? null;
    entity.start_time = domain.start_time ?? null;
    entity.end_time = domain.end_time ?? null;
    entity.is_full_day = domain.is_full_day ?? true;
    entity.reason = domain.reason ?? null;
    entity.block_type = domain.block_type ?? 'maintenance';
    entity.open_play_event_id = domain.open_play_event_id ?? null;
    entity.status = domain.status ?? 'Active';

    if (domain.created_by) {
      entity.created_by = UserMapper.toPersistence(domain.created_by as User);
    }
    if (domain.updated_by) {
      entity.updated_by = UserMapper.toPersistence(domain.updated_by as User);
    }
    if (domain.deleted_by) {
      entity.deleted_by = UserMapper.toPersistence(domain.deleted_by as User);
    }

    entity.created_at = domain.created_at;
    entity.updated_at = domain.updated_at;
    entity.deleted_at = domain.deleted_at ?? null;
    return entity;
  }
}
