import { Module } from '@nestjs/common';
import { CheckoutOrderItemsSeedService } from './checkout-order-items-seed.service';

/**
 * Checkout Order Items Seed Module
 */
@Module({
  imports: [
    // TypeOrmModule.forFeature([CheckoutOrderItemEntity]), // Uncomment if table exists
  ],
  providers: [CheckoutOrderItemsSeedService],
  exports: [CheckoutOrderItemsSeedService],
})
export class CheckoutOrderItemsSeedModule {}
