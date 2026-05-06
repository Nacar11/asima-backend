import { FormFieldTypeEnum } from '../enums/form-field-type.enum';
import { FormTemplateValidationRule } from './form-template-validation-rule';
import { FormTemplateOption } from './form-template-option';

export class FormTemplate {
  id: number;
  service_id: number;
  name: string; // "Quantity", "Brand", "Size", etc.
  code: string; // "quantity", "brand", "size"
  field_type: FormFieldTypeEnum;
  is_required: boolean;
  placeholder: string | null;
  help_text: string | null;
  default_value: string | null;
  sequence_order: number;
  is_active: boolean;

  // Relations
  validation_rules: FormTemplateValidationRule[];
  options: FormTemplateOption[];

  // Audit fields
  created_by: number | null;
  created_at: Date;
  updated_by: number | null;
  updated_at: Date;
  deleted_by?: number | null;
  deleted_at?: Date | null;
}
