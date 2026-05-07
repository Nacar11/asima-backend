import { TimeEntry } from '@/time-entries/domain/time-entry';
import { TimeEntryEntity } from '@/time-entries/persistence/entities/time-entry.entity';

export class TimeEntryMapper {
  static toDomain(raw: TimeEntryEntity): TimeEntry {
    const entry = new TimeEntry();
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

  static toPersistence(domain: Partial<TimeEntry>): TimeEntryEntity {
    const entity = new TimeEntryEntity();
    if (domain.id !== undefined) entity.id = domain.id;
    if (domain.employee_id !== undefined) entity.employee_id = domain.employee_id;
    if (domain.work_date !== undefined) entity.work_date = domain.work_date;
    if (domain.time_in !== undefined) entity.time_in = domain.time_in;
    if (domain.time_out !== undefined) entity.time_out = domain.time_out;
    if (domain.source !== undefined) entity.source = domain.source;
    if (domain.status !== undefined) entity.status = domain.status;
    if (domain.notes !== undefined) entity.notes = domain.notes;
    if (domain.created_by !== undefined) entity.created_by = domain.created_by;
    if (domain.updated_by !== undefined) entity.updated_by = domain.updated_by;
    if (domain.deleted_by !== undefined) entity.deleted_by = domain.deleted_by;
    return entity;
  }
}
