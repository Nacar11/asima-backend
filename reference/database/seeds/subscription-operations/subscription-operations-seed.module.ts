import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionOperationEntity } from '@/admin-subscriptions/persistence/entities/subscription-operation.entity';
import { SubscriptionOperationsSeedService } from '@/database/seeds/subscription-operations/subscription-operations-seed.service';
import { SubscriptionEntity } from '@/subscriptions/persistence/entities/subscription.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

/**
 * Seed module for subscription operations
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubscriptionOperationEntity,
      SubscriptionEntity,
      UserEntity,
    ]),
  ],
  providers: [SubscriptionOperationsSeedService],
  exports: [SubscriptionOperationsSeedService],
})
export class SubscriptionOperationsSeedModule {}
