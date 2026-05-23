import { Module } from '@nestjs/common';
import { WorkSchedulesService } from '@/work-schedules/work-schedules.service';
import { WorkSchedulePersistenceModule } from '@/work-schedules/persistence/persistence.module';
import { AdminWorkSchedulesController } from '@/work-schedules/controllers/admin-work-schedules.controller';
import { MeWorkSchedulesController } from '@/work-schedules/controllers/me-work-schedules.controller';

@Module({
  imports: [WorkSchedulePersistenceModule],
  controllers: [AdminWorkSchedulesController, MeWorkSchedulesController],
  providers: [WorkSchedulesService],
  exports: [WorkSchedulesService, WorkSchedulePersistenceModule],
})
export class WorkSchedulesModule {}
