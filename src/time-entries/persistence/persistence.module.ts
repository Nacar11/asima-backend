import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeEntryEntity } from '@/time-entries/persistence/entities/time-entry.entity';
import { TimeEntryRepository } from '@/time-entries/persistence/repositories/time-entry.repository';
import { BaseTimeEntryRepository } from '@/time-entries/persistence/base-time-entry.repository';

@Module({
  imports: [TypeOrmModule.forFeature([TimeEntryEntity])],
  providers: [
    TimeEntryRepository,
    { provide: BaseTimeEntryRepository, useClass: TimeEntryRepository },
  ],
  exports: [BaseTimeEntryRepository, TimeEntryRepository, TypeOrmModule],
})
export class TimeEntryPersistenceModule {}
