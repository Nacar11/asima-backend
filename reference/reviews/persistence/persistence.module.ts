import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewEntity } from '@/reviews/persistence/entities/review.entity';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { BookingEntity } from '@/bookings/persistence/entities/booking.entity';
import { UserAddressEntity } from '@/user-addresses/persistence/entities/user-address.entity';
import { ReviewRepository } from '@/reviews/persistence/repositories/review.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReviewEntity,
      ServiceEntity,
      BookingEntity,
      UserAddressEntity,
    ]),
  ],
  providers: [ReviewRepository],
  exports: [ReviewRepository],
})
export class ReviewPersistenceModule {}
