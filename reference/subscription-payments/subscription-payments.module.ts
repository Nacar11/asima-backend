import { Module } from '@nestjs/common';
import { SubscriptionPaymentsService } from '@/subscription-payments/subscription-payments.service';
import { SubscriptionPaymentsController } from '@/subscription-payments/subscription-payments.controller';
import { SubscriptionPaymentPersistenceModule } from '@/subscription-payments/persistence/persistence.module';
import { SubscriptionsModule } from '@/subscriptions/subscriptions.module';

@Module({
  imports: [SubscriptionPaymentPersistenceModule, SubscriptionsModule],
  controllers: [SubscriptionPaymentsController],
  providers: [SubscriptionPaymentsService],
  exports: [SubscriptionPaymentsService, SubscriptionPaymentPersistenceModule],
})
export class SubscriptionPaymentsModule {}
