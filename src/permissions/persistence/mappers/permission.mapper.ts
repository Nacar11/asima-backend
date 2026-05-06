import { Permission } from '@/permissions/domain/permission';
import { PermissionEntity } from '@/permissions/persistence/entities/permission.entity';

export class PermissionMapper {
  static toDomain(raw: PermissionEntity): Permission {
    const domain = new Permission();
    domain.id = raw.id;
    domain.code = raw.code;
    domain.resource = raw.resource;
    domain.action = raw.action;
    domain.description = raw.description;
    domain.created_at = raw.created_at;
    domain.updated_at = raw.updated_at;
    return domain;
  }

  static toPersistence(domain: Partial<Permission>): PermissionEntity {
    const entity = new PermissionEntity();
    if (domain.id !== undefined) entity.id = domain.id;
    if (domain.code !== undefined) entity.code = domain.code;
    if (domain.resource !== undefined) entity.resource = domain.resource;
    if (domain.action !== undefined) entity.action = domain.action;
    if (domain.description !== undefined) entity.description = domain.description;
    return entity;
  }
}
