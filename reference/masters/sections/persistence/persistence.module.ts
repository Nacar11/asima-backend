import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseSectionRepository } from '@/masters/sections/persistence/base-section.repository';
import { SectionRepository } from '@/masters/sections/persistence/repositories/section.repository';
import { SectionEntity } from '@/masters/sections/persistence/entities/section.entity';

/**
 * Persistence module for section data access operations.
 *
 * This module configures all persistence-related components for section
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
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [SectionPersistenceModule],
 *   // Other module configuration
 * })
 * export class AppModule {}
 * ```
 */
@Module({
  imports: [TypeOrmModule.forFeature([SectionEntity])],
  providers: [
    {
      provide: BaseSectionRepository,
      useClass: SectionRepository,
    },
  ],
  exports: [BaseSectionRepository],
})
export class SectionPersistenceModule {}
