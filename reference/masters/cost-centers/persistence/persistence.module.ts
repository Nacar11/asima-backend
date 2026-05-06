import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseCostCenterRepository } from '@/masters/cost-centers/persistence/base-cost-center.repository';
import { CostCenterRepository } from '@/masters/cost-centers/persistence/repositories/cost-center.repository';
import { CostCenterEntity } from '@/masters/cost-centers/persistence/entities/cost-center.entity';

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
