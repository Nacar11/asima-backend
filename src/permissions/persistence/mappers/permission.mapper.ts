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
}
