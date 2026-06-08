import { Module } from '@nestjs/common';
import { LeaveAllocationsService } from '@/leave-allocations/leave-allocations.service';
import { LeaveAllocationPersistenceModule } from '@/leave-allocations/persistence/persistence.module';
import { AdminLeaveAllocationsController } from '@/leave-allocations/controllers/admin-leave-allocations.controller';
import { UserPersistenceModule } from '@/users/persistence/persistence.module';
import { LeaveRequestsModule } from '@/leave-requests/leave-requests.module';

@Module({
  imports: [
    LeaveAllocationPersistenceModule,
    UserPersistenceModule,
    // For LeaveBalanceService (admin balance view). LeaveRequestsModule depends
    // only on the allocation *persistence* module, so this is acyclic.
    LeaveRequestsModule,
  ],
  controllers: [AdminLeaveAllocationsController],
  providers: [LeaveAllocationsService],
  exports: [LeaveAllocationsService],
})
export class LeaveAllocationsModule {}
