import { ServiceOptionGroup } from '@/service-option-groups/domain/service-option-group';
import { ServiceOptionGroupEntity } from '../entities/service-option-group.entity';
import { ServiceOptionValueMapper } from '@/service-option-values/persistence/mappers/service-option-value.mapper';

export class ServiceOptionGroupMapper {
  static toDomain(entity: ServiceOptionGroupEntity): ServiceOptionGroup {
    const domain = new ServiceOptionGroup();
    domain.id = entity.id;
    domain.service_id = entity.service_id;
    domain.name = entity.name;
    domain.code = entity.code;
    domain.description = entity.description;
    domain.input_type = entity.input_type;
    domain.min_value = entity.min_value;
    domain.max_value = entity.max_value;
    domain.default_value = entity.default_value;
    domain.display_order = entity.display_order;
    domain.is_required = entity.is_required;
    domain.status = entity.status;
    domain.option_values = entity.option_values
      ? entity.option_values.map(ServiceOptionValueMapper.toDomain)
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
    domain: Partial<ServiceOptionGroup>,
  ): Partial<ServiceOptionGroupEntity> {
    const entity = new ServiceOptionGroupEntity();
    if (domain.id !== undefined) entity.id = domain.id;
    if (domain.service_id !== undefined) entity.service_id = domain.service_id;
    if (domain.name !== undefined) entity.name = domain.name;
    if (domain.code !== undefined) entity.code = domain.code;
    if (domain.description !== undefined)
      entity.description = domain.description;
    if (domain.input_type !== undefined) entity.input_type = domain.input_type;
    if (domain.min_value !== undefined) entity.min_value = domain.min_value;
    if (domain.max_value !== undefined) entity.max_value = domain.max_value;
    if (domain.default_value !== undefined)
      entity.default_value = domain.default_value;
    if (domain.display_order !== undefined)
      entity.display_order = domain.display_order;
    if (domain.is_required !== undefined)
      entity.is_required = domain.is_required;
    if (domain.status !== undefined) entity.status = domain.status;
    return entity;
  }
}
