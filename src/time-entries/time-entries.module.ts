import { Module } from '@nestjs/common';
import { TimeEntriesService } from '@/time-entries/time-entries.service';
import { TimeEntryPersistenceModule } from '@/time-entries/persistence/persistence.module';
import { AdminTimeEntriesController } from '@/time-entries/controllers/admin-time-entries.controller';
import { MeTimeEntriesController } from '@/time-entries/controllers/me-time-entries.controller';

@Module({
  imports: [TimeEntryPersistenceModule],
  controllers: [AdminTimeEntriesController, MeTimeEntriesController],
  providers: [TimeEntriesService],
  exports: [TimeEntriesService, TimeEntryPersistenceModule],
})
export class TimeEntriesModule {}
