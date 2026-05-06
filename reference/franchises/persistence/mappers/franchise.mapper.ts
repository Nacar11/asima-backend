import { FranchiseEntity } from '@/franchises/persistence/entities/franchise.entity';
import { Franchise } from '@/franchises/domain/franchise';
import { getCauser } from '@/utils/helpers/entity.helper';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { User } from '@/users/domain/user';

export class FranchiseMapper {
  static toDomain(raw: FranchiseEntity): Franchise {
    const domainEntity = new Franchise();
    Object.assign(domainEntity, raw);

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

  static toPersistence(domainEntity: Franchise): FranchiseEntity {
    const persistenceEntity = new FranchiseEntity();

    Object.assign(persistenceEntity, domainEntity);

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
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
