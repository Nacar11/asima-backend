import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BaseFormSubmissionRepository } from '@/form-submissions/persistence/base-form-submission.repository';
import { CreateFormSubmissionDto } from '@/form-submissions/dto/create-form-submission.dto';
import { QueryFormSubmissionDto } from '@/form-submissions/dto/query-form-submission.dto';
import { FormSubmission } from '@/form-submissions/domain/form-submission';
import { ServicesService } from '@/services/services.service';
import { FormTemplatesService } from '@/form-templates/form-templates.service';
import { User } from '@/users/domain/user';

@Injectable()
export class FormSubmissionsService {
  constructor(
    private readonly repository: BaseFormSubmissionRepository,
    private readonly servicesService: ServicesService,
    private readonly formTemplatesService: FormTemplatesService,
  ) {}

  async create(
    dto: CreateFormSubmissionDto,
    causer: User,
  ): Promise<FormSubmission> {
    // Verify service exists
    await this.servicesService.findById(dto.service_id);

    // Get form templates for this service to validate and denormalize
    const templates = await this.formTemplatesService.findByServiceId(
      dto.service_id,
    );
    const templateMap = new Map(templates.map((t) => [t.id, t]));

    // Validate and prepare values with denormalized data
    const preparedValues: {
      form_template_id: number;
      field_code: string;
      field_name: string;
      field_type: string;
      value: string | null;
    }[] = [];

    for (const val of dto.values) {
      const template = templateMap.get(val.form_template_id);
      if (!template) {
        throw new BadRequestException(
          `Form template ${val.form_template_id} not found for this service`,
        );
      }

      // Verify field_code matches
      if (template.code !== val.field_code) {
        throw new BadRequestException(
          `Field code mismatch: expected ${template.code}, got ${val.field_code}`,
        );
      }

      preparedValues.push({
        form_template_id: val.form_template_id,
        field_code: template.code,
        field_name: template.name,
        field_type: template.field_type,
        value: val.value ?? null,
      });
    }

    // Create submission
    const model = Object.assign(new FormSubmission(), {
      service_id: dto.service_id,
      customer_id: causer.id,
      booking_id: dto.booking_id ?? null,
      quotation_id: dto.quotation_id ?? null,
      submitted_at: new Date(),
      values: [],
    });

    const created = await this.repository.create(model);

    // Save values
    if (preparedValues.length > 0) {
      await this.repository.saveValues(created.id, preparedValues);
    }

    // Return with values
    return this.findById(created.id);
  }

  async findAll(query: QueryFormSubmissionDto) {
    return this.repository.findAll(query);
  }

  async findById(id: number): Promise<FormSubmission> {
    const item = await this.repository.findById(id);
    if (!item) throw new NotFoundException('Form Submission not found');
    return item;
  }

  async findByBookingId(bookingId: number): Promise<FormSubmission | null> {
    return this.repository.findByBookingId(bookingId);
  }

  async findByCustomerId(customerId: number): Promise<FormSubmission[]> {
    return this.repository.findByCustomerId(customerId);
  }

  async linkToBooking(id: number, bookingId: number): Promise<FormSubmission> {
    await this.findById(id); // Verify exists
    return this.repository.updateBookingId(id, bookingId);
  }

  /**
   * Create a copy of an existing form submission linked to another booking.
   * Used for recurring preventive bookings: each booking in the recurrence group
   * gets its own form_submission row with booking_id set (so booking_id is never null).
   *
   * @param sourceSubmissionId - ID of the form submission to copy (e.g. the first in the group)
   * @param bookingId - Booking ID to link the new submission to
   * @param causer - User (for customer_id)
   * @returns The new form submission with same values and booking_id = bookingId
   */
  async createCopyForBooking(
    sourceSubmissionId: number,
    bookingId: number,
    causer: User,
  ): Promise<FormSubmission> {
    const source = await this.findById(sourceSubmissionId);
    if (!source.values?.length) {
      return this.repository
        .create(
          Object.assign(new FormSubmission(), {
            service_id: source.service_id,
            customer_id: causer.id,
            booking_id: bookingId,
            quotation_id: null,
            submitted_at: new Date(),
            values: [],
          }),
        )
        .then((created) => this.findById(created.id));
    }
    const values = source.values.map((v) => ({
      form_template_id: v.form_template_id,
      field_code: v.field_code,
      value: v.value ?? null,
    }));
    return this.create(
      {
        service_id: source.service_id,
        booking_id: bookingId,
        values,
      },
      causer,
    );
  }

  async linkToQuotation(
    id: number,
    quotationId: number,
  ): Promise<FormSubmission> {
    await this.findById(id); // Verify exists
    return this.repository.updateQuotationId(id, quotationId);
  }

  async remove(id: number): Promise<void> {
    await this.findById(id); // Verify exists
    await this.repository.remove(id);
  }
}
