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
 * Cost Centers Module
 *
 * NestJS module that provides cost center management functionality including:
 * - Cost center CRUD operations with complete related entity data
 * - Hierarchical organization structure management
 * - User audit trails and soft deletion
 * - Lookup operations for UI components
 *
 * This module integrates with organizational modules (divisions, departments,
 * sections, sub-sections) to provide complete cost center functionality.
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [CostCentersModule],
 *   // ... other module configuration
 * })
 * export class AppModule {}
 * ```
 *
 * @author Cody Inc Development Team
 * @since 1.0.0
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
