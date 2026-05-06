import { SocialAccount } from '@/social-accounts/domain/social-account';
import { SocialAccountEntity } from '../entities/social-account.entity';

export class SocialAccountMapper {
  static toDomain(raw: SocialAccountEntity): SocialAccount {
    const domainEntity = new SocialAccount();
    domainEntity.id = raw.id;
    domainEntity.user_id = raw.user_id;
    domainEntity.provider = raw.provider;
    domainEntity.provider_id = raw.provider_id;
    domainEntity.access_token = raw.access_token;
    domainEntity.refresh_token = raw.refresh_token;
    domainEntity.token_expires_at = raw.token_expires_at;
    domainEntity.profile_data = raw.profile_data;
    domainEntity.is_verified = raw.is_verified;
    domainEntity.created_by = raw.created_by;
    domainEntity.created_at = raw.created_at;
    domainEntity.updated_by = raw.updated_by;
    domainEntity.updated_at = raw.updated_at;

    return domainEntity;
  }

  static toPersistence(domainEntity: SocialAccount): SocialAccountEntity {
    const persistenceEntity = new SocialAccountEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.user_id = domainEntity.user_id;
    persistenceEntity.provider = domainEntity.provider;
    persistenceEntity.provider_id = domainEntity.provider_id;
    persistenceEntity.access_token = domainEntity.access_token;
    persistenceEntity.refresh_token = domainEntity.refresh_token;
    persistenceEntity.token_expires_at = domainEntity.token_expires_at;
    persistenceEntity.profile_data = domainEntity.profile_data;
    persistenceEntity.is_verified = domainEntity.is_verified;
    persistenceEntity.created_by = domainEntity.created_by as any;
    persistenceEntity.created_at = domainEntity.created_at;
    persistenceEntity.updated_by = domainEntity.updated_by as any;
    persistenceEntity.updated_at = domainEntity.updated_at;

    return persistenceEntity;
  }
}
