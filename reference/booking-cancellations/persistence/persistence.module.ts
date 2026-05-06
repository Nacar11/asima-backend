import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingCancellationEntity } from './entities/booking-cancellation.entity';
import { BookingCancellationRepository } from './repositories/booking-cancellation.repository';
import { BaseBookingCancellationRepository } from './base-booking-cancellation.repository';

@Module({
  imports: [TypeOrmModule.forFeature([BookingCancellationEntity])],
  providers: [
    {
      provide: BaseBookingCancellationRepository,
      useClass: BookingCancellationRepository,
    },
  ],
  exports: [BaseBookingCancellationRepository],
})
export class BookingCancellationPersistenceModule {}
