import { QueryRunner } from 'typeorm';
import { NullableType } from '@/utils/types/nullable.type';
import { ReferralCodeUsage } from '@/referral-codes/domain/referral-code-usage';
import { ReferralCodeUsageSelectionStatusEnum } from '@/referral-codes/enums/referral-code-usage-selection-status.enum';

export abstract class BaseReferralCodeUsageRepository {
  abstract findById(
    id: number,
    queryRunner?: QueryRunner,
  ): Promise<NullableType<ReferralCodeUsage>>;

  abstract findByUserId(userId: number): Promise<ReferralCodeUsage[]>;

  abstract findByReferralCodeId(
    referralCodeId: number,
    skip: number,
    take: number,
  ): Promise<{ data: ReferralCodeUsage[]; total: number }>;

  abstract findOverdueSelections(now: Date): Promise<ReferralCodeUsage[]>;

  abstract create(
    data: Omit<ReferralCodeUsage, 'id' | 'created_at'>,
    queryRunner?: QueryRunner,
  ): Promise<ReferralCodeUsage>;

  abstract updateSelectionStatus(
    id: number,
    status: ReferralCodeUsageSelectionStatusEnum,
    queryRunner?: QueryRunner,
  ): Promise<void>;
}
