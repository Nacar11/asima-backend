import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { BaseMembershipRepository } from '@/memberships/persistence/base-membership.repository';
import { BaseMembershipPaymentRepository } from '@/memberships/persistence/base-membership-payment.repository';
import { BaseMembershipVoucherGrantRepository } from '@/memberships/persistence/base-membership-voucher-grant.repository';
import { MembershipEntity } from '@/memberships/persistence/entities/membership.entity';
import { MembershipPaymentEntity } from '@/memberships/persistence/entities/membership-payment.entity';
import { MembershipVoucherGrantEntity } from '@/memberships/persistence/entities/membership-voucher-grant.entity';
import { MembershipMapper } from '@/memberships/persistence/mappers/membership.mapper';
import { MembershipPaymentMapper } from '@/memberships/persistence/mappers/membership-payment.mapper';
import { MembershipVoucherGrantMapper } from '@/memberships/persistence/mappers/membership-voucher-grant.mapper';
import { RegisterMembershipDto } from '@/memberships/dto/register-membership.dto';
import { RegisterMembershipResponseDto } from '@/memberships/dto/register-membership-response.dto';
import { Membership } from '@/memberships/domain/membership';
import { User } from '@/users/domain/user';
import { MembershipStatusEnum } from '@/memberships/enums/membership-status.enum';
import { MEMBERSHIP_PAYMENT_CURRENCY } from '@/memberships/memberships.constants';
import { MembershipPayment } from '@/memberships/domain/membership-payment';
import { MembershipPaymentStatusEnum } from '@/memberships/enums/membership-payment-status.enum';
import { MembershipVoucherGrant } from '@/memberships/domain/membership-voucher-grant';
import { QueryMembershipDto } from '@/memberships/dto/query-membership.dto';
import { FindAllMembership } from '@/memberships/domain/find-all-membership';
import { RenewMembershipDto } from '@/memberships/dto/renew-membership.dto';
import { UpdateAutoRenewalDto } from '@/memberships/dto/update-auto-renewal.dto';
import { CancelMembershipDto } from '@/memberships/dto/cancel-membership.dto';
import { ExtendMembershipDto } from '@/memberships/dto/extend-membership.dto';
import { QueryMembershipPaymentDto } from '@/memberships/dto/query-membership-payment.dto';
import { FindAllMembershipPayment } from '@/memberships/domain/find-all-membership-payment';
import { QueryMembershipVoucherGrantDto } from '@/memberships/dto/query-membership-voucher-grant.dto';
import {
  MembershipPlanBillingPeriodStatusFilter,
  QueryMembershipPlanBillingPeriodDto,
} from '@/memberships/dto/query-membership-plan-billing-period.dto';
import { FindAllMembershipVoucherGrant } from '@/memberships/domain/find-all-membership-voucher-grant';
import { ActivateMembershipDto } from '@/memberships/dto/activate-membership.dto';
import { BaseMembershipVoucherConfigurationRepository } from '@/membership-voucher-configurations/persistence/base-membership-voucher-configuration.repository';
import { MembershipVoucherConfiguration } from '@/membership-voucher-configurations/domain/membership-voucher-configuration';
import { MembershipDetails } from '@/memberships/domain/membership-details';
import { ParametersService } from '@/parameters/parameters.service';
import { UserVoucherEntity } from '@/vouchers/persistence/entities/user-voucher.entity';
import { UserVoucherStatusEnum } from '@/vouchers/enums/user-voucher-status.enum';
import { ActivateMembershipResponseDto } from '@/memberships/dto/activate-membership-response.dto';
import { MembershipSettingsResponseDto } from '@/memberships/dto/membership-settings-response.dto';
import { UpdateMembershipSettingsDto } from '@/memberships/dto/update-membership-settings.dto';
import { VoucherEntity } from '@/vouchers/persistence/entities/voucher.entity';
import { VoucherCategoryEntity } from '@/voucher-categories/persistence/entities/voucher-category.entity';
import { VoucherProductEntity } from '@/voucher-products/persistence/entities/voucher-product.entity';
import { VoucherScopeEnum } from '@/vouchers/enums/voucher-scope.enum';
import { ActivateMembershipVoucherGrantItemDto } from '@/memberships/dto/activate-membership-voucher-grant-item.dto';
import { ActivateMembershipVoucherGrantsGroupedDto } from '@/memberships/dto/activate-membership-voucher-grants-grouped.dto';
import { ActivateMembershipVoucherLinkedCategoryDto } from '@/memberships/dto/activate-membership-voucher-linked-category.dto';
import { ActivateMembershipVoucherLinkedProductDto } from '@/memberships/dto/activate-membership-voucher-linked-product.dto';
import { MyMembershipResponseDto } from '@/memberships/dto/my-membership-response.dto';
import { isMembershipAccessGranted } from '@/memberships/utils/membership-access.util';
import { MembershipPlanEntity } from '@/memberships/persistence/entities/membership-plan.entity';
import { MembershipPlanBillingPeriodEntity } from '@/memberships/persistence/entities/membership-plan-billing-period.entity';
import { MembershipBillingPeriodResponseDto } from '@/memberships/dto/membership-billing-period-response.dto';
import { RenewMembershipResponseDto } from '@/memberships/dto/renew-membership-response.dto';
import { UserAssignmentsService } from '@/user-assignments/user-assignments.service';
import { CreateUserAssignmentDto } from '@/user-assignments/dto/create-user-assignment.dto';
import { UserGroupsService } from '@/user-groups/user-groups.service';
import { StorageService } from '@/storage/storage.service';
import { MembershipPaymentPageResponseDto } from '@/memberships/dto/membership-payment-page-response.dto';
import { MembershipPaymentStatusResponseDto } from '@/memberships/dto/membership-payment-status-response.dto';
import { NotifyMembershipPaymentDto } from '@/memberships/dto/notify-membership-payment.dto';
import { SubmitMembershipPaymentDto } from '@/memberships/dto/submit-membership-payment.dto';
import { CustomPaymentMethodRepository } from '@/checkout-payments/persistence/repositories/custom-payment-method.repository';
import { NotificationsService } from '@/notifications/notifications.service';
import { UserEntity } from '@/users/persistence/entities/user.entity';

/**
 * Membership service.
 */
@Injectable()
export class MembershipsService {
  private static readonly MOCK_CHECKOUT_URL =
    'https://mock-payment.localhost/membership/success';

  constructor(
    private readonly membershipRepository: BaseMembershipRepository,
    private readonly membershipPaymentRepository: BaseMembershipPaymentRepository,
    private readonly membershipVoucherGrantRepository: BaseMembershipVoucherGrantRepository,
    private readonly membershipVoucherConfigurationRepository: BaseMembershipVoucherConfigurationRepository,
    private readonly parametersService: ParametersService,
    private readonly userAssignmentsService: UserAssignmentsService,
    private readonly userGroupsService: UserGroupsService,
    private readonly storageService: StorageService,
    @InjectRepository(MembershipPlanEntity)
    private readonly membershipPlanEntityRepository: Repository<MembershipPlanEntity>,
    @InjectRepository(MembershipPlanBillingPeriodEntity)
    private readonly membershipPlanBillingPeriodRepository: Repository<MembershipPlanBillingPeriodEntity>,
    @InjectRepository(UserVoucherEntity)
    private readonly userVoucherRepository: Repository<UserVoucherEntity>,
    @InjectRepository(VoucherEntity)
    private readonly voucherRepository: Repository<VoucherEntity>,
    @InjectRepository(VoucherCategoryEntity)
    private readonly voucherCategoryRepository: Repository<VoucherCategoryEntity>,
    @InjectRepository(VoucherProductEntity)
    private readonly voucherProductRepository: Repository<VoucherProductEntity>,
    private readonly customPaymentMethodRepository: CustomPaymentMethodRepository,
    private readonly notificationsService: NotificationsService,
    @InjectRepository(UserEntity)
    private readonly userEntityRepository: Repository<UserEntity>,
    private readonly dataSource: DataSource,
  ) {}
  /**
   * Update membership settings in parameters table.
   */
  async updateMembershipSettings(
    input: UpdateMembershipSettingsDto,
  ): Promise<MembershipSettingsResponseDto> {
    const response = new MembershipSettingsResponseDto();

    // Update grace_period if provided
    if (input.grace_period !== undefined) {
      const gracePeriodParam =
        await this.parametersService.findByCode('grace_period');
      await this.parametersService.update(gracePeriodParam!.id, {
        numeric_value: input.grace_period,
      });
      response.grace_period = input.grace_period;
    } else {
      // Get current value if not updated
      const gracePeriodParam =
        await this.parametersService.findByCode('grace_period');
      response.grace_period = gracePeriodParam!.numeric_value;
    }

    // Update auto_renewal_days_before_expiration if provided
    if (input.auto_renewal_days_before_expiration !== undefined) {
      const autoRenewalParam = await this.parametersService.findByCode(
        'auto_renewal_days_before_expiration',
      );
      await this.parametersService.update(autoRenewalParam!.id, {
        numeric_value: input.auto_renewal_days_before_expiration,
      });
      response.auto_renewal_days_before_expiration =
        input.auto_renewal_days_before_expiration;
    } else {
      // Get current value if not updated
      const autoRenewalParam = await this.parametersService.findByCode(
        'auto_renewal_days_before_expiration',
      );
      response.auto_renewal_days_before_expiration =
        autoRenewalParam!.numeric_value;
    }

    // Update maximum_renewal_entries if provided
    if (input.maximum_renewal_entries !== undefined) {
      const maxRenewalParam = await this.parametersService.findByCode(
        'maximum_renewal_entries',
      );
      await this.parametersService.update(maxRenewalParam!.id, {
        numeric_value: input.maximum_renewal_entries,
      });
      response.maximum_renewal_entries = input.maximum_renewal_entries;
    } else {
      // Get current value if not updated
      const maxRenewalParam = await this.parametersService.findByCode(
        'maximum_renewal_entries',
      );
      response.maximum_renewal_entries = maxRenewalParam!.numeric_value;
    }

    return response;
  }
  /**
   * Get current membership settings from parameters table.
   */
  async getMembershipSettings(): Promise<MembershipSettingsResponseDto> {
    const response = new MembershipSettingsResponseDto();

    // Get grace_period
    const gracePeriodParam =
      await this.parametersService.findByCode('grace_period');
    response.grace_period = gracePeriodParam!.numeric_value;

    // Get auto_renewal_days_before_expiration
    const autoRenewalParam = await this.parametersService.findByCode(
      'auto_renewal_days_before_expiration',
    );
    response.auto_renewal_days_before_expiration =
      autoRenewalParam!.numeric_value;

    // Get maximum_renewal_entries
    const maxRenewalParam = await this.parametersService.findByCode(
      'maximum_renewal_entries',
    );
    response.maximum_renewal_entries = maxRenewalParam!.numeric_value;

    return response;
  }
  /**
   * Find an active plan billing period by its ID.
   */
  private async findActivePlanBillingPeriod(
    planBillingPeriodId: number,
  ): Promise<MembershipPlanBillingPeriodEntity> {
    const planBillingPeriod: MembershipPlanBillingPeriodEntity | null =
      await this.membershipPlanBillingPeriodRepository.findOne({
        where: { id: planBillingPeriodId, is_active: true },
      });
    if (!planBillingPeriod) {
      throw new BadRequestException(
        'Membership plan billing period does not exist or is inactive.',
      );
    }
    return planBillingPeriod;
  }

