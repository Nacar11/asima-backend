import { LeaveRequest } from '@/leave-requests/domain/leave-request';
import { LeaveRequestEntity } from '@/leave-requests/persistence/entities/leave-request.entity';

export class LeaveRequestMapper {
  static toDomain(raw: LeaveRequestEntity): LeaveRequest {
    const lr = new LeaveRequest();
    lr.id = raw.id;
    lr.employee_id = raw.employee_id;
    lr.leave_type = raw.leave_type;
    lr.start_date = raw.start_date;
    lr.end_date = raw.end_date;
    lr.reason = raw.reason;
    lr.status = raw.status;
    lr.submitted_at = raw.submitted_at;
    lr.decided_at = raw.decided_at;
    lr.decided_by = raw.decided_by;
    lr.decision_note = raw.decision_note;
    lr.decision_path = raw.decision_path;
    lr.cancelled_at = raw.cancelled_at;
    lr.cancelled_by = raw.cancelled_by;
    lr.l1_approver_id = raw.l1_approver_id;
    lr.l2_approver_id = raw.l2_approver_id;
    lr.created_by = raw.created_by;
    lr.updated_by = raw.updated_by;
    lr.deleted_by = raw.deleted_by;
    lr.created_at = raw.created_at;
    lr.updated_at = raw.updated_at;
    lr.deleted_at = raw.deleted_at;
    return lr;
  }
}
