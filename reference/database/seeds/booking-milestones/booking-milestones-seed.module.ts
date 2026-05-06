import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingMilestoneEntity } from '@/booking-milestones/persistence/entities/booking-milestone.entity';
import { BookingMilestonesSeedService } from '@/database/seeds/booking-milestones/booking-milestones-seed.service';
import { BookingEntity } from '@/bookings/persistence/entities/booking.entity';
import { ServiceMilestoneTemplateEntity } from '@/service-milestone-templates/persistence/entities/service-milestone-template.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

/**
 * Seed module for booking milestones
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      BookingMilestoneEntity,
      BookingEntity,
      ServiceMilestoneTemplateEntity,
      UserEntity,
    ]),
  ],
  providers: [BookingMilestonesSeedService],
  exports: [BookingMilestonesSeedService],
})
export class BookingMilestonesSeedModule {}
