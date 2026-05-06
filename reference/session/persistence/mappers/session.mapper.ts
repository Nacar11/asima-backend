import { UserEntity } from '@/users/persistence/entities/user.entity';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';
import { Session } from '@/session/domain/session';
import { SessionEntity } from '@/session/persistence/entities/session.entity';

export class SessionMapper {
  static toDomain(raw: SessionEntity): Session {
    const domainEntity = new Session();
    domainEntity.id = raw.id;
    if (raw.user) {
      domainEntity.user = UserMapper.toDomain(raw.user);
    }
    domainEntity.hash = raw.hash;
    domainEntity.created_at = raw.created_at;
    domainEntity.updated_at = raw.updated_at;
    domainEntity.deleted_at = raw.deleted_at;
    return domainEntity;
  }

  static toPersistence(domainEntity: Session): SessionEntity {
    const user = new UserEntity();
    user.id = Number(domainEntity.user.id);

    const persistenceEntity = new SessionEntity();
    if (domainEntity.id && typeof domainEntity.id === 'number') {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.hash = domainEntity.hash;
    persistenceEntity.user = user;
    persistenceEntity.created_at = domainEntity.created_at;
    persistenceEntity.updated_at = domainEntity.updated_at;
    persistenceEntity.deleted_at = domainEntity.deleted_at;

    return persistenceEntity;
  }
}
