import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import { SalesOrderItemEntity } from '@/sales-orders/persistence/entities/sales-order-item.entity';
import { ProductVariantEntity } from '@/product-variants/persistence/entities/product-variant.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { UserAddressEntity } from '@/user-addresses/persistence/entities/user-address.entity';
import { OrderTrackingEventEntity } from '@/order-tracking/persistence/entities/order-tracking-event.entity';
import { ShippingModule } from '@/shipping/shipping.module';
import { SalesOrderSeedService } from './sales-order-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalesOrderEntity,
      SalesOrderItemEntity,
      ProductVariantEntity,
      UserEntity,
      SellerEntity,
      UserAddressEntity,
      OrderTrackingEventEntity,
    ]),
    ShippingModule,
  ],
  providers: [SalesOrderSeedService],
  exports: [SalesOrderSeedService],
})
export class SalesOrderSeedModule {}
