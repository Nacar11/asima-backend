import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { StoreAddressEntity } from '../entities/store-address.entity';
import { StoreAddress } from '@/store-addresses/domain/store-address';
import { StoreAddressMapper } from '../mappers/store-address.mapper';
import { BaseStoreAddressRepository } from '../base-store-address.repository';

@Injectable()
export class StoreAddressRepository extends BaseStoreAddressRepository {
  constructor(
    @InjectRepository(StoreAddressEntity)
    private readonly repository: Repository<StoreAddressEntity>,
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  async findById(id: number): Promise<StoreAddress | null> {
    const entity = await this.repository.findOne({
      where: { id, deleted_at: IsNull() },
      relations: ['created_by', 'updated_by'],
    });
    return entity ? StoreAddressMapper.toDomain(entity) : null;
  }

  async findAllBySellerId(
    sellerId: number,
    skip = 0,
    take = 20,
  ): Promise<{ data: StoreAddress[]; total: number }> {
    const [entities, total] = await this.repository.findAndCount({
      where: { seller_id: sellerId, deleted_at: IsNull() },
      relations: ['created_by', 'updated_by'],
      order: { is_default: 'DESC', created_at: 'DESC' },
      skip,
      take,
    });
    return {
      data: entities.map((e) => StoreAddressMapper.toDomain(e)),
      total,
    };
  }

  async findDefaultBySellerId(sellerId: number): Promise<StoreAddress | null> {
    const entity = await this.repository.findOne({
      where: { seller_id: sellerId, is_default: true, deleted_at: IsNull() },
      relations: ['created_by', 'updated_by'],
    });
    return entity ? StoreAddressMapper.toDomain(entity) : null;
  }

  async create(data: Partial<StoreAddress>): Promise<StoreAddress> {
    const entity = this.repository.create(
      StoreAddressMapper.toPersistence(data as StoreAddress),
    );
    const saved = await this.repository.save(entity);

    const reloaded = await this.repository.findOne({
      where: { id: saved.id },
      relations: ['created_by', 'updated_by'],
    });

    return StoreAddressMapper.toDomain(reloaded!);
  }

  async update(id: number, data: Partial<StoreAddress>): Promise<StoreAddress> {
    const existing = await this.repository.findOne({
      where: { id, deleted_at: IsNull() },
    });

    if (!existing) {
      throw new NotFoundException(`Store address with ID ${id} not found`);
    }

    const merged = { ...existing, ...data, id };
    await this.repository.save(
      StoreAddressMapper.toPersistence(merged as StoreAddress),
    );

    const reloaded = await this.repository.findOne({
      where: { id },
      relations: ['created_by', 'updated_by'],
    });

    return StoreAddressMapper.toDomain(reloaded!);
  }

  async softDelete(id: number, deletedBy: number): Promise<void> {
    await this.repository.update(id, {
      deleted_at: new Date(),
      deleted_by: { id: deletedBy } as any,
    });
  }

  async unsetDefaultForSeller(sellerId: number): Promise<void> {
    await this.repository.update(
      { seller_id: sellerId, is_default: true, deleted_at: IsNull() },
      { is_default: false },
    );
  }

  async setAsDefault(id: number, sellerId: number): Promise<StoreAddress> {
    await this.unsetDefaultForSeller(sellerId);
    await this.repository.update(id, { is_default: true });

    const entity = await this.repository.findOne({
      where: { id },
      relations: ['created_by', 'updated_by'],
    });

    if (!entity) {
      throw new NotFoundException(`Store address with ID ${id} not found`);
    }

    return StoreAddressMapper.toDomain(entity);
  }

  async softDeleteAndPromoteDefault(
    id: number,
    sellerId: number,
    deletedBy: number,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(StoreAddressEntity);

      await repo.update(id, {
        deleted_at: new Date(),
        deleted_by: { id: deletedBy } as any,
      });

      const next = await repo.findOne({
        where: { seller_id: sellerId, deleted_at: IsNull() },
        order: { created_at: 'ASC' },
      });

      if (next) {
        await repo.update(
          { seller_id: sellerId, is_default: true, deleted_at: IsNull() },
          { is_default: false },
        );
        await repo.update(next.id, { is_default: true });
      }
    });
  }
}
