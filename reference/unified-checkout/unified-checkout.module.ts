import { Module } from '@nestjs/common';
import { UnifiedCheckoutService } from './unified-checkout.service';
import { UnifiedCheckoutController } from './unified-checkout.controller';
import { ShoppingCartsModule } from '@/shopping-carts/shopping-carts.module';
import { CheckoutOrdersModule } from '@/checkout-orders/checkout-orders.module';
import { SalesOrdersModule } from '@/sales-orders/sales-orders.module';
import { BookingsModule } from '@/bookings/bookings.module';
import { ServicesModule } from '@/services/services.module';
import { CartItemAddonsModule } from '@/cart-item-addons/cart-item-addons.module';
import { CartItemOptionsModule } from '@/cart-item-options/cart-item-options.module';

/**
 * Unified Checkout Module.
 *
 * Provides orchestration for unified checkout of both products and services
 * in a single cart. Coordinates with existing sales orders and bookings modules.
 *
 * @version 1
 */
@Module({
  imports: [
    ShoppingCartsModule,
    CheckoutOrdersModule,
    SalesOrdersModule,
    BookingsModule,
    ServicesModule,
    CartItemAddonsModule,
    CartItemOptionsModule,
  ],
  controllers: [UnifiedCheckoutController],
  providers: [UnifiedCheckoutService],
  exports: [UnifiedCheckoutService],
})
export class UnifiedCheckoutModule {}
