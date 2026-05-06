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

  static toPersistence(domain: Partial<Role>): RoleEntity {
    const entity = new RoleEntity();
    if (domain.id !== undefined) entity.id = domain.id;
    if (domain.name !== undefined) entity.name = domain.name;
    if (domain.description !== undefined) entity.description = domain.description;
    if (domain.created_by !== undefined) entity.created_by = domain.created_by;
    if (domain.updated_by !== undefined) entity.updated_by = domain.updated_by;
    if (domain.deleted_by !== undefined) entity.deleted_by = domain.deleted_by;
    return entity;
  }
}
