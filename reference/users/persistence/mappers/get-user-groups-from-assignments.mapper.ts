import { User } from '@/users/domain/user';
import { UserEntity } from '@/users/persistence/entities/user.entity';

export class GetUserGroupsFromAssignmentsMapper {
  static toDomain(raw: UserEntity): string[] {
    if (raw.assignments)
      return raw.assignments.flatMap((v) => v.group?.group_name);

    return ['empty'];
  }

  static toPersistence(domainEntity: User): UserEntity {
    const persistenceEntity = new UserEntity();

    Object.assign(
      persistenceEntity,
      domainEntity as Omit<User, 'id' | 'cost_center'>,
    );

    return persistenceEntity;
  }
}
