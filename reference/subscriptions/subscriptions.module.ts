import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionsService } from '@/subscriptions/subscriptions.service';
import { SubscriptionsSchedulerService } from '@/subscriptions/subscriptions-scheduler.service';
import { SubscriptionsController } from '@/subscriptions/subscriptions.controller';
import { SubscriptionPersistenceModule } from '@/subscriptions/persistence/persistence.module';
import { SubscriptionPaymentPersistenceModule } from '@/subscription-payments/persistence/persistence.module';
import { SubscriptionPlansModule } from '@/subscription-plans/subscription-plans.module';
import { SellerPersistenceModule } from '@/sellers/persistence/persistence.module';
import { ProductPersistenceModule } from '@/products/persistence/persistence.module';
import { ServicePersistenceModule } from '@/services/persistence/persistence.module';
import { SellerMemberPersistenceModule } from '@/seller-members/persistence/persistence.module';
import { BookingPersistenceModule } from '@/bookings/persistence/persistence.module';
import { SubscriptionEntity } from '@/subscriptions/persistence/entities/subscription.entity';
import { SubscriptionPaymentEntity } from '@/subscription-payments/persistence/entities/subscription-payment.entity';

@Module({
  imports: [
    SubscriptionPersistenceModule,
    SubscriptionPaymentPersistenceModule,
    SubscriptionPlansModule,
    SellerPersistenceModule,
    ProductPersistenceModule,
    ServicePersistenceModule,
    SellerMemberPersistenceModule,
    BookingPersistenceModule,
    TypeOrmModule.forFeature([SubscriptionEntity, SubscriptionPaymentEntity]),
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, SubscriptionsSchedulerService],
  exports: [
    SubscriptionsService,
    SubscriptionsSchedulerService,
    SubscriptionPersistenceModule,
  ],
})
export class SubscriptionsModule {}
