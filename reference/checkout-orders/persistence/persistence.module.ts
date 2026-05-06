import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckoutOrderEntity } from './entities/checkout-order.entity';
import { BaseCheckoutOrderRepository } from './base-checkout-order.repository';
import { CheckoutOrderRepository } from './repositories/checkout-order.repository';
import { CheckoutOrderMapper } from './mappers/checkout-order.mapper';

/**
 * Checkout Orders Persistence Module.
 *
 * Provides data access layer for checkout orders including repository
 * implementations and TypeORM entity registration. Maps abstract repository
 * to concrete implementation for dependency injection.
 *
 * @version 1
 * @since 1.0.0
 */
@Module({
  imports: [TypeOrmModule.forFeature([CheckoutOrderEntity])],
  providers: [
    CheckoutOrderMapper,
    {
      provide: BaseCheckoutOrderRepository,
      useClass: CheckoutOrderRepository,
    },
  ],
  exports: [TypeOrmModule, BaseCheckoutOrderRepository, CheckoutOrderMapper],
})
export class CheckoutOrderPersistenceModule {}
