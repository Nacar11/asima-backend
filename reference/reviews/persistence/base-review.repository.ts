import { Repository } from 'typeorm';
import { ReviewEntity } from '@/reviews/persistence/entities/review.entity';
import { Review } from '@/reviews/domain/review';

export abstract class BaseReviewRepository {
  constructor(protected repository: Repository<ReviewEntity>) {}

  abstract findByUserAndSalesOrderItem(
    userId: number,
    salesOrderItemId: number,
  ): Promise<Review | null>;

  abstract findByUserAndSalesOrder(
    userId: number,
    salesOrderId: number,
  ): Promise<Review | null>;

  // Common repository methods can be added here if needed
}
