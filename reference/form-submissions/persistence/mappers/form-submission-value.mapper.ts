import { FormSubmissionValue } from '@/form-submissions/domain/form-submission-value';
import { FormSubmissionValueEntity } from '../entities/form-submission-value.entity';

export class FormSubmissionValueMapper {
  static toDomain(entity: FormSubmissionValueEntity): FormSubmissionValue {
    const domain = new FormSubmissionValue();
    domain.id = entity.id;
    domain.form_submission_id = entity.form_submission_id;
    domain.form_template_id = entity.form_template_id;
    domain.field_code = entity.field_code;
    domain.field_name = entity.field_name;
    domain.field_type = entity.field_type;
    domain.value = entity.value;
    domain.created_at = entity.created_at;
    return domain;
  }

  static toPersistence(
    domain: Partial<FormSubmissionValue>,
  ): Partial<FormSubmissionValueEntity> {
    const entity = new FormSubmissionValueEntity();
    if (domain.id !== undefined) entity.id = domain.id;
    if (domain.form_submission_id !== undefined)
      entity.form_submission_id = domain.form_submission_id;
    if (domain.form_template_id !== undefined)
      entity.form_template_id = domain.form_template_id;
    if (domain.field_code !== undefined) entity.field_code = domain.field_code;
    if (domain.field_name !== undefined) entity.field_name = domain.field_name;
    if (domain.field_type !== undefined) entity.field_type = domain.field_type;
    if (domain.value !== undefined) entity.value = domain.value;
    return entity;
  }
}
