import { DivisionEntity } from '@/divisions/persistence/entities/division.entity';
import { Division } from '@/divisions/domain/division';
import { User } from '@/users/domain/user';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { getCauser, getUser } from '@/utils/helpers/entity.helper';

export class DivisionMapper {
  static toDomain(raw: DivisionEntity): Division {
    const domainEntity = new Division();

    Object.assign(domainEntity, raw);

    if (raw.division_head) {
      domainEntity.division_head = getUser(raw.division_head);
    }

    if (raw.created_by) {
      domainEntity.created_by = getCauser(raw.created_by);
    }

    if (raw.updated_by) {
      domainEntity.updated_by = getCauser(raw.updated_by);
    }

    if (raw.deleted_by) {
      domainEntity.deleted_by = getCauser(raw.deleted_by);
    }

    return domainEntity;
  }

  static toPersistence(domainEntity: Division): DivisionEntity {
    const persistenceEntity = new DivisionEntity();

    Object.assign(
      persistenceEntity,
      domainEntity as Omit<
        Division,
        'id' | 'division_head' | 'created_by' | 'updated_by' | 'deleted_by'
      >,
    );

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }

    if (domainEntity.division_head) {
      persistenceEntity.division_head = UserMapper.toPersistence(
        domainEntity.division_head as User,
      );
    }

    if (domainEntity.created_by) {
      persistenceEntity.created_by = UserMapper.toPersistence(
        domainEntity.created_by as User,
      );
    }

    if (domainEntity.updated_by) {
      persistenceEntity.updated_by = UserMapper.toPersistence(
        domainEntity.updated_by as User,
      );
    }

    if (domainEntity.deleted_by) {
      persistenceEntity.deleted_by = UserMapper.toPersistence(
        domainEntity.deleted_by as User,
      );
    }

    return persistenceEntity;
  }
}
