import { RatingTemplate } from '@/rating-templates/domain/rating-template';
import { RatingTemplateEntity } from '@/rating-templates/persistence/entities/rating-template.entity';

/**
 * Mapper for RatingTemplate domain/entity conversion.
 */
export class RatingTemplateMapper {
  static toDomain(entity: RatingTemplateEntity): RatingTemplate {
    const domain = new RatingTemplate();
    domain.id = entity.id;
    domain.name = entity.name;
    domain.code = entity.code;
    domain.description = entity.description;
    domain.rating_type = entity.rating_type;
    domain.min_value = entity.min_value;
    domain.max_value = entity.max_value;
    domain.is_required = entity.is_required;
    domain.sequence_order = entity.sequence_order;
    domain.is_active = entity.is_active;
    domain.status = entity.status;
    domain.created_by = entity.created_by;
    domain.created_at = entity.created_at;
    domain.updated_by = entity.updated_by;
    domain.updated_at = entity.updated_at;
    domain.deleted_by = entity.deleted_by;
    domain.deleted_at = entity.deleted_at;
    return domain;
  }

  static toEntity(
    domain: Partial<RatingTemplate>,
  ): Partial<RatingTemplateEntity> {
    const entity: Partial<RatingTemplateEntity> = {};
    if (domain.id !== undefined) entity.id = domain.id;
    if (domain.name !== undefined) entity.name = domain.name;
    if (domain.code !== undefined) entity.code = domain.code;
    if (domain.description !== undefined)
      entity.description = domain.description;
    if (domain.rating_type !== undefined)
      entity.rating_type = domain.rating_type;
    if (domain.min_value !== undefined) entity.min_value = domain.min_value;
    if (domain.max_value !== undefined) entity.max_value = domain.max_value;
    if (domain.is_required !== undefined)
      entity.is_required = domain.is_required;
    if (domain.sequence_order !== undefined)
      entity.sequence_order = domain.sequence_order;
    if (domain.is_active !== undefined) entity.is_active = domain.is_active;
    if (domain.status !== undefined) entity.status = domain.status;
    if (domain.created_by !== undefined) entity.created_by = domain.created_by;
    if (domain.updated_by !== undefined) entity.updated_by = domain.updated_by;
    if (domain.deleted_by !== undefined) entity.deleted_by = domain.deleted_by;
    return entity;
  }
}
