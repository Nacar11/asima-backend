import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberScheduleEntity } from '@/member-schedules/persistence/entities/member-schedule.entity';
import { BaseMemberScheduleRepository } from '@/member-schedules/persistence/base-member-schedule.repository';
import { MemberScheduleRepository } from '@/member-schedules/persistence/repositories/member-schedule.repository';

@Module({
  imports: [TypeOrmModule.forFeature([MemberScheduleEntity])],
  providers: [
    {
      provide: BaseMemberScheduleRepository,
      useClass: MemberScheduleRepository,
    },
  ],
  exports: [BaseMemberScheduleRepository],
})
export class MemberSchedulesPersistenceModule {}
