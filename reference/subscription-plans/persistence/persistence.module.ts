import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionPlanEntity } from '@/subscription-plans/persistence/entities/subscription-plan.entity';
import { SubscriptionPlanRepository } from '@/subscription-plans/persistence/repositories/subscription-plan.repository';
import { BaseSubscriptionPlanRepository } from '@/subscription-plans/persistence/base-subscription-plan.repository';

@Module({
  imports: [TypeOrmModule.forFeature([SubscriptionPlanEntity])],
  providers: [
    {
      provide: BaseSubscriptionPlanRepository,
      useClass: SubscriptionPlanRepository,
    },
  ],
  exports: [BaseSubscriptionPlanRepository],
})
export class SubscriptionPlanPersistenceModule {}
