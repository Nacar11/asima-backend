import { Module } from '@nestjs/common';
import { PermissionsService } from '@/permissions/permissions.service';
import { PermissionPersistenceModule } from '@/permissions/persistence/persistence.module';
import { AdminPermissionsController } from '@/permissions/controllers/admin-permissions.controller';
import { PermissionsGuard } from '@/permissions/permissions.guard';

@Module({
  imports: [PermissionPersistenceModule],
  controllers: [AdminPermissionsController],
  providers: [PermissionsService, PermissionsGuard],
  exports: [PermissionsService, PermissionPersistenceModule, PermissionsGuard],
})
export class PermissionsModule {}
