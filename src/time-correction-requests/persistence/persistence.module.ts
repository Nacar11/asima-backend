import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeCorrectionRequestEntity } from '@/time-correction-requests/persistence/entities/time-correction-request.entity';
import { TimeCorrectionRequestRepository } from '@/time-correction-requests/persistence/repositories/time-correction-request.repository';
import { BaseTimeCorrectionRequestRepository } from '@/time-correction-requests/persistence/base-time-correction-request.repository';

@Module({
  imports: [TypeOrmModule.forFeature([TimeCorrectionRequestEntity])],
  providers: [
    TimeCorrectionRequestRepository,
    {
      provide: BaseTimeCorrectionRequestRepository,
      useClass: TimeCorrectionRequestRepository,
    },
  ],
  exports: [BaseTimeCorrectionRequestRepository, TimeCorrectionRequestRepository, TypeOrmModule],
})
export class TimeCorrectionRequestPersistenceModule {}
