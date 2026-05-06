import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryStockEntity } from './entities/inventory-stock.entity';
import { InventoryStockRepository } from './repositories/inventory-stock.repository';
import { BaseInventoryStockRepository } from './base-inventory-stock.repository';
import { InventoryStockMapper } from './mappers/inventory-stock.mapper';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryStockEntity])],
  providers: [
    {
      provide: BaseInventoryStockRepository,
      useClass: InventoryStockRepository,
    },
    InventoryStockRepository,
    InventoryStockMapper,
  ],
  exports: [
    BaseInventoryStockRepository,
    InventoryStockRepository,
    InventoryStockMapper,
  ],
})
export class InventoryStockPersistenceModule {}
