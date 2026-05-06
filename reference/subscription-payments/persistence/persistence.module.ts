import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionPaymentEntity } from '@/subscription-payments/persistence/entities/subscription-payment.entity';
import { SubscriptionPaymentRepository } from '@/subscription-payments/persistence/repositories/subscription-payment.repository';
import { BaseSubscriptionPaymentRepository } from '@/subscription-payments/persistence/base-subscription-payment.repository';

@Module({
  imports: [TypeOrmModule.forFeature([SubscriptionPaymentEntity])],
  providers: [
    {
      provide: BaseSubscriptionPaymentRepository,
      useClass: SubscriptionPaymentRepository,
    },
  ],
  exports: [BaseSubscriptionPaymentRepository],
})
export class SubscriptionPaymentPersistenceModule {}
