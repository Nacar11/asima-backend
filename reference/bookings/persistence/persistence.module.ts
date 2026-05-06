import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingEntity } from './entities/booking.entity';
import { BaseBookingRepository } from './base-booking.repository';
import { BookingRepository } from './repositories/booking.repository';
import { BookingMapper } from './mappers/booking.mapper';

/**
 * Bookings Persistence Module.
 *
 * Provides data access layer for bookings including repository
 * implementations and TypeORM entity registration. Maps abstract repository
 * to concrete implementation for dependency injection.
 *
 * @version 1
 * @since 1.0.0
 */
@Module({
  imports: [TypeOrmModule.forFeature([BookingEntity])],
  providers: [
    BookingMapper,
    {
      provide: BaseBookingRepository,
      useClass: BookingRepository,
    },
  ],
  exports: [TypeOrmModule, BaseBookingRepository, BookingMapper],
})
export class BookingPersistenceModule {}
