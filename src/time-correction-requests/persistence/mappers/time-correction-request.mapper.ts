import { TimeCorrectionRequestRecord } from '@/time-correction-requests/domain/time-correction-request';
import { TimeCorrectionRequest } from '@/time-correction-requests/domain/time-correction-request.aggregate';
import { TimeCorrectionRequestListItem } from '@/time-correction-requests/domain/time-correction-request-list-item';
import { TimeCorrectionRequestEntity } from '@/time-correction-requests/persistence/entities/time-correction-request.entity';

export class TimeCorrectionRequestMapper {
  /** Write-path load — reconstitute the rich aggregate (validates its VOs). */
  static toAggregate(raw: TimeCorrectionRequestEntity): TimeCorrectionRequest {
    return TimeCorrectionRequest.reconstitute(TimeCorrectionRequestMapper.toDomain(raw));
  }

  /**
   * Read-path — the plain data record the assembler serializes. Field-
   * assignment order drives the JSON key order; keep it == legacy so the wire
   * stays byte-identical.
   */
  static toDomain(raw: TimeCorrectionRequestEntity): TimeCorrectionRequestRecord {
    const tc = new TimeCorrectionRequestRecord();
    tc.id = raw.id;
    tc.employee_id = raw.employee_id;
    tc.target_entry_id = raw.target_entry_id;
    // Original times resolved from the joined target entry (when loaded) —
    // lets approver UIs render the original→proposed diff. NULL for a new-log
    // correction or when the relation wasn't joined.
    tc.original_time_in = raw.target_entry ? raw.target_entry.time_in : null;
    tc.original_time_out = raw.target_entry ? raw.target_entry.time_out : null;
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
   * List read-model: domain fields plus the requester / approver display names
   * from the joined relations. Null only if a join wasn't loaded.
   */
  static toListItem(raw: TimeCorrectionRequestEntity): TimeCorrectionRequestListItem {
    const item = TimeCorrectionRequestMapper.toDomain(raw) as TimeCorrectionRequestListItem;
    item.employee_name = raw.employee
      ? `${raw.employee.first_name} ${raw.employee.last_name}`
      : null;
    item.l1_approver_name = raw.l1_approver
      ? `${raw.l1_approver.first_name} ${raw.l1_approver.last_name}`
      : null;
    item.l2_approver_name = raw.l2_approver
      ? `${raw.l2_approver.first_name} ${raw.l2_approver.last_name}`
      : null;
    return item;
  }
}
