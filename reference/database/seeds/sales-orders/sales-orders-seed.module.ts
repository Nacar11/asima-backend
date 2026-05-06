import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import { SalesOrderItemEntity } from '@/sales-orders/persistence/entities/sales-order-item.entity';
import { ProductVariantEntity } from '@/product-variants/persistence/entities/product-variant.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SalesOrdersSeedService } from './sales-orders-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalesOrderEntity,
      SalesOrderItemEntity,
      ProductVariantEntity,
      UserEntity,
    ]),
  ],
  providers: [SalesOrdersSeedService],
  exports: [SalesOrdersSeedService],
})
export class SalesOrdersSeedModule {}
