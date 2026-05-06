import { MenusModule } from '@/menus/menus.module';
import { forwardRef, Global, Module } from '@nestjs/common';
import { UserPermissionsService } from '@/user-permissions/user-permissions.service';
import { UserPermissionsController } from '@/user-permissions/user-permissions.controller';
import { UserPermissionPersistenceModule } from '@/user-permissions/persistence/persistence.module';
import { UserGroupsModule } from '@/user-groups/user-groups.module';
import { PermissionsGuard } from './user-permissions.guard';
// import { APP_GUARD } from '@nestjs/core';
import { UsersModule } from '../users/users.module';
import { PermissionsModule } from '../permissions/permissions.module';

@Global()
@Module({
  imports: [
    // import modules, etc.
    UserPermissionPersistenceModule,
    forwardRef(() => UserGroupsModule),
    forwardRef(() => UsersModule),
    MenusModule,
    PermissionsModule,
  ],
  controllers: [UserPermissionsController],
  providers: [
    UserPermissionsService,
    PermissionsGuard,
    // { provide: APP_GUARD, useClass: PermissionsGuard }, -- commented to fix PermissionsGuard triggering multiple times
  ],
  exports: [
    UserPermissionsService,
    UserPermissionPersistenceModule,
    PermissionsGuard,
    PermissionsModule, // Re-export for PermissionsGuard dependencies
    forwardRef(() => UsersModule), // Re-export for PermissionsGuard dependencies
  ],
})
export class UserPermissionsModule {}
