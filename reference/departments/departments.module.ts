import { Module } from '@nestjs/common';
import { DepartmentsService } from '@/departments/departments.service';
import { DepartmentsController } from '@/departments/departments.controller';
import { DepartmentPersistenceModule } from '@/departments/persistence/persistence.module';
import { UsersModule } from '@/users/users.module';

@Module({
  imports: [DepartmentPersistenceModule, UsersModule],
  controllers: [DepartmentsController],
  providers: [DepartmentsService],
  exports: [DepartmentsService, DepartmentPersistenceModule],
})
export class DepartmentsModule {}
