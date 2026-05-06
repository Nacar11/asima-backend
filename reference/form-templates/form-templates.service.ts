import {
  ConflictException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { BaseFormTemplateRepository } from '@/form-templates/persistence/base-form-template.repository';
import { CreateFormTemplateDto } from '@/form-templates/dto/create-form-template.dto';
import { UpdateFormTemplateDto } from '@/form-templates/dto/update-form-template.dto';
import { QueryFormTemplateDto } from '@/form-templates/dto/query-form-template.dto';
import { FormTemplate } from '@/form-templates/domain/form-template';
import { ServicesService } from '@/services/services.service';
import { User } from '@/users/domain/user';
import { FormFieldTypeEnum } from './enums/form-field-type.enum';

@Injectable()
export class FormTemplatesService {
  constructor(
    private readonly repository: BaseFormTemplateRepository,
    @Inject(forwardRef(() => ServicesService))
    private readonly servicesService: ServicesService,
  ) {}

  private async ensureCodeUnique(
    serviceId: number,
    code: string,
    excludeId?: number,
  ) {
    const existing = await this.repository.findByServiceAndCode(
      serviceId,
      code,
      excludeId,
    );
    if (existing) {
      throw new ConflictException(
        'Form template code already exists for this service',
      );
    }
  }

  async create(
    dto: CreateFormTemplateDto,
    causer: User,
  ): Promise<FormTemplate> {
    // Verify service exists
    await this.servicesService.findById(dto.service_id);

    // Ensure code is unique within service
    await this.ensureCodeUnique(dto.service_id, dto.code);

    const model = Object.assign(new FormTemplate(), {
      service_id: dto.service_id,
      name: dto.name,
      code: dto.code,
      field_type: dto.field_type ?? FormFieldTypeEnum.TEXT,
      is_required: dto.is_required ?? false,
      placeholder: dto.placeholder ?? null,
      help_text: dto.help_text ?? null,
      default_value: dto.default_value ?? null,
      sequence_order: dto.sequence_order ?? 0,
      is_active: dto.is_active ?? true,
      validation_rules: [],
      options: [],
      created_by: causer?.id ?? null,
      updated_by: causer?.id ?? null,
    });

    const created = await this.repository.create(model);

    // Handle validation rules if provided
    if (dto.validation_rules && dto.validation_rules.length > 0) {
      await this.repository.saveValidationRules(
        created.id,
        dto.validation_rules.map((rule) => ({
          rule_type: rule.rule_type,
          rule_value: rule.rule_value,
          error_message: rule.error_message ?? null,
        })),
      );
    }

    // Handle options if provided
    if (dto.options && dto.options.length > 0) {
      await this.repository.saveOptions(
        created.id,
        dto.options.map((opt, idx) => ({
          label: opt.label,
          value: opt.value,
          sequence_order: opt.sequence_order ?? idx,
          is_default: opt.is_default ?? false,
          is_active: opt.is_active ?? true,
        })),
      );
    }

    // Refresh to get relations
    if (
      (dto.validation_rules && dto.validation_rules.length > 0) ||
      (dto.options && dto.options.length > 0)
    ) {
      return this.findById(created.id);
    }

    return created;
  }

  async findAll(query: QueryFormTemplateDto) {
    return this.repository.findAll(query);
  }

  async findById(id: number): Promise<FormTemplate> {
    const item = await this.repository.findById(id);
    if (!item) throw new NotFoundException('Form Template not found');
    return item;
  }

  async findByServiceId(serviceId: number): Promise<FormTemplate[]> {
    return this.repository.findByServiceId(serviceId);
  }

  async update(
    id: number,
    dto: UpdateFormTemplateDto,
    causer: User,
  ): Promise<FormTemplate> {
    const existing = await this.findById(id);

    if (dto.code !== undefined && dto.code !== existing.code) {
      await this.ensureCodeUnique(existing.service_id, dto.code, id);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { validation_rules: _, options: __, ...updateData } = dto;
    const updated = await this.repository.update(id, {
      ...updateData,
      updated_by: causer?.id ?? null,
    });

    // Handle validation rules if provided
    if (dto.validation_rules !== undefined) {
      await this.repository.saveValidationRules(
        id,
        dto.validation_rules.map((rule) => ({
          id: rule.id,
          rule_type: rule.rule_type,
          rule_value: rule.rule_value,
          error_message: rule.error_message ?? null,
        })),
      );
    }

    // Handle options if provided
    if (dto.options !== undefined) {
      await this.repository.saveOptions(
        id,
        dto.options.map((opt, idx) => ({
          id: opt.id,
          label: opt.label,
          value: opt.value,
          sequence_order: opt.sequence_order ?? idx,
          is_default: opt.is_default ?? false,
          is_active: opt.is_active ?? true,
        })),
      );
    }

    // Refresh to get updated relations
    if (dto.validation_rules !== undefined || dto.options !== undefined) {
      return this.findById(id);
    }

    return updated;
  }

  async remove(id: number, causer: User): Promise<void> {
    await this.findById(id);
    await this.repository.remove(id, causer?.id);
  }

  async reorder(dto: {
    templates: Array<{ id: number; sequence_order: number }>;
  }): Promise<FormTemplate[]> {
    const { templates } = dto;

    // Update sequence_order for each template
    const updatePromises = templates.map(({ id, sequence_order }) =>
      this.repository.update(id, { sequence_order }),
    );

    await Promise.all(updatePromises);

    // Get service ID from the first template
    if (templates.length > 0) {
      const firstTemplate = await this.findById(templates[0].id);
      return await this.findByServiceId(firstTemplate.service_id);
    }

    return [];
  }
}
