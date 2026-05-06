import { ServiceArea } from '@/service-areas/domain/service-area';
import { ServiceAreaEntity } from '@/service-areas/persistence/entities/service-area.entity';
import { getCauser } from '@/utils/helpers/entity.helper';
import { ServiceMapper } from '@/services/persistence/mappers/service.mapper';
import { SellerMapper } from '@/sellers/persistence/mappers/seller.mapper';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';

export class ServiceAreaMapper {
  static toDomain(raw: ServiceAreaEntity): ServiceArea {
    const domain = new ServiceArea();
    domain.id = raw.id;
    domain.seller_id = raw.seller_id;
    domain.service_id = raw.service_id ?? null;
    domain.city = raw.city;
    domain.province = raw.province;
    domain.postal_code = raw.postal_code;
    domain.barangay = raw.barangay;
    domain.center_latitude = raw.center_latitude
      ? Number(raw.center_latitude)
      : null;
    domain.center_longitude = raw.center_longitude
      ? Number(raw.center_longitude)
      : null;
    domain.radius_km = raw.radius_km;
    domain.additional_fee = raw.additional_fee ? Number(raw.additional_fee) : 0;
    domain.additional_fee_type = raw.additional_fee_type;
    domain.minimum_order_amount = raw.minimum_order_amount
      ? Number(raw.minimum_order_amount)
      : null;
    domain.status = raw.status;

    if (raw.seller) domain.seller = SellerMapper.toDomain(raw.seller);
    if (raw.service) domain.service = ServiceMapper.toDomain(raw.service);
    if (raw.created_by) domain.created_by = getCauser(raw.created_by);
    if (raw.updated_by) domain.updated_by = getCauser(raw.updated_by);
    if (raw.deleted_by) domain.deleted_by = getCauser(raw.deleted_by);
    domain.created_at = raw.created_at;
    domain.updated_at = raw.updated_at;
    domain.deleted_at = raw.deleted_at;

    return domain;
  }

  static toPersistence(domain: ServiceArea): ServiceAreaEntity {
    const entity = new ServiceAreaEntity();
    if (domain.id) entity.id = domain.id;
    entity.seller_id = domain.seller_id;
    entity.service_id = domain.service_id ?? null;
    entity.city = domain.city ?? null;
    entity.province = domain.province ?? null;
    entity.postal_code = domain.postal_code ?? null;
    entity.barangay = domain.barangay ?? null;
    entity.center_latitude = domain.center_latitude ?? null;
    entity.center_longitude = domain.center_longitude ?? null;
    entity.radius_km = domain.radius_km ?? null;
    entity.additional_fee = domain.additional_fee ?? 0;
    entity.additional_fee_type = domain.additional_fee_type;
    entity.minimum_order_amount = domain.minimum_order_amount ?? null;
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
