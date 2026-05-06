import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DisputeEntity } from './entities/dispute.entity';
import { DisputeMessageEntity } from './entities/dispute-message.entity';
import { BaseDisputeRepository } from './base-dispute.repository';
import { DisputeRepository } from './repositories/dispute.repository';
import { DisputeMapper } from './mappers/dispute.mapper';
import { BaseDisputeMessageRepository } from './base-dispute-message.repository';
import { DisputeMessageRepository } from './repositories/dispute-message.repository';
import { DisputeMessageMapper } from './mappers/dispute-message.mapper';

/**
 * Disputes Persistence Module.
 *
 * Provides data access layer for disputes including repository
 * implementations and TypeORM entity registration.
 *
 * @version 1
 * @since 1.0.0
 */
@Module({
  imports: [TypeOrmModule.forFeature([DisputeEntity, DisputeMessageEntity])],
  providers: [
    DisputeMapper,
    {
      provide: BaseDisputeRepository,
      useClass: DisputeRepository,
    },
    DisputeMessageMapper,
    {
      provide: BaseDisputeMessageRepository,
      useClass: DisputeMessageRepository,
    },
  ],
  exports: [
    TypeOrmModule,
    BaseDisputeRepository,
    DisputeMapper,
    BaseDisputeMessageRepository,
    DisputeMessageMapper,
  ],
})
export class DisputePersistenceModule {}
