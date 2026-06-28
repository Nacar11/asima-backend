import { TimeEntryRecord } from '@/time-entries/domain/time-entry';
import { TimeEntryEntity } from '@/time-entries/persistence/entities/time-entry.entity';

/**
 * Read-path only. Reconstitution of the rich `TimeEntry` aggregate happens
 * **use-case-side** from the record each mutate path already holds (no
 * `toAggregate`/`findAggregateById` — blueprint §3.2 rule 3a, decision #10).
 *
 * `toDomain`'s field-assignment order drives the JSON key order — keep it ==
 * legacy so the wire stays byte-identical.
 */
export class TimeEntryMapper {
  static toDomain(raw: TimeEntryEntity): TimeEntryRecord {
    const entry = new TimeEntryRecord();
    entry.id = raw.id;
    entry.employee_id = raw.employee_id;
    entry.work_date = raw.work_date;
    entry.time_in = raw.time_in;
    entry.time_out = raw.time_out;
    entry.source = raw.source;
    entry.status = raw.status;
    entry.notes = raw.notes;
    entry.created_by = raw.created_by;
    entry.updated_by = raw.updated_by;
    entry.deleted_by = raw.deleted_by;
    entry.created_at = raw.created_at;
    entry.updated_at = raw.updated_at;
    entry.deleted_at = raw.deleted_at;
    return entry;
  }
}
