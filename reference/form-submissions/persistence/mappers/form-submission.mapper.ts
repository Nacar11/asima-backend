import { FormSubmission } from '@/form-submissions/domain/form-submission';
import { FormSubmissionEntity } from '../entities/form-submission.entity';
import { FormSubmissionValueMapper } from './form-submission-value.mapper';

export class FormSubmissionMapper {
  static toDomain(entity: FormSubmissionEntity): FormSubmission {
    const domain = new FormSubmission();
    domain.id = entity.id;
    domain.service_id = entity.service_id;
    domain.customer_id = entity.customer_id;
    domain.booking_id = entity.booking_id;
    domain.quotation_id = entity.quotation_id;
    domain.submitted_at = entity.submitted_at;
    domain.values = entity.values
      ? entity.values.map(FormSubmissionValueMapper.toDomain)
      : [];
    domain.created_at = entity.created_at;
    domain.updated_at = entity.updated_at;
    domain.deleted_at = entity.deleted_at ?? null;
    return domain;
  }

  static toPersistence(
    domain: Partial<FormSubmission>,
  ): Partial<FormSubmissionEntity> {
    const entity = new FormSubmissionEntity();
    if (domain.id !== undefined) entity.id = domain.id;
    if (domain.service_id !== undefined) entity.service_id = domain.service_id;
    if (domain.customer_id !== undefined)
      entity.customer_id = domain.customer_id;
    if (domain.booking_id !== undefined) entity.booking_id = domain.booking_id;
    if (domain.quotation_id !== undefined)
      entity.quotation_id = domain.quotation_id;
    if (domain.submitted_at !== undefined)
      entity.submitted_at = domain.submitted_at;
    return entity;
  }
}
