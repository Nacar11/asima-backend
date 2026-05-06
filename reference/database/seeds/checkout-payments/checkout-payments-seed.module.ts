import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckoutPaymentEntity } from '@/checkout-payments/persistence/entities/checkout-payment.entity';
import { CheckoutPaymentsSeedService } from '@/database/seeds/checkout-payments/checkout-payments-seed.service';
import { CheckoutOrderEntity } from '@/checkout-orders/persistence/entities/checkout-order.entity';

/**
 * Seed module for checkout payments
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([CheckoutPaymentEntity, CheckoutOrderEntity]),
  ],
  providers: [CheckoutPaymentsSeedService],
  exports: [CheckoutPaymentsSeedService],
})
export class CheckoutPaymentsSeedModule {}
