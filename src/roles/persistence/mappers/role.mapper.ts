import { Role } from '@/roles/domain/role';
import { RoleEntity } from '@/roles/persistence/entities/role.entity';
import { PermissionMapper } from '@/permissions/persistence/mappers/permission.mapper';

export class RoleMapper {
  static toDomain(raw: RoleEntity): Role {
    const role = new Role();
    role.id = raw.id;
    role.name = raw.name;
    role.description = raw.description;
    role.permissions = (raw.permissions ?? []).map(PermissionMapper.toDomain);
    role.created_by = raw.created_by;
    role.updated_by = raw.updated_by;
    role.deleted_by = raw.deleted_by;
    role.created_at = raw.created_at;
    role.updated_at = raw.updated_at;
    role.deleted_at = raw.deleted_at;
    return role;
  }
}
