import { Module } from '@nestjs/common';
import { LeaveAllocationsService } from '@/leave-allocations/leave-allocations.service';
import { LeaveAllocationPersistenceModule } from '@/leave-allocations/persistence/persistence.module';
import { AdminLeaveAllocationsController } from '@/leave-allocations/controllers/admin-leave-allocations.controller';
import { UserPersistenceModule } from '@/users/persistence/persistence.module';
import { LeaveRequestsModule } from '@/leave-requests/leave-requests.module';
import { DomainEventPublisher } from '@/utils/domain/domain-event-publisher';

@Module({
  imports: [
    LeaveAllocationPersistenceModule,
    UserPersistenceModule,
    // For LeaveBalanceService (admin balance view). LeaveRequestsModule depends
    // only on the allocation *persistence* module, so this is acyclic.
    LeaveRequestsModule,
  ],
  controllers: [AdminLeaveAllocationsController],
  // DomainEventPublisher: drains the grant creation event (EventEmitter2 is global).
  providers: [LeaveAllocationsService, DomainEventPublisher],
  exports: [LeaveAllocationsService],
})
export class LeaveAllocationsModule {}
