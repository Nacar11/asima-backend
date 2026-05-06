import { ServiceAddonInclusion } from '@/service-addons/domain/service-addon-inclusion';
import { ServiceAddonInclusionEntity } from '../entities/service-addon-inclusion.entity';

export class ServiceAddonInclusionMapper {
  static toDomain(entity: ServiceAddonInclusionEntity): ServiceAddonInclusion {
    const domain = new ServiceAddonInclusion();
    domain.id = entity.id;
    domain.addon_id = entity.addon_id;
    domain.description = entity.description;
    domain.display_order = entity.display_order;
    domain.created_at = entity.created_at;
    domain.updated_at = entity.updated_at;
    return domain;
  }

  static toPersistence(
    domain: Partial<ServiceAddonInclusion>,
  ): Partial<ServiceAddonInclusionEntity> {
    const entity = new ServiceAddonInclusionEntity();
    if (domain.id !== undefined) entity.id = domain.id;
    if (domain.addon_id !== undefined) entity.addon_id = domain.addon_id;
    if (domain.description !== undefined)
      entity.description = domain.description;
    if (domain.display_order !== undefined)
      entity.display_order = domain.display_order;
    return entity;
  }
}
