import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseUserPermissionRepository } from '@/user-permissions/persistence/base-user-permission.repository';
import { UserPermissionRepository } from '@/user-permissions/persistence/repositories/user-permission.repository';
import { UserPermissionEntity } from '@/user-permissions/persistence/entities/user-permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserPermissionEntity])],
  providers: [
    {
      provide: BaseUserPermissionRepository,
      useClass: UserPermissionRepository,
    },
  ],
  exports: [BaseUserPermissionRepository],
})
export class UserPermissionPersistenceModule {}
