import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository, Not, In } from 'typeorm';
import { BaseFormTemplateRepository } from '@/form-templates/persistence/base-form-template.repository';
import { FormTemplateEntity } from '@/form-templates/persistence/entities/form-template.entity';
import { FormTemplateValidationRuleEntity } from '@/form-templates/persistence/entities/form-template-validation-rule.entity';
import { FormTemplateOptionEntity } from '@/form-templates/persistence/entities/form-template-option.entity';
import { FormTemplateMapper } from '@/form-templates/persistence/mappers/form-template.mapper';
import { FormTemplate } from '@/form-templates/domain/form-template';
import { QueryFormTemplateDto } from '@/form-templates/dto/query-form-template.dto';

@Injectable()
export class FormTemplateRepository implements BaseFormTemplateRepository {
  constructor(
    @InjectRepository(FormTemplateEntity)
    private readonly repo: Repository<FormTemplateEntity>,
    @InjectRepository(FormTemplateValidationRuleEntity)
    private readonly ruleRepo: Repository<FormTemplateValidationRuleEntity>,
    @InjectRepository(FormTemplateOptionEntity)
    private readonly optionRepo: Repository<FormTemplateOptionEntity>,
  ) {}

  async create(data: FormTemplate): Promise<FormTemplate> {
    const saved = await this.repo.save(
      this.repo.create(FormTemplateMapper.toPersistence(data)),
    );
    const withRelations = await this.repo.findOne({
      where: { id: saved.id },
      relations: [
        'service',
        'validation_rules',
        'options',
        'created_by',
        'updated_by',
      ],
    });
    return FormTemplateMapper.toDomain(withRelations ?? saved);
  }

  async findAll(
    query: QueryFormTemplateDto,
  ): Promise<{ data: FormTemplate[]; totalCount: number }> {
    const skip = query.skip ?? 0;
    const take = query.take ?? 20;

    const where: FindOptionsWhere<FormTemplateEntity> = {};

    if (query.service_id !== undefined) {
      where.service_id = query.service_id;
    }
    if (query.is_active !== undefined) {
      where.is_active = query.is_active;
    }
    if (query.field_type !== undefined) {
      where.field_type = query.field_type;
    }
    if (query.search) {
      where.name = ILike(`%${query.search}%`);
    }

    const [entities, totalCount] = await this.repo.findAndCount({
      where,
      skip,
      take,
      order: { sequence_order: 'ASC', id: 'ASC' },
      relations: [
        'service',
        'validation_rules',
        'options',
        'created_by',
        'updated_by',
      ],
    });

    return {
      data: entities.map((e) => FormTemplateMapper.toDomain(e)),
      totalCount,
    };
  }

  async findById(id: number): Promise<FormTemplate | null> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: [
        'service',
        'validation_rules',
        'options',
        'created_by',
        'updated_by',
      ],
    });
    return entity ? FormTemplateMapper.toDomain(entity) : null;
  }

  async findByServiceId(serviceId: number): Promise<FormTemplate[]> {
    const entities = await this.repo.find({
      where: { service_id: serviceId, is_active: true },
      order: { sequence_order: 'ASC', id: 'ASC' },
      relations: ['validation_rules', 'options'],
    });
    return entities.map((e) => FormTemplateMapper.toDomain(e));
  }

  async findByServiceAndCode(
    serviceId: number,
    code: string,
    excludeId?: number,
  ): Promise<FormTemplate | null> {
    const where: FindOptionsWhere<FormTemplateEntity> = {
      service_id: serviceId,
      code,
    };
    if (excludeId) where.id = Not(excludeId);
    const entity = await this.repo.findOne({ where });
    return entity ? FormTemplateMapper.toDomain(entity) : null;
  }

  async update(
    id: number,
    payload: Partial<FormTemplate>,
  ): Promise<FormTemplate> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Form Template not found');

    const updated = await this.repo.save(
      this.repo.create(
        FormTemplateMapper.toPersistence({
          ...FormTemplateMapper.toDomain(existing),
          ...payload,
        }),
      ),
    );
    const withRelations = await this.repo.findOne({
      where: { id: updated.id },
      relations: [
        'service',
        'validation_rules',
        'options',
        'created_by',
        'updated_by',
      ],
    });
    return FormTemplateMapper.toDomain(withRelations ?? updated);
  }

  async remove(id: number, causerId?: number): Promise<void> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Form Template not found');
    await this.repo.save({
      id,
      deleted_at: new Date(),
      deleted_by: causerId ? ({ id: causerId } as any) : null,
      is_active: false,
    });
  }

  async saveValidationRules(
    templateId: number,
    rules: {
      id?: number;
      rule_type: string;
      rule_value: string;
      error_message?: string | null;
    }[],
  ): Promise<void> {
    // Get existing rules
    const existing = await this.ruleRepo.find({
      where: { form_template_id: templateId },
    });
    const existingIds = existing.map((e) => e.id);
    const incomingIds = rules.filter((r) => r.id).map((r) => r.id!);

    // Delete removed rules
    const toDelete = existingIds.filter((id) => !incomingIds.includes(id));
    if (toDelete.length > 0) {
      await this.ruleRepo.delete({ id: In(toDelete) });
    }

    // Upsert rules
    for (const rule of rules) {
      if (rule.id) {
        await this.ruleRepo.update(rule.id, {
          rule_type: rule.rule_type,
          rule_value: rule.rule_value,
          error_message: rule.error_message ?? null,
        });
      } else {
        await this.ruleRepo.save(
          this.ruleRepo.create({
            form_template_id: templateId,
            rule_type: rule.rule_type,
            rule_value: rule.rule_value,
            error_message: rule.error_message ?? null,
          }),
        );
      }
    }
  }

  async saveOptions(
    templateId: number,
    options: {
      id?: number;
      label: string;
      value: string;
      sequence_order?: number;
      is_default?: boolean;
      is_active?: boolean;
    }[],
  ): Promise<void> {
    // Get existing options
    const existing = await this.optionRepo.find({
      where: { form_template_id: templateId },
    });
    const existingIds = existing.map((e) => e.id);
    const incomingIds = options.filter((o) => o.id).map((o) => o.id!);

    // Delete removed options
    const toDelete = existingIds.filter((id) => !incomingIds.includes(id));
    if (toDelete.length > 0) {
      await this.optionRepo.delete({ id: In(toDelete) });
    }

    // Upsert options
    for (let idx = 0; idx < options.length; idx++) {
      const opt = options[idx];
      if (opt.id) {
        await this.optionRepo.update(opt.id, {
          label: opt.label,
          value: opt.value,
          sequence_order: opt.sequence_order ?? idx,
          is_default: opt.is_default ?? false,
          is_active: opt.is_active ?? true,
        });
      } else {
        await this.optionRepo.save(
          this.optionRepo.create({
            form_template_id: templateId,
            label: opt.label,
            value: opt.value,
            sequence_order: opt.sequence_order ?? idx,
            is_default: opt.is_default ?? false,
            is_active: opt.is_active ?? true,
          }),
        );
      }
    }
  }
}
