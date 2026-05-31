import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveAllocationEntity } from '@/leave-allocations/persistence/entities/leave-allocation.entity';
import { LeaveAllocationRepository } from '@/leave-allocations/persistence/repositories/leave-allocation.repository';
import { BaseLeaveAllocationRepository } from '@/leave-allocations/persistence/base-leave-allocation.repository';

@Module({
  imports: [TypeOrmModule.forFeature([LeaveAllocationEntity])],
  providers: [
    LeaveAllocationRepository,
    { provide: BaseLeaveAllocationRepository, useClass: LeaveAllocationRepository },
  ],
  exports: [BaseLeaveAllocationRepository, LeaveAllocationRepository, TypeOrmModule],
})
export class LeaveAllocationPersistenceModule {}
