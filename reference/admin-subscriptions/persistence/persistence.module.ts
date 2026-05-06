import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionOperationEntity } from './entities/subscription-operation.entity';
import { SubscriptionOperationRepository } from './repositories/subscription-operation.repository';

/**
 * Persistence module for admin subscriptions.
 *
 * Registers TypeORM entities and provides repository implementations.
 *
 * @version 1
 * @since 1.0.0
 */
@Module({
  imports: [TypeOrmModule.forFeature([SubscriptionOperationEntity])],
  providers: [SubscriptionOperationRepository],
  exports: [SubscriptionOperationRepository],
})
export class AdminSubscriptionsPersistenceModule {}
