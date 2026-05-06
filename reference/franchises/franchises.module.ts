import { Module } from '@nestjs/common';
import { FranchisesController } from '@/franchises/franchises.controller';
import { FranchisesService } from '@/franchises/franchises.service';
import { FranchiseStatusEventsService } from '@/franchises/franchise-status-events.service';
import { FranchisePersistenceModule } from '@/franchises/persistence/persistence.module';
import { FranchiseMapper } from '@/franchises/persistence/mappers/franchise.mapper';
import { FranchiseStatusEventMapper } from '@/franchises/persistence/mappers/franchise-status-event.mapper';

/**
 * Franchises module
 * Encapsulates all franchise-related functionality
 */
@Module({
  imports: [FranchisePersistenceModule],
  controllers: [FranchisesController],
  providers: [
    FranchisesService,
    FranchiseStatusEventsService,
    FranchiseMapper,
    FranchiseStatusEventMapper,
  ],
  exports: [FranchisesService],
})
export class FranchisesModule {}
