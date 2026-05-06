import { Module } from '@nestjs/common';
import { SubscriptionPlansService } from '@/subscription-plans/subscription-plans.service';
import { SubscriptionPlansController } from '@/subscription-plans/subscription-plans.controller';
import { SubscriptionPlanPersistenceModule } from '@/subscription-plans/persistence/persistence.module';

@Module({
  imports: [SubscriptionPlanPersistenceModule],
  controllers: [SubscriptionPlansController],
  providers: [SubscriptionPlansService],
  exports: [SubscriptionPlansService, SubscriptionPlanPersistenceModule],
})
export class SubscriptionPlansModule {}
