import { UserDetail } from '@/user-details/domain/user-detail';
import { UserDetailEntity } from '../entities/user-detail.entity';
import { getCauser } from '@/utils/helpers/entity.helper';

export class UserDetailMapper {
  static toDomain(raw: UserDetailEntity): UserDetail {
    const domainEntity = new UserDetail();
    domainEntity.id = raw.id;
    domainEntity.user_id = raw.user_id;
    domainEntity.username = raw.username;
    domainEntity.gender = raw.gender as any;
    domainEntity.date_of_birth = raw.date_of_birth;
    domainEntity.bio = raw.bio;
    domainEntity.profile_picture = raw.profile_picture;
    domainEntity.phone = raw.phone;
    domainEntity.address = raw.address;
    domainEntity.phone_verified_at = raw.phone_verified_at;
    domainEntity.email_verified_at = raw.email_verified_at;
    domainEntity.timezone = raw.timezone;
    domainEntity.locale = raw.locale;
    domainEntity.notification_preferences = raw.notification_preferences;

    if (raw.created_by) {
      domainEntity.created_by = getCauser(raw.created_by);
    }

    domainEntity.created_at = raw.created_at;

    if (raw.updated_by) {
      domainEntity.updated_by = getCauser(raw.updated_by);
    }

    domainEntity.updated_at = raw.updated_at;

    return domainEntity;
  }

  static toPersistence(domainEntity: UserDetail): UserDetailEntity {
    const persistenceEntity = new UserDetailEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.user_id = domainEntity.user_id;
    persistenceEntity.username = domainEntity.username ?? null;
    persistenceEntity.gender = domainEntity.gender ?? null;
    persistenceEntity.date_of_birth = domainEntity.date_of_birth ?? null;
    persistenceEntity.bio = domainEntity.bio ?? null;
    persistenceEntity.profile_picture = domainEntity.profile_picture ?? null;
    persistenceEntity.phone = domainEntity.phone ?? null;
    persistenceEntity.address = domainEntity.address ?? null;
    persistenceEntity.phone_verified_at =
      domainEntity.phone_verified_at ?? null;
    persistenceEntity.email_verified_at =
      domainEntity.email_verified_at ?? null;
    persistenceEntity.timezone = domainEntity.timezone;
    persistenceEntity.locale = domainEntity.locale;
    persistenceEntity.notification_preferences =
      domainEntity.notification_preferences ?? null;
    persistenceEntity.created_by = domainEntity.created_by as any;
    persistenceEntity.created_at = domainEntity.created_at;
    persistenceEntity.updated_by = domainEntity.updated_by as any;
    persistenceEntity.updated_at = domainEntity.updated_at;

    return persistenceEntity;
  }
}
