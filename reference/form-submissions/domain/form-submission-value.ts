export class FormSubmissionValue {
  id: number;
  form_submission_id: number;
  form_template_id: number;
  field_code: string; // Denormalized for easy querying
  field_name: string; // Denormalized for display
  field_type: string; // Denormalized for parsing
  value: string | null; // Stored as string, parsed based on field_type
  created_at: Date;
}
