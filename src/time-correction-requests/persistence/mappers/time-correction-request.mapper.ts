import { TimeCorrectionRequest } from '@/time-correction-requests/domain/time-correction-request';
import { TimeCorrectionRequestListItem } from '@/time-correction-requests/domain/time-correction-request-list-item';
import { TimeCorrectionRequestEntity } from '@/time-correction-requests/persistence/entities/time-correction-request.entity';

export class TimeCorrectionRequestMapper {
  static toDomain(raw: TimeCorrectionRequestEntity): TimeCorrectionRequest {
    const tc = new TimeCorrectionRequest();
    tc.id = raw.id;
    tc.employee_id = raw.employee_id;
    tc.target_entry_id = raw.target_entry_id;
    tc.work_date = raw.work_date;
    tc.proposed_time_in = raw.proposed_time_in;
    tc.proposed_time_out = raw.proposed_time_out;
    tc.reason = raw.reason;
    tc.status = raw.status;
    tc.submitted_at = raw.submitted_at;
    tc.decided_at = raw.decided_at;
    tc.decided_by = raw.decided_by;
    tc.decision_note = raw.decision_note;
    tc.decision_path = raw.decision_path;
    tc.cancelled_at = raw.cancelled_at;
    tc.cancelled_by = raw.cancelled_by;
    tc.l1_approver_id = raw.l1_approver_id;
    tc.l2_approver_id = raw.l2_approver_id;
    tc.created_by = raw.created_by;
    tc.updated_by = raw.updated_by;
    tc.deleted_by = raw.deleted_by;
    tc.created_at = raw.created_at;
    tc.updated_at = raw.updated_at;
    tc.deleted_at = raw.deleted_at;
    return tc;
  }

  /**
   * List read-model: domain fields plus the requester's display name from
   * the joined `employee` relation. Null only if the join wasn't loaded.
   */
  static toListItem(raw: TimeCorrectionRequestEntity): TimeCorrectionRequestListItem {
    const item = TimeCorrectionRequestMapper.toDomain(raw) as TimeCorrectionRequestListItem;
    item.employee_name = raw.employee
      ? `${raw.employee.first_name} ${raw.employee.last_name}`
      : null;
    return item;
  }
}