  /**
   * Get all available billing periods for a specific plan (authenticated user).
   */
  async getMembershipBillingPeriodsByPlanId(
    planId: number,
    query?: QueryMembershipPlanBillingPeriodDto,
  ): Promise<MembershipBillingPeriodResponseDto[]> {
    const billingPeriodWhere: Record<string, unknown> = {};
    if (query?.status === MembershipPlanBillingPeriodStatusFilter.ACTIVE)
      billingPeriodWhere.is_active = true;
    else if (query?.status === MembershipPlanBillingPeriodStatusFilter.INACTIVE)
      billingPeriodWhere.is_active = false;

    const periods = await this.membershipPlanBillingPeriodRepository.find({
      where: {
        membership_plan_id: planId,
        billing_period: billingPeriodWhere,
      },
      relations: ['billing_period'],
      order: { billing_period: { duration_in_months: 'ASC' } },
    });

    return periods.map((period) => ({
      id: period.id,
      membership_plan_id: period.membership_plan_id,
      billing_period_id: period.billing_period_id,
      total_price: Number(period.total_price),
      discount_percentage: Number(period.discount_percentage),
      is_active: period.is_active,
      billing_period: {
        id: period.billing_period.id,
        period_code: period.billing_period.period_code,
        period_name: period.billing_period.period_name,
        duration_in_months: period.billing_period.duration_in_months,
        duration_in_days: period.billing_period.duration_in_days,
        sort_order: period.billing_period.sort_order,
        is_active: period.billing_period.is_active,
      },
    }));
  }
  /**
   * Register membership.
   */
  async registerMembership(
    input: RegisterMembershipDto,
    causer: User,
  ): Promise<RegisterMembershipResponseDto> {
    // Block if already active/grace
    const hasAccessibleMembership: Membership | null =
      await this.membershipRepository.findActiveOrGraceByUserId(causer.id);
    if (hasAccessibleMembership) {
      throw new BadRequestException(
        'User already has an active or grace period membership.',
      );
    }

    const membershipPlan: MembershipPlanEntity =
      await this.findActiveMembershipPlanById(input.membership_plan_id);
    let planBillingPeriod: MembershipPlanBillingPeriodEntity;
    if (input.membership_plan_billing_period_id !== undefined) {
      planBillingPeriod = await this.findActivePlanBillingPeriod(
        input.membership_plan_billing_period_id,
      );
      if (planBillingPeriod.membership_plan_id !== membershipPlan.id) {
        throw new BadRequestException(
          'Billing period does not belong to the selected plan.',
        );
      }
    } else {
      const defaultPeriod =
        await this.membershipPlanBillingPeriodRepository.findOne({
          where: { membership_plan_id: membershipPlan.id, is_active: true },
          order: { total_price: 'ASC' },
        });
      if (!defaultPeriod) {
        throw new BadRequestException(
          'No active billing period available for this plan.',
        );
      }
      planBillingPeriod = defaultPeriod;
    }
    const billingPeriod = planBillingPeriod.billing_period;
    const durationMonths: number = billingPeriod.duration_in_months;
    const discountPercentage: number = Number(
      planBillingPeriod.discount_percentage,
    );
    const membershipAmount: number = Number(planBillingPeriod.total_price);
    const baseMonthlyPrice: number = membershipAmount / durationMonths;

    // One row per user — always reuse the existing membership record.
    // If PENDING with an unsubmitted payment, redirect to that payment page (no new records).
    // If CANCELLED or EXPIRED, reset it to PENDING and create a fresh payment.
    const existingMembership: Membership | null =
      await this.membershipRepository.findLatestByUserId(causer.id);

    if (existingMembership?.status === MembershipStatusEnum.PENDING) {
      const existingPayments: MembershipPayment[] =
        await this.membershipPaymentRepository.findByMembershipId(
          existingMembership.id,
        );
      const pendingPayments: MembershipPayment[] = existingPayments.filter(
        (p) => p.payment_status === MembershipPaymentStatusEnum.PENDING,
      );

      const billingPeriodChanged =
        existingMembership.membership_plan_billing_period_id !==
        planBillingPeriod.id;

      if (billingPeriodChanged) {
        // User switched plan/period — void stale pending payments and fall
        // through so the update+create block below issues a fresh payment.
        for (const stale of pendingPayments) {
          await this.membershipPaymentRepository.update(stale.id, {
            payment_status: MembershipPaymentStatusEnum.CANCELLED,
          });
        }
      } else {
        // Same plan/period — return the existing pending payment as-is.
        const latestPendingPayment: MembershipPayment | undefined =
          pendingPayments.sort((a, b) => b.id - a.id)[0];
        const response: RegisterMembershipResponseDto =
          new RegisterMembershipResponseDto();
        response.membership_id = existingMembership.id;
        response.membership_payment_id = latestPendingPayment?.id ?? 0;
        response.amount = Number(latestPendingPayment?.amount ?? 0);
        response.currency =
          latestPendingPayment?.currency ?? MEMBERSHIP_PAYMENT_CURRENCY;
        response.membership_plan_billing_period_id =
          existingMembership.membership_plan_billing_period_id ?? 0;
        response.billing_period_code =
          latestPendingPayment?.billing_period_code ?? '';
        response.payment_status = MembershipPaymentStatusEnum.PENDING;
        response.transaction_number =
          latestPendingPayment?.provider_reference ?? '';
        response.checkout_url = null;
        response.already_pending = true;
        return response;
      }
    }

    // Reuse existing row (cancelled/expired) or create one if truly first-time
    const membership: Membership = existingMembership
      ? await this.membershipRepository.update(existingMembership.id, {
          membership_plan_id: membershipPlan.id,
          membership_plan_billing_period_id: planBillingPeriod.id,
          status: MembershipStatusEnum.PENDING,
          starts_at: null,
          ends_at: null,
          grace_ends_at: null,
          is_auto_renew_enabled: input.is_auto_renew_enabled ?? true,
          cancelled_at: null,
          updated_by: causer,
        })
      : await this.membershipRepository.create({
          user_id: causer.id,
          membership_plan_id: membershipPlan.id,
          membership_plan_billing_period_id: planBillingPeriod.id,
          status: MembershipStatusEnum.PENDING,
          starts_at: null,
          ends_at: null,
          grace_ends_at: null,
          is_auto_renew_enabled: input.is_auto_renew_enabled ?? true,
          cancelled_at: null,
          created_by: causer,
          updated_by: causer,
        });
    const transactionNumber: string = this.generateMockTransactionNumber();
    const payment: MembershipPayment =
      await this.membershipPaymentRepository.create({
        membership_id: membership.id,
        user_id: causer.id,
        membership_plan_billing_period_id: planBillingPeriod.id,
        membership_plan_id: membershipPlan.id,
        membership_plan_code: membershipPlan.plan_code,
        membership_plan_name: membershipPlan.plan_name,
        billing_period_code: billingPeriod.period_code,
        billing_duration_months: durationMonths,
        base_monthly_price: baseMonthlyPrice,
        discount_percentage: discountPercentage,
        amount: membershipAmount,
        currency: MEMBERSHIP_PAYMENT_CURRENCY,
        payment_status: MembershipPaymentStatusEnum.PENDING,
        provider: null,
        provider_reference: transactionNumber,
        paid_at: null,
        created_by: causer,
        updated_by: causer,
      });
    const response: RegisterMembershipResponseDto =
      new RegisterMembershipResponseDto();
    response.membership_id = membership.id;
    response.membership_payment_id = payment.id;
    response.amount = membershipAmount;
    response.currency = MEMBERSHIP_PAYMENT_CURRENCY;
    response.membership_plan_billing_period_id = planBillingPeriod.id;
    response.billing_period_code = billingPeriod.period_code;
    response.payment_status = payment.payment_status;
    response.transaction_number = transactionNumber;
    response.checkout_url = MembershipsService.MOCK_CHECKOUT_URL;
    return response;
  }
  /**
   * Activate existing membership using provided payment row.
   */
  async activateMembership(
    input: ActivateMembershipDto,
    causer: User,
  ): Promise<ActivateMembershipResponseDto> {
    let payment: MembershipPayment;

    // Handle both membership_payment_id and dragonpay_txn_id
    if (input.dragonpay_txn_id) {
      payment = await this.findPaymentByProviderReference(
        input.dragonpay_txn_id,
      );
    } else if (input.membership_payment_id) {
      payment = await this.findPaymentById(input.membership_payment_id);
    } else {
      throw new BadRequestException(
        'Either membership_payment_id or dragonpay_txn_id must be provided.',
      );
    }

    if (payment.user_id !== causer.id) {
      throw new BadRequestException('Payment does not belong to current user.');
    }
    if (payment.payment_status !== MembershipPaymentStatusEnum.PAID) {
      throw new BadRequestException('Membership payment is not paid yet.');
    }

    const membership: Membership = await this.findById(payment.membership_id);
    if (membership.user_id !== causer.id) {
      throw new BadRequestException(
        'Membership does not belong to current user.',
      );
    }

    await this.ensureCustomerGroupAssignment(causer.id, causer);

    const now: Date = new Date();
    // Check if this is a renewal by looking for existing payments for this membership
    const existingPayments: MembershipPayment[] =
      await this.membershipPaymentRepository.findByMembershipId(membership.id);
    const isRenewal: boolean = existingPayments.length > 1;

    // Anchor renewal on `ends_at` for ACTIVE (stack) and GRACE_PERIOD
    // (anti-abuse: prevents gaining free grace days by intentionally
    // lapsing). Fully-lapsed users start fresh from `now`.
    const renewalStartAt: Date = this.resolveRenewalAnchor(membership, now);
    const durationInDays: number = payment.billing_duration_months * 30;
    const endsAt: Date = this.calculateMembershipEndDate({
      startsAt: renewalStartAt,
      durationInDays,
    });
    // Serialize concurrent callbacks on the same payment. A pessimistic_write lock
    // on the membership_payment row forces the second racer to wait until the first
    // commits; it will then find the already-created grants and short-circuit.
    const { updatedMembership, voucherGrants } =
      await this.dataSource.transaction('SERIALIZABLE', async (manager) => {
        // Lock the payment row for the duration of this transaction
        const lockedPayment = await manager
          .getRepository(MembershipPaymentEntity)
          .findOne({
            where: { id: payment.id },
            lock: { mode: 'pessimistic_write' },
          });
        if (!lockedPayment) {
          throw new NotFoundException('Membership payment does not exist.');
        }

        // Idempotency check INSIDE the lock — if grants already exist for this
        // payment, another caller finished first. Return what they produced.
        const existingGrantEntities = await manager
          .getRepository(MembershipVoucherGrantEntity)
          .find({
            where: { membership_payment_id: payment.id },
            take: 10,
          });
        if (existingGrantEntities.length > 0) {
          const existingMembershipEntity = await manager
            .getRepository(MembershipEntity)
            .findOne({ where: { id: membership.id } });
          return {
            updatedMembership: existingMembershipEntity
              ? MembershipMapper.toDomain(existingMembershipEntity)
              : membership,
            voucherGrants: existingGrantEntities.map((e) =>
              MembershipVoucherGrantMapper.toDomain(e),
            ),
          };
        }

        // Step 1: mark payment as paid (if not already stamped)
        if (!payment.paid_at) {
          await this.updateMembershipPaymentInTransaction(manager, payment.id, {
            paid_at: new Date(),
            updated_by: causer,
          });
        }
        // Step 2: activate the membership
        const nextMembership = await this.updateMembershipInTransaction(
          manager,
          membership.id,
          {
            status: MembershipStatusEnum.ACTIVE,
            membership_plan_id: payment.membership_plan_id,
            membership_plan_billing_period_id:
              payment.membership_plan_billing_period_id,
            starts_at: membership.starts_at ?? renewalStartAt,
            ends_at: endsAt,
            grace_ends_at: await this.calculateGraceEndDate(endsAt),
            cancelled_at: null,
            updated_by: causer,
          },
        );
        // Step 3: grant vouchers (grants + user_vouchers) — all on the same tx
        const grants = await this.createActivationVoucherGrants(
          {
            membership: nextMembership,
            payment,
            causer,
            isRenewal,
            membershipEndsAt: nextMembership.grace_ends_at!,
          },
          manager,
        );
        return { updatedMembership: nextMembership, voucherGrants: grants };
      });
    const response: ActivateMembershipResponseDto =
      new ActivateMembershipResponseDto();
    response.membership = updatedMembership;
    response.voucher_grants = await this.buildGroupedActivationVoucherGrants(
      voucherGrants,
      causer.id,
    );

    // Notify user that membership has been activated via gateway (non-blocking)
    this.notificationsService
      .sendMembershipPaymentConfirmed(
        causer.id,
        updatedMembership.id,
        Number(payment.amount),
        true,
        causer.email ?? undefined,
        `${causer.first_name ?? ''} ${causer.last_name ?? ''}`.trim(),
        isRenewal,
      )
      .catch(() => {});

    return response;
  }

