import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminSubscriptionsPersistenceModule } from '@/admin-subscriptions/persistence/persistence.module';
import { SubscriptionPersistenceModule } from '@/subscriptions/persistence/persistence.module';
import { SubscriptionPlansModule } from '@/subscription-plans/subscription-plans.module';
import { AdminSubscriptionsService } from '@/admin-subscriptions/admin-subscriptions.service';
import { SubscriptionAnalyticsService } from '@/admin-subscriptions/services/subscription-analytics.service';
import { SubscriptionOperationsService } from '@/admin-subscriptions/services/subscription-operations.service';
import { AdminSubscriptionsController } from '@/admin-subscriptions/admin-subscriptions.controller';
import { SubscriptionEntity } from '@/subscriptions/persistence/entities/subscription.entity';
import { SubscriptionPlanEntity } from '@/subscription-plans/persistence/entities/subscription-plan.entity';
import { SubscriptionPaymentEntity } from '@/subscription-payments/persistence/entities/subscription-payment.entity';
import { SubscriptionOperationEntity } from '@/admin-subscriptions/persistence/entities/subscription-operation.entity';

/**
 * Admin Subscriptions Module.
 *
 * Orchestrates all components of the admin subscription management system.
 *
 * @version 1
 * @since 1.0.0
 */
@Module({
  imports: [
    AdminSubscriptionsPersistenceModule,
    SubscriptionPersistenceModule,
    SubscriptionPlansModule,
    TypeOrmModule.forFeature([
      SubscriptionEntity,
      SubscriptionPlanEntity,
      SubscriptionPaymentEntity,
      SubscriptionOperationEntity,
    ]),
  ],
  controllers: [AdminSubscriptionsController],
  providers: [
    AdminSubscriptionsService,
    SubscriptionAnalyticsService,
    SubscriptionOperationsService,
  ],
  exports: [AdminSubscriptionsService],
})
export class AdminSubscriptionsModule {}
