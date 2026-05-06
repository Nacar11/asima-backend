import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartmentEntity } from '@/departments/persistence/entities/department.entity';
import { DepartmentSeedService } from '@/database/seeds/department/department-seed.service';
import { UserEntity } from '@/users/persistence/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, DepartmentEntity])],
  providers: [DepartmentSeedService],
  exports: [DepartmentSeedService],
})
export class DepartmentSeedModule {}