  private async ensureCustomerGroupAssignment(
    userId: number,
    causer: User,
  ): Promise<void> {
    const assignments =
      await this.userAssignmentsService.findActiveByUserId(userId);
    const customerGroup = await this.userGroupsService.findCustomerGroup();
    if (!customerGroup) {
      throw new NotFoundException('Customer user group does not exist.');
    }
    const isCustomer = assignments.some(
      (assignment) => assignment.group?.id === customerGroup.id,
    );
    if (isCustomer) {
      return;
    }
    const assignmentPayload: CreateUserAssignmentDto = {
      group: customerGroup.id,
      user: userId,
    };
    await this.userAssignmentsService.create(assignmentPayload, causer);
  }

  /**
   * Get membership list.
   */
  async findAll(query: QueryMembershipDto): Promise<FindAllMembership> {
    return this.membershipRepository.findAll(query);
  }
  /**
   * Get membership for user.
   */
  async findMyMembership(currentUser: User): Promise<MyMembershipResponseDto> {
    const userId = currentUser.id;
    const membership: Membership | null =
      await this.membershipRepository.findLatestByUserId(userId);
    const paymentResult: FindAllMembershipPayment =
      await this.membershipPaymentRepository.findAll({
        user_id: userId,
        skip: 0,
        take: 5,
      });
    // Only return voucher grants if the membership has a valid active period.
    // For GRACE_PERIOD, access is gated by grace_ends_at (post-expiry window);
    // for every other status, access is gated by ends_at. A cancelled
    // in-period member retains access because ends_at is preserved;
    // a cancelled grace-period member loses access because ends_at is clamped
    // to the cancellation time.
    const now = new Date();
    const effectiveExpiry: Date | null =
      membership?.status === MembershipStatusEnum.GRACE_PERIOD
        ? (membership.grace_ends_at ?? null)
        : (membership?.ends_at ?? null);
    const isActiveMembership =
      membership &&
      !!membership.starts_at &&
      !!effectiveExpiry &&
      effectiveExpiry > now;
    const grantResult: FindAllMembershipVoucherGrant | null = isActiveMembership
      ? await this.membershipVoucherGrantRepository.findAll({
          membership_id: membership!.id,
          user_id: userId,
          skip: 0,
          take: 500,
        })
      : null;
    const response: MyMembershipResponseDto = new MyMembershipResponseDto();
    response.user = {
      id: currentUser.id,
      first_name: currentUser.first_name,
      middle_name: currentUser.middle_name ?? null,
      last_name: currentUser.last_name,
      suffix: currentUser.suffix ?? null,
      email: currentUser.email ?? null,
      phone: currentUser.phone ?? null,
      image: currentUser.image ?? null,
      profile_picture: currentUser.profile_picture ?? null,
    };
    response.membership = membership;
    response.has_access = isMembershipAccessGranted(membership, now);
    response.membership_payments = paymentResult.data;
    response.voucher_grants = await this.buildGroupedActivationVoucherGrants(
      grantResult?.data ?? [],
      userId,
    );
    return response;
  }
  /**
   * Get membership by identifier.
   */
  async findById(id: number): Promise<Membership> {
    const membership: Membership | null =
      await this.membershipRepository.findById(id);
    if (!membership) {
      throw new NotFoundException('Membership does not exist.');
    }
    return membership;
  }
  /**
   * Get admin membership details with associated logs.
   */
  async findMembershipDetailsById(id: number): Promise<MembershipDetails> {
    const membership: Membership = await this.findById(id);
    const allPayments: MembershipPayment[] =
      await this.membershipPaymentRepository.findByMembershipId(membership.id);
    const paymentHistory: MembershipPayment[] = allPayments.filter(
      (p) => p.payment_status !== MembershipPaymentStatusEnum.PENDING,
    );
    const voucherIssuanceLog: MembershipVoucherGrant[] =
      await this.membershipVoucherGrantRepository.findByMembershipId(
        membership.id,
      );
    const groupedVoucherIssuanceLog: MembershipVoucherGrant[] =
      await this.buildGroupedVoucherIssuanceLog(voucherIssuanceLog);
    const details: MembershipDetails = new MembershipDetails();
    details.membership = membership;
    details.payment_history = paymentHistory;
    details.voucher_issuance_log = groupedVoucherIssuanceLog;
    return details;
  }

