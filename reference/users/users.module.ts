import { forwardRef, Module } from '@nestjs/common';
import { UsersController } from '@/users/users.controller';
import { UsersService } from '@/users/users.service';
import { UserPersistenceModule } from '@/users/persistence/persistence.module';
import { UserValidator } from '@/users/users.validator';
import { UserDetailsModule } from '@/user-details/user-details.module';
import { UserGroupAssignmentModule } from '@/user-group-assignment/user-group-assignment.module';
import { UserAssignmentsModule } from '@/user-assignments/user-assignments.module';
import { SellerPersistenceModule } from '@/sellers/persistence/persistence.module';
import { SellerMemberPersistenceModule } from '@/seller-members/persistence/persistence.module';

@Module({
  imports: [
    // import modules, etc.
    UserPersistenceModule,
    UserDetailsModule,
    UserGroupAssignmentModule,
    forwardRef(() => UserAssignmentsModule),
    SellerPersistenceModule,
    SellerMemberPersistenceModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, UserValidator],
  exports: [UsersService, UserPersistenceModule],
})
export class UsersModule {}
