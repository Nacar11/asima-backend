import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellerScheduleEntity } from '@/seller-schedules/persistence/entities/seller-schedule.entity';
import { BaseSellerScheduleRepository } from '@/seller-schedules/persistence/base-seller-schedule.repository';
import { SellerScheduleRepository } from '@/seller-schedules/persistence/repositories/seller-schedule.repository';

@Module({
  imports: [TypeOrmModule.forFeature([SellerScheduleEntity])],
  providers: [
    {
      provide: BaseSellerScheduleRepository,
      useClass: SellerScheduleRepository,
    },
  ],
  exports: [BaseSellerScheduleRepository],
})
export class SellerSchedulesPersistenceModule {}
