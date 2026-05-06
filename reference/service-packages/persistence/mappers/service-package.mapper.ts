import { ServicePackage } from '@/service-packages/domain/service-package';
import { ServicePackageEntity } from '@/service-packages/persistence/entities/service-package.entity';
import { getCauser } from '@/utils/helpers/entity.helper';
import { ServiceMapper } from '@/services/persistence/mappers/service.mapper';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';

export class ServicePackageMapper {
  static toDomain(raw: ServicePackageEntity): ServicePackage {
    const domain = new ServicePackage();
    domain.id = raw.id;
    domain.service_id = raw.service_id;
    domain.name = raw.name;
    domain.description = raw.description;
    domain.price = raw.price ? Number(raw.price) : 0;
    domain.compare_at_price = raw.compare_at_price
      ? Number(raw.compare_at_price)
      : null;
    domain.duration_minutes = raw.duration_minutes;
    domain.inclusions = raw.inclusions;
    domain.max_bookings_per_day = raw.max_bookings_per_day;
    domain.is_popular = raw.is_popular;
    domain.display_order = raw.display_order;
    domain.status = raw.status;

    if (raw.service) domain.service = ServiceMapper.toDomain(raw.service);
    if (raw.created_by) domain.created_by = getCauser(raw.created_by);
    if (raw.updated_by) domain.updated_by = getCauser(raw.updated_by);
    if (raw.deleted_by) domain.deleted_by = getCauser(raw.deleted_by);
    domain.created_at = raw.created_at;
    domain.updated_at = raw.updated_at;
    domain.deleted_at = raw.deleted_at;

    return domain;
  }

  static toPersistence(domain: ServicePackage): ServicePackageEntity {
    const entity = new ServicePackageEntity();
    if (domain.id) entity.id = domain.id;
    entity.service_id = domain.service_id;
    entity.name = domain.name;
    entity.description = domain.description ?? null;
    entity.price = domain.price;
    entity.compare_at_price = domain.compare_at_price ?? null;
    entity.duration_minutes = domain.duration_minutes ?? null;
    entity.inclusions = domain.inclusions ?? null;
    entity.max_bookings_per_day = domain.max_bookings_per_day ?? null;
    entity.is_popular = domain.is_popular ?? false;
    entity.display_order = domain.display_order ?? 0;
    entity.status = domain.status;

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
