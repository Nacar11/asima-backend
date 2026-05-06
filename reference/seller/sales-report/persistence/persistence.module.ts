import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseSalesReportRepository } from '@/seller/sales-report/persistence/base-sales-report.repository';
import { SalesReportRepository } from '@/seller/sales-report/persistence/repositories/sales-report.repository';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import { SalesOrderItemEntity } from '@/sales-orders/persistence/entities/sales-order-item.entity';
import { ProductVariantEntity } from '@/product-variants/persistence/entities/product-variant.entity';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { ProductCategoryEntity } from '@/product-categories/persistence/entities/product-category.entity';
import { CategoryEntity } from '@/categories/persistence/entities/category.entity';
import { ProductMediaMappingEntity } from '@/media/persistence/entities/product-media-mapping.entity';
import { MediaEntity } from '@/media/persistence/entities/media.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalesOrderEntity,
      SalesOrderItemEntity,
      ProductVariantEntity,
      ProductEntity,
      ProductCategoryEntity,
      CategoryEntity,
      ProductMediaMappingEntity,
      MediaEntity,
    ]),
  ],
  providers: [
    {
      provide: BaseSalesReportRepository,
      useClass: SalesReportRepository,
    },
  ],
  exports: [TypeOrmModule, BaseSalesReportRepository],
})
export class SalesReportPersistenceModule {}
