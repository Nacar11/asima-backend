import { Module } from '@nestjs/common';
import { WorkSchedulesService } from '@/work-schedules/work-schedules.service';
import { ScheduleChangeService } from '@/work-schedules/schedule-change.service';
import { WorkSchedulePersistenceModule } from '@/work-schedules/persistence/persistence.module';
import { LeaveRequestPersistenceModule } from '@/leave-requests/persistence/persistence.module';
import { TimeCorrectionRequestPersistenceModule } from '@/time-correction-requests/persistence/persistence.module';
import { AdminWorkSchedulesController } from '@/work-schedules/controllers/admin-work-schedules.controller';
import { AdminScheduleChangesController } from '@/work-schedules/controllers/admin-schedule-changes.controller';
import { MeWorkSchedulesController } from '@/work-schedules/controllers/me-work-schedules.controller';
import { DomainEventPublisher } from '@/utils/domain/domain-event-publisher';

@Module({
  // Leave + time-correction persistence are imported one-way (schedule →
  // leave/TC) so the cascade orchestrator can read/cancel their requests. The
  // dependency never points the other direction (plan Architecture decisions).
  imports: [
    WorkSchedulePersistenceModule,
    LeaveRequestPersistenceModule,
    TimeCorrectionRequestPersistenceModule,
  ],
  controllers: [
    AdminWorkSchedulesController,
    AdminScheduleChangesController,
    MeWorkSchedulesController,
  ],
  providers: [WorkSchedulesService, ScheduleChangeService, DomainEventPublisher],
  exports: [WorkSchedulesService, ScheduleChangeService, WorkSchedulePersistenceModule],
})
export class WorkSchedulesModule {}
