import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryStockEntity } from '@/inventory-stocks/persistence/entities/inventory-stock.entity';
import { ProductVariantEntity } from '@/product-variants/persistence/entities/product-variant.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { InventoryStockSeedService } from './inventory-stock-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InventoryStockEntity,
      ProductVariantEntity,
      UserEntity,
    ]),
  ],
  providers: [InventoryStockSeedService],
  exports: [InventoryStockSeedService],
})
export class InventoryStockSeedModule {}
