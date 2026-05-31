import { LeaveRequest } from '@/leave-requests/domain/leave-request';
import { LeaveRequestListItem } from '@/leave-requests/domain/leave-request-list-item';
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

  /**
   * List read-model: the domain fields plus the requester's display name
   * from the joined `employee` relation. Used by the paginated list query
   * so the HR table resolves names without a second round-trip. Null only
   * if the join was not loaded / the user is gone.
   */
  static toListItem(raw: LeaveRequestEntity): LeaveRequestListItem {
    const item = LeaveRequestMapper.toDomain(raw) as LeaveRequestListItem;
    item.employee_name = raw.employee
      ? `${raw.employee.first_name} ${raw.employee.last_name}`
      : null;
    return item;
  }
}
