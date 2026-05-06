import { ServiceAddon } from '@/service-addons/domain/service-addon';
import { ServiceAddonEntity } from '../entities/service-addon.entity';
import { ServiceAddonInclusionMapper } from './service-addon-inclusion.mapper';

export class ServiceAddonMapper {
  static toDomain(entity: ServiceAddonEntity): ServiceAddon {
    const domain = new ServiceAddon();
    domain.id = entity.id;
    domain.service_id = entity.service_id;
    domain.name = entity.name;
    domain.code = entity.code;
    domain.description = entity.description;
    domain.short_description = entity.short_description;
    domain.unit_type = entity.unit_type;
    domain.price = Number(entity.price);
    domain.compare_at_price = entity.compare_at_price
      ? Number(entity.compare_at_price)
      : null;
    domain.duration_minutes = entity.duration_minutes;
    domain.min_quantity = entity.min_quantity;
    domain.max_quantity = entity.max_quantity;
    domain.display_order = entity.display_order;
    domain.icon_url = entity.icon_url;
    domain.image_url = entity.image_url;
    domain.is_popular = entity.is_popular;
    domain.is_required = entity.is_required;
    domain.status = entity.status;
    domain.inclusions = entity.inclusions
      ? entity.inclusions.map(ServiceAddonInclusionMapper.toDomain)
      : [];
    domain.created_by = entity.created_by?.id ?? null;
    domain.created_at = entity.created_at;
    domain.updated_by = entity.updated_by?.id ?? null;
    domain.updated_at = entity.updated_at;
    domain.deleted_by = entity.deleted_by?.id ?? null;
    domain.deleted_at = entity.deleted_at ?? null;
    return domain;
  }

  static toPersistence(
    domain: Partial<ServiceAddon>,
  ): Partial<ServiceAddonEntity> {
    const entity = new ServiceAddonEntity();
    if (domain.id !== undefined) entity.id = domain.id;
    if (domain.service_id !== undefined) entity.service_id = domain.service_id;
    if (domain.name !== undefined) entity.name = domain.name;
    if (domain.code !== undefined) entity.code = domain.code;
    if (domain.description !== undefined)
      entity.description = domain.description;
    if (domain.short_description !== undefined)
      entity.short_description = domain.short_description;
    if (domain.unit_type !== undefined) entity.unit_type = domain.unit_type;
    if (domain.price !== undefined) entity.price = domain.price;
    if (domain.compare_at_price !== undefined)
      entity.compare_at_price = domain.compare_at_price;
    if (domain.duration_minutes !== undefined)
      entity.duration_minutes = domain.duration_minutes;
    if (domain.min_quantity !== undefined)
      entity.min_quantity = domain.min_quantity;
    if (domain.max_quantity !== undefined)
      entity.max_quantity = domain.max_quantity;
    if (domain.display_order !== undefined)
      entity.display_order = domain.display_order;
    if (domain.icon_url !== undefined) entity.icon_url = domain.icon_url;
    if (domain.image_url !== undefined) entity.image_url = domain.image_url;
    if (domain.is_popular !== undefined) entity.is_popular = domain.is_popular;
    if (domain.is_required !== undefined)
      entity.is_required = domain.is_required;
    if (domain.status !== undefined) entity.status = domain.status;
    return entity;
  }
}
