import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository, Not } from 'typeorm';
import { BaseServiceMilestoneTemplateRepository } from '@/service-milestone-templates/persistence/base-service-milestone-template.repository';
import { ServiceMilestoneTemplateEntity } from '@/service-milestone-templates/persistence/entities/service-milestone-template.entity';
import { ServiceMilestoneTemplateMapper } from '@/service-milestone-templates/persistence/mappers/service-milestone-template.mapper';
import { ServiceMilestoneTemplate } from '@/service-milestone-templates/domain/service-milestone-template';
import { QueryServiceMilestoneTemplateDto } from '@/service-milestone-templates/dto/query-service-milestone-template.dto';
import { ServiceMilestoneTemplateStatusEnum } from '@/service-milestone-templates/enums/service-milestone-template-status.enum';

@Injectable()
export class ServiceMilestoneTemplateRepository
  implements BaseServiceMilestoneTemplateRepository
{
  constructor(
    @InjectRepository(ServiceMilestoneTemplateEntity)
    private readonly repo: Repository<ServiceMilestoneTemplateEntity>,
  ) {}

  async findByServiceAndSequence(
    serviceId: number,
    sequenceOrder: number,
    excludeId?: number,
  ): Promise<ServiceMilestoneTemplate | null> {
    const where: FindOptionsWhere<ServiceMilestoneTemplateEntity> = {
      service_id: serviceId,
      sequence_order: sequenceOrder,
    };
    if (excludeId) where.id = Not(excludeId);
    const entity = await this.repo.findOne({ where });
    return entity ? ServiceMilestoneTemplateMapper.toDomain(entity) : null;
  }

  async create(
    data: ServiceMilestoneTemplate,
  ): Promise<ServiceMilestoneTemplate> {
    const saved = await this.repo.save(
      this.repo.create(ServiceMilestoneTemplateMapper.toPersistence(data)),
    );
    const withRelations = await this.repo.findOne({
      where: { id: saved.id },
      relations: [
        'service',
        'package',
        'created_by',
        'updated_by',
        'deleted_by',
      ],
    });
    return ServiceMilestoneTemplateMapper.toDomain(withRelations ?? saved);
  }

  async findAll(
    query: QueryServiceMilestoneTemplateDto,
  ): Promise<{ data: ServiceMilestoneTemplate[]; totalCount: number }> {
    const skip = query.skip ?? 0;
    const take = query.take ?? 20;

    // Build where clause with AND conditions (single object for AND, array for OR)
    const where: FindOptionsWhere<ServiceMilestoneTemplateEntity> = {};

    if (query.search) {
      const like = ILike(`%${query.search}%`);
      where.name = like;
    }
    if (query.service_id !== undefined) {
      where.service_id = query.service_id;
    }
    if (query.template_type !== undefined) {
      where.template_type = query.template_type;
    }
    if (query.package_id !== undefined) {
      where.package_id = query.package_id;
    }
    if (query.requires_customer_approval !== undefined) {
      where.requires_customer_approval = query.requires_customer_approval;
    }
    if (query.status !== undefined) {
      where.status = query.status;
    }

    const [entities, totalCount] = await this.repo.findAndCount({
      where: Object.keys(where).length > 0 ? where : undefined,
      skip,
      take,
      order: { sequence_order: 'ASC' },
      relations: [
        'service',
        'package',
        'created_by',
        'updated_by',
        'deleted_by',
      ],
    });

    return {
      data: entities.map((e) => ServiceMilestoneTemplateMapper.toDomain(e)),
      totalCount,
    };
  }

  async findById(id: number): Promise<ServiceMilestoneTemplate | null> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: [
        'service',
        'package',
        'created_by',
        'updated_by',
        'deleted_by',
      ],
    });
    return entity ? ServiceMilestoneTemplateMapper.toDomain(entity) : null;
  }

  async update(
    id: number,
    payload: Partial<ServiceMilestoneTemplate>,
  ): Promise<ServiceMilestoneTemplate> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing)
      throw new NotFoundException('Service Milestone Template not found');

    const updated = await this.repo.save(
      this.repo.create(
        ServiceMilestoneTemplateMapper.toPersistence({
          ...ServiceMilestoneTemplateMapper.toDomain(existing),
          ...payload,
        }),
      ),
    );
    const withRelations = await this.repo.findOne({
      where: { id: updated.id },
      relations: [
        'service',
        'package',
        'created_by',
        'updated_by',
        'deleted_by',
      ],
    });
    return ServiceMilestoneTemplateMapper.toDomain(withRelations ?? updated);
  }

  async remove(id: number, causerId?: number): Promise<void> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing)
      throw new NotFoundException('Service Milestone Template not found');
    await this.repo.save({
      id,
      deleted_at: new Date(),
      deleted_by: causerId ? ({ id: causerId } as any) : null,
      status: ServiceMilestoneTemplateStatusEnum.INACTIVE,
    });
  }
}
