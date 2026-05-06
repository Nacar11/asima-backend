import { ReferralCodeVoucherEntity } from '@/referral-codes/persistence/entities/referral-code-voucher.entity';

export class ReferralCodeVoucherMapper {
  static toPersistence(
    referralCodeId: number,
    voucherId: number,
  ): Partial<ReferralCodeVoucherEntity> {
    return { referral_code_id: referralCodeId, voucher_id: voucherId };
  }
}
