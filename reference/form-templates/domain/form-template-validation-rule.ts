export class FormTemplateValidationRule {
  id: number;
  form_template_id: number;
  rule_type: string; // 'min', 'max', 'pattern', 'min_length', 'max_length', 'required'
  rule_value: string; // The value (stored as string, parsed by type)
  error_message: string | null;
  created_at: Date;
}
