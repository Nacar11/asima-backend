import { Module } from '@nestjs/common';
import { TimeCorrectionRequestsService } from '@/time-correction-requests/time-correction-requests.service';
import { TimeCorrectionRequestPersistenceModule } from '@/time-correction-requests/persistence/persistence.module';
import { AdminTimeCorrectionRequestsController } from '@/time-correction-requests/controllers/admin-time-correction-requests.controller';
import { MeTimeCorrectionRequestsController } from '@/time-correction-requests/controllers/me-time-correction-requests.controller';
import { TimeCorrectionRequestsController } from '@/time-correction-requests/controllers/time-correction-requests.controller';
import { ApprovalChainsModule } from '@/approval-chains/approval-chains.module';
import { UserPersistenceModule } from '@/users/persistence/persistence.module';
import { TimeEntriesModule } from '@/time-entries/time-entries.module';

/**
 * Time-correction module. Imports `TimeEntriesModule` for the
 * cross-module `applyCorrection` write on final approval (Q6) — the DI
 * boundary keeps the time-entries repo out of this service.
 */
@Module({
  imports: [
    TimeCorrectionRequestPersistenceModule,
    ApprovalChainsModule,
    UserPersistenceModule,
    TimeEntriesModule,
  ],
  controllers: [
    AdminTimeCorrectionRequestsController,
    MeTimeCorrectionRequestsController,
    TimeCorrectionRequestsController,
  ],
  providers: [TimeCorrectionRequestsService],
  exports: [TimeCorrectionRequestsService, TimeCorrectionRequestPersistenceModule],
})
export class TimeCorrectionRequestsModule {}
