import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseInventoryStockRepository } from '../base-inventory-stock.repository';
import { InventoryStockEntity } from '../entities/inventory-stock.entity';
import { InventoryStockMapper } from '../mappers/inventory-stock.mapper';
import { InventoryStock } from '@/inventory-stocks/domain/inventory-stock';

@Injectable()
export class InventoryStockRepository extends BaseInventoryStockRepository {
  constructor(
    @InjectRepository(InventoryStockEntity)
    private readonly inventoryStockRepository: Repository<InventoryStockEntity>,
  ) {
    super();
  }

  async create(data: InventoryStock): Promise<InventoryStock> {
    const persistenceModel = InventoryStockMapper.toPersistence(data);

    const newEntity = await this.inventoryStockRepository.save(
      this.inventoryStockRepository.create(persistenceModel),
    );

    return InventoryStockMapper.toDomain(newEntity);
  }

  async findByVariantId(variantId: number): Promise<InventoryStock | null> {
    const entity = await this.inventoryStockRepository.findOne({
      where: { variant_id: variantId },
      relations: ['created_by', 'updated_by', 'deleted_by'],
    });

    return entity ? InventoryStockMapper.toDomain(entity) : null;
  }

  async update(
    id: number,
    data: Partial<InventoryStock>,
  ): Promise<InventoryStock> {
    const persistenceModel = InventoryStockMapper.toPersistence(
      data as InventoryStock,
    );

    await this.inventoryStockRepository.update(id, persistenceModel);

    const updatedEntity = await this.inventoryStockRepository.findOne({
      where: { id },
      relations: ['created_by', 'updated_by', 'deleted_by'],
    });

    if (!updatedEntity) {
      throw new Error(`Inventory stock with ID ${id} not found after update`);
    }

    return InventoryStockMapper.toDomain(updatedEntity);
  }

  async remove(id: number, deletedBy: any): Promise<void> {
    const updateData = {
      deleted_by: deletedBy,
    };

    await this.inventoryStockRepository.update(id, updateData);
    await this.inventoryStockRepository.softDelete(id);
  }
}
