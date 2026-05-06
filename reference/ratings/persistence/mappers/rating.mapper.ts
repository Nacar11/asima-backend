import { Rating } from '@/ratings/domain/rating';
import { RatingEntity } from '@/ratings/persistence/entities/rating.entity';

/**
 * Mapper for Rating domain/entity conversion.
 */
export class RatingMapper {
  static toDomain(entity: RatingEntity): Rating {
    const domain = new Rating();
    domain.id = entity.id;
    domain.booking_id = entity.booking_id;
    domain.sales_order_id = entity.sales_order_id;
    domain.customer_id = entity.customer_id;
    domain.seller_id = entity.seller_id;
    domain.service_id = entity.service_id;
    domain.overall_rating = Number(entity.overall_rating);
    domain.review_comment = entity.review_comment;
    domain.is_public = entity.is_public;
    domain.has_seller_response = entity.has_seller_response;
    domain.seller_response = entity.seller_response;
    domain.seller_response_at = entity.seller_response_at;
    domain.status = entity.status;
    domain.created_by = entity.created_by;
    domain.created_at = entity.created_at;
    domain.updated_by = entity.updated_by;
    domain.updated_at = entity.updated_at;
    domain.deleted_by = entity.deleted_by;
    domain.deleted_at = entity.deleted_at;
    return domain;
  }

  static toEntity(domain: Partial<Rating>): Partial<RatingEntity> {
    const entity: Partial<RatingEntity> = {};
    if (domain.id !== undefined) entity.id = domain.id;
    if (domain.booking_id !== undefined) entity.booking_id = domain.booking_id;
    if (domain.sales_order_id !== undefined)
      entity.sales_order_id = domain.sales_order_id;
    if (domain.customer_id !== undefined)
      entity.customer_id = domain.customer_id;
    if (domain.seller_id !== undefined) entity.seller_id = domain.seller_id;
    if (domain.service_id !== undefined) entity.service_id = domain.service_id;
    if (domain.overall_rating !== undefined)
      entity.overall_rating = domain.overall_rating;
    if (domain.review_comment !== undefined)
      entity.review_comment = domain.review_comment;
    if (domain.is_public !== undefined) entity.is_public = domain.is_public;
    if (domain.has_seller_response !== undefined)
      entity.has_seller_response = domain.has_seller_response;
    if (domain.seller_response !== undefined)
      entity.seller_response = domain.seller_response;
    if (domain.seller_response_at !== undefined)
      entity.seller_response_at = domain.seller_response_at;
    if (domain.status !== undefined) entity.status = domain.status;
    if (domain.created_by !== undefined) entity.created_by = domain.created_by;
    if (domain.updated_by !== undefined) entity.updated_by = domain.updated_by;
    if (domain.deleted_by !== undefined) entity.deleted_by = domain.deleted_by;
    return entity;
  }
}
