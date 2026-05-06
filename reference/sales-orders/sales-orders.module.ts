import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesOrderPersistenceModule } from './persistence/persistence.module';
import { SalesOrdersService } from './sales-orders.service';
import { SalesOrdersSchedulerService } from './sales-orders-scheduler.service';
import { SalesOrdersController } from './sales-orders.controller';
import { ShoppingCartsModule } from '@/shopping-carts/shopping-carts.module';
import { InventoryStocksModule } from '@/inventory-stocks/inventory-stocks.module';
import { UserAddressesModule } from '@/user-addresses/user-addresses.module';
import { ProductVariantEntity } from '@/product-variants/persistence/entities/product-variant.entity';
import { SalesOrderEntity } from './persistence/entities/sales-order.entity';
import { StorageModule } from '@/storage/storage.module';
import { OrderTrackingModule } from '@/order-tracking/order-tracking.module';
import { ShippingModule } from '@/shipping/shipping.module';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { ReturnRequestsModule } from '@/return-requests/return-requests.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { InvoicePersistenceModule } from '@/invoices/persistence/persistence.module';
import { ServicesModule } from '@/services/services.module';
import { BookingsModule } from '@/bookings/bookings.module';
import { CartItemAddonsModule } from '@/cart-item-addons/cart-item-addons.module';
import { CartItemOptionsModule } from '@/cart-item-options/cart-item-options.module';
import { SalesOrderItemAddonsModule } from '@/sales-order-item-addons/sales-order-item-addons.module';
import { SalesOrderItemOptionsModule } from '@/sales-order-item-options/sales-order-item-options.module';
import { ServiceAddonsModule } from '@/service-addons/service-addons.module';
import { ServiceOptionGroupsModule } from '@/service-option-groups/service-option-groups.module';
import { ServiceOptionValuesModule } from '@/service-option-values/service-option-values.module';
import { CheckoutPaymentsModule } from '@/checkout-payments/checkout-payments.module';
import { CheckoutPaymentEntity } from '@/checkout-payments/persistence/entities/checkout-payment.entity';
import { CheckoutPaymentOrderEntity } from '@/checkout-payments/persistence/entities/checkout-payment-order.entity';
import { CheckoutSessionsModule } from '@/checkout-sessions/checkout-sessions.module';
import { VouchersModule } from '@/vouchers/vouchers.module';
import { PickupAvailabilityModule } from './pickup-availability.module';
import { SalesOrderVoucherEntity } from '@/sales-order-vouchers/persistence/entities/sales-order-voucher.entity';
import { WalletsModule } from '@/wallets/wallets.module';

@Module({
  imports: [
    SalesOrderPersistenceModule,
    InvoicePersistenceModule,
    ShoppingCartsModule,
    InventoryStocksModule,
    UserAddressesModule,
    OrderTrackingModule,
    ShippingModule,
    ReturnRequestsModule,
    NotificationsModule,
    forwardRef(() => CheckoutPaymentsModule),
    CheckoutSessionsModule,
    ServicesModule,
    forwardRef(() => BookingsModule),
    CartItemAddonsModule,
    CartItemOptionsModule,
    SalesOrderItemAddonsModule,
    SalesOrderItemOptionsModule,
    ServiceAddonsModule,
    ServiceOptionGroupsModule,
    ServiceOptionValuesModule,
    VouchersModule,
    PickupAvailabilityModule,
    WalletsModule,
    StorageModule.register(),
    TypeOrmModule.forFeature([
      ProductVariantEntity,
      SalesOrderEntity,
      SellerEntity,
      SalesOrderVoucherEntity,
      CheckoutPaymentEntity,
      CheckoutPaymentOrderEntity,
    ]),
  ],
  controllers: [SalesOrdersController],
  providers: [SalesOrdersService, SalesOrdersSchedulerService],
  exports: [SalesOrdersService],
})
export class SalesOrdersModule {}
