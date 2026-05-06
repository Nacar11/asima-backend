import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionPaymentEntity } from '@/subscription-payments/persistence/entities/subscription-payment.entity';
import { SubscriptionPaymentsSeedService } from '@/database/seeds/subscription-payments/subscription-payments-seed.service';
import { SubscriptionEntity } from '@/subscriptions/persistence/entities/subscription.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

/**
 * Seed module for subscription payments
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubscriptionPaymentEntity,
      SubscriptionEntity,
      UserEntity,
    ]),
  ],
  providers: [SubscriptionPaymentsSeedService],
  exports: [SubscriptionPaymentsSeedService],
})
export class SubscriptionPaymentsSeedModule {}
