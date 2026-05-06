import { RatingItem } from '@/ratings/domain/rating-item';
import { RatingItemEntity } from '@/ratings/persistence/entities/rating-item.entity';

/**
 * Mapper for RatingItem domain/entity conversion.
 */
export class RatingItemMapper {
  static toDomain(entity: RatingItemEntity): RatingItem {
    const domain = new RatingItem();
    domain.id = entity.id;
    domain.rating_id = entity.rating_id;
    domain.rating_template_id = entity.rating_template_id;
    domain.template_code = entity.template_code;
    domain.template_name = entity.template_name;
    domain.value = Number(entity.value);
    domain.created_by = entity.created_by;
    domain.created_at = entity.created_at;
    domain.updated_by = entity.updated_by;
    domain.updated_at = entity.updated_at;
    domain.deleted_by = entity.deleted_by;
    domain.deleted_at = entity.deleted_at;
    return domain;
  }

  static toEntity(domain: Partial<RatingItem>): Partial<RatingItemEntity> {
    const entity: Partial<RatingItemEntity> = {};
    if (domain.id !== undefined) entity.id = domain.id;
    if (domain.rating_id !== undefined) entity.rating_id = domain.rating_id;
    if (domain.rating_template_id !== undefined)
      entity.rating_template_id = domain.rating_template_id;
    if (domain.template_code !== undefined)
      entity.template_code = domain.template_code;
    if (domain.template_name !== undefined)
      entity.template_name = domain.template_name;
    if (domain.value !== undefined) entity.value = domain.value;
    if (domain.created_by !== undefined) entity.created_by = domain.created_by;
    if (domain.updated_by !== undefined) entity.updated_by = domain.updated_by;
    if (domain.deleted_by !== undefined) entity.deleted_by = domain.deleted_by;
    return entity;
  }
}
