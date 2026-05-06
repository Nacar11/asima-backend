import { ServiceMilestoneTemplate } from '@/service-milestone-templates/domain/service-milestone-template';
import { ServiceMilestoneTemplateEntity } from '@/service-milestone-templates/persistence/entities/service-milestone-template.entity';
import { getCauser } from '@/utils/helpers/entity.helper';
import { ServiceMapper } from '@/services/persistence/mappers/service.mapper';
import { ServicePackageMapper } from '@/service-packages/persistence/mappers/service-package.mapper';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { ServiceMilestoneTemplateStatusEnum } from '@/service-milestone-templates/enums/service-milestone-template-status.enum';
import { MilestoneTypeEnum } from '@/booking-milestones/enums/milestone-type.enum';

export class ServiceMilestoneTemplateMapper {
  static toDomain(
    raw: ServiceMilestoneTemplateEntity,
  ): ServiceMilestoneTemplate {
    const domain = new ServiceMilestoneTemplate();
    domain.id = raw.id;
    domain.service_id = raw.service_id;
    domain.package_id = raw.package_id;
    domain.name = raw.name;
    domain.description = raw.description;
    domain.template_type = raw.template_type ?? MilestoneTypeEnum.MILESTONE;
    domain.category = raw.category ?? null;
    domain.response_type = raw.response_type ?? null;
    domain.measurement_unit = raw.measurement_unit ?? null;
    domain.is_required = raw.is_required ?? false;
    domain.sequence_order = raw.sequence_order;
    domain.estimated_duration_hours = raw.estimated_duration_hours
      ? Number(raw.estimated_duration_hours)
      : null;
    domain.estimated_duration_days = raw.estimated_duration_days;
    domain.payment_percent = Number(raw.payment_percent);
    domain.deliverables = raw.deliverables;
    domain.requires_customer_approval = raw.requires_customer_approval;
    domain.auto_approve_after_hours = raw.auto_approve_after_hours;
    domain.status = raw.status as ServiceMilestoneTemplateStatusEnum;

    if (raw.service) domain.service = ServiceMapper.toDomain(raw.service);
    if (raw.package)
      domain.package = ServicePackageMapper.toDomain(raw.package);
    if (raw.created_by) domain.created_by = getCauser(raw.created_by);
    if (raw.updated_by) domain.updated_by = getCauser(raw.updated_by);
    if (raw.deleted_by) domain.deleted_by = getCauser(raw.deleted_by);
    domain.created_at = raw.created_at;
    domain.updated_at = raw.updated_at;
    domain.deleted_at = raw.deleted_at;
    return domain;
  }

  static toPersistence(
    domain: ServiceMilestoneTemplate,
  ): ServiceMilestoneTemplateEntity {
    const entity = new ServiceMilestoneTemplateEntity();
    if (domain.id) entity.id = domain.id;
    entity.service_id = domain.service_id;
    entity.package_id = domain.package_id ?? null;
    entity.name = domain.name;
    entity.description = domain.description ?? null;
    entity.template_type = domain.template_type ?? MilestoneTypeEnum.MILESTONE;
    entity.category = domain.category ?? null;
    entity.response_type = domain.response_type ?? null;
    entity.measurement_unit = domain.measurement_unit ?? null;
    entity.is_required = domain.is_required ?? false;
    entity.sequence_order = domain.sequence_order;
    entity.estimated_duration_hours = domain.estimated_duration_hours ?? null;
    entity.estimated_duration_days = domain.estimated_duration_days ?? null;
    entity.payment_percent = domain.payment_percent ?? 0;
    entity.deliverables = domain.deliverables ?? null;
    entity.requires_customer_approval =
      domain.requires_customer_approval ?? true;
    entity.auto_approve_after_hours = domain.auto_approve_after_hours ?? 48;
    entity.status = domain.status ?? ServiceMilestoneTemplateStatusEnum.ACTIVE;

    if (domain.created_by) {
      entity.created_by = UserMapper.toPersistence(domain.created_by as User);
    }
    if (domain.updated_by) {
      entity.updated_by = UserMapper.toPersistence(domain.updated_by as User);
    }
    if (domain.deleted_by) {
      entity.deleted_by = UserMapper.toPersistence(domain.deleted_by as User);
    }

    entity.created_at = domain.created_at;
    entity.updated_at = domain.updated_at;
    entity.deleted_at = domain.deleted_at ?? null;
    return entity;
  }
}
