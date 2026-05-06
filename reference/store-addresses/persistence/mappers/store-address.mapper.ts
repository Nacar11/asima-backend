import { StoreAddress } from '@/store-addresses/domain/store-address';
import { StoreAddressEntity } from '../entities/store-address.entity';
import { getCauser } from '@/utils/helpers/entity.helper';

export class StoreAddressMapper {
  static toDomain(raw: StoreAddressEntity): StoreAddress {
    const domain = new StoreAddress();

    domain.id = raw.id;
    domain.seller_id = raw.seller_id;
    domain.label = raw.label;
    domain.address_line = raw.address_line;
    domain.province = raw.province;
    domain.city = raw.city;
    domain.barangay = raw.barangay;
    domain.postal_code = raw.postal_code;
    domain.latitude = raw.latitude ? Number(raw.latitude) : null;
    domain.longitude = raw.longitude ? Number(raw.longitude) : null;
    domain.is_default = raw.is_default;

    if (raw.created_by) {
      domain.created_by = getCauser(raw.created_by);
    }
    domain.created_at = raw.created_at;

    if (raw.updated_by) {
      domain.updated_by = getCauser(raw.updated_by);
    }
    domain.updated_at = raw.updated_at;

    if (raw.deleted_by) {
      domain.deleted_by = getCauser(raw.deleted_by);
    }
    domain.deleted_at = raw.deleted_at;

    return domain;
  }

  static toPersistence(domain: StoreAddress): StoreAddressEntity {
    const entity = new StoreAddressEntity();

    if (domain.id) {
      entity.id = domain.id;
    }

    entity.seller_id = domain.seller_id;
    entity.label = domain.label ?? null;
    entity.address_line = domain.address_line ?? null;
    entity.province = domain.province ?? null;
    entity.city = domain.city ?? null;
    entity.barangay = domain.barangay ?? null;
    entity.postal_code = domain.postal_code ?? null;
    entity.latitude = domain.latitude ?? null;
    entity.longitude = domain.longitude ?? null;
    entity.is_default = domain.is_default ?? false;

    entity.created_by = domain.created_by as any;
    entity.created_at = domain.created_at;
    entity.updated_by = domain.updated_by as any;
    entity.updated_at = domain.updated_at;
    entity.deleted_by = domain.deleted_by as any;
    entity.deleted_at = domain.deleted_at ?? null;

    return entity;
  }
}
