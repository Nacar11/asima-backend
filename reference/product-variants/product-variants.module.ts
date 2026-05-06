import { Module } from '@nestjs/common';
import { ProductVariantsService } from './product-variants.service';
import { ProductVariantsController } from './product-variants.controller';
import { ProductVariantPersistenceModule } from './persistence/persistence.module';
import { InventoryStockPersistenceModule } from '@/inventory-stocks/persistence/persistence.module';
import { FeaturedProductsModule } from '@/featured-products/featured-products.module';

@Module({
  imports: [
    ProductVariantPersistenceModule,
    InventoryStockPersistenceModule,
    FeaturedProductsModule,
  ],
  controllers: [ProductVariantsController],
  providers: [ProductVariantsService],
  exports: [ProductVariantsService],
})
export class ProductVariantsModule {}
