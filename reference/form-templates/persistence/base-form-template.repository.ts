import { FormTemplate } from '@/form-templates/domain/form-template';
import { QueryFormTemplateDto } from '@/form-templates/dto/query-form-template.dto';

export abstract class BaseFormTemplateRepository {
  abstract create(
    data: Omit<FormTemplate, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>,
  ): Promise<FormTemplate>;

  abstract findAll(
    query: QueryFormTemplateDto,
  ): Promise<{ data: FormTemplate[]; totalCount: number }>;

  abstract findById(id: number): Promise<FormTemplate | null>;

  abstract findByServiceId(serviceId: number): Promise<FormTemplate[]>;

  abstract findByServiceAndCode(
    serviceId: number,
    code: string,
    excludeId?: number,
  ): Promise<FormTemplate | null>;

  abstract update(
    id: number,
    payload: Partial<FormTemplate>,
  ): Promise<FormTemplate>;

  abstract remove(id: number, causerId?: number): Promise<void>;

  abstract saveValidationRules(
    templateId: number,
    rules: {
      id?: number;
      rule_type: string;
      rule_value: string;
      error_message?: string | null;
    }[],
  ): Promise<void>;

  abstract saveOptions(
    templateId: number,
    options: {
      id?: number;
      label: string;
      value: string;
      sequence_order?: number;
      is_default?: boolean;
      is_active?: boolean;
    }[],
  ): Promise<void>;
}