  private async buildGroupedVoucherIssuanceLog(
    voucherIssuanceLog: MembershipVoucherGrant[],
  ): Promise<MembershipVoucherGrant[]> {
    const groupedMap: Map<string, MembershipVoucherGrant> = new Map();
    const groupedList: MembershipVoucherGrant[] = [];
    for (const item of voucherIssuanceLog) {
      const createdAtKey: string = new Date(item.created_at).toISOString();
      const key: string = `${item.voucher_code}:${createdAtKey}`;
      const existing: MembershipVoucherGrant | undefined = groupedMap.get(key);
      if (existing) {
        const currentQuantity: number = existing.quantity
          ? Number(existing.quantity)
          : 1;
        existing.quantity = currentQuantity + 1;
        continue;
      }
      const groupedItem: MembershipVoucherGrant = {
        ...item,
        quantity: 1,
      };
      groupedMap.set(key, groupedItem);
      groupedList.push(groupedItem);
    }
    const voucherIds: number[] = Array.from(
      new Set(
        groupedList.map(
          (item: MembershipVoucherGrant): number => item.voucher_id,
        ),
      ),
    );
    if (voucherIds.length === 0) {
      return groupedList;
    }
    const vouchers: VoucherEntity[] = await this.voucherRepository.find({
      where: { id: In(voucherIds) },
      select: ['id', 'scope'],
    });
    const voucherScopeById: Map<number, VoucherScopeEnum> = new Map(
      vouchers.map((voucher: VoucherEntity): [number, VoucherScopeEnum] => [
        voucher.id,
        voucher.scope,
      ]),
    );
    const categoryRows: Array<{ voucher_id: number; category_name: string }> =
      await this.voucherCategoryRepository
        .createQueryBuilder('voucherCategory')
        .innerJoin('voucherCategory.category', 'category')
        .select('voucherCategory.voucher_id', 'voucher_id')
        .addSelect('category.category_name', 'category_name')
        .where('voucherCategory.voucher_id IN (:...voucherIds)', { voucherIds })
        .getRawMany();
    const categoryNamesByVoucherId: Map<number, string[]> = new Map();
    for (const row of categoryRows) {
      const existing: string[] =
        categoryNamesByVoucherId.get(row.voucher_id) ?? [];
      existing.push(row.category_name);
      categoryNamesByVoucherId.set(row.voucher_id, existing);
    }
    return groupedList.map(
      (item: MembershipVoucherGrant): MembershipVoucherGrant => {
        const scope: VoucherScopeEnum | undefined = voucherScopeById.get(
          item.voucher_id,
        );
        if (!scope) {
          return {
            ...item,
            grant_type: null,
          };
        }
        if (scope === VoucherScopeEnum.CATEGORIES) {
          const names: string[] =
            categoryNamesByVoucherId.get(item.voucher_id) ?? [];
          const uniqueNames: string[] = Array.from(new Set(names));
          const displayedNames: string[] = uniqueNames.slice(0, 3);
          const base: string =
            displayedNames.length > 0
              ? displayedNames.join(', ')
              : 'categories';
          const grantType: string =
            uniqueNames.length >= 4 ? `${base}, etc.` : base;
          return {
            ...item,
            grant_type: grantType,
          };
        }
        return {
          ...item,
          grant_type: String(scope).toLowerCase(),
        };
      },
    );
  }
  /**
   * Renew membership.
   */
  async renewMembership(
    input: RenewMembershipDto,
    causer: User,
  ): Promise<RenewMembershipResponseDto> {
    // Find the current user's membership
    const membership: Membership | null =
      await this.membershipRepository.findLatestByUserId(causer.id);
    if (!membership) {
      throw new BadRequestException('No membership found for current user.');
    }
    if (membership.user_id !== causer.id) {
      throw new BadRequestException(
        'Membership does not belong to current user.',
      );
    }
    // If there's already a pending payment for this membership, return it
    // instead of creating a duplicate. This prevents accumulation of pending
    // records when the user submits the renew form multiple times.
    const existingPayments: MembershipPayment[] =
      await this.membershipPaymentRepository.findByMembershipId(membership.id);
    const latestPending: MembershipPayment | undefined = existingPayments
      .filter((p) => p.payment_status === MembershipPaymentStatusEnum.PENDING)
      .sort((a, b) => b.id - a.id)[0];
    if (latestPending) {
      // Update payment_method_code in case the user switched channels
      if (
        input.payment_method_code &&
        input.payment_method_code !== latestPending.payment_method_code
      ) {
        await this.membershipPaymentRepository.update(latestPending.id, {
          payment_method_code: input.payment_method_code,
          updated_by: causer,
        });
      }
      const response = new RenewMembershipResponseDto();
      response.membership_id = membership.id;
      response.membership_payment_id = latestPending.id;
      response.amount = Number(latestPending.amount);
      response.currency = latestPending.currency;
      response.membership_plan_billing_period_id =
        latestPending.membership_plan_billing_period_id ?? 0;
      response.billing_period_code = latestPending.billing_period_code ?? '';
      response.payment_status = latestPending.payment_status;
      response.transaction_number = latestPending.provider_reference ?? '';
      response.checkout_url = '';
      return response;
    }
    let membershipPlan: MembershipPlanEntity;
    if (input.membership_plan_id !== undefined) {
      membershipPlan = await this.findActiveMembershipPlanById(
        input.membership_plan_id,
      );
    } else {
      // Always default to the current membership's plan if no plan_id provided
      membershipPlan = await this.findActiveMembershipPlanById(
        membership.membership_plan_id,
      );
    }
    // Resolve the billing period: use provided ID, or default to the current membership's billing period
    let planBillingPeriod: MembershipPlanBillingPeriodEntity;
    if (input.membership_plan_billing_period_id !== undefined) {
      planBillingPeriod = await this.findActivePlanBillingPeriod(
        input.membership_plan_billing_period_id,
      );
      if (planBillingPeriod.membership_plan_id !== membershipPlan.id) {
        throw new BadRequestException(
          'Billing period does not belong to the selected plan.',
        );
      }
    } else {
      planBillingPeriod = await this.findActivePlanBillingPeriod(
        membership.membership_plan_billing_period_id,
      );
    }
    const billingPeriod = planBillingPeriod.billing_period;
    const durationMonths: number = billingPeriod.duration_in_months;
    const discountPercentage: number = Number(
      planBillingPeriod.discount_percentage,
    );
    const membershipAmount: number = Number(planBillingPeriod.total_price);
    const baseMonthlyPrice: number = membershipAmount / durationMonths;
    const transactionNumber: string = this.generateMockTransactionNumber();
    const payment: MembershipPayment =
      await this.membershipPaymentRepository.create({
        membership_id: membership.id,
        user_id: causer.id,
        membership_plan_billing_period_id: planBillingPeriod.id,
        membership_plan_id: membershipPlan.id,
        membership_plan_code: membershipPlan.plan_code,
        membership_plan_name: membershipPlan.plan_name,
        billing_period_code: billingPeriod.period_code,
        billing_duration_months: durationMonths,
        base_monthly_price: baseMonthlyPrice,
        discount_percentage: discountPercentage,
        amount: membershipAmount,
        currency: MEMBERSHIP_PAYMENT_CURRENCY,
        payment_status: MembershipPaymentStatusEnum.PENDING,
        provider: null,
        provider_reference: transactionNumber,
        payment_method_code: input.payment_method_code ?? null,
        paid_at: null,
        created_by: causer,
        updated_by: causer,
      });
    const response: RenewMembershipResponseDto =
      new RenewMembershipResponseDto();
    response.membership_id = membership.id;
    response.membership_payment_id = payment.id;
    response.amount = membershipAmount;
    response.currency = MEMBERSHIP_PAYMENT_CURRENCY;
    response.membership_plan_billing_period_id = planBillingPeriod.id;
    response.billing_period_code = billingPeriod.period_code;
    response.payment_status = payment.payment_status;
    response.transaction_number = transactionNumber;
    response.checkout_url = MembershipsService.MOCK_CHECKOUT_URL;
    return response;
  }
  /**
   * Update membership auto-renewal flag.
   */
  async updateAutoRenewal(
    id: number,
    input: UpdateAutoRenewalDto,
    causer: User,
  ): Promise<Membership> {
    await this.findById(id);
    return this.membershipRepository.update(id, {
      is_auto_renew_enabled: input.is_auto_renew_enabled,
      updated_by: causer,
    });
  }
  /**
   * Cancel membership.
   */
  async cancelMembership(
    id: number,
    _input: CancelMembershipDto,
    causer: User,
  ): Promise<Membership> {
    const membership: Membership = await this.findById(id);
    if (membership.status === MembershipStatusEnum.CANCELLED) {
      throw new BadRequestException('Membership is already cancelled.');
    }

    const now: Date = new Date();
    // Grace-period cancellation revokes access immediately — grace is a
    // courtesy to allow renewal, and an explicit cancel opts out of it.
    // ACTIVE-period cancellation preserves dates: the user paid for that time.
    const cancelledDuringGrace: boolean =
      membership.status === MembershipStatusEnum.GRACE_PERIOD;

    return this.membershipRepository.update(id, {
      status: MembershipStatusEnum.CANCELLED,
      cancelled_at: now,
      ...(cancelledDuringGrace && {
        ends_at: now,
        grace_ends_at: now,
      }),
      updated_by: causer,
    });
  }
  /**
   * Reactivate a cancelled membership if still within its valid period.
   */
  async reactivateMembership(causer: User): Promise<Membership> {
    const membership: Membership | null =
      await this.membershipRepository.findLatestByUserId(causer.id);
    if (!membership) {
      throw new NotFoundException('No membership found.');
    }
    if (membership.status !== MembershipStatusEnum.CANCELLED) {
      throw new BadRequestException('Membership is not cancelled.');
    }
    const now = new Date();
    if (!membership.ends_at || membership.ends_at <= now) {
      throw new BadRequestException(
        'Membership period has expired. Please select a new plan.',
      );
    }
    return this.membershipRepository.update(membership.id, {
      status: MembershipStatusEnum.ACTIVE,
      cancelled_at: null,
      updated_by: causer,
    });
  }

