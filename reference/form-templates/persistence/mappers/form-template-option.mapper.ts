import { FormTemplateOption } from '@/form-templates/domain/form-template-option';
import { FormTemplateOptionEntity } from '../entities/form-template-option.entity';

export class FormTemplateOptionMapper {
  static toDomain(entity: FormTemplateOptionEntity): FormTemplateOption {
    const domain = new FormTemplateOption();
    domain.id = entity.id;
    domain.form_template_id = entity.form_template_id;
    domain.label = entity.label;
    domain.value = entity.value;
    domain.sequence_order = entity.sequence_order;
    domain.is_default = entity.is_default;
    domain.is_active = entity.is_active;
    domain.created_at = entity.created_at;
    return domain;
  }

  static toPersistence(
    domain: Partial<FormTemplateOption>,
  ): Partial<FormTemplateOptionEntity> {
    const entity = new FormTemplateOptionEntity();
    if (domain.id !== undefined) entity.id = domain.id;
    if (domain.form_template_id !== undefined)
      entity.form_template_id = domain.form_template_id;
    if (domain.label !== undefined) entity.label = domain.label;
    if (domain.value !== undefined) entity.value = domain.value;
    if (domain.sequence_order !== undefined)
      entity.sequence_order = domain.sequence_order;
    if (domain.is_default !== undefined) entity.is_default = domain.is_default;
    if (domain.is_active !== undefined) entity.is_active = domain.is_active;
    return entity;
  }
}
