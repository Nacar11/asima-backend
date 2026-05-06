import { FormSubmission } from '@/form-submissions/domain/form-submission';
import { QueryFormSubmissionDto } from '@/form-submissions/dto/query-form-submission.dto';

export abstract class BaseFormSubmissionRepository {
  abstract create(
    data: Omit<
      FormSubmission,
      'id' | 'created_at' | 'updated_at' | 'deleted_at'
    >,
  ): Promise<FormSubmission>;

  abstract findAll(
    query: QueryFormSubmissionDto,
  ): Promise<{ data: FormSubmission[]; totalCount: number }>;

  abstract findById(id: number): Promise<FormSubmission | null>;

  abstract findByBookingId(bookingId: number): Promise<FormSubmission | null>;

  abstract findByCustomerId(customerId: number): Promise<FormSubmission[]>;

  abstract updateBookingId(
    id: number,
    bookingId: number,
  ): Promise<FormSubmission>;

  abstract updateQuotationId(
    id: number,
    quotationId: number,
  ): Promise<FormSubmission>;

  abstract saveValues(
    submissionId: number,
    values: {
      form_template_id: number;
      field_code: string;
      field_name: string;
      field_type: string;
      value: string | null;
    }[],
  ): Promise<void>;

  abstract remove(id: number): Promise<void>;
}
