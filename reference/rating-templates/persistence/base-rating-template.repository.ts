import { RatingTemplate } from '@/rating-templates/domain/rating-template';
import { IPaginatedResult } from '@/utils/types/paginated-result';

/**
 * Abstract repository interface for RatingTemplate.
 */
export abstract class BaseRatingTemplateRepository {
  abstract create(
    data: Omit<
      RatingTemplate,
      'id' | 'created_at' | 'updated_at' | 'deleted_at'
    >,
  ): Promise<RatingTemplate>;

  abstract findById(id: number): Promise<RatingTemplate | null>;

  abstract findByCode(code: string): Promise<RatingTemplate | null>;

  abstract findAll(options: {
    page?: number;
    limit?: number;
    isActive?: boolean;
  }): Promise<IPaginatedResult<RatingTemplate>>;

  abstract findAllActive(): Promise<RatingTemplate[]>;

  abstract update(
    id: number,
    data: Partial<RatingTemplate>,
  ): Promise<RatingTemplate | null>;

  abstract softDelete(id: number, deletedBy?: number): Promise<void>;
}
