import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository, Not } from 'typeorm';
import { BaseServiceOptionGroupRepository } from '@/service-option-groups/persistence/base-service-option-group.repository';
import { ServiceOptionGroupEntity } from '@/service-option-groups/persistence/entities/service-option-group.entity';
import { ServiceOptionGroupMapper } from '@/service-option-groups/persistence/mappers/service-option-group.mapper';
import { ServiceOptionGroup } from '@/service-option-groups/domain/service-option-group';
import { QueryServiceOptionGroupDto } from '@/service-option-groups/dto/query-service-option-group.dto';
import { OptionGroupStatusEnum } from '@/service-option-groups/enums/option-group-status.enum';

@Injectable()
export class ServiceOptionGroupRepository
  implements BaseServiceOptionGroupRepository
{
  constructor(
    @InjectRepository(ServiceOptionGroupEntity)
    private readonly repo: Repository<ServiceOptionGroupEntity>,
  ) {}

  async create(data: ServiceOptionGroup): Promise<ServiceOptionGroup> {
    const saved = await this.repo.save(
      this.repo.create(ServiceOptionGroupMapper.toPersistence(data)),
    );
    const withRelations = await this.repo.findOne({
      where: { id: saved.id },
      relations: ['service', 'created_by', 'updated_by'],
    });
    return ServiceOptionGroupMapper.toDomain(withRelations ?? saved);
  }

  async findAll(
    query: QueryServiceOptionGroupDto,
  ): Promise<{ data: ServiceOptionGroup[]; totalCount: number }> {
    const skip = query.skip ?? 0;
    const take = query.take ?? 20;

    const where: FindOptionsWhere<ServiceOptionGroupEntity> = {};

    if (query.service_id !== undefined) {
      where.service_id = query.service_id;
    }
    if (query.status !== undefined) {
      where.status = query.status;
    }
    if (query.search) {
      where.name = ILike(`%${query.search}%`);
    }

    const [entities, totalCount] = await this.repo.findAndCount({
      where,
      skip,
      take,
      order: { display_order: 'ASC', id: 'ASC' },
      relations: ['service', 'created_by', 'updated_by'],
    });

    return {
      data: entities.map((e) => ServiceOptionGroupMapper.toDomain(e)),
      totalCount,
    };
  }

  async findById(id: number): Promise<ServiceOptionGroup | null> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: ['service', 'created_by', 'updated_by'],
    });
    return entity ? ServiceOptionGroupMapper.toDomain(entity) : null;
  }

  async findByServiceId(serviceId: number): Promise<ServiceOptionGroup[]> {
    const entities = await this.repo.find({
      where: { service_id: serviceId },
      order: {
        display_order: 'ASC',
        id: 'ASC',
        option_values: {
          display_order: 'ASC',
          id: 'ASC',
        },
      },
      relations: ['option_values'],
    });
    return entities.map((e) => ServiceOptionGroupMapper.toDomain(e));
  }

  async findByServiceAndCode(
    serviceId: number,
    code: string,
    excludeId?: number,
  ): Promise<ServiceOptionGroup | null> {
    const where: FindOptionsWhere<ServiceOptionGroupEntity> = {
      service_id: serviceId,
      code,
    };
    if (excludeId) where.id = Not(excludeId);
    const entity = await this.repo.findOne({ where });
    return entity ? ServiceOptionGroupMapper.toDomain(entity) : null;
  }

  async update(
    id: number,
    payload: Partial<ServiceOptionGroup>,
  ): Promise<ServiceOptionGroup> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing)
      throw new NotFoundException('Service Option Group not found');

    const updated = await this.repo.save(
      this.repo.create(
        ServiceOptionGroupMapper.toPersistence({
          ...ServiceOptionGroupMapper.toDomain(existing),
          ...payload,
        }),
      ),
    );
    const withRelations = await this.repo.findOne({
      where: { id: updated.id },
      relations: ['service', 'created_by', 'updated_by'],
    });
    return ServiceOptionGroupMapper.toDomain(withRelations ?? updated);
  }

  async remove(id: number, causerId?: number): Promise<void> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing)
      throw new NotFoundException('Service Option Group not found');
    await this.repo.save({
      id,
      deleted_at: new Date(),
      deleted_by: causerId ? ({ id: causerId } as any) : null,
      status: OptionGroupStatusEnum.ARCHIVED,
    });
  }
}
