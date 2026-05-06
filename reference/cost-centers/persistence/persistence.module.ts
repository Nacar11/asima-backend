import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseCostCenterRepository } from '@/cost-centers/persistence/base-cost-center.repository';
import { CostCenterRepository } from '@/cost-centers/persistence/repositories/cost-center.repository';
import { CostCenterEntity } from '@/cost-centers/persistence/entities/cost-center.entity';

/**
 * Cost Center Persistence Module
 *
 * NestJS module that provides data persistence functionality for cost centers.
 * Configures TypeORM entities and repository implementations for cost center
 * data operations with complete related entity loading.
 *
 * This module ensures that all cost center operations include complete
 * organizational hierarchy data and user audit information.
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [CostCenterPersistenceModule],
 *   // ... other module configuration
 * })
 * export class AppModule {}
 * ```
 *
 * @author Cody Inc Development Team
 * @since 1.0.0
 */
@Module({
  imports: [TypeOrmModule.forFeature([CostCenterEntity])],
  providers: [
    {
      provide: BaseCostCenterRepository,
      useClass: CostCenterRepository,
    },
  ],
  exports: [BaseCostCenterRepository],
})
export class CostCenterPersistenceModule {}
