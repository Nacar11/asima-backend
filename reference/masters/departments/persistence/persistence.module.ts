import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseDepartmentRepository } from '@/masters/departments/persistence/base-department.repository';
import { DepartmentRepository } from '@/masters/departments/persistence/repositories/department.repository';
import { DepartmentEntity } from '@/masters/departments/persistence/entities/department.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DepartmentEntity])],
  providers: [
    {
      provide: BaseDepartmentRepository,
      useClass: DepartmentRepository,
    },
  ],
  exports: [BaseDepartmentRepository],
})
export class DepartmentPersistenceModule {}
