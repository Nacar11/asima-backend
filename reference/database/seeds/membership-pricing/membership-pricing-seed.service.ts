import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParameterEntity } from '@/parameters/persistence/entities/parameter.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { ISeedService } from '@/database/seeds/seed.interface';
import { VoucherEntity } from '@/vouchers/persistence/entities/voucher.entity';
import { MembershipVoucherConfigurationEntity } from '@/membership-voucher-configurations/persistence/entities/membership-voucher-configuration.entity';
import { MembershipPlanEntity } from '@/memberships/persistence/entities/membership-plan.entity';
import { MembershipBillingPeriodEntity } from '@/memberships/persistence/entities/membership-billing-period.entity';
import { MembershipPlanBillingPeriodEntity } from '@/memberships/persistence/entities/membership-plan-billing-period.entity';

const STARTER_MEMBERSHIP_PRICE = 1499;
const CORE_MEMBERSHIP_PRICE = 2999;
const ELITE_MEMBERSHIP_PRICE = 4999;
const GRACE_PERIOD_IN_DAYS = 7;
const AUTO_RENEWAL_DAYS_BEFORE_EXPIRATION = 3;
const MAXIMUM_RENEWAL_ENTRIES = 3;
const DEFAULT_PLATFORM_FEE_PERCENT = 0;

type EnsureMembershipParameterInput = {
  readonly code: string;
  readonly description: string;
  readonly numericValue: number;
  readonly paramItems?: string;
};

type EnsureMembershipVoucherConfigurationInput = {
  readonly membershipPlanCode: string;
  readonly voucherCode: string;
  readonly quantity: number;
};

type EnsureMembershipPlanInput = {
  readonly planCode: string;
  readonly planName: string;
};

type EnsureBillingPeriodInput = {
  readonly periodCode: string;
  readonly periodName: string;
  readonly durationInMonths: number;
  readonly durationInDays: number;
  readonly sortOrder: number;
};

type EnsurePlanBillingPeriodInput = {
  readonly planCode: string;
  readonly periodCode: string;
  readonly discountPercentage: number;
  readonly totalPrice: number;
};

@Injectable()
export class MembershipPricingSeedService implements ISeedService {
  constructor(
    @InjectRepository(ParameterEntity)
    private readonly parameterRepository: Repository<ParameterEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(VoucherEntity)
    private readonly voucherRepository: Repository<VoucherEntity>,
    @InjectRepository(MembershipVoucherConfigurationEntity)
    private readonly membershipVoucherConfigurationRepository: Repository<MembershipVoucherConfigurationEntity>,
    @InjectRepository(MembershipPlanEntity)
    private readonly membershipPlanRepository: Repository<MembershipPlanEntity>,
    @InjectRepository(MembershipBillingPeriodEntity)
    private readonly membershipBillingPeriodRepository: Repository<MembershipBillingPeriodEntity>,
    @InjectRepository(MembershipPlanBillingPeriodEntity)
    private readonly membershipPlanBillingPeriodRepository: Repository<MembershipPlanBillingPeriodEntity>,
  ) {}

