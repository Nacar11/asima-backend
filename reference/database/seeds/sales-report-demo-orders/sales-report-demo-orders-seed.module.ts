import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { ProductVariantEntity } from '@/product-variants/persistence/entities/product-variant.entity';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import { SalesOrderItemEntity } from '@/sales-orders/persistence/entities/sales-order-item.entity';
import { SalesReportDemoOrdersSeedService } from '@/database/seeds/sales-report-demo-orders/sales-report-demo-orders-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      SellerEntity,
      ProductEntity,
      ProductVariantEntity,
      SalesOrderEntity,
      SalesOrderItemEntity,
    ]),
  ],
  providers: [SalesReportDemoOrdersSeedService],
  exports: [SalesReportDemoOrdersSeedService],
})
export class SalesReportDemoOrdersSeedModule {}
