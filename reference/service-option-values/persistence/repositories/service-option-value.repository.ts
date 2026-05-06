import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository, Not } from 'typeorm';
import { BaseServiceOptionValueRepository } from '@/service-option-values/persistence/base-service-option-value.repository';
import { ServiceOptionValueEntity } from '@/service-option-values/persistence/entities/service-option-value.entity';
import { ServiceOptionValueMapper } from '@/service-option-values/persistence/mappers/service-option-value.mapper';
import { ServiceOptionValue } from '@/service-option-values/domain/service-option-value';
import { QueryServiceOptionValueDto } from '@/service-option-values/dto/query-service-option-value.dto';

@Injectable()
export class ServiceOptionValueRepository
  implements BaseServiceOptionValueRepository
{
  constructor(
    @InjectRepository(ServiceOptionValueEntity)
    private readonly repo: Repository<ServiceOptionValueEntity>,
  ) {}

  async create(data: ServiceOptionValue): Promise<ServiceOptionValue> {
    const saved = await this.repo.save(
      this.repo.create(ServiceOptionValueMapper.toPersistence(data)),
    );
    const withRelations = await this.repo.findOne({
      where: { id: saved.id },
      relations: ['option_group'],
    });
    return ServiceOptionValueMapper.toDomain(withRelations ?? saved);
  }

  async findAll(
    query: QueryServiceOptionValueDto,
  ): Promise<{ data: ServiceOptionValue[]; totalCount: number }> {
    const skip = query.skip ?? 0;
    const take = query.take ?? 20;

    const where: FindOptionsWhere<ServiceOptionValueEntity> = {};

    if (query.option_group_id !== undefined) {
      where.option_group_id = query.option_group_id;
    }
    if (query.status !== undefined) {
      where.status = query.status;
    }
    if (query.search) {
      where.label = ILike(`%${query.search}%`);
    }

    const [entities, totalCount] = await this.repo.findAndCount({
      where,
      skip,
      take,
      order: { display_order: 'ASC', id: 'ASC' },
      relations: ['option_group'],
    });

    return {
      data: entities.map((e) => ServiceOptionValueMapper.toDomain(e)),
      totalCount,
    };
  }

  async findById(id: number): Promise<ServiceOptionValue | null> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: ['option_group'],
    });
    return entity ? ServiceOptionValueMapper.toDomain(entity) : null;
  }

  async findByOptionGroupId(
    optionGroupId: number,
  ): Promise<ServiceOptionValue[]> {
    const entities = await this.repo.find({
      where: { option_group_id: optionGroupId },
      order: { display_order: 'ASC', id: 'ASC' },
    });
    return entities.map((e) => ServiceOptionValueMapper.toDomain(e));
  }

  async findByGroupAndValue(
    optionGroupId: number,
    value: string,
    excludeId?: number,
  ): Promise<ServiceOptionValue | null> {
    const where: FindOptionsWhere<ServiceOptionValueEntity> = {
      option_group_id: optionGroupId,
      value,
    };
    if (excludeId) where.id = Not(excludeId);
    const entity = await this.repo.findOne({ where });
    return entity ? ServiceOptionValueMapper.toDomain(entity) : null;
  }

  async update(
    id: number,
    payload: Partial<ServiceOptionValue>,
  ): Promise<ServiceOptionValue> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing)
      throw new NotFoundException('Service Option Value not found');

    const updated = await this.repo.save(
      this.repo.create(
        ServiceOptionValueMapper.toPersistence({
          ...ServiceOptionValueMapper.toDomain(existing),
          ...payload,
        }),
      ),
    );
    const withRelations = await this.repo.findOne({
      where: { id: updated.id },
      relations: ['option_group'],
    });
    return ServiceOptionValueMapper.toDomain(withRelations ?? updated);
  }

  async remove(id: number): Promise<void> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing)
      throw new NotFoundException('Service Option Value not found');
    await this.repo.delete(id);
  }
}
