import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShippingMethodEntity } from '@/shipping/persistence/entities/shipping-method.entity';
import { ShippingMethodMapper } from '@/shipping/persistence/mappers/shipping-method.mapper';
import { ShippingMethod } from '@/shipping/domain/shipping-method';
import { QueryShippingMethodDto } from '@/shipping/dto/query-shipping.dto';

/**
 * Repository for ShippingMethod persistence operations
 */
@Injectable()
export class ShippingMethodRepository {
  constructor(
    @InjectRepository(ShippingMethodEntity)
    private readonly repository: Repository<ShippingMethodEntity>,
  ) {}

  async create(data: Partial<ShippingMethod>): Promise<ShippingMethod> {
    // Auto-increment display_order if not provided (scoped to provider)
    if (data.display_order === undefined || data.display_order === null) {
      const maxResult = await this.repository
        .createQueryBuilder('method')
        .select('MAX(method.display_order)', 'max')
        .where('method.provider_id = :providerId', {
          providerId: data.provider_id,
        })
        .getRawOne();
      data.display_order = (maxResult?.max ?? -1) + 1;
    }

    const persistenceModel = ShippingMethodMapper.toPersistence(data);
    const newEntity = await this.repository.save(
      this.repository.create(persistenceModel),
    );

    const entityWithRelations = await this.repository.findOne({
      where: { id: newEntity.id },
      relations: ['provider', 'created_by', 'updated_by', 'distance_tiers'],
    });

    if (!entityWithRelations) {
      throw new Error('Failed to retrieve created shipping method');
    }

    return ShippingMethodMapper.toDomain(entityWithRelations);
  }

  async findAll(
    query: QueryShippingMethodDto,
  ): Promise<{ data: ShippingMethod[]; totalCount: number }> {
    const skip = query.skip ?? 0;
    const take = query.take ?? 20;

    const queryBuilder = this.repository
      .createQueryBuilder('method')
      .leftJoinAndSelect('method.provider', 'provider')
      .leftJoinAndSelect('method.created_by', 'created_by')
      .leftJoinAndSelect('method.updated_by', 'updated_by')
      .leftJoinAndSelect('method.distance_tiers', 'distance_tiers');

    if (query.provider_id !== undefined) {
      queryBuilder.andWhere('method.provider_id = :provider_id', {
        provider_id: query.provider_id,
      });
    }

    if (query.is_active !== undefined) {
      queryBuilder.andWhere('method.is_active = :is_active', {
        is_active: query.is_active,
      });
    }

    queryBuilder.orderBy('method.display_order', 'ASC');
    queryBuilder.addOrderBy('method.created_at', 'DESC');

    const [entities, totalCount] = await queryBuilder
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return {
      data: entities.map((entity) => ShippingMethodMapper.toDomain(entity)),
      totalCount,
    };
  }

  async findById(id: number): Promise<ShippingMethod | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['provider', 'created_by', 'updated_by', 'distance_tiers'],
    });
    return entity ? ShippingMethodMapper.toDomain(entity) : null;
  }

  async findActiveByProviderId(providerId: number): Promise<ShippingMethod[]> {
    const entities = await this.repository.find({
      where: { provider_id: providerId, is_active: true },
      relations: ['distance_tiers'],
      order: { display_order: 'ASC' },
    });
    return entities.map((entity) => ShippingMethodMapper.toDomain(entity));
  }

  async update(
    id: number,
    payload: Partial<ShippingMethod>,
  ): Promise<ShippingMethod> {
    const entity = await this.repository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new Error('Shipping method not found');
    }

    const persistenceModel = ShippingMethodMapper.toPersistence(payload);
    await this.repository.update(id, persistenceModel);

    const updatedEntity = await this.repository.findOne({
      where: { id },
      relations: ['provider', 'created_by', 'updated_by', 'distance_tiers'],
    });

    if (!updatedEntity) {
      throw new Error('Failed to retrieve updated shipping method');
    }

    return ShippingMethodMapper.toDomain(updatedEntity);
  }

  async remove(id: number): Promise<void> {
    await this.repository.softDelete(id);
  }
}
