import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingCancellationEntity } from '@/booking-cancellations/persistence/entities/booking-cancellation.entity';
import { BookingCancellationsSeedService } from '@/database/seeds/booking-cancellations/booking-cancellations-seed.service';
import { BookingEntity } from '@/bookings/persistence/entities/booking.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

/**
 * Seed module for booking cancellations
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      BookingCancellationEntity,
      BookingEntity,
      UserEntity,
    ]),
  ],
  providers: [BookingCancellationsSeedService],
  exports: [BookingCancellationsSeedService],
})
export class BookingCancellationsSeedModule {}
