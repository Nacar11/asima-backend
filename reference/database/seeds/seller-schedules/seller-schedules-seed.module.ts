import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellerScheduleEntity } from '@/seller-schedules/persistence/entities/seller-schedule.entity';
import { SellerSchedulesSeedService } from '@/database/seeds/seller-schedules/seller-schedules-seed.service';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

/**
 * Seed module for seller schedules
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([SellerScheduleEntity, SellerEntity, UserEntity]),
  ],
  providers: [SellerSchedulesSeedService],
  exports: [SellerSchedulesSeedService],
})
export class SellerSchedulesSeedModule {}
