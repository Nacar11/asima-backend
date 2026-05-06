import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingMilestoneEntity } from './entities/booking-milestone.entity';
import { BaseBookingMilestoneRepository } from './base-booking-milestone.repository';
import { BookingMilestoneRepository } from './repositories/booking-milestone.repository';
import { BookingMilestoneMapper } from './mappers/booking-milestone.mapper';

/**
 * Booking Milestones Persistence Module.
 *
 * Provides data access layer for booking milestones including repository
 * implementations and TypeORM entity registration. Maps abstract repository
 * to concrete implementation for dependency injection.
 *
 * @version 1
 * @since 1.0.0
 */
@Module({
  imports: [TypeOrmModule.forFeature([BookingMilestoneEntity])],
  providers: [
    BookingMilestoneMapper,
    {
      provide: BaseBookingMilestoneRepository,
      useClass: BookingMilestoneRepository,
    },
  ],
  exports: [
    TypeOrmModule,
    BaseBookingMilestoneRepository,
    BookingMilestoneMapper,
  ],
})
export class BookingMilestonePersistenceModule {}
