import { RatingItem } from '@/ratings/domain/rating-item';

/**
 * Base repository interface for Rating Items.
 */
export abstract class BaseRatingItemRepository {
  abstract create(
    data: Omit<RatingItem, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>,
  ): Promise<RatingItem>;

  abstract createMany(
    data: Omit<RatingItem, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>[],
  ): Promise<RatingItem[]>;

  abstract findById(id: number): Promise<RatingItem | null>;

  abstract findByRatingId(ratingId: number): Promise<RatingItem[]>;

  abstract update(
    id: number,
    data: Partial<RatingItem>,
  ): Promise<RatingItem | null>;

  abstract softDelete(id: number, deletedBy?: number): Promise<void>;

  abstract softDeleteByRatingId(
    ratingId: number,
    deletedBy?: number,
  ): Promise<void>;
}
