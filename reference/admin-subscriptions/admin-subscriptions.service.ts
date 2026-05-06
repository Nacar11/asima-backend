import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { BaseSubscriptionRepository } from '@/subscriptions/persistence/base-subscription.repository';
import { BaseSubscriptionPlanRepository } from '@/subscription-plans/persistence/base-subscription-plan.repository';
import { SubscriptionOperationRepository } from '@/admin-subscriptions/persistence/repositories/subscription-operation.repository';
import { SubscriptionAnalyticsService } from '@/admin-subscriptions/services/subscription-analytics.service';
import { SubscriptionOperationsService } from '@/admin-subscriptions/services/subscription-operations.service';
import { SubscriptionOverview } from '@/admin-subscriptions/domain/subscription-overview';
import { SubscriptionOperation } from '@/admin-subscriptions/domain/subscription-operation';
import { UpcomingRenewal } from '@/admin-subscriptions/domain/upcoming-renewal';
import { FailedPayment } from '@/admin-subscriptions/domain/failed-payment';
import { QuickStats } from '@/admin-subscriptions/domain/quick-stats';
import { Subscription } from '@/subscriptions/domain/subscription';
import { ManualRenewalDto } from '@/admin-subscriptions/dto/manual-renewal.dto';
import { ExtendSubscriptionDto } from '@/admin-subscriptions/dto/extend-subscription.dto';
import { RetryPaymentDto } from '@/admin-subscriptions/dto/retry-payment.dto';
import { BulkActionDto } from '@/admin-subscriptions/dto/bulk-action.dto';
import { AdminCreateSubscriptionDto } from '@/admin-subscriptions/dto/admin-create-subscription.dto';
import { AdminBulkCreateSubscriptionDto } from '@/admin-subscriptions/dto/admin-bulk-create-subscription.dto';
import { QueryOperationsDto } from '@/admin-subscriptions/dto/query-operations.dto';
import { QueryAnalyticsDto } from '@/admin-subscriptions/dto/query-analytics.dto';
import { QueryUpcomingRenewalsDto } from '@/admin-subscriptions/dto/query-upcoming-renewals.dto';
import { QueryFailedPaymentsDto } from '@/admin-subscriptions/dto/query-failed-payments.dto';
import { UpgradePlanDto } from '@/admin-subscriptions/dto/upgrade-plan.dto';
import { User } from '@/users/domain/user';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { SubscriptionOperationTypeEnum } from '@/admin-subscriptions/enums/subscription-operation-type.enum';
import { SubscriptionStatusEnum } from '@/subscriptions/enums/subscription-status.enum';
import { BillingCycleEnum } from '@/subscription-plans/enums/billing-cycle.enum';

