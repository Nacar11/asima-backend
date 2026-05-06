import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingMilestonePersistenceModule } from './persistence/persistence.module';
import { BookingMilestonesService } from './booking-milestones.service';
import { BookingMilestonesSchedulerService } from './booking-milestones-scheduler.service';
import { BookingMilestonesController } from './booking-milestones.controller';
import { BookingsModule } from '@/bookings/bookings.module';
import { ServiceMilestoneTemplatePersistenceModule } from '@/service-milestone-templates/persistence/persistence.module';
import { BookingMilestoneEntity } from './persistence/entities/booking-milestone.entity';
import { NotificationsModule } from '@/notifications/notifications.module';

/**
 * Booking Milestones Module.
 *
 * Provides milestone tracking functionality for service bookings.
 * Handles milestone creation from templates, status transitions, and approval workflows.
 * Includes a scheduler service for automatic milestone approval.
 *
 * @version 1
 * @since 1.0.0
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([BookingMilestoneEntity]),
    BookingMilestonePersistenceModule,
    forwardRef(() => BookingsModule),
    ServiceMilestoneTemplatePersistenceModule,
    NotificationsModule,
  ],
  controllers: [BookingMilestonesController],
  providers: [BookingMilestonesService, BookingMilestonesSchedulerService],
  exports: [BookingMilestonesService, BookingMilestonesSchedulerService],
})
export class BookingMilestonesModule {}
