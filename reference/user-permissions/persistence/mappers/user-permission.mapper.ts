import { UserPermission } from '@/user-permissions/domain/user-permission';
import { UserPermissionEntity } from '@/user-permissions/persistence/entities/user-permission.entity';
import { getUser } from '@/utils/helpers/entity.helper';

export class UserPermissionMapper {
  static toDomain(raw: UserPermissionEntity): UserPermission {
    const domainEntity = new UserPermission();

    Object.assign(domainEntity, raw);

    if (raw.created_by) {
      domainEntity.created_by = getUser(raw.created_by);
    }

    if (raw.updated_by) {
      domainEntity.updated_by = getUser(raw.updated_by);
    }

    if (raw.deleted_by) {
      domainEntity.deleted_by = getUser(raw.deleted_by);
    }

    return domainEntity;
  }

  static toPersistence(domainEntity: UserPermission): UserPermissionEntity {
    const persistenceEntity = new UserPermissionEntity();
    Object.assign(
      persistenceEntity,
      domainEntity as Omit<UserPermission, 'id'>,
    );

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }

    return persistenceEntity;
  }
}
