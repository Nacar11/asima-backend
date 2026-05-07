import { Module } from '@nestjs/common';
import { UsersService } from '@/users/users.service';
import { UserPersistenceModule } from '@/users/persistence/persistence.module';
import { RolesModule } from '@/roles/roles.module';
import { AdminUsersController } from '@/users/controllers/admin-users.controller';
import { MeUsersController } from '@/users/controllers/me-users.controller';

@Module({
  imports: [UserPersistenceModule, RolesModule],
  controllers: [AdminUsersController, MeUsersController],
  providers: [UsersService],
  exports: [UsersService, UserPersistenceModule],
})
export class UsersModule {}
