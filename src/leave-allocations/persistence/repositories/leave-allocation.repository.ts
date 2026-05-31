import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { BaseLeaveAllocationRepository } from '@/leave-allocations/persistence/base-leave-allocation.repository';
import { LeaveAllocationEntity } from '@/leave-allocations/persistence/entities/leave-allocation.entity';
import { LeaveAllocationMapper } from '@/leave-allocations/persistence/mappers/leave-allocation.mapper';
import { LeaveAllocation } from '@/leave-allocations/domain/leave-allocation';
import { CreateAllocationInput } from '@/leave-allocations/domain/leave-allocation-inputs';
import { LeaveType } from '@/leave-requests/leave-requests.constants';

@Injectable()
export class LeaveAllocationRepository extends BaseLeaveAllocationRepository {
  constructor(
    @InjectRepository(LeaveAllocationEntity)
    private readonly repo: Repository<LeaveAllocationEntity>,
  ) {
    super();
  }

  async create(input: CreateAllocationInput): Promise<LeaveAllocation> {
    const entity = this.repo.create({
      employee_id: input.employee_id,
      leave_type: input.leave_type,
      amount: input.amount,
      source: input.source,
      reason: input.reason ?? null,
      granted_by: input.granted_by ?? null,
      created_by: input.created_by ?? input.granted_by ?? null,
      updated_by: input.created_by ?? input.granted_by ?? null,
    });
    const saved = await this.repo.save(entity);
    return LeaveAllocationMapper.toDomain(saved);
  }

  async sumByEmployeeAndType(employee_id: number, leave_type: LeaveType): Promise<number> {
    const raw = await this.repo
      .createQueryBuilder('a')
      .select('COALESCE(SUM(a.amount), 0)', 'sum')
      .where('a.employee_id = :employee_id', { employee_id })
      .andWhere('a.leave_type = :leave_type', { leave_type })
      .andWhere('a.deleted_at IS NULL')
      .getRawOne<{ sum: string }>();
    return Number(raw?.sum ?? 0);
  }

  async sumForUpdate(
    manager: EntityManager,
    employee_id: number,
    leave_type: LeaveType,
  ): Promise<number> {
    // Lock the matched rows (FOR UPDATE), then sum in memory. The lock — not
    // the aggregate — is the point: it serializes concurrent same-(emp,type)
    // submits so reserved totals can't be read stale (plan C3).
    const rows = await manager
      .getRepository(LeaveAllocationEntity)
      .createQueryBuilder('a')
      .setLock('pessimistic_write')
      .where('a.employee_id = :employee_id', { employee_id })
      .andWhere('a.leave_type = :leave_type', { leave_type })
      .andWhere('a.deleted_at IS NULL')
      .getMany();
    return rows.reduce((total, row) => total + row.amount, 0);
  }

  async listForEmployee(employee_id: number): Promise<LeaveAllocation[]> {
    const entities = await this.repo.find({
      where: { employee_id },
      order: { created_at: 'DESC', id: 'DESC' },
    });
    return entities.map(LeaveAllocationMapper.toDomain);
  }
}
