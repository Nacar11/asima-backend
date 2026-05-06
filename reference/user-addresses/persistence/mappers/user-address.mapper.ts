import { UserAddress } from '@/user-addresses/domain/user-address';
import { UserAddressEntity } from '../entities/user-address.entity';
import { getCauser } from '@/utils/helpers/entity.helper';

export class UserAddressMapper {
  static toDomain(raw: UserAddressEntity): UserAddress {
    const domainEntity = new UserAddress();

    domainEntity.id = raw.id;
    domainEntity.user_id = raw.user_id;
    domainEntity.label = raw.label;
    domainEntity.recipient_name = raw.recipient_name;
    domainEntity.phone = raw.phone;
    domainEntity.address_line1 = raw.address_line1;
    domainEntity.address_line2 = raw.address_line2;
    domainEntity.city = raw.city;
    domainEntity.state_province = raw.state_province;
    domainEntity.postal_code = raw.postal_code;
    domainEntity.country = raw.country;
    domainEntity.is_default = raw.is_default;
    domainEntity.latitude = raw.latitude ? Number(raw.latitude) : null;
    domainEntity.longitude = raw.longitude ? Number(raw.longitude) : null;

    if (raw.created_by) {
      domainEntity.created_by = getCauser(raw.created_by);
    }
    domainEntity.created_at = raw.created_at;

    if (raw.updated_by) {
      domainEntity.updated_by = getCauser(raw.updated_by);
    }
    domainEntity.updated_at = raw.updated_at;

    if (raw.deleted_by) {
      domainEntity.deleted_by = getCauser(raw.deleted_by);
    }
    domainEntity.deleted_at = raw.deleted_at;

    return domainEntity;
  }

  static toPersistence(domainEntity: UserAddress): UserAddressEntity {
    const persistenceEntity = new UserAddressEntity();

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }

    persistenceEntity.user_id = domainEntity.user_id;
    persistenceEntity.label = domainEntity.label ?? 'Shipping';
    persistenceEntity.recipient_name = domainEntity.recipient_name;
    persistenceEntity.phone = domainEntity.phone ?? null;
    persistenceEntity.address_line1 = domainEntity.address_line1;
    persistenceEntity.address_line2 = domainEntity.address_line2 ?? null;
    persistenceEntity.city = domainEntity.city;
    persistenceEntity.state_province = domainEntity.state_province;
    persistenceEntity.postal_code = domainEntity.postal_code;
    persistenceEntity.country = domainEntity.country ?? 'Philippines';
    persistenceEntity.is_default = domainEntity.is_default ?? false;
    persistenceEntity.latitude = domainEntity.latitude ?? null;
    persistenceEntity.longitude = domainEntity.longitude ?? null;

    persistenceEntity.created_by = domainEntity.created_by as any;
    persistenceEntity.created_at = domainEntity.created_at;
    persistenceEntity.updated_by = domainEntity.updated_by as any;
    persistenceEntity.updated_at = domainEntity.updated_at;
    persistenceEntity.deleted_by = domainEntity.deleted_by as any;
    persistenceEntity.deleted_at = domainEntity.deleted_at ?? null;

    return persistenceEntity;
  }
}
