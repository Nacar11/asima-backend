import { Module } from '@nestjs/common';
import { LeaveRequestsService } from '@/leave-requests/leave-requests.service';
import { LeaveDayCountService } from '@/leave-requests/leave-day-count.service';
import { LeaveBalanceService } from '@/leave-requests/leave-balance.service';
import { LeaveRequestPersistenceModule } from '@/leave-requests/persistence/persistence.module';
import { AdminLeaveRequestsController } from '@/leave-requests/controllers/admin-leave-requests.controller';
import { MeLeaveRequestsController } from '@/leave-requests/controllers/me-leave-requests.controller';
import { MeLeaveBalancesController } from '@/leave-requests/controllers/me-leave-balances.controller';
import { LeaveRequestsController } from '@/leave-requests/controllers/leave-requests.controller';
import { ApprovalChainsModule } from '@/approval-chains/approval-chains.module';
import { UserPersistenceModule } from '@/users/persistence/persistence.module';
import { WorkSchedulePersistenceModule } from '@/work-schedules/persistence/persistence.module';
import { LeaveAllocationPersistenceModule } from '@/leave-allocations/persistence/persistence.module';
import { StorageModule } from '@/storage/storage.module';
import { DomainEventPublisher } from '@/utils/domain/domain-event-publisher';

@Module({
  imports: [
    LeaveRequestPersistenceModule,
    ApprovalChainsModule,
    UserPersistenceModule,
    WorkSchedulePersistenceModule,
    LeaveAllocationPersistenceModule,
    StorageModule,
  ],
  controllers: [
    AdminLeaveRequestsController,
    MeLeaveRequestsController,
    MeLeaveBalancesController,
    LeaveRequestsController,
  ],
  providers: [
    LeaveRequestsService,
    LeaveDayCountService,
    LeaveBalanceService,
    DomainEventPublisher,
  ],
  exports: [
    LeaveRequestsService,
    LeaveDayCountService,
    LeaveBalanceService,
    LeaveRequestPersistenceModule,
  ],
})
export class LeaveRequestsModule {}
