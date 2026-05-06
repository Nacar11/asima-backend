import { ReferralCodeUsageSelection } from '@/referral-codes/domain/referral-code-usage-selection';
import { ReferralCodeUsageSelectionEntity } from '@/referral-codes/persistence/entities/referral-code-usage-selection.entity';

export class ReferralCodeUsageSelectionMapper {
  static toDomain(raw: ReferralCodeUsageSelectionEntity): ReferralCodeUsageSelection {
    const domain = new ReferralCodeUsageSelection();
    domain.id = raw.id;
    domain.referral_code_usage_id = raw.referral_code_usage_id;
    domain.voucher_id = raw.voucher_id;
    domain.selected_at = raw.selected_at;
    return domain;
  }

  static toPersistence(
    domain: Pick<ReferralCodeUsageSelection, 'referral_code_usage_id' | 'voucher_id'>,
  ): Partial<ReferralCodeUsageSelectionEntity> {
    return {
      referral_code_usage_id: domain.referral_code_usage_id,
      voucher_id: domain.voucher_id,
    };
  }
}
