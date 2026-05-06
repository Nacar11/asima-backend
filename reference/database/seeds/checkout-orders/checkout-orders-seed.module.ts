import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckoutOrderEntity } from '@/checkout-orders/persistence/entities/checkout-order.entity';
import { CheckoutOrdersSeedService } from '@/database/seeds/checkout-orders/checkout-orders-seed.service';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { CurrencyEntity } from '@/currencies/persistence/entities/currency.entity';

/**
 * Seed module for checkout orders
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([CheckoutOrderEntity, UserEntity, CurrencyEntity]),
  ],
  providers: [CheckoutOrdersSeedService],
  exports: [CheckoutOrdersSeedService],
})
export class CheckoutOrdersSeedModule {}
