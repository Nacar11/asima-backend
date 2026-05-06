import { UsersModule } from '@/users/users.module';
import { Module } from '@nestjs/common';
import { DivisionsService } from '@/masters/divisions/divisions.service';
import { DivisionsController } from '@/masters/divisions/divisions.controller';
import { DivisionPersistenceModule } from '@/masters/divisions/persistence/persistence.module';

/**
 * Module for managing divisions in the organizational hierarchy.
 *
 * This module configures all components required for division operations,
 * including service, controller, and persistence layer dependencies.
 * It provides a complete feature module for division management with
 * proper dependency injection and clean architecture principles.
 *
 * The module includes:
 * - Division service for business logic
 * - Division controller for API endpoints
 * - User module dependency for division head management
 * - Persistence module for data access operations
 * - Clean exports for external module usage
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [DivisionsModule],
 *   // Other module configuration
 * })
 * export class AppModule {}
 * ```
 */
@Module({
  imports: [UsersModule, DivisionPersistenceModule],
  controllers: [DivisionsController],
  providers: [DivisionsService],
  exports: [DivisionsService, DivisionPersistenceModule],
})
export class DivisionsModule {}
