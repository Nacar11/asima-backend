import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ISeedService } from '../seed.interface';
import { ReferralCodeEntity } from '@/referral-codes/persistence/entities/referral-code.entity';
import { ReferralCodeVoucherEntity } from '@/referral-codes/persistence/entities/referral-code-voucher.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { VoucherEntity } from '@/vouchers/persistence/entities/voucher.entity';
import { ReferralCodeStatusEnum } from '@/referral-codes/enums/referral-code-status.enum';
import { ReferralCodeSelectionModeEnum } from '@/referral-codes/enums/referral-code-selection-mode.enum';

type ReferralCodeInput = {
  readonly code: string;
  readonly description: string;
  readonly status: ReferralCodeStatusEnum;
  readonly usage_limit: number | null;
  readonly usage_count: number;
  readonly selection_mode: ReferralCodeSelectionModeEnum;
  readonly max_voucher_selections: number | null;
  readonly selection_timeout_hours: number | null;
  readonly voucher_codes: string[];
};

/**
 * Service for seeding referral codes
 */
@Injectable()
export class ReferralCodeSeedService implements ISeedService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(ReferralCodeEntity)
    private referralCodeRepository: Repository<ReferralCodeEntity>,
    @InjectRepository(ReferralCodeVoucherEntity)
    private referralCodeVoucherRepository: Repository<ReferralCodeVoucherEntity>,
    @InjectRepository(VoucherEntity)
    private voucherRepository: Repository<VoucherEntity>,
  ) {}

  async run(): Promise<void> {
    const adminUser = await this.userRepository.findOne({ where: { id: 1 } });
    if (!adminUser) {
      console.error('❌ Admin user not found. Cannot seed referral codes.');
      return;
    }

    const referralCodeInputs: ReferralCodeInput[] = [
      {
        code: 'TAMBAYAN',
        description: 'Tambayan referral code',
        status: ReferralCodeStatusEnum.ACTIVE,
        usage_limit: null,
        usage_count: 0,
        selection_mode: ReferralCodeSelectionModeEnum.USER_SELECTION,
        max_voucher_selections: 2,
        selection_timeout_hours: 48,
        voucher_codes: ['FREE-1HR-COURT-CORE', 'FREE-LIFESTYLE-PERK-CORE-1X', 'COFFEEFIX20'],
      },
      {
        code: 'BBH',
        description: 'BBH referral code',
        status: ReferralCodeStatusEnum.ACTIVE,
        usage_limit: null,
        usage_count: 0,
        selection_mode: ReferralCodeSelectionModeEnum.USER_SELECTION,
        max_voucher_selections: 3,
        selection_timeout_hours: 48,
        voucher_codes: [
          'FREE-LIFESTYLE-PERK-CORE-1X',
          'COFFEEFIX30',
          'FREE-1HR-COURT-CORE',
          'COFFEEFIX50',
        ],
      },
      {
        code: 'BNI',
        description: 'BNI referral code',
        status: ReferralCodeStatusEnum.ACTIVE,
        usage_limit: null,
        usage_count: 0,
        selection_mode: ReferralCodeSelectionModeEnum.AUTO_ASSIGN,
        max_voucher_selections: null,
        selection_timeout_hours: null,
        voucher_codes: ['COFFEEFIX20', 'FREE-LIFESTYLE-PERK-CORE-1X'],
      },
      {
        code: 'SCHOOL',
        description: 'School referral code',
        status: ReferralCodeStatusEnum.ACTIVE,
        usage_limit: null,
        usage_count: 0,
        selection_mode: ReferralCodeSelectionModeEnum.AUTO_ASSIGN,
        max_voucher_selections: null,
        selection_timeout_hours: null,
        voucher_codes: [
          'FREE-1HR-COURT-CORE',
          'FREE-LIFESTYLE-PERK-CORE-1X',
          'COFFEEFIX50',
        ],
      },
      {
        code: 'GENERAL',
        description: 'General referral code',
        status: ReferralCodeStatusEnum.ACTIVE,
        usage_limit: null,
        usage_count: 0,
        selection_mode: ReferralCodeSelectionModeEnum.USER_SELECTION,
        max_voucher_selections: 4,
        selection_timeout_hours: 48,
        voucher_codes: [
          'FREE-1HR-COURT-CORE',
          'COFFEEFIX20',
          'COFFEEFIX30',
          'FREE-1HR-COURT-ELITE',
        ],
      },
    ];

    let createdCount = 0;
    let updatedCount = 0;

    for (const input of referralCodeInputs) {
      const existingReferralCode = await this.referralCodeRepository.findOne({
        where: { code: input.code },
      });

      let referralCode: ReferralCodeEntity;

      if (existingReferralCode) {
        referralCode = await this.referralCodeRepository.save({
          ...existingReferralCode,
          description: input.description,
          status: input.status,
          usage_limit: input.usage_limit,
          selection_mode: input.selection_mode,
          max_voucher_selections: input.max_voucher_selections,
          selection_timeout_hours: input.selection_timeout_hours,
          updated_by: adminUser,
        });
        updatedCount++;
      } else {
        referralCode = await this.referralCodeRepository.save(
          this.referralCodeRepository.create({
            code: input.code,
            description: input.description,
            status: input.status,
            usage_limit: input.usage_limit,
            usage_count: input.usage_count,
            selection_mode: input.selection_mode,
            max_voucher_selections: input.max_voucher_selections,
            selection_timeout_hours: input.selection_timeout_hours,
            created_by: adminUser,
            updated_by: adminUser,
          }),
        );
        createdCount++;
      }

      // Handle voucher associations
      const vouchers = await this.voucherRepository.find({
        where: { code: In(input.voucher_codes) },
      });

      // Remove existing voucher associations
      await this.referralCodeVoucherRepository.delete({
        referral_code_id: referralCode.id,
      });

      // Create new voucher associations
      for (const voucher of vouchers) {
        await this.referralCodeVoucherRepository.save(
          this.referralCodeVoucherRepository.create({
            referral_code_id: referralCode.id,
            voucher_id: voucher.id,
          }),
        );
      }
    }

    console.log(
      `✅ Referral codes seed completed (${referralCodeInputs.length} defined, ${createdCount} inserted, ${updatedCount} updated)`,
    );
  }
}