  /**
   * Extend membership end date.
   */
  async extendMembership(
    id: number,
    input: ExtendMembershipDto,
    causer: User,
  ): Promise<Membership> {
    const membership: Membership = await this.findById(id);
    if (membership.ends_at === null) {
      throw new BadRequestException('Membership end date is not set.');
    }
    const endsAt: Date = new Date(membership.ends_at);
    endsAt.setDate(endsAt.getDate() + input.extension_days);

    // If a GRACE_PERIOD member is extended past `now`, flip back to ACTIVE.
    // Without this, the row would keep GRACE_PERIOD status even though
    // ends_at is in the future again — causing the scheduler to potentially
    // skip it and downstream gates to render misleading UI state.
    const shouldReactivate: boolean =
      membership.status === MembershipStatusEnum.GRACE_PERIOD &&
      endsAt > new Date();

    return this.membershipRepository.update(id, {
      ends_at: endsAt,
      grace_ends_at: await this.calculateGraceEndDate(endsAt),
      ...(shouldReactivate && { status: MembershipStatusEnum.ACTIVE }),
      updated_by: causer,
    });
  }
  /**
   * Find membership payment list.
   */
  async findPayments(
    query: QueryMembershipPaymentDto,
  ): Promise<FindAllMembershipPayment> {
    return this.membershipPaymentRepository.findAll(query);
  }

  async getPaymentById(id: number): Promise<MembershipPayment> {
    return this.findPaymentById(id);
  }
  /**
   * Find voucher grant list.
   */
  async findVoucherGrants(
    query: QueryMembershipVoucherGrantDto,
  ): Promise<FindAllMembershipVoucherGrant> {
    return this.membershipVoucherGrantRepository.findAll(query);
  }
  /**
   * Soft-delete membership.
   */
  async removeMembership(id: number, causer: User): Promise<void> {
    await this.findById(id);
    await this.membershipRepository.remove(id, causer);
  }
  /**
   * Build grouped activation voucher grants enriched by voucher scope links.
   */
  private async buildGroupedActivationVoucherGrants(
    grants: MembershipVoucherGrant[],
    userId: number,
  ): Promise<ActivateMembershipVoucherGrantsGroupedDto> {
    const groupedGrants: ActivateMembershipVoucherGrantsGroupedDto =
      new ActivateMembershipVoucherGrantsGroupedDto();
    groupedGrants.global = [];
    groupedGrants.categories = [];
    groupedGrants.products = [];
    if (grants.length === 0) {
      return groupedGrants;
    }
    // Compute granted count by voucher_code only (exclude created_at)
    const countByVoucherCode: Map<string, number> = new Map();
    for (const grant of grants) {
      const existing = countByVoucherCode.get(grant.voucher_code) ?? 0;
      countByVoucherCode.set(grant.voucher_code, existing + 1);
    }
    const voucherCodes: string[] = [
      ...new Set(
        grants.map(
          (grant: MembershipVoucherGrant): string => grant.voucher_code,
        ),
      ),
    ];
    const vouchers: VoucherEntity[] = await this.voucherRepository.find({
      where: { code: In(voucherCodes) },
    });
    if (vouchers.length === 0) {
      return groupedGrants;
    }
    // Count used (redeemed) user_vouchers for this user per voucher_id
    const voucherIds: number[] = vouchers.map((v) => v.id);
    const usedUserVouchers = await this.userVoucherRepository.find({
      where: {
        user_id: userId,
        voucher_id: In(voucherIds),
        status: UserVoucherStatusEnum.USED,
      },
      select: ['voucher_id'],
    });
    const usedCountByVoucherId: Map<number, number> = new Map();
    for (const uv of usedUserVouchers) {
      usedCountByVoucherId.set(
        uv.voucher_id,
        (usedCountByVoucherId.get(uv.voucher_id) ?? 0) + 1,
      );
    }
    const voucherByCode: Map<string, VoucherEntity> = new Map(
      vouchers.map((voucher: VoucherEntity): [string, VoucherEntity] => [
        voucher.code,
        voucher,
      ]),
    );
    const categoryVoucherIds: number[] = vouchers
      .filter(
        (voucher: VoucherEntity): boolean =>
          voucher.scope === VoucherScopeEnum.CATEGORIES,
      )
      .map((voucher: VoucherEntity): number => voucher.id);
    const productVoucherIds: number[] = vouchers
      .filter(
        (voucher: VoucherEntity): boolean =>
          voucher.scope === VoucherScopeEnum.PRODUCTS,
      )
      .map((voucher: VoucherEntity): number => voucher.id);
    const categoryLinks =
      categoryVoucherIds.length > 0
        ? await this.voucherCategoryRepository.find({
            where: { voucher_id: In(categoryVoucherIds) },
            relations: ['category'],
          })
        : [];
    const productLinks =
      productVoucherIds.length > 0
        ? await this.voucherProductRepository.find({
            where: { voucher_id: In(productVoucherIds) },
            relations: ['product'],
          })
        : [];
    const categoryLinksByVoucherId: Map<
      number,
      ActivateMembershipVoucherLinkedCategoryDto[]
    > = new Map();
    for (const categoryLink of categoryLinks) {
      const existingCategories: ActivateMembershipVoucherLinkedCategoryDto[] =
        categoryLinksByVoucherId.get(categoryLink.voucher_id) ?? [];
      const category: ActivateMembershipVoucherLinkedCategoryDto =
        new ActivateMembershipVoucherLinkedCategoryDto();
      category.id = categoryLink.category_id;
      category.name = categoryLink.category?.category_name ?? '';
      existingCategories.push(category);
      categoryLinksByVoucherId.set(categoryLink.voucher_id, existingCategories);
    }
    const productLinksByVoucherId: Map<
      number,
      ActivateMembershipVoucherLinkedProductDto[]
    > = new Map();
    for (const productLink of productLinks) {
      const existingProducts: ActivateMembershipVoucherLinkedProductDto[] =
        productLinksByVoucherId.get(productLink.voucher_id) ?? [];
      const product: ActivateMembershipVoucherLinkedProductDto =
        new ActivateMembershipVoucherLinkedProductDto();
      product.id = productLink.product_id;
      product.name = productLink.product?.product_name ?? '';
      existingProducts.push(product);
      productLinksByVoucherId.set(productLink.voucher_id, existingProducts);
    }
    for (const voucherCode of voucherCodes) {
      const voucher: VoucherEntity | undefined = voucherByCode.get(voucherCode);
      if (!voucher) {
        continue;
      }

      // Get the first grant for this voucher code to use as the base grant data
      const firstGrant = grants.find((g) => g.voucher_code === voucherCode);
      if (!firstGrant) {
        continue;
      }

      const voucherGrantItem: ActivateMembershipVoucherGrantItemDto =
        new ActivateMembershipVoucherGrantItemDto();
      voucherGrantItem.grant = firstGrant;
      voucherGrantItem.voucher_id = voucher.id;
      voucherGrantItem.voucher_code = voucher.code;
      voucherGrantItem.voucher_scope = voucher.scope;
      voucherGrantItem.granted = countByVoucherCode.get(voucher.code) ?? 1;
      voucherGrantItem.used = usedCountByVoucherId.get(voucher.id) ?? 0;
      voucherGrantItem.voucher_description = voucher.description ?? null;

      if (voucher.scope === VoucherScopeEnum.CATEGORIES) {
        voucherGrantItem.categories =
          categoryLinksByVoucherId.get(voucher.id) ?? [];
        groupedGrants.categories.push(voucherGrantItem);
        continue;
      }
      if (voucher.scope === VoucherScopeEnum.PRODUCTS) {
        voucherGrantItem.products =
          productLinksByVoucherId.get(voucher.id) ?? [];
        groupedGrants.products.push(voucherGrantItem);
        continue;
      }
      groupedGrants.global.push(voucherGrantItem);
    }
    return groupedGrants;
  }
  /**
   * Resolve membership period end date.
   */
  private calculateMembershipEndDate(params: {
    startsAt: Date;
    durationInDays: number;
  }): Date {
    const endsAt: Date = new Date(params.startsAt);
    endsAt.setDate(endsAt.getDate() + params.durationInDays);
    return endsAt;
  }

