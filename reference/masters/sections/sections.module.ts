import { Module } from '@nestjs/common';
import { SectionsService } from '@/masters/sections/sections.service';
import { SectionsController } from '@/masters/sections/sections.controller';
import { SectionPersistenceModule } from '@/masters/sections/persistence/persistence.module';
import { UsersModule } from '@/users/users.module';

/**
 * Module for managing sections in the organizational hierarchy.
 *
 * This module configures all components required for section operations,
 * including service, controller, and persistence layer dependencies.
 * It provides a complete feature module for section management with
 * proper dependency injection and clean architecture principles.
 *
 * The module includes:
 * - Section service for business logic
 * - Section controller for API endpoints
 * - User module dependency for section head management
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
 *   imports: [SectionsModule],
 *   // Other module configuration
 * })
 * export class AppModule {}
 * ```
 */
@Module({
  imports: [SectionPersistenceModule, UsersModule],
  controllers: [SectionsController],
  providers: [SectionsService],
  exports: [SectionsService, SectionPersistenceModule],
})
export class SectionsModule {}
