import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreUserGroupsController } from './store-user-groups.controller';
import { StoreUserGroupsService } from './store-user-groups.service';
import { UserGroupEntity } from '@/user-groups/persistence/entities/user-group.entity';
import { UserPermissionEntity } from '@/user-permissions/persistence/entities/user-permission.entity';
import { UserAssignmentEntity } from '@/user-assignments/persistence/entities/user-assignment.entity';
import { UserSellerAssignmentEntity } from '@/user-seller-assignments/persistence/entities/user-seller-assignment.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { MenuEntity } from '@/menus/persistence/entities/menu.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserGroupEntity,
      UserPermissionEntity,
      UserAssignmentEntity,
      UserSellerAssignmentEntity,
      SellerEntity,
      MenuEntity,
    ]),
  ],
  controllers: [StoreUserGroupsController],
  providers: [StoreUserGroupsService],
  exports: [StoreUserGroupsService],
})
export class StoreUserGroupsModule {}
