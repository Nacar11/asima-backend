import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveRequestEntity } from '@/leave-requests/persistence/entities/leave-request.entity';
import { LeaveRequestRepository } from '@/leave-requests/persistence/repositories/leave-request.repository';
import { BaseLeaveRequestRepository } from '@/leave-requests/persistence/base-leave-request.repository';

@Module({
  imports: [TypeOrmModule.forFeature([LeaveRequestEntity])],
  providers: [
    LeaveRequestRepository,
    { provide: BaseLeaveRequestRepository, useClass: LeaveRequestRepository },
  ],
  exports: [BaseLeaveRequestRepository, LeaveRequestRepository, TypeOrmModule],
})
export class LeaveRequestPersistenceModule {}
