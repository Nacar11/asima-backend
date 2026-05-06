import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ISeedService } from '@/database/seeds/seed.interface';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { VoucherEntity } from '@/vouchers/persistence/entities/voucher.entity';
import { VoucherDiscountTypeEnum } from '@/vouchers/enums/voucher-discount-type.enum';
import { VoucherScopeEnum } from '@/vouchers/enums/voucher-scope.enum';
import { VoucherStatusEnum } from '@/vouchers/enums/voucher-status.enum';
import { MembershipVoucherConfigurationEntity } from '@/membership-voucher-configurations/persistence/entities/membership-voucher-configuration.entity';
import { MembershipPlanEntity } from '@/memberships/persistence/entities/membership-plan.entity';

type VoucherInput = {
  readonly code: string;
  readonly scope: VoucherScopeEnum;
  readonly discount_type: VoucherDiscountTypeEnum;
  readonly discount_value: number;
  readonly max_discount_cap: number | null;
  readonly description: string;
  readonly terms_and_conditions: string;
};

type ConfigurationInput = {
  readonly membershipPlanCode: string;
  readonly voucherCode: string;
  readonly quantity: number;
};

const VOUCHER_INPUTS: VoucherInput[] = [
  {
    code: 'FREECOURT1HOUR',
    scope: VoucherScopeEnum.SERVICES,
    discount_type: VoucherDiscountTypeEnum.PER_HOURS,
    discount_value: 0,
    max_discount_cap: null,
    description: 'Free 1-hour court usage',
    terms_and_conditions:
      'Valid for one hour of court usage at eligible branches.',
  },
  {
    code: 'LIFESTYLE1',
    scope: VoucherScopeEnum.SERVICES,
    discount_type: VoucherDiscountTypeEnum.PERCENTAGE,
    discount_value: 100,
    max_discount_cap: 10000,
    description: 'Free lifestyle perk (1 redemption)',
    terms_and_conditions:
      'Valid for one lifestyle service redemption at eligible branches.',
  },
  {
    code: 'FREECOFFEE1',
    scope: VoucherScopeEnum.SERVICES,
    discount_type: VoucherDiscountTypeEnum.PERCENTAGE,
    discount_value: 100,
    max_discount_cap: 10000,
    description: 'Free coffee (1 redemption)',
    terms_and_conditions:
      'Valid for one complimentary coffee at eligible branches.',
  },
  {
    code: 'FREECARWASH',
    scope: VoucherScopeEnum.SERVICES,
    discount_type: VoucherDiscountTypeEnum.PERCENTAGE,
    discount_value: 100,
    max_discount_cap: 10000,
    description: 'Free car wash (1 redemption)',
    terms_and_conditions:
      'Valid for one complimentary car wash at eligible branches.',
  },
  {
    code: 'FREE1HRMSG',
    scope: VoucherScopeEnum.SERVICES,
    discount_type: VoucherDiscountTypeEnum.PERCENTAGE,
    discount_value: 100,
    max_discount_cap: 10000,
    description: 'Free 1-hour massage (1 redemption)',
    terms_and_conditions:
      'Valid for one complimentary 1-hour massage at eligible branches.',
  },
  {
    code: 'FREEBARBER',
    scope: VoucherScopeEnum.SERVICES,
    discount_type: VoucherDiscountTypeEnum.PERCENTAGE,
    discount_value: 100,
    max_discount_cap: 10000,
    description: 'Free barber service (1 redemption)',
    terms_and_conditions:
      'Valid for one complimentary barber service at eligible branches.',
  },
  {
    code: 'FREENAILSPA',
    scope: VoucherScopeEnum.SERVICES,
    discount_type: VoucherDiscountTypeEnum.PERCENTAGE,
    discount_value: 100,
    max_discount_cap: 10000,
    description: 'Free nail spa (1 redemption)',
    terms_and_conditions:
      'Valid for one complimentary nail spa service at eligible branches.',
  },
];

const CONFIGURATION_INPUTS: ConfigurationInput[] = [
  // Starter plan
  { membershipPlanCode: 'starter', voucherCode: 'FREECOURT1HOUR', quantity: 3 },
  // Core plan
  { membershipPlanCode: 'core', voucherCode: 'FREECOURT1HOUR', quantity: 6 },
  { membershipPlanCode: 'core', voucherCode: 'LIFESTYLE1', quantity: 1 },
  { membershipPlanCode: 'core', voucherCode: 'FREECOFFEE1', quantity: 1 },
  // Elite plan
  { membershipPlanCode: 'elite', voucherCode: 'FREECOURT1HOUR', quantity: 10 },
  { membershipPlanCode: 'elite', voucherCode: 'FREECOFFEE1', quantity: 1 },
  { membershipPlanCode: 'elite', voucherCode: 'FREECARWASH', quantity: 1 },
  { membershipPlanCode: 'elite', voucherCode: 'FREE1HRMSG', quantity: 1 },
  { membershipPlanCode: 'elite', voucherCode: 'FREEBARBER', quantity: 1 },
  { membershipPlanCode: 'elite', voucherCode: 'FREENAILSPA', quantity: 1 },
];

/**
 * Seeder for membership_voucher_configurations.
 * Creates required membership vouchers if not yet seeded, then links them to
 * the starter, core, and elite membership plans with the configured quantities.
 */
