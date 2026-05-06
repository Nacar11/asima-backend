import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckoutPaymentPersistenceModule } from './persistence/persistence.module';
import { CustomPaymentMethodEntity } from './persistence/entities/custom-payment-method.entity';
import { CustomPaymentMethodRepository } from './persistence/repositories/custom-payment-method.repository';
import { CheckoutPaymentsService } from './checkout-payments.service';
import { CheckoutPaymentsController } from './checkout-payments.controller';
import { DragonPayCallbackController } from './dragonpay-callback.controller';
import { MayaCallbackController } from './maya-callback.controller';
import { CheckoutOrdersModule } from '@/checkout-orders/checkout-orders.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { MailModule } from '@/mail/mail.module';
import { ParametersModule } from '@/parameters/parameters.module';
import { MayaGateway } from './gateways/maya.gateway';
import { QrManualGateway } from './gateways/qr-manual.gateway';
import { DragonPayGateway } from './gateways/dragonpay.gateway';
import { CodGateway } from './gateways/cod.gateway';
import { PaymentGatewayResolver } from './gateways/payment-gateway.resolver';
import { PaymentGatewaySettingsService } from './payment-gateway-settings.service';
import { PayMongoService } from './services/paymongo.service';
import { DragonPayV2Service } from './services/dragonpay-v2.service';
import { MayaCheckoutService } from './services/maya-checkout.service';
import { MayaWebhookMonitoringService } from './maya-webhook-monitoring.service';
import { MayaIpWhitelistGuard } from './guards/maya-ip-whitelist.guard';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import { BookingEntity } from '@/bookings/persistence/entities/booking.entity';
import { ReturnRequestEntity } from '@/return-requests/persistence/entities/return-request.entity';
import { ReturnRequestItemEntity } from '@/return-requests/persistence/entities/return-request-item.entity';
import { ShoppingCartEntity } from '@/shopping-carts/persistence/entities/shopping-cart.entity';
import { ShoppingCartItemEntity } from '@/shopping-carts/persistence/entities/shopping-cart-item.entity';
import { CheckoutPaymentOrderEntity } from './persistence/entities/checkout-payment-order.entity';
import { MayaWebhookEventEntity } from './persistence/entities/maya-webhook-event.entity';
import { SalesOrdersModule } from '@/sales-orders/sales-orders.module';
import { OrderTrackingModule } from '@/order-tracking/order-tracking.module';
import { MembershipPersistenceModule } from '@/memberships/persistence/persistence.module';
import { MembershipsModule } from '@/memberships/memberships.module';
import { WalletWithdrawalEntity } from '@/wallets/persistence/entities/wallet-withdrawal.entity';
import { WalletWithdrawalRepository } from '@/wallets/persistence/repositories/wallet-withdrawal.repository';
import { WalletEntity } from '@/wallets/persistence/entities/wallet.entity';
import { WalletTransactionEntity } from '@/wallets/persistence/entities/wallet-transaction.entity';
import { WalletRepository } from '@/wallets/persistence/repositories/wallet.repository';
import { WalletTransactionRepository } from '@/wallets/persistence/repositories/wallet-transaction.repository';
import { WalletTransactionService } from '@/wallets/services/wallet-transaction.service';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { InventoryStocksModule } from '@/inventory-stocks/inventory-stocks.module';
import { RedisHelper } from '@/utils/helpers/redis.helper';
import { SubscriptionPaymentsModule } from '@/subscription-payments/subscription-payments.module';
import { SubscriptionPaymentEntity } from '@/subscription-payments/persistence/entities/subscription-payment.entity';

/**
 * Checkout Payments Module.
 *
 * Provides payment processing functionality for checkout orders.
 * Handles payment initiation, gateway integration, callbacks, and refunds.
 *
 * Supported Payment Gateways:
 * - Maya Checkout V1 (primary, requires MAYA_* env vars)
 * - DragonPay V2 (legacy, kept for existing payments)
 * - PayMongo (legacy, kept for existing payments)
 *
 * @version 2
 * @since 1.0.0
 */
@Module({
  imports: [
    CheckoutPaymentPersistenceModule,
    CheckoutOrdersModule,
    NotificationsModule,
    MembershipPersistenceModule,
    forwardRef(() => MembershipsModule),
    MailModule,
    ParametersModule,
    SubscriptionPaymentsModule,
    TypeOrmModule.forFeature([
      SalesOrderEntity,
      BookingEntity,
      ReturnRequestEntity,
      ReturnRequestItemEntity,
      ShoppingCartEntity,
      ShoppingCartItemEntity,
      CheckoutPaymentOrderEntity,
      MayaWebhookEventEntity,
      WalletWithdrawalEntity,
      WalletEntity,
      WalletTransactionEntity,
      SellerEntity,
      CustomPaymentMethodEntity,
      SubscriptionPaymentEntity,
    ]),
    forwardRef(() => SalesOrdersModule),
    OrderTrackingModule,
    InventoryStocksModule,
  ],
  controllers: [
    CheckoutPaymentsController,
    DragonPayCallbackController,
    MayaCallbackController,
  ],
  providers: [
    CheckoutPaymentsService,
    PaymentGatewaySettingsService,
    PaymentGatewayResolver,
    MayaGateway,
    QrManualGateway,
    DragonPayGateway,
    CodGateway,
    PayMongoService,
    DragonPayV2Service,
    MayaCheckoutService,
    MayaWebhookMonitoringService,
    MayaIpWhitelistGuard,
    WalletWithdrawalRepository,
    WalletRepository,
    WalletTransactionRepository,
    WalletTransactionService,
    RedisHelper,
    CustomPaymentMethodRepository,
  ],
  exports: [
    CheckoutPaymentsService,
    DragonPayV2Service,
    MayaCheckoutService,
    PaymentGatewaySettingsService,
    CustomPaymentMethodRepository,
  ],
})
export class CheckoutPaymentsModule {}