  async run(): Promise<void> {
    const adminUser: UserEntity | null = await this.userRepository.findOne({
      where: { id: 1 },
    });

    if (!adminUser) {
      console.log(
        '⚠️  No admin user found (id=1). Skipping membership pricing seed.',
      );
      return;
    }

    const parameterInputs: EnsureMembershipParameterInput[] = [
      {
        code: 'grace_period',
        description: 'Membership grace period in days',
        numericValue: GRACE_PERIOD_IN_DAYS,
      },
      {
        code: 'auto_renewal_days_before_expiration',
        description: 'Days before expiration to attempt auto-renewal',
        numericValue: AUTO_RENEWAL_DAYS_BEFORE_EXPIRATION,
      },
      {
        code: 'maximum_renewal_entries',
        description: 'Maximum auto-renewal retry attempts',
        numericValue: MAXIMUM_RENEWAL_ENTRIES,
      },
      {
        code: 'platform_fee_percent',
        description: 'Default platform fee percentage applied to bookings',
        numericValue: DEFAULT_PLATFORM_FEE_PERCENT,
        paramItems: 'store_settings',
      },
    ];

    let insertedCount: number = 0;
    let updatedCount: number = 0;

    for (const input of parameterInputs) {
      const existing: ParameterEntity | null =
        await this.parameterRepository.findOne({
          where: { code: input.code },
        });

      if (existing) {
        const shouldUpdate: boolean =
          Number(existing.numeric_value) !== input.numericValue ||
          existing.description !== input.description;

        if (!shouldUpdate) {
          continue;
        }

        await this.parameterRepository.save({
          ...existing,
          param_items: existing.param_items || input.paramItems || 'membership',
          description: input.description,
          numeric_value: input.numericValue,
          updated_by: adminUser,
        });

        updatedCount++;
        continue;
      }

      await this.parameterRepository.save(
        this.parameterRepository.create({
          code: input.code,
          param_items: input.paramItems || 'membership',
          description: input.description,
          string_value: '',
          numeric_value: input.numericValue,
          created_by: adminUser,
          updated_by: adminUser,
        }),
      );

      insertedCount++;
    }

    console.log(
      `✅ Membership pricing seed completed (${insertedCount} inserted, ${updatedCount} updated)`,
    );

    await this.seedBillingPeriods();
    await this.seedMembershipPlans();
    await this.seedPlanBillingPeriods();
    await this.seedMembershipVoucherConfigurations(adminUser);
  }

  private async seedBillingPeriods(): Promise<void> {
    const billingPeriodInputs: EnsureBillingPeriodInput[] = [
      {
        periodCode: 'monthly',
        periodName: '1 Month',
        durationInMonths: 1,
        durationInDays: 30,
        sortOrder: 1,
      },
      {
        periodCode: 'quarterly',
        periodName: '3 Months',
        durationInMonths: 3,
        durationInDays: 90,
        sortOrder: 2,
      },
      {
        periodCode: 'semi_annual',
        periodName: '6 Months',
        durationInMonths: 6,
        durationInDays: 180,
        sortOrder: 3,
      },
      {
        periodCode: 'annual',
        periodName: '12 Months',
        durationInMonths: 12,
        durationInDays: 365,
        sortOrder: 4,
      },
    ];

    let insertedCount: number = 0;
    let updatedCount: number = 0;

    for (const input of billingPeriodInputs) {
      const existing: MembershipBillingPeriodEntity | null =
        await this.membershipBillingPeriodRepository.findOne({
          where: { period_code: input.periodCode },
        });

      if (existing) {
        const shouldUpdate: boolean =
          existing.duration_in_months !== input.durationInMonths ||
          existing.duration_in_days !== input.durationInDays ||
          existing.period_name !== input.periodName ||
          existing.sort_order !== input.sortOrder;

        if (!shouldUpdate) {
          continue;
        }

        await this.membershipBillingPeriodRepository.save({
          ...existing,
          period_name: input.periodName,
          duration_in_months: input.durationInMonths,
          duration_in_days: input.durationInDays,
          sort_order: input.sortOrder,
        });

        updatedCount++;
        continue;
      }

      await this.membershipBillingPeriodRepository.save(
        this.membershipBillingPeriodRepository.create({
          period_code: input.periodCode,
          period_name: input.periodName,
          duration_in_months: input.durationInMonths,
          duration_in_days: input.durationInDays,
          sort_order: input.sortOrder,
          is_active: true,
        }),
      );

      insertedCount++;
    }

    console.log(
      `✅ Billing periods seed completed (${insertedCount} inserted, ${updatedCount} updated)`,
    );
  }

