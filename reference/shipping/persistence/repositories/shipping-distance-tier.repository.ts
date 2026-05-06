import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShippingDistanceTierEntity } from '@/shipping/persistence/entities/shipping-distance-tier.entity';
import { ShippingDistanceTierMapper } from '@/shipping/persistence/mappers/shipping-distance-tier.mapper';
import { ShippingDistanceTier } from '@/shipping/domain/shipping-distance-tier';

/**
 * Repository for ShippingDistanceTier persistence operations
 */
@Injectable()
export class ShippingDistanceTierRepository {
  constructor(
    @InjectRepository(ShippingDistanceTierEntity)
    private readonly repository: Repository<ShippingDistanceTierEntity>,
  ) {}

  async create(
    data: Partial<ShippingDistanceTier>,
  ): Promise<ShippingDistanceTier> {
    // Auto-increment display_order if not provided (scoped to method)
    if (data.display_order === undefined || data.display_order === null) {
      const maxResult = await this.repository
        .createQueryBuilder('tier')
        .select('MAX(tier.display_order)', 'max')
        .where('tier.method_id = :methodId', { methodId: data.method_id })
        .getRawOne();
      data.display_order = (maxResult?.max ?? -1) + 1;
    }

    const persistenceModel = ShippingDistanceTierMapper.toPersistence(data);
    const newEntity = await this.repository.save(
      this.repository.create(persistenceModel),
    );

    const entity = await this.repository.findOne({
      where: { id: newEntity.id },
    });

    if (!entity) {
      throw new Error('Failed to retrieve created distance tier');
    }

    return ShippingDistanceTierMapper.toDomain(entity);
  }

  async findById(id: number): Promise<ShippingDistanceTier | null> {
    const entity = await this.repository.findOne({
      where: { id },
    });
    return entity ? ShippingDistanceTierMapper.toDomain(entity) : null;
  }

  async findAll(methodId?: number): Promise<ShippingDistanceTier[]> {
    const where = methodId ? { method_id: methodId } : {};
    const entities = await this.repository.find({
      where,
      order: { method_id: 'ASC', display_order: 'ASC', min_distance_km: 'ASC' },
    });
    return entities.map((entity) =>
      ShippingDistanceTierMapper.toDomain(entity),
    );
  }

  async findByMethodId(methodId: number): Promise<ShippingDistanceTier[]> {
    const entities = await this.repository.find({
      where: { method_id: methodId },
      order: { display_order: 'ASC', min_distance_km: 'ASC' },
    });
    return entities.map((entity) =>
      ShippingDistanceTierMapper.toDomain(entity),
    );
  }

  async update(
    id: number,
    payload: Partial<ShippingDistanceTier>,
  ): Promise<ShippingDistanceTier> {
    const entity = await this.repository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new Error('Distance tier not found');
    }

    const persistenceModel = ShippingDistanceTierMapper.toPersistence(payload);
    await this.repository.update(id, persistenceModel);

    const updatedEntity = await this.repository.findOne({
      where: { id },
    });

    if (!updatedEntity) {
      throw new Error('Failed to retrieve updated distance tier');
    }

    return ShippingDistanceTierMapper.toDomain(updatedEntity);
  }

  async remove(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async removeByMethodId(methodId: number): Promise<void> {
    await this.repository.delete({ method_id: methodId });
  }
}
