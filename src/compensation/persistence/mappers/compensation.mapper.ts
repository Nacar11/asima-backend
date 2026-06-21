import { COMPENSATION_CURRENCY } from '@/compensation/compensation.constants';
import { Compensation } from '@/compensation/domain/compensation';
import { CompensationEntity } from '@/compensation/persistence/entities/compensation.entity';

export class CompensationMapper {
  static toDomain(raw: CompensationEntity): Compensation {
    const c = new Compensation();
    c.id = raw.id;
    c.employee_id = raw.employee_id;
    c.monthly_salary = raw.monthly_salary;
    c.hourly_rate = raw.hourly_rate;
    c.hourly_rate_is_overridden = raw.hourly_rate_is_overridden;
    // Single-tenant constant surfaced on every read payload (not a column).
    c.currency = COMPENSATION_CURRENCY;
    c.effective_from = raw.effective_from;
    c.effective_to = raw.effective_to;
    c.created_by = raw.created_by;
    c.updated_by = raw.updated_by;
    c.deleted_by = raw.deleted_by;
    c.created_at = raw.created_at;
    c.updated_at = raw.updated_at;
    c.deleted_at = raw.deleted_at;
    return c;
  }

  static toPersistence(domain: Partial<Compensation>): CompensationEntity {
    const entity = new CompensationEntity();
    if (domain.id !== undefined) entity.id = domain.id;
    if (domain.employee_id !== undefined) entity.employee_id = domain.employee_id;
    if (domain.monthly_salary !== undefined) entity.monthly_salary = domain.monthly_salary;
    if (domain.hourly_rate !== undefined) entity.hourly_rate = domain.hourly_rate;
    if (domain.hourly_rate_is_overridden !== undefined)
      entity.hourly_rate_is_overridden = domain.hourly_rate_is_overridden;
    if (domain.effective_from !== undefined) entity.effective_from = domain.effective_from;
    if (domain.effective_to !== undefined) entity.effective_to = domain.effective_to;
    if (domain.created_by !== undefined) entity.created_by = domain.created_by;
    if (domain.updated_by !== undefined) entity.updated_by = domain.updated_by;
    if (domain.deleted_by !== undefined) entity.deleted_by = domain.deleted_by;
    return entity;
  }
}
