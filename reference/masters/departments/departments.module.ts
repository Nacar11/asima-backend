import { Module } from '@nestjs/common';
import { DepartmentsService } from '@/masters/departments/departments.service';
import { DepartmentsController } from '@/masters/departments/departments.controller';
import { DepartmentPersistenceModule } from '@/masters/departments/persistence/persistence.module';
import { UsersModule } from '@/users/users.module';

@Module({
  imports: [DepartmentPersistenceModule, UsersModule],
  controllers: [DepartmentsController],
  providers: [DepartmentsService],
  exports: [DepartmentsService, DepartmentPersistenceModule],
})
export class DepartmentsModule {}
