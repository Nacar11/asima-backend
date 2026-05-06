import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { SalesOrderItemAddonEntity } from '@/sales-order-item-addons/persistence/entities/sales-order-item-addon.entity';
import { SalesOrderItemAddonMapper } from '@/sales-order-item-addons/persistence/mappers/sales-order-item-addon.mapper';
import { SalesOrderItemAddon } from '@/sales-order-item-addons/domain/sales-order-item-addon';

@Injectable()
export class SalesOrderItemAddonRepository {
  constructor(
    @InjectRepository(SalesOrderItemAddonEntity)
    private readonly repo: Repository<SalesOrderItemAddonEntity>,
  ) {}

  async create(
    data: Omit<SalesOrderItemAddon, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<SalesOrderItemAddon> {
    const saved = await this.repo.save(
      this.repo.create(SalesOrderItemAddonMapper.toPersistence(data)),
    );
    return SalesOrderItemAddonMapper.toDomain(saved);
  }

  async createMany(
    items: Omit<SalesOrderItemAddon, 'id' | 'created_at' | 'updated_at'>[],
  ): Promise<SalesOrderItemAddon[]> {
    if (items.length === 0) return [];
    const entities = items.map((item) =>
      this.repo.create(SalesOrderItemAddonMapper.toPersistence(item)),
    );
    const saved = await this.repo.save(entities);
    return saved.map((e) => SalesOrderItemAddonMapper.toDomain(e));
  }

  async findBySalesOrderItemId(
    salesOrderItemId: number,
  ): Promise<SalesOrderItemAddon[]> {
    const entities = await this.repo.find({
      where: { sales_order_item_id: salesOrderItemId },
      relations: ['addon'],
    });
    return entities.map((e) => SalesOrderItemAddonMapper.toDomain(e));
  }

  async findBySalesOrderItemIds(
    salesOrderItemIds: number[],
  ): Promise<SalesOrderItemAddon[]> {
    if (salesOrderItemIds.length === 0) return [];
    const entities = await this.repo.find({
      where: { sales_order_item_id: In(salesOrderItemIds) },
      relations: ['addon'],
    });
    return entities.map((e) => SalesOrderItemAddonMapper.toDomain(e));
  }
}
