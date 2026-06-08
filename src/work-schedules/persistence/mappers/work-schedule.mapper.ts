import { WorkSchedule } from '@/work-schedules/domain/work-schedule';
import { WorkScheduleEntity } from '@/work-schedules/persistence/entities/work-schedule.entity';

export class WorkScheduleMapper {
  static toDomain(raw: WorkScheduleEntity): WorkSchedule {
    const ws = new WorkSchedule();
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

  static toPersistence(domain: Partial<WorkSchedule>): WorkScheduleEntity {
    const entity = new WorkScheduleEntity();
    if (domain.id !== undefined) entity.id = domain.id;
    if (domain.employee_id !== undefined) entity.employee_id = domain.employee_id;
    if (domain.day_of_week !== undefined) entity.day_of_week = domain.day_of_week;
    if (domain.expected_in !== undefined) entity.expected_in = domain.expected_in;
    if (domain.expected_out !== undefined) entity.expected_out = domain.expected_out;
    if (domain.break_minutes !== undefined) entity.break_minutes = domain.break_minutes;
    if (domain.break_start !== undefined) entity.break_start = domain.break_start;
    if (domain.effective_from !== undefined) entity.effective_from = domain.effective_from;
    if (domain.effective_to !== undefined) entity.effective_to = domain.effective_to;
    if (domain.created_by !== undefined) entity.created_by = domain.created_by;
    if (domain.updated_by !== undefined) entity.updated_by = domain.updated_by;
    if (domain.deleted_by !== undefined) entity.deleted_by = domain.deleted_by;
    return entity;
  }
}
