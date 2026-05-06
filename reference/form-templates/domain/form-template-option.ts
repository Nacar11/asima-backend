export class FormTemplateOption {
  id: number;
  form_template_id: number;
  label: string; // Display label
  value: string; // Stored value
  sequence_order: number;
  is_default: boolean;
  is_active: boolean;
  created_at: Date;
}
