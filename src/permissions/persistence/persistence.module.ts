import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionEntity } from '@/permissions/persistence/entities/permission.entity';
import { PermissionRepository } from '@/permissions/persistence/repositories/permission.repository';
import { BasePermissionRepository } from '@/permissions/persistence/base-permission.repository';

@Module({
  imports: [TypeOrmModule.forFeature([PermissionEntity])],
  providers: [
    PermissionRepository,
    { provide: BasePermissionRepository, useClass: PermissionRepository },
  ],
  exports: [BasePermissionRepository, PermissionRepository, TypeOrmModule],
})
export class PermissionPersistenceModule {}
