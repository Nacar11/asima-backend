import { Module } from '@nestjs/common';
import { ApprovalsController } from './controllers/approvals.controller';
import { ApprovalsService } from './approvals.service';
import { LeaveRequestsModule } from '@/leave-requests/leave-requests.module';
import { UserPersistenceModule } from '@/users/persistence/persistence.module';

/**
 * Approvals inbox module. Phase 3 wires leave: the service reads pending
 * leave requests (scoped by chain placement or ApproveAny) and resolves
 * employee names for display. Time-correction joins the same shape in
 * Phase 5.
 */
@Module({
  imports: [LeaveRequestsModule, UserPersistenceModule],
  controllers: [ApprovalsController],
  providers: [ApprovalsService],
})
export class ApprovalsModule {}