  private async seedMembershipPlans(): Promise<void> {
    const planInputs: EnsureMembershipPlanInput[] = [
      { planCode: 'starter', planName: 'Starter' },
      { planCode: 'core', planName: 'Core' },
      { planCode: 'elite', planName: 'Elite' },
    ];
    for (const input of planInputs) {
      const existing: MembershipPlanEntity | null =
        await this.membershipPlanRepository.findOne({
          where: { plan_code: input.planCode },
        });
      if (existing) {
        continue;
      }
      await this.membershipPlanRepository.save(
        this.membershipPlanRepository.create({
          plan_code: input.planCode,
          plan_name: input.planName,
          is_active: true,
        }),
      );
    }
  }

  private async seedPlanBillingPeriods(): Promise<void> {
    // Compute total_price = base * months * (1 - discount/100), rounded to 2dp
    const calcPrice = (
      base: number,
      months: number,
      discountPct: number,
    ): number =>
      Math.round(base * months * (1 - discountPct / 100) * 100) / 100;

    // Default: all plans get all 4 periods with standard discounts.
    // Admin can later customize per-plan pricing via the admin panel.
    const planBillingPeriodInputs: EnsurePlanBillingPeriodInput[] = [
      // Starter
      {
        planCode: 'starter',
        periodCode: 'monthly',
        discountPercentage: 0,
        totalPrice: calcPrice(STARTER_MEMBERSHIP_PRICE, 1, 0),
      },
      {
        planCode: 'starter',
        periodCode: 'quarterly',
        discountPercentage: 5,
        totalPrice: calcPrice(STARTER_MEMBERSHIP_PRICE, 3, 5),
      },
      {
        planCode: 'starter',
        periodCode: 'semi_annual',
        discountPercentage: 10,
        totalPrice: calcPrice(STARTER_MEMBERSHIP_PRICE, 6, 10),
      },
      {
        planCode: 'starter',
        periodCode: 'annual',
        discountPercentage: 20,
        totalPrice: calcPrice(STARTER_MEMBERSHIP_PRICE, 12, 20),
      },
      // Core
      {
        planCode: 'core',
        periodCode: 'monthly',
        discountPercentage: 0,
        totalPrice: calcPrice(CORE_MEMBERSHIP_PRICE, 1, 0),
      },
      {
        planCode: 'core',
        periodCode: 'quarterly',
        discountPercentage: 5,
        totalPrice: calcPrice(CORE_MEMBERSHIP_PRICE, 3, 5),
      },
      {
        planCode: 'core',
        periodCode: 'semi_annual',
        discountPercentage: 10,
        totalPrice: calcPrice(CORE_MEMBERSHIP_PRICE, 6, 10),
      },
      {
        planCode: 'core',
        periodCode: 'annual',
        discountPercentage: 20,
        totalPrice: calcPrice(CORE_MEMBERSHIP_PRICE, 12, 20),
      },
      // Elite
      {
        planCode: 'elite',
        periodCode: 'monthly',
        discountPercentage: 0,
        totalPrice: calcPrice(ELITE_MEMBERSHIP_PRICE, 1, 0),
      },
      {
        planCode: 'elite',
        periodCode: 'quarterly',
        discountPercentage: 5,
        totalPrice: calcPrice(ELITE_MEMBERSHIP_PRICE, 3, 5),
      },
      {
        planCode: 'elite',
        periodCode: 'semi_annual',
        discountPercentage: 10,
        totalPrice: calcPrice(ELITE_MEMBERSHIP_PRICE, 6, 10),
      },
      {
        planCode: 'elite',
        periodCode: 'annual',
        discountPercentage: 20,
        totalPrice: calcPrice(ELITE_MEMBERSHIP_PRICE, 12, 20),
      },
    ];

    let insertedCount: number = 0;
    let updatedCount: number = 0;
    let skippedCount: number = 0;

    for (const input of planBillingPeriodInputs) {
      const plan: MembershipPlanEntity | null =
        await this.membershipPlanRepository.findOne({
          where: { plan_code: input.planCode },
        });
      if (!plan) {
        skippedCount++;
        continue;
      }

      const period: MembershipBillingPeriodEntity | null =
        await this.membershipBillingPeriodRepository.findOne({
          where: { period_code: input.periodCode },
        });
      if (!period) {
        skippedCount++;
        continue;
      }

      const existing: MembershipPlanBillingPeriodEntity | null =
        await this.membershipPlanBillingPeriodRepository
          .createQueryBuilder('mpbp')
          .where('mpbp.membership_plan_id = :planId', { planId: plan.id })
          .andWhere('mpbp.billing_period_id = :periodId', {
            periodId: period.id,
          })
          .andWhere('mpbp.deleted_at IS NULL')
          .getOne();

      if (existing) {
        const shouldUpdate: boolean =
          Number(existing.discount_percentage) !== input.discountPercentage ||
          Number(existing.total_price) !== input.totalPrice ||
          existing.is_active !== true;

        if (!shouldUpdate) {
          continue;
        }

        await this.membershipPlanBillingPeriodRepository.save({
          ...existing,
          discount_percentage: input.discountPercentage,
          total_price: input.totalPrice,
          is_active: true,
        });

        updatedCount++;
        continue;
      }

      await this.membershipPlanBillingPeriodRepository.save(
        this.membershipPlanBillingPeriodRepository.create({
          membership_plan_id: plan.id,
          billing_period_id: period.id,
          total_price: input.totalPrice,
          discount_percentage: input.discountPercentage,
          is_active: true,
        }),
      );

      insertedCount++;
    }

    console.log(
      `✅ Plan billing periods seed completed (${insertedCount} inserted, ${updatedCount} updated, ${skippedCount} skipped)`,
    );
  }

