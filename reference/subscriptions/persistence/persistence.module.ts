import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionEntity } from '@/subscriptions/persistence/entities/subscription.entity';
import { SubscriptionRepository } from '@/subscriptions/persistence/repositories/subscription.repository';
import { BaseSubscriptionRepository } from '@/subscriptions/persistence/base-subscription.repository';

@Module({
  imports: [TypeOrmModule.forFeature([SubscriptionEntity])],
  providers: [
    {
      provide: BaseSubscriptionRepository,
      useClass: SubscriptionRepository,
    },
  ],
  exports: [BaseSubscriptionRepository],
})
export class SubscriptionPersistenceModule {}
