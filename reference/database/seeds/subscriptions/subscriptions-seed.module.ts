import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionEntity } from '@/subscriptions/persistence/entities/subscription.entity';
import { SubscriptionsSeedService } from '@/database/seeds/subscriptions/subscriptions-seed.service';
import { SubscriptionPlanEntity } from '@/subscription-plans/persistence/entities/subscription-plan.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

/**
 * Seed module for subscriptions
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubscriptionEntity,
      SubscriptionPlanEntity,
      UserEntity,
    ]),
  ],
  providers: [SubscriptionsSeedService],
  exports: [SubscriptionsSeedService],
})
export class SubscriptionsSeedModule {}
