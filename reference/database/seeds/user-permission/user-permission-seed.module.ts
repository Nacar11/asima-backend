import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPermissionEntity } from '@/user-permissions/persistence/entities/user-permission.entity';
import { UserGroupEntity } from '@/user-groups/persistence/entities/user-group.entity';
import { MenuEntity } from '@/menus/persistence/entities/menu.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { UserPermissionSeedService } from './user-permission-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserPermissionEntity,
      UserGroupEntity,
      MenuEntity,
      UserEntity,
    ]),
  ],
  providers: [UserPermissionSeedService],
  exports: [UserPermissionSeedService],
})
export class UserPermissionSeedModule {}
