import { FormTemplate } from '@/form-templates/domain/form-template';
import { FormTemplateEntity } from '../entities/form-template.entity';
import { FormTemplateValidationRuleMapper } from './form-template-validation-rule.mapper';
import { FormTemplateOptionMapper } from './form-template-option.mapper';

export class FormTemplateMapper {
  static toDomain(entity: FormTemplateEntity): FormTemplate {
    const domain = new FormTemplate();
    domain.id = entity.id;
    domain.service_id = entity.service_id;
    domain.name = entity.name;
    domain.code = entity.code;
    domain.field_type = entity.field_type;
    domain.is_required = entity.is_required;
    domain.placeholder = entity.placeholder;
    domain.help_text = entity.help_text;
    domain.default_value = entity.default_value;
    domain.sequence_order = entity.sequence_order;
    domain.is_active = entity.is_active;
    domain.validation_rules = entity.validation_rules
      ? entity.validation_rules.map(FormTemplateValidationRuleMapper.toDomain)
      : [];
    domain.options = entity.options
      ? entity.options.map(FormTemplateOptionMapper.toDomain)
      : [];
    domain.created_by = entity.created_by?.id ?? null;
    domain.created_at = entity.created_at;
    domain.updated_by = entity.updated_by?.id ?? null;
    domain.updated_at = entity.updated_at;
    domain.deleted_by = entity.deleted_by?.id ?? null;
    domain.deleted_at = entity.deleted_at ?? null;
    return domain;
  }

  static toPersistence(
    domain: Partial<FormTemplate>,
  ): Partial<FormTemplateEntity> {
    const entity = new FormTemplateEntity();
    if (domain.id !== undefined) entity.id = domain.id;
    if (domain.service_id !== undefined) entity.service_id = domain.service_id;
    if (domain.name !== undefined) entity.name = domain.name;
    if (domain.code !== undefined) entity.code = domain.code;
    if (domain.field_type !== undefined) entity.field_type = domain.field_type;
    if (domain.is_required !== undefined)
      entity.is_required = domain.is_required;
    if (domain.placeholder !== undefined)
      entity.placeholder = domain.placeholder;
    if (domain.help_text !== undefined) entity.help_text = domain.help_text;
    if (domain.default_value !== undefined)
      entity.default_value = domain.default_value;
    if (domain.sequence_order !== undefined)
      entity.sequence_order = domain.sequence_order;
    if (domain.is_active !== undefined) entity.is_active = domain.is_active;
    return entity;
  }
}
