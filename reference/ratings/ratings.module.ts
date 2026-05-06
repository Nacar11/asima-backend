import { Module } from '@nestjs/common';
import { RatingPersistenceModule } from '@/ratings/persistence/persistence.module';
import { RatingTemplatePersistenceModule } from '@/rating-templates/persistence/persistence.module';
import { RatingsService } from '@/ratings/ratings.service';
import { RatingsController } from '@/ratings/ratings.controller';
import { BookingsModule } from '@/bookings/bookings.module';

@Module({
  imports: [
    RatingPersistenceModule,
    RatingTemplatePersistenceModule,
    BookingsModule,
  ],
  controllers: [RatingsController],
  providers: [RatingsService],
  exports: [RatingsService],
})
export class RatingsModule {}
