import { ReferralCodeUsage } from '@/referral-codes/domain/referral-code-usage';
import { ReferralCodeUsageEntity } from '@/referral-codes/persistence/entities/referral-code-usage.entity';
import { UserMapper } from '@/users/persistence/mappers/user.mapper';

export class ReferralCodeUsageMapper {
  static toDomain(raw: ReferralCodeUsageEntity): ReferralCodeUsage {
    const domain = new ReferralCodeUsage();
    domain.id = raw.id;
    domain.referral_code_id = raw.referral_code_id;
    domain.user_id = raw.user_id;
    domain.selection_status = raw.selection_status;
    domain.selection_deadline = raw.selection_deadline;
    domain.created_at = raw.created_at;

    if (raw.user) {
      domain.user = UserMapper.toDomain(raw.user);
    }

    return domain;
  }

  static toPersistence(
    domain: Partial<ReferralCodeUsage>,
  ): Partial<ReferralCodeUsageEntity> {
    const entity: Partial<ReferralCodeUsageEntity> = {};
    if (domain.referral_code_id !== undefined) entity.referral_code_id = domain.referral_code_id;
    if (domain.user_id !== undefined) entity.user_id = domain.user_id;
    if (domain.selection_status !== undefined) entity.selection_status = domain.selection_status;
    if (domain.selection_deadline !== undefined) entity.selection_deadline = domain.selection_deadline;
    return entity;
  }
}
