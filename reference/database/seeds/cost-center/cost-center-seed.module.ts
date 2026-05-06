import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CostCenterEntity } from '@/cost-centers/persistence/entities/cost-center.entity';
import { CostCenterSeedService } from '@/database/seeds/cost-center/cost-center-seed.service';
import { DivisionEntity } from '@/divisions/persistence/entities/division.entity';
import { DepartmentEntity } from '@/departments/persistence/entities/department.entity';
import { SectionEntity } from '@/sections/persistence/entities/section.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DivisionEntity,
      DepartmentEntity,
      SectionEntity,
      CostCenterEntity,
      UserEntity,
    ]),
  ],
  providers: [CostCenterSeedService],
  exports: [CostCenterSeedService],
})
export class CostCenterSeedModule {}
