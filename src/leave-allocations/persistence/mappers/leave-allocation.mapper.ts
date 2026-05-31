import { LeaveAllocation } from '@/leave-allocations/domain/leave-allocation';
import { LeaveAllocationEntity } from '@/leave-allocations/persistence/entities/leave-allocation.entity';

export class LeaveAllocationMapper {
  static toDomain(raw: LeaveAllocationEntity): LeaveAllocation {
    const a = new LeaveAllocation();
    a.id = raw.id;
    a.employee_id = raw.employee_id;
    a.leave_type = raw.leave_type;
    a.amount = raw.amount;
    a.source = raw.source;
    a.reason = raw.reason;
    a.granted_by = raw.granted_by;
    a.created_by = raw.created_by;
    a.updated_by = raw.updated_by;
    a.deleted_by = raw.deleted_by;
    a.created_at = raw.created_at;
    a.updated_at = raw.updated_at;
    a.deleted_at = raw.deleted_at;
    return a;
  }

  static toPersistence(domain: Partial<LeaveAllocation>): LeaveAllocationEntity {
    const entity = new LeaveAllocationEntity();
    if (domain.id !== undefined) entity.id = domain.id;
    if (domain.employee_id !== undefined) entity.employee_id = domain.employee_id;
    if (domain.leave_type !== undefined) entity.leave_type = domain.leave_type;
    if (domain.amount !== undefined) entity.amount = domain.amount;
    if (domain.source !== undefined) entity.source = domain.source;
    if (domain.reason !== undefined) entity.reason = domain.reason;
    if (domain.granted_by !== undefined) entity.granted_by = domain.granted_by;
    if (domain.created_by !== undefined) entity.created_by = domain.created_by;
    if (domain.updated_by !== undefined) entity.updated_by = domain.updated_by;
    if (domain.deleted_by !== undefined) entity.deleted_by = domain.deleted_by;
    return entity;
  }
}