  /**
   * Compute the post-expiry grace deadline.
   *
   * `grace_ends_at = ends_at + grace_period` where grace_period is read from
   * the `parameter` table (configurable in admin Membership Settings).
   * Falls back to 7 days if the parameter row is missing.
   */
  private async calculateGraceEndDate(endsAt: Date): Promise<Date> {
    const gracePeriodParam =
      await this.parametersService.findByCode('grace_period');
    const gracePeriodDays: number = Math.round(Number(gracePeriodParam?.numeric_value ?? 7));
    const graceEndsAt: Date = new Date(endsAt);
    graceEndsAt.setDate(graceEndsAt.getDate() + gracePeriodDays);
    return graceEndsAt;
  }

  /**
   * Resolve the date from which to anchor a renewal period.
   *
   * - ACTIVE: always start from today — renewal extends from now, not from
   *   the remaining period end date.
   * - GRACE_PERIOD (within grace): anchor on `ends_at`, NOT now. Prevents
   *   users from gaining free days by intentionally lapsing into grace.
   * - Fully lapsed (past grace or no ends_at): start fresh from now.
   */
  private resolveRenewalAnchor(membership: Membership, now: Date): Date {
    const graceEndsAt: Date | null = membership.grace_ends_at ?? null;
    const isInGrace: boolean =
      membership.status === MembershipStatusEnum.GRACE_PERIOD &&
      graceEndsAt !== null &&
      graceEndsAt > now;
    return isInGrace ? (membership.ends_at as Date) : now;
  }
  /**
   * Create activation voucher grants idempotently.
   * For each configured voucher, grants (config.quantity × billing_duration_months)
   * individual rows — one membership_voucher_grant + one user_voucher per instance.
   */
  /**
   * Update a membership_payment row using the given transactional manager, preserving
   * the same mapper-based merge behavior as the base repository.
   */
  private async updateMembershipPaymentInTransaction(
    manager: EntityManager,
    id: number,
    payload: Partial<MembershipPayment>,
  ): Promise<MembershipPayment> {
    const repo = manager.getRepository(MembershipPaymentEntity);
    const entity = await repo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('Membership payment does not exist.');
    }
    const updateData = MembershipPaymentMapper.toPersistence({
      ...MembershipPaymentMapper.toDomain(entity),
      ...payload,
    } as MembershipPayment);
    const saved = await repo.save(repo.create(updateData));
    return MembershipPaymentMapper.toDomain(saved);
  }

  /**
   * Update a membership row using the given transactional manager, preserving
   * the same mapper-based merge behavior as the base repository.
   */
  private async updateMembershipInTransaction(
    manager: EntityManager,
    id: number,
    payload: Partial<Membership>,
  ): Promise<Membership> {
    const repo = manager.getRepository(MembershipEntity);
    const entity = await repo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('Membership does not exist.');
    }
    const updateData = MembershipMapper.toPersistence({
      ...MembershipMapper.toDomain(entity),
      ...payload,
    } as Membership);
    const saved = await repo.save(repo.create(updateData));
    return MembershipMapper.toDomain(saved);
  }

  private async createActivationVoucherGrants(
    params: {
      membership: Membership;
      payment: MembershipPayment;
      causer: User;
      isRenewal: boolean;
      membershipEndsAt: Date;
    },
    manager?: EntityManager,
  ): Promise<MembershipVoucherGrant[]> {
    const voucherGrants: MembershipVoucherGrant[] = [];
    const configurationsResult =
      await this.membershipVoucherConfigurationRepository.findAll({
        membership_plan_id: params.payment.membership_plan_id,
        is_active: true,
        skip: 0,
        take: 500,
      });
    const configurations: MembershipVoucherConfiguration[] =
      configurationsResult.data;
    const durationInMonths: number = params.payment.billing_duration_months;

    const userVoucherRepo = manager
      ? manager.getRepository(UserVoucherEntity)
      : this.userVoucherRepository;
    const grantRepo = manager
      ? manager.getRepository(MembershipVoucherGrantEntity)
      : null;

    // On renewal, expire any leftover AVAILABLE user_vouchers from the previous
    // term so they don't accumulate unboundedly across renewals.
    if (params.isRenewal) {
      const voucherIdsToGrant: number[] = configurations
        .filter((c) => c.voucher_id != null)
        .map((c) => c.voucher_id as number);
      if (voucherIdsToGrant.length > 0) {
        await userVoucherRepo
          .createQueryBuilder()
          .update(UserVoucherEntity)
          .set({
            status: UserVoucherStatusEnum.EXPIRED,
            expired_at: new Date(),
          })
          .where('user_id = :userId', { userId: params.membership.user_id })
          .andWhere('voucher_id IN (:...voucherIds)', {
            voucherIds: voucherIdsToGrant,
          })
          .andWhere('status = :status', {
            status: UserVoucherStatusEnum.AVAILABLE,
          })
          .execute();
      }
    }

    for (const configuration of configurations) {
      const voucherCode: string | null = configuration.voucher_code ?? null;
      if (!voucherCode) {
        continue;
      }
      const baseQuantity: number = this.resolveVoucherQuantity(
        configuration.quantity,
      );
      const totalQuantity: number = baseQuantity * durationInMonths;
      for (let i = 0; i < totalQuantity; i++) {
        const grantPayload = {
          membership_id: params.membership.id,
          user_id: params.membership.user_id,
          membership_payment_id: params.payment.id,
          voucher_id: configuration.voucher_id,
          voucher_code: voucherCode,
          created_by: params.causer,
          updated_by: params.causer,
        };
        let createdGrant: MembershipVoucherGrant;
        if (grantRepo) {
          const persistence =
            MembershipVoucherGrantMapper.toPersistence(grantPayload);
          const saved = await grantRepo.save(grantRepo.create(persistence));
          createdGrant = MembershipVoucherGrantMapper.toDomain(saved);
        } else {
          createdGrant =
            await this.membershipVoucherGrantRepository.create(grantPayload);
        }
        voucherGrants.push(createdGrant);
      }
      await this.createUserVouchers(
        {
          userId: params.membership.user_id,
          voucherId: configuration.voucher_id,
          quantity: totalQuantity,
          expiresAt: params.membershipEndsAt,
        },
        manager,
      );
    }
    return voucherGrants;
  }
  /**
   * Create exactly `quantity` new user_voucher rows for the given user and voucher.
   * Each row represents one redeemable instance granted by a membership activation.
   */
  private async createUserVouchers(
    params: {
      userId: number;
      voucherId: number;
      quantity: number;
      expiresAt?: Date;
    },
    manager?: EntityManager,
  ): Promise<void> {
    const userVoucherRepo = manager
      ? manager.getRepository(UserVoucherEntity)
      : this.userVoucherRepository;
    for (let i: number = 0; i < params.quantity; i += 1) {
      const userVoucher: UserVoucherEntity = userVoucherRepo.create({
        user_id: params.userId,
        voucher_id: params.voucherId,
        status: UserVoucherStatusEnum.AVAILABLE,
        expires_at: params.expiresAt ?? null,
      });
      await userVoucherRepo.save(userVoucher);
    }
  }
  /**
   * Resolve voucher quantity to safe positive integer.
   */
  private resolveVoucherQuantity(quantity: number | null | undefined): number {
    if (!quantity || quantity < 1) {
      return 1;
    }
    return Math.floor(quantity);
  }
  /**
   * Find payment by identifier.
   */
  private async findPaymentById(id: number): Promise<MembershipPayment> {
    const payment: MembershipPayment | null =
      await this.membershipPaymentRepository.findById(id);
    if (!payment) {
      throw new NotFoundException('Membership payment does not exist.');
    }
    return payment;
  }

  /**
   * Find payment by provider reference (DragonPay transaction ID).
   */
  private async findPaymentByProviderReference(
    providerReference: string,
  ): Promise<MembershipPayment> {
    const payment: MembershipPayment | null =
      await this.membershipPaymentRepository.findByProviderReference(
        providerReference,
      );
    if (!payment) {
      throw new NotFoundException(
        'Membership payment with this transaction ID does not exist.',
      );
    }
    return payment;
  }

  private async findActiveMembershipPlanById(
    membershipPlanId: number,
  ): Promise<MembershipPlanEntity> {
    const membershipPlan: MembershipPlanEntity | null =
      await this.membershipPlanEntityRepository.findOne({
        where: { id: membershipPlanId, is_active: true },
      });
    if (!membershipPlan) {
      throw new BadRequestException('Membership plan does not exist.');
    }
    return membershipPlan;
  }

  private generateMockTransactionNumber(): string {
    const randomToken: string = Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase();
    return `MOCK-MEM-${randomToken}`;
  }

  /**
   * Admin: confirm a pending QR payment and activate the membership.
   */
  async adminConfirmMembershipPayment(
    paymentId: number,
    causer: User,
  ): Promise<{ membership_payment_id: number; message: string }> {
    const payment: MembershipPayment = await this.findPaymentById(paymentId);
    if (payment.payment_status === MembershipPaymentStatusEnum.PAID) {
      throw new BadRequestException('Payment is already confirmed.');
    }
    if (
      payment.payment_status !== MembershipPaymentStatusEnum.PENDING &&
      payment.payment_status !==
        MembershipPaymentStatusEnum.AWAITING_CONFIRMATION
    ) {
      throw new BadRequestException(
        'Payment cannot be confirmed in its current state.',
      );
    }

    // Read & compute period before opening the transaction (no writes yet).
    const membership: Membership = await this.findById(payment.membership_id);
    const now: Date = new Date();
    // Anchor renewal on `ends_at` for ACTIVE (stack) and GRACE_PERIOD
    // (anti-abuse). Fully-lapsed users start fresh from `now`.
    const renewalStartAt: Date = this.resolveRenewalAnchor(membership, now);
    const durationInDays: number = payment.billing_duration_months * 30;
    const endsAt: Date = this.calculateMembershipEndDate({
      startsAt: renewalStartAt,
      durationInDays,
    });
    const graceEndsAt: Date = await this.calculateGraceEndDate(endsAt);
    await this.ensureCustomerGroupAssignment(membership.user_id, causer);
    await this.dataSource.transaction(async (manager) => {
      // Step 1: mark payment as PAID
      await this.updateMembershipPaymentInTransaction(manager, paymentId, {
        payment_status: MembershipPaymentStatusEnum.PAID,
        paid_at: new Date(),
        updated_by: causer,
      });
      // Step 2: activate the membership
      await this.updateMembershipInTransaction(manager, membership.id, {
        status: MembershipStatusEnum.ACTIVE,
        membership_plan_id: payment.membership_plan_id,
        membership_plan_billing_period_id:
          payment.membership_plan_billing_period_id,
        // Always preserve the original starts_at ("member since" date).
        // Only set it if this is the very first activation (starts_at is null).
        starts_at: membership.starts_at ?? renewalStartAt,
        ends_at: endsAt,
        grace_ends_at: graceEndsAt,
        cancelled_at: null,
        updated_by: causer,
      });
      // Step 3: grant vouchers (grants + user_vouchers) — all on the same tx
      await this.createActivationVoucherGrants(
        {
          membership,
          payment: {
            ...payment,
            payment_status: MembershipPaymentStatusEnum.PAID,
          },
          causer,
          isRenewal: membership.starts_at !== null,
          membershipEndsAt: graceEndsAt,
        },
        manager,
      );
    });

    // Notify member that membership payment is confirmed (non-blocking)
    this.userEntityRepository
      .findOne({ where: { id: payment.user_id } })
      .then((memberUser) => {
        if (!memberUser) return;
        return this.notificationsService.sendMembershipPaymentConfirmed(
          memberUser.id,
          membership.id,
          Number(payment.amount),
          true,
          memberUser.email ?? undefined,
          `${memberUser.first_name} ${memberUser.last_name}`,
          membership.starts_at !== null,
        );
      })
      .catch(() => {});

    return {
      membership_payment_id: paymentId,
      message: 'Payment confirmed and membership activated.',
    };
  }

  /**
   * Admin: void a pending payment (membership was cancelled before payment was confirmed).
   */
  async adminVoidMembershipPayment(
    paymentId: number,
    causer: User,
  ): Promise<{ membership_payment_id: number; message: string }> {
    const payment: MembershipPayment = await this.findPaymentById(paymentId);
    if (payment.payment_status === MembershipPaymentStatusEnum.CANCELLED) {
      throw new BadRequestException('Payment is already voided.');
    }
    if (payment.payment_status === MembershipPaymentStatusEnum.PAID) {
      throw new BadRequestException(
        'Cannot void a payment that has already been confirmed. Use refund instead.',
      );
    }
    await this.membershipPaymentRepository.update(paymentId, {
      payment_status: MembershipPaymentStatusEnum.CANCELLED,
      updated_by: causer,
    });

    // If the membership was downgraded to PENDING by the renewal proof submission
    // bug, restore it to ACTIVE provided it still has a valid period and no other
    // open (PENDING / AWAITING_CONFIRMATION) payments remain.
    const membership: Membership = await this.findById(payment.membership_id);
    if (membership.status === MembershipStatusEnum.PENDING) {
      const now = new Date();
      const stillValid =
        membership.ends_at !== null && membership.ends_at > now;
      const allPayments =
        await this.membershipPaymentRepository.findByMembershipId(
          membership.id,
        );
      const hasOpenPayment = allPayments.some(
        (p) =>
          p.id !== paymentId &&
          (p.payment_status === MembershipPaymentStatusEnum.PENDING ||
            p.payment_status ===
              MembershipPaymentStatusEnum.AWAITING_CONFIRMATION),
      );
      if (stillValid && !hasOpenPayment) {
        await this.membershipRepository.update(membership.id, {
          status: MembershipStatusEnum.ACTIVE,
          updated_by: causer,
        });
      }
    }

    // Notify member that membership payment was rejected/voided (non-blocking)
    this.userEntityRepository
      .findOne({ where: { id: payment.user_id } })
      .then((memberUser) => {
        if (!memberUser) return;
        return this.notificationsService.sendMembershipPaymentVoided(
          memberUser.id,
          payment.membership_id,
          Number(payment.amount),
          undefined,
          true,
          memberUser.email ?? undefined,
          `${memberUser.first_name} ${memberUser.last_name}`,
        );
      })
      .catch(() => {});

    return {
      membership_payment_id: paymentId,
      message: 'Payment voided.',
    };
  }

  /**
   * Get membership payment page data (QR image, expiry, proof, status).
   */
  async getMembershipPaymentPage(
    paymentId: number,
    user: User,
  ): Promise<MembershipPaymentPageResponseDto> {
    const payment: MembershipPayment = await this.findPaymentById(paymentId);
    if (payment.user_id !== user.id) {
      throw new NotFoundException('Membership payment does not exist.');
    }
    const response: MembershipPaymentPageResponseDto =
      new MembershipPaymentPageResponseDto();
    response.membership_payment_id = payment.id;
    response.plan_name = payment.membership_plan_name;
    response.amount = Number(payment.amount);
    response.currency = payment.currency;
    response.payment_method_code = payment.payment_method_code ?? '';
    response.qr_image_url = await this.resolveQrImageUrl(
      payment.payment_method_code ?? null,
    );
    response.payment_expires_at = payment.expires_at
      ? new Date(payment.expires_at).toISOString()
      : null;
    response.payment_proof_url = payment.payment_proof_url ?? null;
    response.billing_duration_months = payment.billing_duration_months;
    response.ui_status = await this.resolveMembershipPaymentUiStatus(payment);
    return response;
  }

  /**
   * Poll membership payment status.
   */
  async getMembershipPaymentStatus(
    paymentId: number,
    user: User,
  ): Promise<MembershipPaymentStatusResponseDto> {
    const payment: MembershipPayment = await this.findPaymentById(paymentId);
    if (payment.user_id !== user.id) {
      throw new NotFoundException('Membership payment does not exist.');
    }
    const response: MembershipPaymentStatusResponseDto =
      new MembershipPaymentStatusResponseDto();
    response.membership_payment_id = payment.id;
    response.ui_status = await this.resolveMembershipPaymentUiStatus(payment);
    response.payment_expires_at = payment.expires_at
      ? new Date(payment.expires_at).toISOString()
      : null;
    response.payment_proof_url = payment.payment_proof_url ?? null;
    return response;
  }

  /**
   * Submit payment proof — creates membership + payment record in one shot as AWAITING_CONFIRMATION.
   * No DB records exist before this is called; the QR page is purely informational.
   */
  async submitMembershipPayment(
    input: SubmitMembershipPaymentDto,
    causer: User,
    proofFile?: Express.Multer.File,
  ): Promise<MembershipPaymentStatusResponseDto> {
    const membershipPlan = await this.findActiveMembershipPlanById(
      input.membership_plan_id,
    );
    const planBillingPeriod = await this.findActivePlanBillingPeriod(
      input.membership_plan_billing_period_id,
    );
    const billingPeriod = planBillingPeriod.billing_period;
    const durationMonths: number = billingPeriod.duration_in_months;
    const discountPercentage: number = Number(
      planBillingPeriod.discount_percentage,
    );
    const membershipAmount: number = Number(planBillingPeriod.total_price);
    const baseMonthlyPrice: number = membershipAmount / durationMonths;

    // Upsert membership row — reuse existing or create new
    const existingMembership: Membership | null =
      await this.membershipRepository.findLatestByUserId(causer.id);

    // If the membership was cancelled but is still within its valid period,
    // preserve starts_at/ends_at so access continues until the original end date.
    // GRACE_PERIOD is also treated as "within period" so the renewal anchor
    // can resolve to the original ends_at and the user doesn't gain free days.
    const now = new Date();
    const stillWithinPeriod =
      existingMembership?.starts_at &&
      existingMembership?.ends_at &&
      (existingMembership.ends_at > now ||
        existingMembership.status === MembershipStatusEnum.GRACE_PERIOD);

    // Members within a valid period (ACTIVE or GRACE_PERIOD) submitting
    // renewal proof must preserve their current status — downgrading to
    // PENDING would revoke access while admin reviews the payment.
    // For ACTIVE members: keep ACTIVE.
    // For GRACE_PERIOD members: keep GRACE_PERIOD (their grace continues
    // until the admin confirms the renewal, then activateMembership
    // flips them back to ACTIVE).
    const isInValidPeriod: boolean =
      existingMembership?.status === MembershipStatusEnum.ACTIVE ||
      existingMembership?.status === MembershipStatusEnum.GRACE_PERIOD;

    const membership: Membership = existingMembership
      ? await this.membershipRepository.update(existingMembership.id, {
          membership_plan_id: membershipPlan.id,
          membership_plan_billing_period_id: planBillingPeriod.id,
          status: isInValidPeriod
            ? existingMembership.status
            : MembershipStatusEnum.PENDING,
          starts_at: stillWithinPeriod ? existingMembership.starts_at : null,
          ends_at: stillWithinPeriod ? existingMembership.ends_at : null,
          grace_ends_at: stillWithinPeriod
            ? existingMembership.grace_ends_at
            : null,
          is_auto_renew_enabled: input.is_auto_renew_enabled ?? true,
          cancelled_at: null,
          updated_by: causer,
        })
      : await this.membershipRepository.create({
          user_id: causer.id,
          membership_plan_id: membershipPlan.id,
          membership_plan_billing_period_id: planBillingPeriod.id,
          status: MembershipStatusEnum.PENDING,
          starts_at: null,
          ends_at: null,
          grace_ends_at: null,
          is_auto_renew_enabled: input.is_auto_renew_enabled ?? true,
          cancelled_at: null,
          created_by: causer,
          updated_by: causer,
        });

    // Upload proof if provided
    let proofUrl: string | null = null;
    let proofKey: string | null = null;
    if (proofFile) {
      const uploaded = await this.storageService.put(
        proofFile,
        `membership-payment-proofs/${membership.id}-${Date.now()}-${proofFile.originalname}`,
      );
      proofUrl = uploaded.url;
      proofKey = uploaded.key;
    }

    const transactionNumber: string = this.generateMockTransactionNumber();
    const payment: MembershipPayment =
      await this.membershipPaymentRepository.create({
        membership_id: membership.id,
        user_id: causer.id,
        membership_plan_billing_period_id: planBillingPeriod.id,
        membership_plan_id: membershipPlan.id,
        membership_plan_code: membershipPlan.plan_code,
        membership_plan_name: membershipPlan.plan_name,
        billing_period_code: billingPeriod.period_code,
        billing_duration_months: durationMonths,
        base_monthly_price: baseMonthlyPrice,
        discount_percentage: discountPercentage,
        amount: membershipAmount,
        currency: MEMBERSHIP_PAYMENT_CURRENCY,
        payment_status: MembershipPaymentStatusEnum.AWAITING_CONFIRMATION,
        payment_method_code: input.payment_method_code,
        provider: null,
        provider_reference: input.payment_reference ?? transactionNumber,
        payment_proof_url: proofUrl,
        payment_proof_key: proofKey,
        paid_at: null,
        created_by: causer,
        updated_by: causer,
      });

    const response = new MembershipPaymentStatusResponseDto();
    response.membership_payment_id = payment.id;
    response.ui_status = 'awaiting_confirmation';
    response.payment_expires_at = null;
    response.payment_proof_url = proofUrl;

    // Notify user that payment was submitted and is awaiting confirmation (non-blocking)
    this.notificationsService
      .sendMembershipPaymentSubmitted(
        causer.id,
        payment.membership_id,
        Number(payment.amount),
        true,
        causer.email ?? undefined,
        `${causer.first_name} ${causer.last_name}`,
      )
      .catch(() => {});

    // Notify admin of new membership payment submission (non-blocking)
    this.notificationsService
      .sendMembershipPaymentSubmittedAdmin(
        payment.membership_id,
        causer.first_name ?? '',
        causer.last_name ?? '',
        Number(payment.amount),
      )
      .catch(() => {});

    return response;
  }

  /**
   * Notify that payment proof has been uploaded (transitions to awaiting_confirmation).
   */
  async notifyMembershipPayment(
    paymentId: number,
    user: User,
    dto: NotifyMembershipPaymentDto,
    proofFile?: Express.Multer.File,
  ): Promise<MembershipPaymentStatusResponseDto> {
    const payment: MembershipPayment = await this.findPaymentById(paymentId);
    if (payment.user_id !== user.id) {
      throw new NotFoundException('Membership payment does not exist.');
    }
    if (payment.payment_status !== MembershipPaymentStatusEnum.PENDING) {
      throw new BadRequestException('Payment is not in a pending state.');
    }

    let proofUrl: string | null = payment.payment_proof_url ?? null;
    let proofKey: string | null = payment.payment_proof_key ?? null;

    if (proofFile) {
      const uploaded = await this.storageService.put(
        proofFile,
        `membership-payment-proofs/${paymentId}-${Date.now()}-${proofFile.originalname}`,
      );
      proofUrl = uploaded.url;
      proofKey = uploaded.key;
    }

    const updated: MembershipPayment =
      await this.membershipPaymentRepository.update(paymentId, {
        payment_proof_url: proofUrl,
        payment_proof_key: proofKey,
        payment_status: MembershipPaymentStatusEnum.AWAITING_CONFIRMATION,
        provider_reference: dto.payment_reference ?? payment.provider_reference,
        updated_by: user,
      });

    const response: MembershipPaymentStatusResponseDto =
      new MembershipPaymentStatusResponseDto();
    response.membership_payment_id = updated.id;
    response.ui_status = await this.resolveMembershipPaymentUiStatus(updated);
    response.payment_expires_at = updated.expires_at
      ? new Date(updated.expires_at).toISOString()
      : null;
    response.payment_proof_url = updated.payment_proof_url ?? null;

    // Notify user that payment proof was submitted and is awaiting confirmation (non-blocking)
    this.notificationsService
      .sendMembershipPaymentSubmitted(
        user.id,
        updated.membership_id,
        Number(updated.amount),
        true,
        user.email ?? undefined,
        `${user.first_name} ${user.last_name}`,
      )
      .catch(() => {});

    // Notify admin of new membership payment proof submission (non-blocking)
    this.notificationsService
      .sendMembershipPaymentSubmittedAdmin(
        updated.membership_id,
        user.first_name ?? '',
        user.last_name ?? '',
        Number(updated.amount),
      )
      .catch(() => {});

    return response;
  }

  /**
   * Resolve QR image URL for QR manual payment methods from parameters table.
   */
  private async resolveQrImageUrl(
    paymentMethodCode: string | null,
  ): Promise<string | null> {
    if (!paymentMethodCode) return null;
    const code = paymentMethodCode.toLowerCase().trim();
    if (code.startsWith('custom-')) {
      const id = parseInt(code.slice('custom-'.length), 10);
      if (isNaN(id)) return null;
      const method = await this.customPaymentMethodRepository.findById(id);
      return method?.qr_image_url ?? null;
    }
    const method =
      (await this.customPaymentMethodRepository.findByCode(code)) ??
      (await this.customPaymentMethodRepository.findByCode(
        code.replace(/_qr$/, ''),
      ));
    return method?.qr_image_url ?? null;
  }

  /**
   * Derive UI status from payment + membership state.
   * - Membership CANCELLED → cancelled
   * - PENDING + no proof → pending_payment
   * - PENDING + proof uploaded → awaiting_confirmation
   * - PAID → confirmed
   * - FAILED / CANCELLED → cancelled
   */
  private async resolveMembershipPaymentUiStatus(
    payment: MembershipPayment,
  ): Promise<string> {
    const membership: Membership | null =
      await this.membershipRepository.findById(payment.membership_id);
    if (membership?.status === MembershipStatusEnum.CANCELLED) {
      return 'cancelled';
    }
    if (payment.payment_status === MembershipPaymentStatusEnum.PAID) {
      return 'confirmed';
    }
    if (
      payment.payment_status === MembershipPaymentStatusEnum.FAILED ||
      payment.payment_status === MembershipPaymentStatusEnum.CANCELLED
    ) {
      return 'cancelled';
    }
    if (
      payment.payment_status ===
        MembershipPaymentStatusEnum.AWAITING_CONFIRMATION ||
      payment.payment_proof_url
    ) {
      return 'awaiting_confirmation';
    }
    return 'pending_payment';
  }
}
