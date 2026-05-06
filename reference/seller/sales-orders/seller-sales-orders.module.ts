import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellerSalesOrdersController } from './seller-sales-orders.controller';
import { SellerSalesOrdersService } from './seller-sales-orders.service';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import { SalesOrderItemEntity } from '@/sales-orders/persistence/entities/sales-order-item.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { SalesOrderVoucherEntity } from '@/sales-order-vouchers/persistence/entities/sales-order-voucher.entity';
import { UserVoucherEntity } from '@/vouchers/persistence/entities/user-voucher.entity';
import { InventoryStocksModule } from '@/inventory-stocks/inventory-stocks.module';
import { OrderTrackingModule } from '@/order-tracking/order-tracking.module';
import { ReturnRequestsModule } from '@/return-requests/return-requests.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { CheckoutPaymentsModule } from '@/checkout-payments/checkout-payments.module';
import { SalesOrdersModule } from '@/sales-orders/sales-orders.module';
import { WalletsModule } from '@/wallets/wallets.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalesOrderEntity,
      SalesOrderItemEntity,
      SellerEntity,
      UserEntity,
      SalesOrderVoucherEntity,
      UserVoucherEntity,
    ]),
    InventoryStocksModule,
    OrderTrackingModule,
    ReturnRequestsModule,
    NotificationsModule,
    CheckoutPaymentsModule,
    SalesOrdersModule,
    WalletsModule,
  ],
  controllers: [SellerSalesOrdersController],
  providers: [SellerSalesOrdersService],
  exports: [SellerSalesOrdersService],
})
export class SellerSalesOrdersModule {}
