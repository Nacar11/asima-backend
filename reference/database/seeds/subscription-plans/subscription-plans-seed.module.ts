import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionPlanEntity } from '@/subscription-plans/persistence/entities/subscription-plan.entity';
import { SubscriptionPlansSeedService } from '@/database/seeds/subscription-plans/subscription-plans-seed.service';
import { CurrencyEntity } from '@/currencies/persistence/entities/currency.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

/**
 * Seed module for subscription plans
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubscriptionPlanEntity,
      CurrencyEntity,
      UserEntity,
    ]),
  ],
  providers: [SubscriptionPlansSeedService],
  exports: [SubscriptionPlansSeedService],
})
export class SubscriptionPlansSeedModule {}