@Injectable()
export class MembershipPlanVoucherConfigurationSeedService
  implements ISeedService
{
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(VoucherEntity)
    private readonly voucherRepository: Repository<VoucherEntity>,
    @InjectRepository(MembershipVoucherConfigurationEntity)
    private readonly membershipVoucherConfigurationRepository: Repository<MembershipVoucherConfigurationEntity>,
    @InjectRepository(MembershipPlanEntity)
    private readonly membershipPlanRepository: Repository<MembershipPlanEntity>,
  ) {}

  async run(): Promise<void> {
    const adminUser: UserEntity | null = await this.userRepository.findOne({
      where: { id: 1 },
    });

    if (!adminUser) {
      console.log(
        '⚠️  No admin user found (id=1). Skipping membership plan voucher configuration seed.',
      );
      return;
    }

    await this.ensureVouchers(adminUser);
    await this.ensureConfigurations(adminUser);
  }

  private async ensureVouchers(adminUser: UserEntity): Promise<void> {
    const now: Date = new Date();
    const startsAt: Date = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const expiresAt: Date = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 3);

    let insertedCount = 0;
    let skippedCount = 0;

    for (const input of VOUCHER_INPUTS) {
      const existing: VoucherEntity | null = await this.voucherRepository
        .createQueryBuilder('v')
        .where('UPPER(v.code) = UPPER(:code)', { code: input.code })
        .andWhere('v.deleted_at IS NULL')
        .getOne();

      if (existing) {
        skippedCount++;
        continue;
      }

      await this.voucherRepository.save(
        this.voucherRepository.create({
          code: input.code,
          scope: input.scope,
          seller_id: null,
          discount_type: input.discount_type,
          discount_value: input.discount_value,
          max_discount_cap: input.max_discount_cap,
          min_order_amount: 0,
          total_limit: null,
          per_user_limit: 9999,
          used_count: 0,
          starts_at: startsAt,
          expires_at: expiresAt,
          status: VoucherStatusEnum.ACTIVE,
          is_claimable: false,
          description: input.description,
          terms_and_conditions: input.terms_and_conditions,
          created_by: adminUser,
          updated_by: adminUser,
        }),
      );

      insertedCount++;
    }

    console.log(
      `✅ Membership vouchers ensured (${insertedCount} inserted, ${skippedCount} skipped)`,
    );
  }

  private async ensureConfigurations(adminUser: UserEntity): Promise<void> {
    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const input of CONFIGURATION_INPUTS) {
      const membershipPlan: MembershipPlanEntity | null =
        await this.membershipPlanRepository.findOne({
          where: { plan_code: input.membershipPlanCode },
        });

      if (!membershipPlan) {
        console.warn(
          `⚠️  Membership plan "${input.membershipPlanCode}" not found. Skipping voucher "${input.voucherCode}".`,
        );
        skippedCount++;
        continue;
      }

      const voucher: VoucherEntity | null = await this.voucherRepository
        .createQueryBuilder('v')
        .where('UPPER(v.code) = UPPER(:code)', { code: input.voucherCode })
        .andWhere('v.deleted_at IS NULL')
        .getOne();

      if (!voucher) {
        console.warn(
          `⚠️  Voucher "${input.voucherCode}" not found. Skipping plan "${input.membershipPlanCode}".`,
        );
        skippedCount++;
        continue;
      }

      const existing: MembershipVoucherConfigurationEntity | null =
        await this.membershipVoucherConfigurationRepository
          .createQueryBuilder('mvc')
          .where('mvc.membership_plan_id = :planId', {
            planId: membershipPlan.id,
          })
          .andWhere('mvc.voucher_id = :voucherId', { voucherId: voucher.id })
          .andWhere('mvc.deleted_at IS NULL')
          .getOne();

      if (existing) {
        const shouldUpdate =
          existing.quantity !== input.quantity || existing.is_active !== true;

        if (!shouldUpdate) {
          continue;
        }

        await this.membershipVoucherConfigurationRepository.save({
          ...existing,
          quantity: input.quantity,
          is_active: true,
          updated_by: adminUser,
        });

        updatedCount++;
        continue;
      }

      await this.membershipVoucherConfigurationRepository.save(
        this.membershipVoucherConfigurationRepository.create({
          membership_plan_id: membershipPlan.id,
          voucher_id: voucher.id,
          quantity: input.quantity,
          is_active: true,
          created_by: adminUser,
          updated_by: adminUser,
        }),
      );

      insertedCount++;
    }

    console.log(
      `✅ Membership plan voucher configurations seeded (${insertedCount} inserted, ${updatedCount} updated, ${skippedCount} skipped)`,
    );
  }

  async down(): Promise<void> {
    for (const input of CONFIGURATION_INPUTS) {
      const membershipPlan = await this.membershipPlanRepository.findOne({
        where: { plan_code: input.membershipPlanCode },
      });
      if (!membershipPlan) continue;

      const voucher = await this.voucherRepository
        .createQueryBuilder('v')
        .where('UPPER(v.code) = UPPER(:code)', { code: input.voucherCode })
        .andWhere('v.deleted_at IS NULL')
        .getOne();
      if (!voucher) continue;

      await this.membershipVoucherConfigurationRepository
        .createQueryBuilder()
        .delete()
        .from(MembershipVoucherConfigurationEntity)
        .where('membership_plan_id = :planId', { planId: membershipPlan.id })
        .andWhere('voucher_id = :voucherId', { voucherId: voucher.id })
        .execute();
    }

    console.log('✅ Membership plan voucher configuration rollback completed.');
  }
}
