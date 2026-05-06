import { Review } from '@/reviews/domain/review';
import { ReviewEntity } from '@/reviews/persistence/entities/review.entity';
import { ReviewMediaMappingMapper } from '@/media/persistence/mappers/review-media-mapping.mapper';
import { getCauser } from '@/utils/helpers/entity.helper';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { User } from '@/users/domain/user';

export class ReviewMapper {
  static toDomain(entity: ReviewEntity): Review {
    const domain = new Review();
    domain.id = entity.id;
    domain.user_id = entity.user_id;
    if (entity.user) {
      domain.user = UserMapper.toDomain(entity.user);
    }
    domain.seller_id = entity.seller_id;
    domain.product_id = entity.product_id;
    domain.product_name =
      entity.product?.product_name ??
      entity.sales_order_item?.variant?.product?.product_name;
    domain.sales_order_item_id = entity.sales_order_item_id;
    domain.variant_name = entity.sales_order_item?.variant?.variant_name;
    domain.reviewable_type = entity.reviewable_type;
    domain.source_type = entity.source_type;
    domain.source_id = entity.source_id;
    domain.service_id = entity.service_id;
    domain.booking_id = entity.booking_id;
    domain.aspect_ratings = entity.aspect_ratings;
    domain.rating = entity.rating;
    domain.comment = entity.comment;
    domain.is_anonymous = entity.is_anonymous;
    domain.is_verified_purchase = entity.is_verified_purchase;
    domain.status = entity.status;
    domain.reply_text = entity.reply_text;
    domain.reply_at = entity.reply_at?.toISOString();
    domain.created_by = entity.created_by ? getCauser(entity.created_by) : null;
    domain.updated_by = entity.updated_by ? getCauser(entity.updated_by) : null;
    domain.deleted_by = entity.deleted_by ? getCauser(entity.deleted_by) : null;
    domain.created_at = entity.created_at?.toISOString();
    domain.updated_at = entity.updated_at?.toISOString();
    domain.deleted_at = entity.deleted_at?.toISOString();
    if (entity.review_media_mappings) {
      domain.review_media_mappings = entity.review_media_mappings.map((mm) =>
        ReviewMediaMappingMapper.toDomain(mm),
      );
    }
    return domain;
  }

  static toEntity(domain: Review): ReviewEntity {
    const entity = new ReviewEntity();
    entity.id = domain.id;
    entity.user_id = domain.user_id;
    entity.seller_id = domain.seller_id;
    entity.product_id = domain.product_id;
    entity.sales_order_item_id = domain.sales_order_item_id;
    entity.reviewable_type = domain.reviewable_type;
    entity.source_type = domain.source_type;
    entity.source_id = domain.source_id;
    entity.service_id = domain.service_id;
    entity.booking_id = domain.booking_id;
    entity.aspect_ratings = domain.aspect_ratings;
    entity.rating = domain.rating;
    entity.comment = domain.comment;
    entity.is_anonymous = domain.is_anonymous;
    entity.is_verified_purchase = domain.is_verified_purchase;
    entity.status = domain.status;
    entity.reply_text = domain.reply_text;
    entity.reply_at = domain.reply_at ? new Date(domain.reply_at) : undefined;
    if (domain.created_by) {
      entity.created_by = UserMapper.toPersistence(domain.created_by as User);
    }
    if (domain.updated_by) {
      entity.updated_by = UserMapper.toPersistence(domain.updated_by as User);
    }
    if (domain.deleted_by) {
      entity.deleted_by = UserMapper.toPersistence(domain.deleted_by as User);
    }
    return entity;
  }
}
