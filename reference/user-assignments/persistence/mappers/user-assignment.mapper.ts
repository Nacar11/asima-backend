import { UserGroupMapper } from '@/user-groups/persistence/mappers/user-group.mapper';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { UserAssignment } from '@/user-assignments/domain/user-assignment';
import { UserAssignmentEntity } from '@/user-assignments/persistence/entities/user-assignment.entity';
import { getUser } from '@/utils/helpers/entity.helper';

export class UserAssignmentMapper {
  static toDomain(raw: UserAssignmentEntity): UserAssignment {
    const domainEntity = new UserAssignment();

    Object.assign(domainEntity, raw);

    if (raw.user) {
      domainEntity.user = UserMapper.toDomain(raw.user);
    }

    if (raw.group) {
      domainEntity.group = UserGroupMapper.toDomain(raw.group);
    }

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

  static toPersistence(domainEntity: UserAssignment): UserAssignmentEntity {
    const persistenceEntity = new UserAssignmentEntity();

    Object.assign(
      persistenceEntity,
      domainEntity as Omit<UserAssignment, 'id'>,
    );

    if (domainEntity.user) {
      persistenceEntity.user = UserMapper.toPersistence(domainEntity.user);
    }

    if (domainEntity.group) {
      persistenceEntity.group = UserGroupMapper.toPersistence(
        domainEntity.group,
      );
    }

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }

    return persistenceEntity;
  }
}
