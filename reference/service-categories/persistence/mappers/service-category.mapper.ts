import { ServiceCategory } from '@/service-categories/domain/service-category';
import { ServiceCategoryEntity } from '@/service-categories/persistence/entities/service-category.entity';
import { getCauser } from '@/utils/helpers/entity.helper';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';

export class ServiceCategoryMapper {
  static toDomain(raw: ServiceCategoryEntity): ServiceCategory {
    const domain = new ServiceCategory();

    domain.id = raw.id;
    domain.parent_id = raw.parent_id;
    if (raw.parent) {
      domain.parent = ServiceCategoryMapper.toDomain(raw.parent);
    }
    domain.name = raw.name;
    domain.code = raw.code;
    domain.description = raw.description;
    domain.icon_url = raw.icon_url;
    domain.image_url = raw.image_url;
    domain.level = raw.level;
    domain.display_order = raw.display_order;
    domain.is_active = raw.is_active;
    domain.is_featured = raw.is_featured;
    domain.status = raw.status;
    domain.default_platform_fee_percent = Number(
      raw.default_platform_fee_percent,
    );
    domain.meta_title = raw.meta_title;
    domain.meta_description = raw.meta_description;

    if (raw.created_by) domain.created_by = getCauser(raw.created_by);
    if (raw.updated_by) domain.updated_by = getCauser(raw.updated_by);
    if (raw.deleted_by) domain.deleted_by = getCauser(raw.deleted_by);
    domain.created_at = raw.created_at;
    domain.updated_at = raw.updated_at;
    domain.deleted_at = raw.deleted_at;

    return domain;
  }

  static toPersistence(domain: ServiceCategory): ServiceCategoryEntity {
    const entity = new ServiceCategoryEntity();

    if (domain.id) entity.id = domain.id;
    entity.parent_id = domain.parent_id ?? null;
    entity.name = domain.name;
    entity.code = domain.code;
    entity.description = domain.description ?? null;
    entity.icon_url = domain.icon_url ?? null;
    entity.image_url = domain.image_url ?? null;
    entity.level = domain.level ?? 0;
    entity.display_order = domain.display_order ?? 0;
    entity.is_active = domain.is_active ?? true;
    entity.is_featured = domain.is_featured ?? false;
    entity.status = domain.status ?? 'Active';
    entity.default_platform_fee_percent =
      domain.default_platform_fee_percent ?? 10;
    entity.meta_title = domain.meta_title ?? null;
    entity.meta_description = domain.meta_description ?? null;

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
