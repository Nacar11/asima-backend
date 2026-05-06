import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CancellationPolicyEntity } from '@/cancellation-policies/persistence/entities/cancellation-policy.entity';
import { BaseCancellationPolicyRepository } from '@/cancellation-policies/persistence/base-cancellation-policy.repository';
import { CancellationPolicy } from '@/cancellation-policies/domain/cancellation-policy';
import { CancellationPolicyMapper } from '@/cancellation-policies/persistence/mappers/cancellation-policy.mapper';
import { QueryCancellationPolicyDto } from '@/cancellation-policies/dto/query-cancellation-policy.dto';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { NullableType } from '@/utils/types/nullable.type';

@Injectable()
export class CancellationPolicyRepository
  implements BaseCancellationPolicyRepository
{
  constructor(
    @InjectRepository(CancellationPolicyEntity)
    private readonly repository: Repository<CancellationPolicyEntity>,
  ) {}

  async create(data: Partial<CancellationPolicy>): Promise<CancellationPolicy> {
    const persistenceData = CancellationPolicyMapper.toPersistence(data);
    const entity = this.repository.create(persistenceData);
    const saved = await this.repository.save(entity);
    return CancellationPolicyMapper.toDomain(saved);
  }

  async findAll(
    query: QueryCancellationPolicyDto,
  ): Promise<IPaginatedResult<CancellationPolicy>> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const skip = (page - 1) * limit;

    const queryBuilder = this.repository
      .createQueryBuilder('policy')
      .leftJoinAndSelect('policy.seller', 'seller')
      .leftJoinAndSelect('policy.service', 'service');

    if (query.seller_id) {
      queryBuilder.andWhere('policy.seller_id = :sellerId', {
        sellerId: query.seller_id,
      });
    }

    if (query.service_id) {
      queryBuilder.andWhere('policy.service_id = :serviceId', {
        serviceId: query.service_id,
      });
    }

    if (query.status) {
      queryBuilder.andWhere('policy.status = :status', {
        status: query.status,
      });
    }

    queryBuilder.orderBy('policy.created_at', 'DESC');

    const [entities, totalCount] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: entities.map(CancellationPolicyMapper.toDomain),
      totalResults: totalCount,
    };
  }

  async findById(id: number): Promise<NullableType<CancellationPolicy>> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['seller', 'service'],
    });
    return entity ? CancellationPolicyMapper.toDomain(entity) : null;
  }

  async findBySellerId(sellerId: number): Promise<CancellationPolicy[]> {
    const entities = await this.repository.find({
      where: { seller_id: sellerId, status: 'Active' },
      relations: ['seller', 'service'],
      order: { created_at: 'DESC' },
    });
    return entities.map(CancellationPolicyMapper.toDomain);
  }

  async findByServiceId(
    serviceId: number,
  ): Promise<NullableType<CancellationPolicy>> {
    const entity = await this.repository.findOne({
      where: { service_id: serviceId, status: 'Active' },
      relations: ['seller', 'service'],
    });
    return entity ? CancellationPolicyMapper.toDomain(entity) : null;
  }

  async findDefault(): Promise<NullableType<CancellationPolicy>> {
    // Default policy: no seller_id and no service_id
    const entity = await this.repository.findOne({
      where: {
        seller_id: IsNull(),
        service_id: IsNull(),
        status: 'Active',
      },
    });
    return entity ? CancellationPolicyMapper.toDomain(entity) : null;
  }

  async update(
    id: number,
    data: Partial<CancellationPolicy>,
  ): Promise<CancellationPolicy> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['seller', 'service'],
    });

    if (!entity) {
      throw new NotFoundException('Cancellation policy not found');
    }

    const persistenceData = CancellationPolicyMapper.toPersistence(data);
    Object.assign(entity, persistenceData);

    const updated = await this.repository.save(entity);
    return CancellationPolicyMapper.toDomain(updated);
  }

  async remove(id: number): Promise<void> {
    const result = await this.repository.update(id, { status: 'Inactive' });
    if (result.affected === 0) {
      throw new NotFoundException('Cancellation policy not found');
    }
  }
}
