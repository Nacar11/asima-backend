import { Module } from '@nestjs/common';
import { MemberSchedulesService } from '@/member-schedules/member-schedules.service';
import { MemberSchedulesController } from '@/member-schedules/member-schedules.controller';
import { MemberSchedulesPersistenceModule } from '@/member-schedules/persistence/persistence.module';
import { SellerMembersModule } from '@/seller-members/seller-members.module';

@Module({
  imports: [MemberSchedulesPersistenceModule, SellerMembersModule],
  controllers: [MemberSchedulesController],
  providers: [MemberSchedulesService],
  exports: [MemberSchedulesService, MemberSchedulesPersistenceModule],
})
export class MemberSchedulesModule {}
