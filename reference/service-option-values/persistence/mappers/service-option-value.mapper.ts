import { ServiceOptionValue } from '@/service-option-values/domain/service-option-value';
import { ServiceOptionValueEntity } from '../entities/service-option-value.entity';

export class ServiceOptionValueMapper {
  static toDomain(entity: ServiceOptionValueEntity): ServiceOptionValue {
    const domain = new ServiceOptionValue();
    domain.id = entity.id;
    domain.option_group_id = entity.option_group_id;
    domain.label = entity.label;
    domain.value = entity.value;
    domain.description = entity.description;
    domain.price_adjustment = Number(entity.price_adjustment);
    domain.price_multiplier = Number(entity.price_multiplier);
    domain.duration_adjustment_minutes = entity.duration_adjustment_minutes;
    domain.icon_url = entity.icon_url;
    domain.display_order = entity.display_order;
    domain.is_default = entity.is_default;
    domain.status = entity.status;
    domain.created_at = entity.created_at;
    domain.updated_at = entity.updated_at;
    return domain;
  }

  static toPersistence(
    domain: Partial<ServiceOptionValue>,
  ): Partial<ServiceOptionValueEntity> {
    const entity = new ServiceOptionValueEntity();
    if (domain.id !== undefined) entity.id = domain.id;
    if (domain.option_group_id !== undefined)
      entity.option_group_id = domain.option_group_id;
    if (domain.label !== undefined) entity.label = domain.label;
    if (domain.value !== undefined) entity.value = domain.value;
    if (domain.description !== undefined)
      entity.description = domain.description;
    if (domain.price_adjustment !== undefined)
      entity.price_adjustment = domain.price_adjustment;
    if (domain.price_multiplier !== undefined)
      entity.price_multiplier = domain.price_multiplier;
    if (domain.duration_adjustment_minutes !== undefined)
      entity.duration_adjustment_minutes = domain.duration_adjustment_minutes;
    if (domain.icon_url !== undefined) entity.icon_url = domain.icon_url;
    if (domain.display_order !== undefined)
      entity.display_order = domain.display_order;
    if (domain.is_default !== undefined) entity.is_default = domain.is_default;
    if (domain.status !== undefined) entity.status = domain.status;
    return entity;
  }
}
