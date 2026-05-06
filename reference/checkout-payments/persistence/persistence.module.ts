import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckoutPaymentEntity } from './entities/checkout-payment.entity';
import { CheckoutPaymentOrderEntity } from './entities/checkout-payment-order.entity';
import { BaseCheckoutPaymentRepository } from './base-checkout-payment.repository';
import { CheckoutPaymentRepository } from './repositories/checkout-payment.repository';
import { CheckoutPaymentMapper } from './mappers/checkout-payment.mapper';

/**
 * Checkout Payments Persistence Module.
 *
 * Provides data access layer for checkout payments including repository
 * implementations and TypeORM entity registration. Maps abstract repository
 * to concrete implementation for dependency injection.
 *
 * @version 1
 * @since 1.0.0
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      CheckoutPaymentEntity,
      CheckoutPaymentOrderEntity,
    ]),
  ],
  providers: [
    CheckoutPaymentMapper,
    {
      provide: BaseCheckoutPaymentRepository,
      useClass: CheckoutPaymentRepository,
    },
  ],
  exports: [
    TypeOrmModule,
    BaseCheckoutPaymentRepository,
    CheckoutPaymentMapper,
  ],
})
export class CheckoutPaymentPersistenceModule {}
