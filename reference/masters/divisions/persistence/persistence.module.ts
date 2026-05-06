import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseDivisionRepository } from '@/masters/divisions/persistence/base-division.repository';
import { DivisionRepository } from '@/masters/divisions/persistence/repositories/division.repository';
import { DivisionEntity } from '@/masters/divisions/persistence/entities/division.entity';

/**
 * Persistence module for division data access operations.
 *
 * This module configures all persistence-related components for division
 * operations, including repository providers, entity registration, and
 * dependency injection setup. It provides a clean abstraction layer
 * for data access operations.
 *
 * The module includes:
 * - TypeORM entity registration for DivisionEntity
 * - Repository provider configuration with dependency injection
 * - Abstract repository implementation binding
 * - Clean dependency injection for external modules
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [DivisionPersistenceModule],
 *   // Other module configuration
 * })
 * export class DivisionsModule {}
 * ```
 */
@Module({
  imports: [TypeOrmModule.forFeature([DivisionEntity])],
  providers: [
    {
      provide: BaseDivisionRepository,
      useClass: DivisionRepository,
    },
  ],
  exports: [BaseDivisionRepository],
})
export class DivisionPersistenceModule {}
