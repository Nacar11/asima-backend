import { Review } from '@/reviews/domain/review';

export type FindAllReview = {
  data: Review[];
  totalCount: number;
  skip: number;
  take: number;
};
