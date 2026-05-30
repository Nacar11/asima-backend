import { Module } from '@nestjs/common';
import { ApprovalsController } from './controllers/approvals.controller';
import { ApprovalsService } from './approvals.service';
import { LeaveRequestsModule } from '@/leave-requests/leave-requests.module';
import { TimeCorrectionRequestsModule } from '@/time-correction-requests/time-correction-requests.module';
import { UserPersistenceModule } from '@/users/persistence/persistence.module';

/**
 * Approvals inbox module. Aggregates pending leave + time-correction
 * requests, scoped by chain placement (or ApproveAny / system_admin),
 * with employee names resolved for display.
 */
@Module({
  imports: [LeaveRequestsModule, TimeCorrectionRequestsModule, UserPersistenceModule],
  controllers: [ApprovalsController],
  providers: [ApprovalsService],
})
export class ApprovalsModule {}
