import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ISeedService } from '@/database/seeds/seed.interface';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { MembershipEntity } from '@/memberships/persistence/entities/membership.entity';
import { MembershipPaymentEntity } from '@/memberships/persistence/entities/membership-payment.entity';
import { MembershipVoucherGrantEntity } from '@/memberships/persistence/entities/membership-voucher-grant.entity';
import { MembershipStatusEnum } from '@/memberships/enums/membership-status.enum';
import { MembershipPaymentStatusEnum } from '@/memberships/enums/membership-payment-status.enum';
import { MembershipPlanEntity } from '@/memberships/persistence/entities/membership-plan.entity';
import { MembershipPlanBillingPeriodEntity } from '@/memberships/persistence/entities/membership-plan-billing-period.entity';
import { VoucherEntity } from '@/vouchers/persistence/entities/voucher.entity';

const MEMBERSHIP_PAYMENT_CURRENCY = 'PHP';

const WELCOME_VOUCHER_CODES: readonly string[] = [
  'WELCOME-FOOD-10PCT',
  'WELCOME-SERVICE-10PCT',
  'WELCOME-VENUE-10PCT',
] as const;

type EnsureMembershipInput = {
  readonly email: string;
  readonly planCode: string;
  readonly billingPeriodCode: string;
};

@Injectable()
export class MembershipsSeedService implements ISeedService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(MembershipEntity)
    private readonly membershipRepository: Repository<MembershipEntity>,
    @InjectRepository(MembershipPaymentEntity)
    private readonly membershipPaymentRepository: Repository<MembershipPaymentEntity>,
    @InjectRepository(MembershipVoucherGrantEntity)
    private readonly membershipVoucherGrantRepository: Repository<MembershipVoucherGrantEntity>,
    @InjectRepository(MembershipPlanEntity)
    private readonly membershipPlanRepository: Repository<MembershipPlanEntity>,
    @InjectRepository(MembershipPlanBillingPeriodEntity)
    private readonly membershipPlanBillingPeriodRepository: Repository<MembershipPlanBillingPeriodEntity>,
    @InjectRepository(VoucherEntity)
    private readonly voucherRepository: Repository<VoucherEntity>,
  ) {}

  async run(): Promise<void> {
    const adminUser: UserEntity | null = await this.userRepository.findOne({
      where: { id: 1 },
    });
    if (!adminUser) {
      console.log('⚠️  No admin user found (id=1). Skipping memberships seed.');
      return;
    }
    const membershipInputs: EnsureMembershipInput[] = [
      {
        email: 'admin@cody.inc',
        planCode: 'starter',
        billingPeriodCode: 'monthly',
      },
      {
        email: 'john.doe@cody.inc',
        planCode: 'starter',
        billingPeriodCode: 'monthly',
      },
    ];
    for (const input of membershipInputs) {
      const user: UserEntity | null = await this.userRepository.findOne({
        where: { email: input.email },
      });
      if (!user) {
        console.log(
          `⚠️  No user found with email ${input.email}. Skipping membership seed for this user.`,
        );
        continue;
      }
      const planBillingPeriod: MembershipPlanBillingPeriodEntity =
        await this.findActivePlanBillingPeriod(
          input.planCode,
          input.billingPeriodCode,
        );

      const membershipPlan: MembershipPlanEntity =
        planBillingPeriod.membership_plan;
      const billingPeriod = planBillingPeriod.billing_period;

      const amount: number = Number(planBillingPeriod.total_price);
      const discountPercentage: number = Number(
        planBillingPeriod.discount_percentage,
      );
      const baseMonthlyPrice: number =
        amount / billingPeriod.duration_in_months;

      const startsAt: Date = new Date();
      const endsAt: Date = new Date(startsAt);
      endsAt.setDate(endsAt.getDate() + billingPeriod.duration_in_days);

      const membership: MembershipEntity = await this.ensureMembership({
        user,
        adminUser,
        membershipPlan,
        planBillingPeriod,
        startsAt,
        endsAt,
      });
      const payment: MembershipPaymentEntity =
        await this.ensureMembershipPayment({
          membership,
          user,
          adminUser,
          membershipPlan,
          planBillingPeriod,
          baseMonthlyPrice,
          discountPercentage,
          amount,
        });
      await this.ensureWelcomeVoucherGrants({
        membership,
        user,
        payment,
        adminUser,
      });
    }
    console.log('✅ Memberships seed completed');
  }

  private async findActivePlanBillingPeriod(
    planCode: string,
    periodCode: string,
  ): Promise<MembershipPlanBillingPeriodEntity> {
    const planBillingPeriod: MembershipPlanBillingPeriodEntity | null =
      await this.membershipPlanBillingPeriodRepository
        .createQueryBuilder('mpbp')
        .innerJoinAndSelect('mpbp.membership_plan', 'plan')
        .innerJoinAndSelect('mpbp.billing_period', 'period')
        .where('plan.plan_code = :planCode', { planCode })
        .andWhere('period.period_code = :periodCode', { periodCode })
        .andWhere('mpbp.is_active = true')
        .andWhere('mpbp.deleted_at IS NULL')
        .andWhere('plan.is_active = true')
        .andWhere('plan.deleted_at IS NULL')
        .andWhere('period.is_active = true')
        .andWhere('period.deleted_at IS NULL')
        .getOne();

    if (!planBillingPeriod) {
      throw new Error(
        `No active plan billing period found for plan_code=${planCode}, period_code=${periodCode}.`,
      );
    }
    return planBillingPeriod;
  }

  private async ensureMembership(params: {
    user: UserEntity;
    adminUser: UserEntity;
    membershipPlan: MembershipPlanEntity;
    planBillingPeriod: MembershipPlanBillingPeriodEntity;
    startsAt: Date;
    endsAt: Date;
  }): Promise<MembershipEntity> {
    const existing: MembershipEntity | null =
      await this.membershipRepository.findOne({
        where: { user_id: params.user.id },
        order: { id: 'DESC' },
      });

    if (existing) {
      const shouldUpdate: boolean =
        existing.status !== MembershipStatusEnum.ACTIVE ||
        existing.membership_plan_billing_period_id !==
          params.planBillingPeriod.id;

      if (shouldUpdate) {
        return this.membershipRepository.save({
          ...existing,
          status: MembershipStatusEnum.ACTIVE,
          membership_plan_billing_period_id: params.planBillingPeriod.id,
          membership_plan_id: params.membershipPlan.id,
          starts_at: params.startsAt,
          ends_at: params.endsAt,
          grace_ends_at: null,
          is_auto_renew_enabled: true,
          cancelled_at: null,
          updated_by: params.adminUser,
        });
      }

      return existing;
    }

    const membershipToCreate = this.membershipRepository.create({
      user_id: params.user.id,
      status: MembershipStatusEnum.ACTIVE,
      membership_plan_billing_period_id: params.planBillingPeriod.id,
      membership_plan_id: params.membershipPlan.id,
      starts_at: params.startsAt,
      ends_at: params.endsAt,
      grace_ends_at: null,
      is_auto_renew_enabled: true,
      cancelled_at: null,
      created_by: params.adminUser,
      updated_by: params.adminUser,
    });

    return this.membershipRepository.save(membershipToCreate);
  }

  private async ensureMembershipPayment(params: {
    membership: MembershipEntity;
    user: UserEntity;
    adminUser: UserEntity;
    membershipPlan: MembershipPlanEntity;
    planBillingPeriod: MembershipPlanBillingPeriodEntity;
    baseMonthlyPrice: number;
    discountPercentage: number;
    amount: number;
  }): Promise<MembershipPaymentEntity> {
    const billingPeriod = params.planBillingPeriod.billing_period;

    const existing: MembershipPaymentEntity | null =
      await this.membershipPaymentRepository.findOne({
        where: {
          membership_id: params.membership.id,
          payment_status: MembershipPaymentStatusEnum.PAID,
        },
        order: { id: 'DESC' },
      });

    if (existing) {
      const shouldUpdate: boolean =
        Number(existing.amount) !== params.amount ||
        existing.membership_plan_billing_period_id !==
          params.planBillingPeriod.id;

      if (!shouldUpdate) {
        return existing;
      }

      return this.membershipPaymentRepository.save({
        ...existing,
        membership_plan_billing_period_id: params.planBillingPeriod.id,
        membership_plan_id: params.membershipPlan.id,
        membership_plan_code: params.membershipPlan.plan_code,
        membership_plan_name: params.membershipPlan.plan_name,
        billing_period_code: billingPeriod.period_code,
        billing_duration_months: billingPeriod.duration_in_months,
        base_monthly_price: params.baseMonthlyPrice,
        discount_percentage: params.discountPercentage,
        amount: params.amount,
        currency: MEMBERSHIP_PAYMENT_CURRENCY,
        payment_status: MembershipPaymentStatusEnum.PAID,
        provider: existing.provider ?? null,
        provider_reference: existing.provider_reference ?? null,
        paid_at: existing.paid_at ?? new Date(),
        updated_by: params.adminUser,
      });
    }

    const paymentToCreate = this.membershipPaymentRepository.create({
      membership_id: params.membership.id,
      user_id: params.user.id,
      membership_plan_billing_period_id: params.planBillingPeriod.id,
      membership_plan_id: params.membershipPlan.id,
      membership_plan_code: params.membershipPlan.plan_code,
      membership_plan_name: params.membershipPlan.plan_name,
      billing_period_code: billingPeriod.period_code,
      billing_duration_months: billingPeriod.duration_in_months,
      base_monthly_price: params.baseMonthlyPrice,
      discount_percentage: params.discountPercentage,
      amount: params.amount,
      currency: MEMBERSHIP_PAYMENT_CURRENCY,
      payment_status: MembershipPaymentStatusEnum.PAID,
      provider: null,
      provider_reference: null,
      paid_at: new Date(),
      created_by: params.adminUser,
      updated_by: params.adminUser,
    });

    return this.membershipPaymentRepository.save(paymentToCreate);
  }

  private async ensureWelcomeVoucherGrants(params: {
    membership: MembershipEntity;
    user: UserEntity;
    payment: MembershipPaymentEntity;
    adminUser: UserEntity;
  }): Promise<void> {
    for (const voucherCode of WELCOME_VOUCHER_CODES) {
      const voucher: VoucherEntity | null = await this.voucherRepository
        .createQueryBuilder('voucher')
        .where('UPPER(voucher.code) = UPPER(:code)', {
          code: voucherCode,
        })
        .andWhere('voucher.deleted_at IS NULL')
        .getOne();
      if (!voucher) {
        continue;
      }
      const existing: MembershipVoucherGrantEntity | null =
        await this.membershipVoucherGrantRepository.findOne({
          where: {
            membership_id: params.membership.id,
            voucher_code: voucherCode,
          },
        });

      if (existing) {
        continue;
      }

      const grantToCreate = this.membershipVoucherGrantRepository.create({
        membership_id: params.membership.id,
        user_id: params.user.id,
        membership_payment_id: params.payment.id,
        voucher_id: voucher.id,
        voucher_code: voucherCode,
        created_by: params.adminUser,
        updated_by: params.adminUser,
      });

      await this.membershipVoucherGrantRepository.save(grantToCreate);
    }
  }
}
