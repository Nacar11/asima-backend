import { LeaveAllocationRecord } from '@/leave-allocations/domain/leave-allocation';
import { LeaveAllocationEntity } from '@/leave-allocations/persistence/entities/leave-allocation.entity';

export class LeaveAllocationMapper {
  /**
   * Read-path mapping: TypeORM entity → pure data record. The assembler copies
   * record keys onto the response DTO, so this assignment order is what drives
   * the JSON key order — keep it stable for wire parity (plan S2).
   *
   * No `toAggregate` / `toPersistence`: the ledger has no load-mutate-save
   * path, and the repository builds the insert entity inline (plan decision #2,
   * matching the leave-requests mapper shape).
   */
  static toDomain(raw: LeaveAllocationEntity): LeaveAllocationRecord {
    const a = new LeaveAllocationRecord();
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
}
