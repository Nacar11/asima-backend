import { WorkScheduleRecord } from '@/work-schedules/domain/work-schedule';
import { WorkScheduleEntity } from '@/work-schedules/persistence/entities/work-schedule.entity';

/**
 * Read-path only. Reconstitution of the rich `WorkSchedule` aggregate happens
 * **use-case-side** from the record each mutate path already holds (no
 * `toAggregate`/`findAggregateById` — blueprint §3.2 rule 3a).
 *
 * `toDomain`'s field-assignment order drives the JSON key order — keep it ==
 * legacy so the wire stays byte-identical.
 */
export class WorkScheduleMapper {
  static toDomain(raw: WorkScheduleEntity): WorkScheduleRecord {
    const ws = new WorkScheduleRecord();
    ws.id = raw.id;
    ws.employee_id = raw.employee_id;
    ws.day_of_week = raw.day_of_week;
    ws.expected_in = raw.expected_in;
    ws.expected_out = raw.expected_out;
    ws.break_minutes = raw.break_minutes;
    ws.break_start = raw.break_start;
    ws.effective_from = raw.effective_from;
    ws.effective_to = raw.effective_to;
    ws.created_by = raw.created_by;
    ws.updated_by = raw.updated_by;
    ws.deleted_by = raw.deleted_by;
    ws.created_at = raw.created_at;
    ws.updated_at = raw.updated_at;
    ws.deleted_at = raw.deleted_at;
    return ws;
  }
}
