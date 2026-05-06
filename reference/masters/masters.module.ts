import { Module } from '@nestjs/common';
import { CostCentersModule } from './cost-centers/cost-centers.module';
import { DepartmentsModule } from './departments/departments.module';
import { DivisionsModule } from './divisions/divisions.module';
import { SectionsModule } from './sections/sections.module';
import { SubSectionsModule } from './sub-sections/sub-sections.module';
import { MastersController } from './masters.controller';

/**
 * Main module for centralized organizational management.
 *
 * The Masters Module provides comprehensive functionality for managing
 * the organizational hierarchy including cost centers, departments,
 * divisions, sections, and sub-sections. It serves as the central hub
 * for all organizational structure management operations.
 *
 * This module integrates all organizational entity modules and provides
 * a unified interface for organizational management. It includes:
 * - CRUD operations for all organizational entities
 * - Status management (Hold, Activate, Cancel)
 * - Bulk operations for efficient data management
 * - Advanced filtering and pagination
 * - Lookup operations for dropdowns and autocomplete
 * - Audit trails for all operations
 * - Soft delete functionality
 * - Complete JSDoc documentation
 * - Compodocs integration for API documentation
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * // Import the module in your application
 * @Module({
 *   imports: [MastersModule],
 * })
 * export class AppModule {}
 * ```
 *
 * @see {@link CostCentersModule} - Cost centers management
 * @see {@link DepartmentsModule} - Departments management
 * @see {@link DivisionsModule} - Divisions management
 * @see {@link SectionsModule} - Sections management
 * @see {@link SubSectionsModule} - Sub-sections management
 * @see {@link MastersController} - Main controller for module information
 */
@Module({
  imports: [
    CostCentersModule,
    DepartmentsModule,
    DivisionsModule,
    SectionsModule,
    SubSectionsModule,
  ],
  controllers: [MastersController],
  exports: [
    CostCentersModule,
    DepartmentsModule,
    DivisionsModule,
    SectionsModule,
    SubSectionsModule,
  ],
})
export class MastersModule {}
