import { QueryRunner } from 'typeorm';
import { ReferralCodeUsageSelection } from '@/referral-codes/domain/referral-code-usage-selection';

export abstract class BaseReferralCodeUsageSelectionRepository {
  abstract createBulk(
    selections: Array<Pick<ReferralCodeUsageSelection, 'referral_code_usage_id' | 'voucher_id'>>,
    queryRunner?: QueryRunner,
  ): Promise<void>;

  abstract findByUsageId(usageId: number): Promise<ReferralCodeUsageSelection[]>;
}
