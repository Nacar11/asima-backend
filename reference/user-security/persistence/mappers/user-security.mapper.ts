import { UserSecurity } from '@/user-security/domain/user-security';
import { UserSecurityEntity } from '../entities/user-security.entity';

export class UserSecurityMapper {
  static toDomain(raw: UserSecurityEntity): UserSecurity {
    const domainEntity = new UserSecurity();
    domainEntity.id = raw.id;
    domainEntity.user_id = raw.user_id;
    domainEntity.password_changed_at = raw.password_changed_at;
    domainEntity.password_expires_at = raw.password_expires_at;
    domainEntity.require_password_change = raw.require_password_change;
    domainEntity.failed_login_attempts = raw.failed_login_attempts;
    domainEntity.locked_until = raw.locked_until;
    domainEntity.last_login_ip = raw.last_login_ip;
    domainEntity.mfa_enabled = raw.mfa_enabled;
    domainEntity.mfa_type = raw.mfa_type as any;
    domainEntity.mfa_secret = raw.mfa_secret;
    domainEntity.mfa_backup_codes = raw.mfa_backup_codes;
    domainEntity.created_by = raw.created_by;
    domainEntity.created_at = raw.created_at;
    domainEntity.updated_by = raw.updated_by;
    domainEntity.updated_at = raw.updated_at;

    return domainEntity;
  }

  static toPersistence(domainEntity: UserSecurity): UserSecurityEntity {
    const persistenceEntity = new UserSecurityEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.user_id = domainEntity.user_id;
    persistenceEntity.password_changed_at =
      domainEntity.password_changed_at ?? null;
    persistenceEntity.password_expires_at =
      domainEntity.password_expires_at ?? null;
    persistenceEntity.require_password_change =
      domainEntity.require_password_change;
    persistenceEntity.failed_login_attempts =
      domainEntity.failed_login_attempts;
    persistenceEntity.locked_until = domainEntity.locked_until ?? null;
    persistenceEntity.last_login_ip = domainEntity.last_login_ip ?? null;
    persistenceEntity.mfa_enabled = domainEntity.mfa_enabled;
    persistenceEntity.mfa_type = domainEntity.mfa_type;
    persistenceEntity.mfa_secret = domainEntity.mfa_secret ?? null;
    persistenceEntity.mfa_backup_codes = domainEntity.mfa_backup_codes ?? null;
    persistenceEntity.created_by = domainEntity.created_by as any;
    persistenceEntity.created_at = domainEntity.created_at;
    persistenceEntity.updated_by = domainEntity.updated_by as any;
    persistenceEntity.updated_at = domainEntity.updated_at;

    return persistenceEntity;
  }
}
