import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleEntity } from '@/roles/persistence/entities/role.entity';
import { RoleRepository } from '@/roles/persistence/repositories/role.repository';
import { BaseRoleRepository } from '@/roles/persistence/base-role.repository';
import { PermissionPersistenceModule } from '@/permissions/persistence/persistence.module';

@Module({
  imports: [TypeOrmModule.forFeature([RoleEntity]), PermissionPersistenceModule],
  providers: [RoleRepository, { provide: BaseRoleRepository, useClass: RoleRepository }],
  exports: [BaseRoleRepository, RoleRepository, TypeOrmModule],
})
export class RolePersistenceModule {}
