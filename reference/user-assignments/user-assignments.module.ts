import { UsersModule } from '@/users/users.module';
import { UserGroupsModule } from './../user-groups/user-groups.module';
import { forwardRef, Module } from '@nestjs/common';
import { UserAssignmentsService } from '@/user-assignments/user-assignments.service';
import { UserAssignmentsController } from '@/user-assignments/user-assignments.controller';
import { UserAssignmentPersistenceModule } from '@/user-assignments/persistence/persistence.module';
import { UserPersistenceModule } from '@/users/persistence/persistence.module';
import { IsExistConstraint } from '@/utils/validators/exist.validator';

@Module({
  imports: [
    // import modules, etc.
    UserAssignmentPersistenceModule,
    UserPersistenceModule,
    forwardRef(() => UsersModule),
    forwardRef(() => UserGroupsModule),
  ],
  controllers: [UserAssignmentsController],
  providers: [UserAssignmentsService, IsExistConstraint],
  exports: [UserAssignmentsService, UserAssignmentPersistenceModule],
})
export class UserAssignmentsModule {}
