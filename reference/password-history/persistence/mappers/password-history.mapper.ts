import { PasswordHistory } from '@/password-history/domain/password-history';
import { PasswordHistoryEntity } from '../entities/password-history.entity';

export class PasswordHistoryMapper {
  static toDomain(raw: PasswordHistoryEntity): PasswordHistory {
    const domainEntity = new PasswordHistory();
    domainEntity.id = raw.id;
    domainEntity.user_id = raw.user_id;
    domainEntity.password_hash = raw.password_hash;
    domainEntity.created_at = raw.created_at;

    return domainEntity;
  }

  static toPersistence(domainEntity: PasswordHistory): PasswordHistoryEntity {
    const persistenceEntity = new PasswordHistoryEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.user_id = domainEntity.user_id;
    persistenceEntity.password_hash = domainEntity.password_hash;
    persistenceEntity.created_at = domainEntity.created_at;

    return persistenceEntity;
  }
}
