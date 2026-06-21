import { CompensationAudit } from '@/compensation/domain/compensation-audit';
import { CompensationAuditEntity } from '@/compensation/persistence/entities/compensation-audit.entity';

export class CompensationAuditMapper {
  static toDomain(raw: CompensationAuditEntity): CompensationAudit {
    const a = new CompensationAudit();
    a.id = raw.id;
    a.compensation_id = raw.compensation_id;
    a.employee_id = raw.employee_id;
    a.action = raw.action;
    a.before_monthly_salary = raw.before_monthly_salary;
    a.after_monthly_salary = raw.after_monthly_salary;
    a.before_hourly_rate = raw.before_hourly_rate;
    a.after_hourly_rate = raw.after_hourly_rate;
    a.before_effective_from = raw.before_effective_from;
    a.after_effective_from = raw.after_effective_from;
    a.actor_id = raw.actor_id;
    a.created_at = raw.created_at;
    return a;
  }
}