/**
 * Admin Subscriptions Service.
 *
 * Main service for admin subscription management operations.
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class AdminSubscriptionsService {
  constructor(
    private readonly subscriptionRepository: BaseSubscriptionRepository,
    private readonly subscriptionPlanRepository: BaseSubscriptionPlanRepository,
    private readonly operationRepository: SubscriptionOperationRepository,
    private readonly analyticsService: SubscriptionAnalyticsService,
    private readonly operationsService: SubscriptionOperationsService,
  ) {}

  /**
   * Generate subscription number.
   */
  private generateSubscriptionNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `SUB-${timestamp}-${random}`;
  }

  /**
   * Calculate end date based on billing cycle.
   */
  private calculateEndDate(
    startDate: Date,
    billingCycle: BillingCycleEnum,
  ): Date {
    const endDate = new Date(startDate);
    switch (billingCycle) {
      case BillingCycleEnum.MONTHLY:
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case BillingCycleEnum.QUARTERLY:
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case BillingCycleEnum.YEARLY:
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
    }
    return endDate;
  }

  /**
   * Get subscription by user ID.
   */
  async getSubscriptionByUserId(userId: number): Promise<Subscription | null> {
    return this.subscriptionRepository.findActiveByUserId(userId);
  }

  /**
   * Get all subscriptions by user ID.
   */
  async getSubscriptionsByUserId(userId: number): Promise<Subscription[]> {
    return this.subscriptionRepository.findByUserId(userId);
  }

  /**
   * Create subscription for a specific user (admin).
   */
  async createSubscriptionForUser(
    dto: AdminCreateSubscriptionDto,
    causer: User,
  ): Promise<Subscription> {
    // Check if user already has an active subscription
    const existingSubscription =
      await this.subscriptionRepository.findActiveByUserId(dto.user_id);
    if (existingSubscription) {
      throw new BadRequestException(
        'User already has an active subscription. Please cancel the current subscription first.',
      );
    }

    // Validate plan exists and is active
    const plan = await this.subscriptionPlanRepository.findById(dto.plan_id);
    if (!plan) {
      throw new NotFoundException('Subscription plan not found!');
    }
    if (plan.status !== 'active') {
      throw new BadRequestException('Subscription plan is not available!');
    }

    const startDate = new Date();
    const endDate = this.calculateEndDate(startDate, plan.billing_cycle);
    const nextBillingDate = new Date(endDate);

    // Determine status based on skip_payment flag
    const status =
      dto.skip_payment !== false
        ? SubscriptionStatusEnum.ACTIVE
        : SubscriptionStatusEnum.PENDING_PAYMENT;

    return this.subscriptionRepository.create({
      user_id: dto.user_id,
      plan_id: dto.plan_id,
      subscription_number: this.generateSubscriptionNumber(),
      status,
      start_date: startDate,
      end_date: endDate,
      next_billing_date: nextBillingDate,
      auto_renew: dto.auto_renew ?? true,
      created_by: causer,
      updated_by: causer,
    });
  }

  /**
   * Bulk create subscriptions for multiple users (admin).
   */
  async bulkCreateSubscriptions(
    dto: AdminBulkCreateSubscriptionDto,
    causer: User,
  ): Promise<{
    success: Subscription[];
    failed: { user_id: number; error: string }[];
  }> {
    // Validate plan exists and is active
    const plan = await this.subscriptionPlanRepository.findById(dto.plan_id);
    if (!plan) {
      throw new NotFoundException('Subscription plan not found!');
    }
    if (plan.status !== 'active') {
      throw new BadRequestException('Subscription plan is not available!');
    }

    const success: Subscription[] = [];
    const failed: { user_id: number; error: string }[] = [];

    for (const userId of dto.user_ids) {
      try {
        const subscription = await this.createSubscriptionForUser(
          {
            user_id: userId,
            plan_id: dto.plan_id,
            auto_renew: dto.auto_renew,
            skip_payment: dto.skip_payment,
          },
          causer,
        );
        success.push(subscription);
      } catch (error) {
        failed.push({
          user_id: userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { success, failed };
  }

  /**
   * Get subscription overview.
   */
  async getOverview(): Promise<SubscriptionOverview> {
    return this.analyticsService.getOverview();
  }

  /**
   * Get subscription analytics.
   */
  async getAnalytics(dto: QueryAnalyticsDto) {
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (dto.start_date) {
      // Parse date string and set to start of day in UTC
      const [year, month, day] = dto.start_date.split('-').map(Number);
      startDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    }

    if (dto.end_date) {
      // Parse date string and set to end of day in UTC to include all subscriptions created on that day
      const [year, month, day] = dto.end_date.split('-').map(Number);
      endDate = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
    }

    return this.analyticsService.getAnalytics(startDate, endDate);
  }

  /**
   * Get upcoming renewals list.
   */
  async getUpcomingRenewals(
    dto: QueryUpcomingRenewalsDto,
  ): Promise<IPaginatedResult<UpcomingRenewal>> {
    return this.analyticsService.getUpcomingRenewalsList(
      dto.days || 7,
      dto.page || 1,
      dto.limit || 20,
    );
  }

  /**
   * Get failed payments list.
   */
  async getFailedPayments(
    dto: QueryFailedPaymentsDto,
  ): Promise<IPaginatedResult<FailedPayment>> {
    return this.analyticsService.getFailedPaymentsList(
      dto.page || 1,
      dto.limit || 20,
    );
  }

  /**
   * Get quick stats.
   */
  async getQuickStats(): Promise<QuickStats> {
    return this.analyticsService.getQuickStats();
  }

  /**
   * Get operations log.
   */
  async getOperationsLog(
    dto: QueryOperationsDto,
  ): Promise<IPaginatedResult<SubscriptionOperation>> {
    const paginationOptions = {
      page: dto.page || 1,
      limit: dto.limit || 20,
    };

    const filterQuery: {
      subscriptionId?: number;
      operationType?: SubscriptionOperationTypeEnum;
    } = {};

    if (dto.subscription_id) {
      filterQuery.subscriptionId = dto.subscription_id;
    }

    if (dto.operation_type) {
      filterQuery.operationType = dto.operation_type;
    }

    return this.operationRepository.findAll({
      filterQuery,
      paginationOptions,
    });
  }

  /**
   * Manual renewal.
   */
  async manualRenewal(
    subscriptionId: number,
    dto: ManualRenewalDto,
    user: User,
  ): Promise<Subscription> {
    return this.operationsService.manualRenewal(
      subscriptionId,
      dto.reason,
      user,
    );
  }

  /**
   * Extend subscription.
   */
  async extendSubscription(
    subscriptionId: number,
    dto: ExtendSubscriptionDto,
    user: User,
  ): Promise<Subscription> {
    return this.operationsService.extendSubscription(
      subscriptionId,
      dto.days,
      dto.reason,
      user,
    );
  }

  /**
   * Retry payment.
   */
  async retryPayment(
    subscriptionId: number,
    dto: RetryPaymentDto,
    user: User,
  ): Promise<Subscription> {
    return this.operationsService.retryPayment(
      subscriptionId,
      dto.reason,
      user,
    );
  }

  /**
   * Pause subscription.
   */
  async pauseSubscription(
    subscriptionId: number,
    reason: string | undefined,
    user: User,
  ): Promise<Subscription> {
    return this.operationsService.pauseSubscription(
      subscriptionId,
      reason,
      user,
    );
  }

  /**
   * Cancel subscription.
   */
  async cancelSubscription(
    subscriptionId: number,
    reason: string | undefined,
    user: User,
  ): Promise<Subscription> {
    return this.operationsService.cancelSubscription(
      subscriptionId,
      reason,
      user,
    );
  }

  /**
   * Upgrade subscription plan.
   */
  async upgradePlan(
    subscriptionId: number,
    dto: UpgradePlanDto,
    user: User,
  ): Promise<Subscription> {
    return this.operationsService.upgradePlan(
      subscriptionId,
      dto.new_plan_id,
      dto.reason,
      dto.prorate ?? true,
      user,
    );
  }

  /**
   * Sync subscription billing.
   */
  async syncBilling(
    subscriptionId: number,
    reason: string | undefined,
    user: User,
  ): Promise<Subscription> {
    return this.operationsService.syncBilling(subscriptionId, reason, user);
  }

  /**
   * Bulk operations.
   */
  async bulkAction(dto: BulkActionDto, user: User): Promise<Subscription[]> {
    const results: Subscription[] = [];

    for (const subscriptionId of dto.subscription_ids) {
      try {
        let result: Subscription;

        switch (dto.operation_type) {
          case SubscriptionOperationTypeEnum.RENEW:
            result = await this.operationsService.manualRenewal(
              subscriptionId,
              dto.reason,
              user,
            );
            break;

          case SubscriptionOperationTypeEnum.EXTEND:
            if (!dto.metadata?.days) {
              throw new Error('Days required for extend operation');
            }
            result = await this.operationsService.extendSubscription(
              subscriptionId,
              dto.metadata.days,
              dto.reason,
              user,
            );
            break;

          case SubscriptionOperationTypeEnum.RETRY_PAYMENT:
            result = await this.operationsService.retryPayment(
              subscriptionId,
              dto.reason,
              user,
            );
            break;

          case SubscriptionOperationTypeEnum.PAUSE:
          case SubscriptionOperationTypeEnum.SUSPEND:
            result = await this.operationsService.pauseSubscription(
              subscriptionId,
              dto.reason,
              user,
            );
            break;

          case SubscriptionOperationTypeEnum.CANCEL:
            result = await this.operationsService.cancelSubscription(
              subscriptionId,
              dto.reason,
              user,
            );
            break;

          case SubscriptionOperationTypeEnum.UPGRADE_PLAN:
            if (!dto.metadata?.new_plan_id) {
              throw new Error('new_plan_id required for upgrade operation');
            }
            result = await this.operationsService.upgradePlan(
              subscriptionId,
              dto.metadata.new_plan_id,
              dto.reason,
              dto.metadata.prorate ?? true,
              user,
            );
            break;

          case SubscriptionOperationTypeEnum.SYNC_BILLING:
            result = await this.operationsService.syncBilling(
              subscriptionId,
              dto.reason,
              user,
            );
            break;

          default:
            throw new Error(
              `Unsupported bulk operation: ${dto.operation_type}`,
            );
        }

        results.push(result);
      } catch {
        // Skip items that fail (e.g., not found)
        continue;
      }
    }

    return results;
  }
}
