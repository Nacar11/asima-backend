import { Module } from '@nestjs/common';
import { LeaveRequestsService } from '@/leave-requests/leave-requests.service';
import { LeaveDayCountService } from '@/leave-requests/leave-day-count.service';
import { LeaveRequestPersistenceModule } from '@/leave-requests/persistence/persistence.module';
import { AdminLeaveRequestsController } from '@/leave-requests/controllers/admin-leave-requests.controller';
import { MeLeaveRequestsController } from '@/leave-requests/controllers/me-leave-requests.controller';
import { LeaveRequestsController } from '@/leave-requests/controllers/leave-requests.controller';
import { ApprovalChainsModule } from '@/approval-chains/approval-chains.module';
import { UserPersistenceModule } from '@/users/persistence/persistence.module';
import { WorkSchedulePersistenceModule } from '@/work-schedules/persistence/persistence.module';

@Module({
  imports: [
    LeaveRequestPersistenceModule,
    ApprovalChainsModule,
    UserPersistenceModule,
    WorkSchedulePersistenceModule,
  ],
  controllers: [AdminLeaveRequestsController, MeLeaveRequestsController, LeaveRequestsController],
  providers: [LeaveRequestsService, LeaveDayCountService],
  exports: [LeaveRequestsService, LeaveDayCountService, LeaveRequestPersistenceModule],
})
export class LeaveRequestsModule {}
