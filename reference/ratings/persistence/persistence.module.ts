import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatingEntity } from '@/ratings/persistence/entities/rating.entity';
import { RatingItemEntity } from '@/ratings/persistence/entities/rating-item.entity';
import { RatingRepository } from '@/ratings/persistence/repositories/rating.repository';
import { RatingItemRepository } from '@/ratings/persistence/repositories/rating-item.repository';
import { BaseRatingRepository } from '@/ratings/persistence/base-rating.repository';
import { BaseRatingItemRepository } from '@/ratings/persistence/base-rating-item.repository';

@Module({
  imports: [TypeOrmModule.forFeature([RatingEntity, RatingItemEntity])],
  providers: [
    {
      provide: BaseRatingRepository,
      useClass: RatingRepository,
    },
    {
      provide: BaseRatingItemRepository,
      useClass: RatingItemRepository,
    },
  ],
  exports: [BaseRatingRepository, BaseRatingItemRepository],
})
export class RatingPersistenceModule {}
