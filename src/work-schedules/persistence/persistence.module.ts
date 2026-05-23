import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkScheduleEntity } from '@/work-schedules/persistence/entities/work-schedule.entity';
import { WorkScheduleRepository } from '@/work-schedules/persistence/repositories/work-schedule.repository';
import { BaseWorkScheduleRepository } from '@/work-schedules/persistence/base-work-schedule.repository';

@Module({
  imports: [TypeOrmModule.forFeature([WorkScheduleEntity])],
  providers: [
    WorkScheduleRepository,
    { provide: BaseWorkScheduleRepository, useClass: WorkScheduleRepository },
  ],
  exports: [BaseWorkScheduleRepository, WorkScheduleRepository, TypeOrmModule],
})
export class WorkSchedulePersistenceModule {}
