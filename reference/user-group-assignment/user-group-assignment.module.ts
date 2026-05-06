import { Module } from '@nestjs/common';
import { UserGroupPersistenceModule } from '@/user-groups/persistence/persistence.module';
import { UserAssignmentPersistenceModule } from '@/user-assignments/persistence/persistence.module';
import { UserGroupAssignmentService } from './user-group-assignment.service';
import { PermissionsModule } from '@/permissions/permissions.module';

@Module({
  imports: [
    UserGroupPersistenceModule,
    UserAssignmentPersistenceModule,
    PermissionsModule,
  ],
  providers: [UserGroupAssignmentService],
  exports: [UserGroupAssignmentService],
})
export class UserGroupAssignmentModule {}
