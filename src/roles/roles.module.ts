import { Module } from '@nestjs/common';
import { RolesService } from '@/roles/roles.service';
import { RolePersistenceModule } from '@/roles/persistence/persistence.module';
import { PermissionsModule } from '@/permissions/permissions.module';
import { AdminRolesController } from '@/roles/controllers/admin-roles.controller';

@Module({
  imports: [RolePersistenceModule, PermissionsModule],
  controllers: [AdminRolesController],
  providers: [RolesService],
  exports: [RolesService, RolePersistenceModule],
})
export class RolesModule {}
