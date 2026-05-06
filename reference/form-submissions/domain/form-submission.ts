import { FormSubmissionValue } from './form-submission-value';

export class FormSubmission {
  id: number;
  service_id: number;
  customer_id: number;
  booking_id: number | null; // Linked after booking created
  quotation_id: number | null; // Linked when quotation created
  submitted_at: Date;

  // Relations
  values: FormSubmissionValue[];

  // Audit fields
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}
