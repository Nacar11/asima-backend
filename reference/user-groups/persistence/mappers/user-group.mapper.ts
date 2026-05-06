import { UserGroup } from '@/user-groups/domain/user-group';
import { UserGroupEntity } from '@/user-groups/persistence/entities/user-group.entity';
import { getUser } from '@/utils/helpers/entity.helper';

export class UserGroupMapper {
  static toDomain(raw: UserGroupEntity): UserGroup {
    const domainEntity = new UserGroup();

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

  static toPersistence(domainEntity: UserGroup): UserGroupEntity {
    const persistenceEntity = new UserGroupEntity();

    Object.assign(persistenceEntity, domainEntity as Omit<UserGroup, 'id'>);

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }

    return persistenceEntity;
  }
}
