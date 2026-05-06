import { FormTemplateValidationRule } from '@/form-templates/domain/form-template-validation-rule';
import { FormTemplateValidationRuleEntity } from '../entities/form-template-validation-rule.entity';

export class FormTemplateValidationRuleMapper {
  static toDomain(
    entity: FormTemplateValidationRuleEntity,
  ): FormTemplateValidationRule {
    const domain = new FormTemplateValidationRule();
    domain.id = entity.id;
    domain.form_template_id = entity.form_template_id;
    domain.rule_type = entity.rule_type;
    domain.rule_value = entity.rule_value;
    domain.error_message = entity.error_message;
    domain.created_at = entity.created_at;
    return domain;
  }

  static toPersistence(
    domain: Partial<FormTemplateValidationRule>,
  ): Partial<FormTemplateValidationRuleEntity> {
    const entity = new FormTemplateValidationRuleEntity();
    if (domain.id !== undefined) entity.id = domain.id;
    if (domain.form_template_id !== undefined)
      entity.form_template_id = domain.form_template_id;
    if (domain.rule_type !== undefined) entity.rule_type = domain.rule_type;
    if (domain.rule_value !== undefined) entity.rule_value = domain.rule_value;
    if (domain.error_message !== undefined)
      entity.error_message = domain.error_message;
    return entity;
  }
}
