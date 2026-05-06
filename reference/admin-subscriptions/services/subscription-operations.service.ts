import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { BaseSubscriptionRepository } from '@/subscriptions/persistence/base-subscription.repository';
import { BaseSubscriptionPlanRepository } from '@/subscription-plans/persistence/base-subscription-plan.repository';
import { SubscriptionOperationRepository } from '@/admin-subscriptions/persistence/repositories/subscription-operation.repository';
import { Subscription } from '@/subscriptions/domain/subscription';
import { SubscriptionOperationTypeEnum } from '@/admin-subscriptions/enums/subscription-operation-type.enum';
import { SubscriptionStatusEnum } from '@/subscriptions/enums/subscription-status.enum';
import { User } from '@/users/domain/user';
import { BillingCycleEnum } from '@/subscription-plans/enums/billing-cycle.enum';

/**
 * Subscription Operations Service.
 *
 * Handles admin operations on subscriptions (renewal, extension, payment retry, etc.).
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class SubscriptionOperationsService {
  constructor(
    private readonly subscriptionRepository: BaseSubscriptionRepository,
    private readonly subscriptionPlanRepository: BaseSubscriptionPlanRepository,
    private readonly operationRepository: SubscriptionOperationRepository,
  ) {}

  /**
   * Manually renew a subscription.
   */
  async manualRenewal(
    subscriptionId: number,
    reason: string | undefined,
    user: User,
  ): Promise<Subscription> {
    const subscription =
      await this.subscriptionRepository.findById(subscriptionId);

    if (!subscription) {
      throw new NotFoundException(
        `Subscription with ID ${subscriptionId} not found`,
      );
    }

    if (!subscription.plan) {
      throw new BadRequestException('Subscription plan not found');
    }

    // Calculate new dates based on billing cycle
    const startDate = new Date();
    const endDate = this.calculateEndDate(
      startDate,
      subscription.plan.billing_cycle,
    );
    const nextBillingDate = new Date(endDate);

    // Update subscription
    const updatedSubscription = await this.subscriptionRepository.update(
      subscriptionId,
      {
        status: SubscriptionStatusEnum.ACTIVE,
        start_date: startDate,
        end_date: endDate,
        next_billing_date: nextBillingDate,
        updated_by: user,
      },
    );

    // Log operation
    await this.operationRepository.create({
      subscription_id: subscriptionId,
      operation_type: SubscriptionOperationTypeEnum.RENEW,
      performed_by: user.id,
      reason: reason || 'Manual renewal by admin',
      metadata: {
        previous_end_date: subscription.end_date,
        new_end_date: endDate,
        billing_cycle: subscription.plan.billing_cycle,
      },
    });

    return updatedSubscription;
  }

  /**
   * Extend a subscription.
   */
  async extendSubscription(
    subscriptionId: number,
    days: number,
    reason: string | undefined,
    user: User,
  ): Promise<Subscription> {
    const subscription =
      await this.subscriptionRepository.findById(subscriptionId);

    if (!subscription) {
      throw new NotFoundException(
        `Subscription with ID ${subscriptionId} not found`,
      );
    }

    const currentEndDate = subscription.end_date
      ? new Date(subscription.end_date)
      : new Date();
    const newEndDate = new Date(currentEndDate);
    newEndDate.setDate(newEndDate.getDate() + days);

    // Update subscription
    const updatedSubscription = await this.subscriptionRepository.update(
      subscriptionId,
      {
        end_date: newEndDate,
        next_billing_date: newEndDate,
        updated_by: user,
      },
    );

    // Log operation
    await this.operationRepository.create({
      subscription_id: subscriptionId,
      operation_type: SubscriptionOperationTypeEnum.EXTEND,
      performed_by: user.id,
      reason: reason || `Extended by ${days} days`,
      metadata: {
        days_extended: days,
        previous_end_date: currentEndDate,
        new_end_date: newEndDate,
      },
    });

    return updatedSubscription;
  }

  /**
   * Retry failed payment.
   */
  async retryPayment(
    subscriptionId: number,
    reason: string | undefined,
    user: User,
  ): Promise<Subscription> {
    const subscription =
      await this.subscriptionRepository.findById(subscriptionId);

    if (!subscription) {
      throw new NotFoundException(
        `Subscription with ID ${subscriptionId} not found`,
      );
    }

    if (subscription.status !== SubscriptionStatusEnum.PENDING_PAYMENT) {
      throw new BadRequestException(
        'Subscription is not in pending payment status',
      );
    }

    // Update subscription status to active (assuming payment will be processed)
    const updatedSubscription = await this.subscriptionRepository.update(
      subscriptionId,
      {
        status: SubscriptionStatusEnum.ACTIVE,
        updated_by: user,
      },
    );

    // Log operation
    await this.operationRepository.create({
      subscription_id: subscriptionId,
      operation_type: SubscriptionOperationTypeEnum.RETRY_PAYMENT,
      performed_by: user.id,
      reason: reason || 'Payment retry initiated by admin',
      metadata: {
        previous_status: SubscriptionStatusEnum.PENDING_PAYMENT,
        new_status: SubscriptionStatusEnum.ACTIVE,
      },
    });

    return updatedSubscription;
  }

  /**
   * Pause (suspend) a subscription.
   */
  async pauseSubscription(
    subscriptionId: number,
    reason: string | undefined,
    user: User,
  ): Promise<Subscription> {
    const subscription =
      await this.subscriptionRepository.findById(subscriptionId);

    if (!subscription) {
      throw new NotFoundException(
        `Subscription with ID ${subscriptionId} not found`,
      );
    }

    if (subscription.status !== SubscriptionStatusEnum.ACTIVE) {
      throw new BadRequestException('Only active subscriptions can be paused');
    }

    const updatedSubscription = await this.subscriptionRepository.update(
      subscriptionId,
      {
        status: SubscriptionStatusEnum.SUSPENDED,
        updated_by: user,
      },
    );

    await this.operationRepository.create({
      subscription_id: subscriptionId,
      operation_type: SubscriptionOperationTypeEnum.PAUSE,
      performed_by: user.id,
      reason: reason || 'Subscription paused by admin',
      metadata: {
        previous_status: subscription.status,
        new_status: SubscriptionStatusEnum.SUSPENDED,
      },
    });

    return updatedSubscription;
  }

  /**
   * Cancel a subscription.
   */
  async cancelSubscription(
    subscriptionId: number,
    reason: string | undefined,
    user: User,
  ): Promise<Subscription> {
    const subscription =
      await this.subscriptionRepository.findById(subscriptionId);

    if (!subscription) {
      throw new NotFoundException(
        `Subscription with ID ${subscriptionId} not found`,
      );
    }

    if (subscription.status === SubscriptionStatusEnum.CANCELLED) {
      throw new BadRequestException('Subscription is already cancelled');
    }

    const updatedSubscription = await this.subscriptionRepository.update(
      subscriptionId,
      {
        status: SubscriptionStatusEnum.CANCELLED,
        cancelled_at: new Date(),
        cancelled_by: user,
        cancellation_reason: reason || 'Cancelled by admin',
        auto_renew: false,
        updated_by: user,
      },
    );

    await this.operationRepository.create({
      subscription_id: subscriptionId,
      operation_type: SubscriptionOperationTypeEnum.CANCEL,
      performed_by: user.id,
      reason: reason || 'Subscription cancelled by admin',
      metadata: {
        previous_status: subscription.status,
        new_status: SubscriptionStatusEnum.CANCELLED,
      },
    });

    return updatedSubscription;
  }

  /**
   * Upgrade subscription to a new plan.
   */
  async upgradePlan(
    subscriptionId: number,
    newPlanId: number,
    reason: string | undefined,
    prorate: boolean = true,
    user: User,
  ): Promise<Subscription> {
    const subscription =
      await this.subscriptionRepository.findById(subscriptionId);

    if (!subscription) {
      throw new NotFoundException(
        `Subscription with ID ${subscriptionId} not found`,
      );
    }

    const newPlan = await this.subscriptionPlanRepository.findById(newPlanId);

    if (!newPlan) {
      throw new NotFoundException(`Plan with ID ${newPlanId} not found`);
    }

    if (newPlan.status !== 'active') {
      throw new BadRequestException('Target plan is not active');
    }

    const previousPlanId = subscription.plan_id;
    const previousPlanName = subscription.plan?.plan_name;

    const updatedSubscription = await this.subscriptionRepository.update(
      subscriptionId,
      {
        plan_id: newPlanId,
        updated_by: user,
      },
    );

    await this.operationRepository.create({
      subscription_id: subscriptionId,
      operation_type: SubscriptionOperationTypeEnum.UPGRADE_PLAN,
      performed_by: user.id,
      reason: reason || `Upgraded to ${newPlan.plan_name}`,
      metadata: {
        previous_plan_id: previousPlanId,
        previous_plan_name: previousPlanName,
        new_plan_id: newPlanId,
        new_plan_name: newPlan.plan_name,
        prorate,
      },
    });

    return updatedSubscription;
  }

  /**
   * Sync billing cycle for a subscription.
   */
  async syncBilling(
    subscriptionId: number,
    reason: string | undefined,
    user: User,
  ): Promise<Subscription> {
    const subscription =
      await this.subscriptionRepository.findById(subscriptionId);

    if (!subscription) {
      throw new NotFoundException(
        `Subscription with ID ${subscriptionId} not found`,
      );
    }

    if (!subscription.plan) {
      throw new BadRequestException('Subscription plan not found');
    }

    // Recalculate billing dates based on current date and plan
    const now = new Date();
    const newEndDate = this.calculateEndDate(
      now,
      subscription.plan.billing_cycle,
    );

    const previousEndDate = subscription.end_date;
    const previousNextBillingDate = subscription.next_billing_date;

    const updatedSubscription = await this.subscriptionRepository.update(
      subscriptionId,
      {
        start_date: now,
        end_date: newEndDate,
        next_billing_date: newEndDate,
        updated_by: user,
      },
    );

    await this.operationRepository.create({
      subscription_id: subscriptionId,
      operation_type: SubscriptionOperationTypeEnum.SYNC_BILLING,
      performed_by: user.id,
      reason: reason || 'Billing cycle synchronized',
      metadata: {
        previous_end_date: previousEndDate,
        previous_next_billing_date: previousNextBillingDate,
        new_end_date: newEndDate,
        new_next_billing_date: newEndDate,
        billing_cycle: subscription.plan.billing_cycle,
      },
    });

    return updatedSubscription;
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
}
