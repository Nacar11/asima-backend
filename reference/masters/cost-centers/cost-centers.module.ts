import { Module } from '@nestjs/common';
import { CostCentersService } from '@/masters/cost-centers/cost-centers.service';
import { CostCentersController } from '@/masters/cost-centers/cost-centers.controller';
import { CostCenterPersistenceModule } from '@/masters/cost-centers/persistence/persistence.module';
import { DepartmentsModule } from '@/masters/departments/departments.module';
import { DivisionsModule } from '@/masters/divisions/divisions.module';
import { SectionsModule } from '@/masters/sections/sections.module';
import { SubSectionsModule } from '@/masters/sub-sections/sub-sections.module';
import { CostCenterValidator } from '@/utils/validators/cost-centers.validator';

/**
 * Module for managing cost centers in the organizational hierarchy.
 *
 * This module provides comprehensive functionality for cost center management,
 * including CRUD operations, status management, bulk operations, and advanced
 * filtering. Cost centers are automatically generated based on organizational
 * structure and follow a hierarchical code system.
 *
 * The module integrates with the organizational structure modules (divisions,
 * departments, sections, sub-sections) to ensure data integrity and proper
 * cost center code generation.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * // Import the module in your application
 * @Module({
 *   imports: [CostCentersModule],
 * })
 * export class AppModule {}
 * ```
 *
 * @see {@link CostCentersService} - Service for cost center business logic
 * @see {@link CostCentersController} - Controller for cost center HTTP endpoints
 * @see {@link CostCenterPersistenceModule} - Persistence layer for cost centers
 */
@Module({
  imports: [
    // import modules, etc.
    CostCenterPersistenceModule,
    DepartmentsModule,
    DivisionsModule,
    SectionsModule,
    SubSectionsModule,
  ],
  controllers: [CostCentersController],
  providers: [CostCentersService, CostCenterValidator],
  exports: [CostCentersService, CostCenterPersistenceModule],
})
export class CostCentersModule {}
