import { Module } from '@nestjs/common';
import { PermissionsService } from '@/permissions/permissions.service';
import { PermissionPersistenceModule } from '@/permissions/persistence/persistence.module';
import { AdminPermissionsController } from '@/permissions/controllers/admin-permissions.controller';

@Module({
  imports: [PermissionPersistenceModule],
  controllers: [AdminPermissionsController],
  providers: [PermissionsService],
  exports: [PermissionsService, PermissionPersistenceModule],
})
export class PermissionsModule {}
