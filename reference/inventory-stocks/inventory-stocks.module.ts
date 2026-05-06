import { Module } from '@nestjs/common';
import { InventoryStockPersistenceModule } from './persistence/persistence.module';
import { InventoryStocksService } from './inventory-stocks.service';
import { FeaturedProductsModule } from '@/featured-products/featured-products.module';

@Module({
  imports: [InventoryStockPersistenceModule, FeaturedProductsModule],
  providers: [InventoryStocksService],
  exports: [InventoryStocksService],
})
export class InventoryStocksModule {}
