import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { SalesOrderItemOptionEntity } from '@/sales-order-item-options/persistence/entities/sales-order-item-option.entity';
import { SalesOrderItemOptionMapper } from '@/sales-order-item-options/persistence/mappers/sales-order-item-option.mapper';
import { SalesOrderItemOption } from '@/sales-order-item-options/domain/sales-order-item-option';

@Injectable()
export class SalesOrderItemOptionRepository {
  constructor(
    @InjectRepository(SalesOrderItemOptionEntity)
    private readonly repo: Repository<SalesOrderItemOptionEntity>,
  ) {}

  async create(
    data: Omit<SalesOrderItemOption, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<SalesOrderItemOption> {
    const saved = await this.repo.save(
      this.repo.create(SalesOrderItemOptionMapper.toPersistence(data)),
    );
    return SalesOrderItemOptionMapper.toDomain(saved);
  }

  async createMany(
    items: Omit<SalesOrderItemOption, 'id' | 'created_at' | 'updated_at'>[],
  ): Promise<SalesOrderItemOption[]> {
    if (items.length === 0) return [];
    const entities = items.map((item) =>
      this.repo.create(SalesOrderItemOptionMapper.toPersistence(item)),
    );
    const saved = await this.repo.save(entities);
    return saved.map((e) => SalesOrderItemOptionMapper.toDomain(e));
  }

  async findBySalesOrderItemId(
    salesOrderItemId: number,
  ): Promise<SalesOrderItemOption[]> {
    const entities = await this.repo.find({
      where: { sales_order_item_id: salesOrderItemId },
      relations: ['option_group', 'option_value'],
    });
    return entities.map((e) => SalesOrderItemOptionMapper.toDomain(e));
  }

  async findBySalesOrderItemIds(
    salesOrderItemIds: number[],
  ): Promise<SalesOrderItemOption[]> {
    if (salesOrderItemIds.length === 0) return [];
    const entities = await this.repo.find({
      where: { sales_order_item_id: In(salesOrderItemIds) },
      relations: ['option_group', 'option_value'],
    });
    return entities.map((e) => SalesOrderItemOptionMapper.toDomain(e));
  }
}
