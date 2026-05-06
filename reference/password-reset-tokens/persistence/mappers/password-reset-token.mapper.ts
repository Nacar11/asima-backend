import { PasswordResetToken } from '@/password-reset-tokens/domain/password-reset-token';
import { PasswordResetTokenEntity } from '../entities/password-reset-token.entity';

export class PasswordResetTokenMapper {
  static toDomain(raw: PasswordResetTokenEntity): PasswordResetToken {
    const domainEntity = new PasswordResetToken();
    domainEntity.id = raw.id;
    domainEntity.user_id = raw.user_id;
    domainEntity.token = raw.token;
    domainEntity.otp = raw.otp;
    domainEntity.expires_at = raw.expires_at;
    domainEntity.used_at = raw.used_at;
    domainEntity.ip_address = raw.ip_address;
    domainEntity.user_agent = raw.user_agent;
    domainEntity.metadata = raw.metadata;
    domainEntity.created_at = raw.created_at;

    return domainEntity;
  }

  static toPersistence(
    domainEntity: PasswordResetToken,
  ): PasswordResetTokenEntity {
    const persistenceEntity = new PasswordResetTokenEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.user_id = domainEntity.user_id;
    persistenceEntity.token = domainEntity.token;
    persistenceEntity.otp = domainEntity.otp ?? null;
    persistenceEntity.expires_at = domainEntity.expires_at;
    persistenceEntity.used_at = domainEntity.used_at ?? null;
    persistenceEntity.ip_address = domainEntity.ip_address ?? null;
    persistenceEntity.user_agent = domainEntity.user_agent ?? null;
    persistenceEntity.metadata = domainEntity.metadata ?? null;
    persistenceEntity.created_at = domainEntity.created_at;

    return persistenceEntity;
  }
}
