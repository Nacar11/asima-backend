import { forwardRef, Module } from '@nestjs/common';
import { UserGroupsController } from '@/user-groups/user-groups.controller';
import { UserGroupPersistenceModule } from '@/user-groups/persistence/persistence.module';
import { UserGroupsService } from '@/user-groups/user-groups.service';
import { UserAssignmentsModule } from '@/user-assignments/user-assignments.module';
import { UserPermissionsModule } from '@/user-permissions/user-permissions.module';
// import { UserAssignmentsModule } from '@/user-assignments/user-assignments.module';

@Module({
  imports: [
    // import modules, etc.
    UserGroupPersistenceModule,
    forwardRef(() => UserAssignmentsModule),
    forwardRef(() => UserPermissionsModule),
  ],
  controllers: [UserGroupsController],
  providers: [UserGroupsService],
  exports: [UserGroupsService, UserGroupPersistenceModule],
})
export class UserGroupsModule {}
