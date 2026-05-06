import { QueryRunner } from 'typeorm';
import { NullableType } from '@/utils/types/nullable.type';
import { ReferralCode } from '@/referral-codes/domain/referral-code';
import { QueryReferralCodeDto } from '@/referral-codes/dto/query-referral-code.dto';

export abstract class BaseReferralCodeRepository {
  abstract findAll(
    query: QueryReferralCodeDto,
  ): Promise<{ data: ReferralCode[]; total: number }>;

  abstract findById(
    id: number,
    queryRunner?: QueryRunner,
  ): Promise<NullableType<ReferralCode>>;

  abstract findByCode(
    code: string,
    queryRunner?: QueryRunner,
  ): Promise<NullableType<ReferralCode>>;

  abstract create(
    data: Omit<ReferralCode, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'isValid' | 'voucher_ids'>,
    queryRunner?: QueryRunner,
  ): Promise<ReferralCode>;

  abstract update(
    id: number,
    data: Partial<ReferralCode>,
    queryRunner?: QueryRunner,
  ): Promise<ReferralCode>;

  abstract softDelete(id: number, queryRunner?: QueryRunner): Promise<void>;

  abstract incrementUsage(id: number, queryRunner?: QueryRunner): Promise<void>;

  abstract saveVoucherLinks(
    referralCodeId: number,
    voucherIds: number[],
    queryRunner?: QueryRunner,
  ): Promise<void>;

  abstract replaceVoucherLinks(
    referralCodeId: number,
    voucherIds: number[],
  ): Promise<void>;
}
