import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FranchiseEntity } from '@/franchises/persistence/entities/franchise.entity';
import { FranchiseStatusEventEntity } from '@/franchises/persistence/entities/franchise-status-event.entity';
import { FranchiseMapper } from '@/franchises/persistence/mappers/franchise.mapper';
import { FranchiseStatusEventMapper } from '@/franchises/persistence/mappers/franchise-status-event.mapper';
import { FranchiseRepository } from '@/franchises/persistence/repositories/franchise.repository';
import { FranchiseStatusEventRepository } from '@/franchises/persistence/repositories/franchise-status-event.repository';
import { BaseFranchiseRepository } from '@/franchises/persistence/base-franchise.repository';
import { BaseFranchiseStatusEventRepository } from '@/franchises/persistence/base-franchise-status-event.repository';

/**
 * Persistence module for franchises
 * Encapsulates TypeORM setup and repository configuration
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([FranchiseEntity, FranchiseStatusEventEntity]),
  ],
  providers: [
    FranchiseMapper,
    FranchiseStatusEventMapper,
    {
      provide: BaseFranchiseRepository,
      useClass: FranchiseRepository,
    },
    {
      provide: BaseFranchiseStatusEventRepository,
      useClass: FranchiseStatusEventRepository,
    },
  ],
  exports: [
    BaseFranchiseRepository,
    BaseFranchiseStatusEventRepository,
    FranchiseMapper,
    FranchiseStatusEventMapper,
  ],
})
export class FranchisePersistenceModule {}
