import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { BaseFormSubmissionRepository } from '@/form-submissions/persistence/base-form-submission.repository';
import { FormSubmissionEntity } from '@/form-submissions/persistence/entities/form-submission.entity';
import { FormSubmissionValueEntity } from '@/form-submissions/persistence/entities/form-submission-value.entity';
import { FormSubmissionMapper } from '@/form-submissions/persistence/mappers/form-submission.mapper';
import { FormSubmission } from '@/form-submissions/domain/form-submission';
import { QueryFormSubmissionDto } from '@/form-submissions/dto/query-form-submission.dto';

@Injectable()
export class FormSubmissionRepository implements BaseFormSubmissionRepository {
  constructor(
    @InjectRepository(FormSubmissionEntity)
    private readonly repo: Repository<FormSubmissionEntity>,
    @InjectRepository(FormSubmissionValueEntity)
    private readonly valueRepo: Repository<FormSubmissionValueEntity>,
  ) {}

  async create(data: FormSubmission): Promise<FormSubmission> {
    const saved = await this.repo.save(
      this.repo.create(FormSubmissionMapper.toPersistence(data)),
    );
    const withRelations = await this.repo.findOne({
      where: { id: saved.id },
      relations: ['service', 'customer', 'booking', 'values'],
    });
    return FormSubmissionMapper.toDomain(withRelations ?? saved);
  }

  async findAll(
    query: QueryFormSubmissionDto,
  ): Promise<{ data: FormSubmission[]; totalCount: number }> {
    const skip = query.skip ?? 0;
    const take = query.take ?? 20;

    const where: FindOptionsWhere<FormSubmissionEntity> = {};

    if (query.service_id !== undefined) {
      where.service_id = query.service_id;
    }
    if (query.customer_id !== undefined) {
      where.customer_id = query.customer_id;
    }
    if (query.booking_id !== undefined) {
      where.booking_id = query.booking_id;
    }

    const [entities, totalCount] = await this.repo.findAndCount({
      where,
      skip,
      take,
      order: { created_at: 'DESC' },
      relations: ['service', 'customer', 'booking', 'values'],
    });

    return {
      data: entities.map((e) => FormSubmissionMapper.toDomain(e)),
      totalCount,
    };
  }

  async findById(id: number): Promise<FormSubmission | null> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: ['service', 'customer', 'booking', 'values'],
    });
    return entity ? FormSubmissionMapper.toDomain(entity) : null;
  }

  async findByBookingId(bookingId: number): Promise<FormSubmission | null> {
    const entity = await this.repo.findOne({
      where: { booking_id: bookingId },
      relations: ['service', 'customer', 'booking', 'values'],
    });
    return entity ? FormSubmissionMapper.toDomain(entity) : null;
  }

  async findByCustomerId(customerId: number): Promise<FormSubmission[]> {
    const entities = await this.repo.find({
      where: { customer_id: customerId },
      order: { created_at: 'DESC' },
      relations: ['service', 'values'],
    });
    return entities.map((e) => FormSubmissionMapper.toDomain(e));
  }

  async updateBookingId(
    id: number,
    bookingId: number,
  ): Promise<FormSubmission> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Form Submission not found');

    await this.repo.update(id, { booking_id: bookingId });

    const updated = await this.repo.findOne({
      where: { id },
      relations: ['service', 'customer', 'booking', 'values'],
    });
    return FormSubmissionMapper.toDomain(updated!);
  }

  async updateQuotationId(
    id: number,
    quotationId: number,
  ): Promise<FormSubmission> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Form Submission not found');

    await this.repo.update(id, { quotation_id: quotationId });

    const updated = await this.repo.findOne({
      where: { id },
      relations: ['service', 'customer', 'booking', 'values'],
    });
    return FormSubmissionMapper.toDomain(updated!);
  }

  async saveValues(
    submissionId: number,
    values: {
      form_template_id: number;
      field_code: string;
      field_name: string;
      field_type: string;
      value: string | null;
    }[],
  ): Promise<void> {
    // Delete existing values and insert new ones
    await this.valueRepo.delete({ form_submission_id: submissionId });

    for (const val of values) {
      await this.valueRepo.save(
        this.valueRepo.create({
          form_submission_id: submissionId,
          form_template_id: val.form_template_id,
          field_code: val.field_code,
          field_name: val.field_name,
          field_type: val.field_type,
          value: val.value,
        }),
      );
    }
  }

  async remove(id: number): Promise<void> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Form Submission not found');
    await this.repo.softDelete(id);
  }
}
