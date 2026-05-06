import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShippingProviderEntity } from '@/shipping/persistence/entities/shipping-provider.entity';
import { ShippingProviderMapper } from '@/shipping/persistence/mappers/shipping-provider.mapper';
import { ShippingProvider } from '@/shipping/domain/shipping-provider';
import { QueryShippingProviderDto } from '@/shipping/dto/query-shipping.dto';

/**
 * Repository for ShippingProvider persistence operations
 */
@Injectable()
export class ShippingProviderRepository {
  constructor(
    @InjectRepository(ShippingProviderEntity)
    private readonly repository: Repository<ShippingProviderEntity>,
  ) {}

  async create(data: Partial<ShippingProvider>): Promise<ShippingProvider> {
    // Auto-increment display_order if not provided
    if (data.display_order === undefined || data.display_order === null) {
      const maxResult = await this.repository
        .createQueryBuilder('provider')
        .select('MAX(provider.display_order)', 'max')
        .getRawOne();
      data.display_order = (maxResult?.max ?? -1) + 1;
    }

    const persistenceModel = ShippingProviderMapper.toPersistence(data);
    const newEntity = await this.repository.save(
      this.repository.create(persistenceModel),
    );

    const entityWithRelations = await this.repository.findOne({
      where: { id: newEntity.id },
      relations: ['created_by', 'updated_by', 'methods'],
    });

    if (!entityWithRelations) {
      throw new Error('Failed to retrieve created shipping provider');
    }

    return ShippingProviderMapper.toDomain(entityWithRelations);
  }

  async findAll(
    query: QueryShippingProviderDto,
  ): Promise<{ data: ShippingProvider[]; totalCount: number }> {
    const skip = query.skip ?? 0;
    const take = query.take ?? 20;

    const queryBuilder = this.repository
      .createQueryBuilder('provider')
      .leftJoinAndSelect('provider.created_by', 'created_by')
      .leftJoinAndSelect('provider.updated_by', 'updated_by');

    if (query.is_active !== undefined) {
      queryBuilder.andWhere('provider.is_active = :is_active', {
        is_active: query.is_active,
      });
    }

    queryBuilder.orderBy('provider.is_default', 'DESC');
    queryBuilder.addOrderBy('provider.created_at', 'DESC');

    const [entities, totalCount] = await queryBuilder
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return {
      data: entities.map((entity) => ShippingProviderMapper.toDomain(entity)),
      totalCount,
    };
  }

  async findById(id: number): Promise<ShippingProvider | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['created_by', 'updated_by', 'methods'],
    });
    return entity ? ShippingProviderMapper.toDomain(entity) : null;
  }

  async findByCode(code: string): Promise<ShippingProvider | null> {
    const entity = await this.repository.findOne({
      where: { code },
      relations: ['created_by', 'updated_by', 'methods'],
    });
    return entity ? ShippingProviderMapper.toDomain(entity) : null;
  }

  async findDefault(): Promise<ShippingProvider | null> {
    const entity = await this.repository.findOne({
      where: { is_default: true, is_active: true },
      relations: ['methods', 'methods.distance_tiers'],
    });
    return entity ? ShippingProviderMapper.toDomain(entity) : null;
  }

  async update(
    id: number,
    payload: Partial<ShippingProvider>,
  ): Promise<ShippingProvider> {
    const entity = await this.repository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new Error('Shipping provider not found');
    }

    const persistenceModel = ShippingProviderMapper.toPersistence(payload);
    await this.repository.update(id, persistenceModel);

    const updatedEntity = await this.repository.findOne({
      where: { id },
      relations: ['created_by', 'updated_by', 'methods'],
    });

    if (!updatedEntity) {
      throw new Error('Failed to retrieve updated shipping provider');
    }

    return ShippingProviderMapper.toDomain(updatedEntity);
  }

  async remove(id: number): Promise<void> {
    await this.repository.softDelete(id);
  }

  async clearDefaultFlag(): Promise<void> {
    await this.repository.update({ is_default: true }, { is_default: false });
  }
}
