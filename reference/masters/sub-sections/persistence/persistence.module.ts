import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseSubSectionRepository } from '@/masters/sub-sections/persistence/base-sub-section.repository';
import { SubSectionRepository } from '@/masters/sub-sections/persistence/repositories/sub-section.repository';
import { SubSectionEntity } from '@/masters/sub-sections/persistence/entities/sub-section.entity';

/**
 * Persistence module for sub-section data access operations.
 *
 * This module configures all persistence-related components for sub-section
 * operations, including repository providers, entity registration, and
 * dependency injection setup. It provides a clean abstraction layer
 * for data access operations.
 *
 * The module includes:
 * - TypeORM entity registration
 * - Repository provider configuration
 * - Abstract repository implementation
 * - Clean dependency injection
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 */
@Module({
  imports: [TypeOrmModule.forFeature([SubSectionEntity])],
  providers: [
    {
      provide: BaseSubSectionRepository,
      useClass: SubSectionRepository,
    },
  ],
  exports: [BaseSubSectionRepository],
})
export class SubSectionPersistenceModule {}
