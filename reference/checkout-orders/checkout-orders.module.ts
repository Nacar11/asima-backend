import { Module } from '@nestjs/common';
import { CheckoutOrderPersistenceModule } from './persistence/persistence.module';
import { CheckoutOrdersService } from './checkout-orders.service';
import { CheckoutOrdersController } from './checkout-orders.controller';
import { ShoppingCartsModule } from '@/shopping-carts/shopping-carts.module';
import { UserAddressesModule } from '@/user-addresses/user-addresses.module';
import { ServiceAreasModule } from '@/service-areas/service-areas.module';

/**
 * Checkout Orders Module.
 *
 * Provides unified checkout functionality for both products and services.
 * Handles checkout order creation, management, and processing.
 * Includes location validation for service items.
 *
 * @version 2
 * @since 1.0.0
 */
@Module({
  imports: [
    CheckoutOrderPersistenceModule,
    ShoppingCartsModule,
    UserAddressesModule,
    ServiceAreasModule,
  ],
  controllers: [CheckoutOrdersController],
  providers: [CheckoutOrdersService],
  exports: [CheckoutOrdersService],
})
export class CheckoutOrdersModule {}