  private async seedMembershipVoucherConfigurations(
    adminUser: UserEntity,
  ): Promise<void> {
    const configurationInputs: EnsureMembershipVoucherConfigurationInput[] = [
      {
        membershipPlanCode: 'starter',
        voucherCode: 'FREE-1HR-COURT-STARTER',
        quantity: 3,
      },
      {
        membershipPlanCode: 'core',
        voucherCode: 'FREE-1HR-COURT-CORE',
        quantity: 6,
      },
      {
        membershipPlanCode: 'core',
        voucherCode: 'FREE-LIFESTYLE-PERK-CORE-1X',
        quantity: 1,
      },
      {
        membershipPlanCode: 'elite',
        voucherCode: 'FREE-1HR-COURT-ELITE',
        quantity: 10,
      },
      {
        membershipPlanCode: 'elite',
        voucherCode: 'FREE-LIFESTYLE-PERK-ELITE-1X',
        quantity: 4,
      },
    ];

    let insertedCount: number = 0;
    let updatedCount: number = 0;
    let skippedCount: number = 0;

    for (const input of configurationInputs) {
      const membershipPlan: MembershipPlanEntity | null =
        await this.membershipPlanRepository.findOne({
          where: { plan_code: input.membershipPlanCode },
        });
      if (!membershipPlan) {
        skippedCount++;
        continue;
      }
      const voucher: VoucherEntity | null = await this.voucherRepository
        .createQueryBuilder('voucher')
        .where('UPPER(voucher.code) = UPPER(:code)', {
          code: input.voucherCode,
        })
        .andWhere('voucher.deleted_at IS NULL')
        .getOne();

      if (!voucher) {
        skippedCount++;
        continue;
      }

      const existingQueryBuilder = this.membershipVoucherConfigurationRepository
        .createQueryBuilder('membership_voucher_configuration')
        .where(
          'membership_voucher_configuration.membership_plan_id = :membershipPlanId',
          {
            membershipPlanId: membershipPlan.id,
          },
        )
        .andWhere('membership_voucher_configuration.voucher_id = :voucherId', {
          voucherId: voucher.id,
        })
        .andWhere('membership_voucher_configuration.deleted_at IS NULL');

      const existing: MembershipVoucherConfigurationEntity | null =
        await existingQueryBuilder.getOne();

      if (existing) {
        const shouldUpdate: boolean =
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
      `✅ Membership voucher configuration seed completed (${insertedCount} inserted, ${updatedCount} updated, ${skippedCount} skipped - missing vouchers)`,
    );
  }
}
