import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionEntity } from '@/subscriptions/persistence/entities/subscription.entity';
import { SubscriptionPlanEntity } from '@/subscription-plans/persistence/entities/subscription-plan.entity';
import { SubscriptionPaymentEntity } from '@/subscription-payments/persistence/entities/subscription-payment.entity';
import { SubscriptionOperationEntity } from '@/admin-subscriptions/persistence/entities/subscription-operation.entity';
import { SubscriptionStatusEnum } from '@/subscriptions/enums/subscription-status.enum';
import { SubscriptionPaymentStatusEnum } from '@/subscription-payments/enums/subscription-payment-status.enum';
import { SubscriptionOperationTypeEnum } from '@/admin-subscriptions/enums/subscription-operation-type.enum';
import { BillingCycleEnum } from '@/subscription-plans/enums/billing-cycle.enum';
import { SubscriptionOverview } from '@/admin-subscriptions/domain/subscription-overview';
import { UpcomingRenewal } from '@/admin-subscriptions/domain/upcoming-renewal';
import { FailedPayment } from '@/admin-subscriptions/domain/failed-payment';
import { QuickStats } from '@/admin-subscriptions/domain/quick-stats';
import { IPaginatedResult } from '@/utils/types/paginated-result';

/**
 * Subscription Analytics Service.
 *
 * Handles analytics calculations for subscription metrics.
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class SubscriptionAnalyticsService {
  private readonly MAX_RETRY_COUNT = 3;

  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepository: Repository<SubscriptionEntity>,
    @InjectRepository(SubscriptionPlanEntity)
    private readonly planRepository: Repository<SubscriptionPlanEntity>,
    @InjectRepository(SubscriptionPaymentEntity)
    private readonly paymentRepository: Repository<SubscriptionPaymentEntity>,
    @InjectRepository(SubscriptionOperationEntity)
    private readonly operationRepository: Repository<SubscriptionOperationEntity>,
  ) {}

  /**
   * Get subscription overview metrics.
   */
  async getOverview(): Promise<SubscriptionOverview> {
    const [
      totalActive,
      totalCancelled,
      totalExpired,
      totalPendingPayment,
      totalSuspended,
      activeSubscriptions,
      upcomingRenewals,
      failedPayments,
      paidPayments,
      pendingPayments,
      refundedPayments,
    ] = await Promise.all([
      this.subscriptionRepository.count({
        where: { status: SubscriptionStatusEnum.ACTIVE },
      }),
      this.subscriptionRepository.count({
        where: { status: SubscriptionStatusEnum.CANCELLED },
      }),
      this.subscriptionRepository.count({
        where: { status: SubscriptionStatusEnum.EXPIRED },
      }),
      this.subscriptionRepository.count({
        where: { status: SubscriptionStatusEnum.PENDING_PAYMENT },
      }),
      this.subscriptionRepository.count({
        where: { status: SubscriptionStatusEnum.SUSPENDED },
      }),
      this.subscriptionRepository.find({
        where: { status: SubscriptionStatusEnum.ACTIVE },
        relations: ['plan'],
      }),
      this.getUpcomingRenewals(),
      this.subscriptionRepository.count({
        where: { status: SubscriptionStatusEnum.PENDING_PAYMENT },
      }),
      this.paymentRepository.count({
        where: { payment_status: SubscriptionPaymentStatusEnum.PAID },
      }),
      this.paymentRepository.count({
        where: { payment_status: SubscriptionPaymentStatusEnum.PENDING },
      }),
      this.paymentRepository.count({
        where: { payment_status: SubscriptionPaymentStatusEnum.REFUNDED },
      }),
    ]);

    // Calculate Monthly Recurring Revenue (MRR)
    const monthlyRecurringRevenue = this.calculateMRR(activeSubscriptions);

    // Calculate churn rate (cancelled / (active + cancelled + expired) * 100)
    const totalSubscriptions = totalActive + totalCancelled + totalExpired;
    const churnRate =
      totalSubscriptions > 0 ? (totalCancelled / totalSubscriptions) * 100 : 0;

    return {
      totalActive,
      totalCancelled,
      totalExpired,
      totalPendingPayment,
      totalSuspended,
      monthlyRecurringRevenue,
      churnRate: Math.round(churnRate * 100) / 100, // Round to 2 decimal places
      upcomingRenewals,
      failedPayments,
      paidPayments,
      pendingPayments,
      refundedPayments,
    };
  }

  /**
   * Get subscription analytics.
   */
  async getAnalytics(startDate?: Date, endDate?: Date) {
    const queryBuilder = this.subscriptionRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.plan', 'plan');

    if (startDate) {
      queryBuilder.andWhere('subscription.created_at >= :startDate', {
        startDate,
      });
    }

    if (endDate) {
      queryBuilder.andWhere('subscription.created_at <= :endDate', {
        endDate,
      });
    }

    const subscriptions = await queryBuilder.getMany();

    // Plan popularity
    const planPopularity = this.calculatePlanPopularity(subscriptions);

    // Revenue by plan
    const revenueByPlan = this.calculateRevenueByPlan(subscriptions);

    // Subscription trends (monthly)
    const trends = this.calculateTrends(subscriptions);

    // Churn analysis
    const churnAnalysis = await this.calculateChurnAnalysis();

    // Conversion rates
    const conversionRates = await this.calculateConversionRates();

    return {
      planPopularity,
      revenueByPlan,
      trends,
      churnAnalysis,
      conversionRates,
    };
  }

  /**
   * Calculate Monthly Recurring Revenue (MRR).
   */
  private calculateMRR(subscriptions: SubscriptionEntity[]): number {
    let mrr = 0;

    for (const subscription of subscriptions) {
      if (!subscription.plan) continue;

      const planPrice = Number(subscription.plan.price) || 0;

      switch (subscription.plan.billing_cycle) {
        case BillingCycleEnum.MONTHLY:
          mrr += planPrice;
          break;
        case BillingCycleEnum.QUARTERLY:
          mrr += planPrice / 3;
          break;
        case BillingCycleEnum.YEARLY:
          mrr += planPrice / 12;
          break;
      }
    }

    return Math.round(mrr * 100) / 100;
  }

  /**
   * Get upcoming renewals in next 30 days.
   */
  private async getUpcomingRenewals(): Promise<number> {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // TypeORM doesn't support date range queries directly, use query builder
    const result = await this.subscriptionRepository
      .createQueryBuilder('subscription')
      .where('subscription.status = :status', {
        status: SubscriptionStatusEnum.ACTIVE,
      })
      .andWhere('subscription.next_billing_date >= :now', {
        now: new Date(),
      })
      .andWhere('subscription.next_billing_date <= :thirtyDays', {
        thirtyDays: thirtyDaysFromNow,
      })
      .getCount();

    return result;
  }

  /**
   * Calculate plan popularity.
   */
  private calculatePlanPopularity(
    subscriptions: SubscriptionEntity[],
  ): Array<{ plan_id: number; plan_name: string; count: number }> {
    const planCounts = new Map<number, { plan_name: string; count: number }>();

    for (const subscription of subscriptions) {
      if (!subscription.plan) continue;

      const planId = subscription.plan.id;
      const planName = subscription.plan.plan_name;

      if (!planCounts.has(planId)) {
        planCounts.set(planId, { plan_name: planName, count: 0 });
      }

      planCounts.get(planId)!.count++;
    }

    return Array.from(planCounts.entries()).map(([plan_id, data]) => ({
      plan_id,
      ...data,
    }));
  }

  /**
   * Calculate revenue by plan.
   */
  private calculateRevenueByPlan(
    subscriptions: SubscriptionEntity[],
  ): Array<{ plan_id: number; plan_name: string; revenue: number }> {
    const planRevenue = new Map<
      number,
      { plan_name: string; revenue: number }
    >();

    for (const subscription of subscriptions) {
      if (!subscription.plan) continue;

      const planId = subscription.plan.id;
      const planName = subscription.plan.plan_name;
      const planPrice = Number(subscription.plan.price) || 0;

      if (!planRevenue.has(planId)) {
        planRevenue.set(planId, { plan_name: planName, revenue: 0 });
      }

      planRevenue.get(planId)!.revenue += planPrice;
    }

    return Array.from(planRevenue.entries()).map(([plan_id, data]) => ({
      plan_id,
      ...data,
      revenue: Math.round(data.revenue * 100) / 100,
    }));
  }

  /**
   * Calculate subscription trends (monthly).
   */
  private calculateTrends(
    subscriptions: SubscriptionEntity[],
  ): Array<{ month: string; count: number; revenue: number }> {
    const monthlyData = new Map<string, { count: number; revenue: number }>();

    for (const subscription of subscriptions) {
      const createdDate = new Date(subscription.created_at);
      const monthKey = `${createdDate.getFullYear()}-${String(
        createdDate.getMonth() + 1,
      ).padStart(2, '0')}`;

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { count: 0, revenue: 0 });
      }

      monthlyData.get(monthKey)!.count++;

      if (subscription.plan) {
        const planPrice = Number(subscription.plan.price) || 0;
        monthlyData.get(monthKey)!.revenue += planPrice;
      }
    }

    return Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        count: data.count,
        revenue: Math.round(data.revenue * 100) / 100,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Calculate churn analysis.
   */
  private async calculateChurnAnalysis(): Promise<{
    totalChurned: number;
    churnRate: number;
    churnByMonth: Array<{ month: string; count: number }>;
  }> {
    const queryBuilder = this.subscriptionRepository
      .createQueryBuilder('subscription')
      .where('subscription.status = :status', {
        status: SubscriptionStatusEnum.CANCELLED,
      });

    const cancelledSubscriptions = await queryBuilder.getMany();

    const totalChurned = cancelledSubscriptions.length;

    // Calculate churn by month
    const churnByMonth = new Map<string, number>();
    for (const subscription of cancelledSubscriptions) {
      if (!subscription.cancelled_at) continue;

      const cancelledDate = new Date(subscription.cancelled_at);
      const monthKey = `${cancelledDate.getFullYear()}-${String(
        cancelledDate.getMonth() + 1,
      ).padStart(2, '0')}`;

      churnByMonth.set(monthKey, (churnByMonth.get(monthKey) || 0) + 1);
    }

    // Calculate overall churn rate
    const totalActive = await this.subscriptionRepository.count({
      where: { status: SubscriptionStatusEnum.ACTIVE },
    });
    const churnRate =
      totalActive + totalChurned > 0
        ? (totalChurned / (totalActive + totalChurned)) * 100
        : 0;

    return {
      totalChurned,
      churnRate: Math.round(churnRate * 100) / 100,
      churnByMonth: Array.from(churnByMonth.entries())
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month)),
    };
  }

  /**
   * Calculate conversion rates.
   */
  private async calculateConversionRates(): Promise<{
    pendingToActive: number;
    activeToCancelled: number;
    overallConversion: number;
  }> {
    const allSubscriptions = await this.subscriptionRepository
      .createQueryBuilder('subscription')
      .getMany();

    const pendingCount = allSubscriptions.filter(
      (s) => s.status === SubscriptionStatusEnum.PENDING_PAYMENT,
    ).length;

    const activeCount = allSubscriptions.filter(
      (s) => s.status === SubscriptionStatusEnum.ACTIVE,
    ).length;

    const cancelledCount = allSubscriptions.filter(
      (s) => s.status === SubscriptionStatusEnum.CANCELLED,
    ).length;

    const pendingToActive =
      pendingCount > 0 ? (activeCount / pendingCount) * 100 : 0;
    const activeToCancelled =
      activeCount > 0 ? (cancelledCount / activeCount) * 100 : 0;
    const overallConversion =
      allSubscriptions.length > 0
        ? (activeCount / allSubscriptions.length) * 100
        : 0;

    return {
      pendingToActive: Math.round(pendingToActive * 100) / 100,
      activeToCancelled: Math.round(activeToCancelled * 100) / 100,
      overallConversion: Math.round(overallConversion * 100) / 100,
    };
  }

  /**
   * Get upcoming renewals list with customer details.
   */
  async getUpcomingRenewalsList(
    days: number = 7,
    page: number = 1,
    limit: number = 20,
  ): Promise<IPaginatedResult<UpcomingRenewal>> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const queryBuilder = this.subscriptionRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.user', 'user')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .where('subscription.status = :status', {
        status: SubscriptionStatusEnum.ACTIVE,
      })
      .andWhere('subscription.next_billing_date >= :now', { now })
      .andWhere('subscription.next_billing_date <= :futureDate', { futureDate })
      .orderBy('subscription.next_billing_date', 'ASC');

    const totalCount = await queryBuilder.getCount();
    const skip = (page - 1) * limit;

    const subscriptions = await queryBuilder.skip(skip).take(limit).getMany();

    const data: UpcomingRenewal[] = subscriptions.map((sub) => {
      const dueDate = new Date(sub.next_billing_date!);
      const daysUntil = Math.ceil(
        (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      return {
        subscription_id: sub.id,
        subscription_number: sub.subscription_number,
        customer_id: sub.user?.id || 0,
        customer_name: sub.user
          ? `${sub.user.first_name || ''} ${sub.user.last_name || ''}`.trim()
          : 'Unknown',
        customer_email: sub.user?.email || '',
        plan_id: sub.plan?.id || 0,
        plan_name: sub.plan?.plan_name || 'Unknown',
        amount: Number(sub.plan?.price) || 0,
        billing_cycle: sub.plan?.billing_cycle || 'monthly',
        due_date: dueDate,
        days_until_renewal: daysUntil,
        auto_renew: sub.auto_renew,
      };
    });

    return { data, totalResults: totalCount };
  }

  /**
   * Get failed payments list with customer details.
   */
  async getFailedPaymentsList(
    page: number = 1,
    limit: number = 20,
  ): Promise<IPaginatedResult<FailedPayment>> {
    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.subscription', 'subscription')
      .leftJoinAndSelect('subscription.user', 'user')
      .where('payment.payment_status = :status', {
        status: SubscriptionPaymentStatusEnum.FAILED,
      })
      .andWhere('payment.deleted_at IS NULL')
      .orderBy('payment.updated_at', 'DESC');

    const totalCount = await queryBuilder.getCount();
    const skip = (page - 1) * limit;

    const payments = await queryBuilder.skip(skip).take(limit).getMany();

    const data: FailedPayment[] = payments.map((payment) => ({
      payment_id: payment.id,
      payment_number: payment.payment_number,
      subscription_id: payment.subscription_id,
      subscription_number: payment.subscription?.subscription_number || '',
      customer_id: payment.subscription?.user?.id || 0,
      customer_name: payment.subscription?.user
        ? `${payment.subscription.user.first_name || ''} ${payment.subscription.user.last_name || ''}`.trim()
        : 'Unknown',
      customer_email: payment.subscription?.user?.email || '',
      amount: Number(payment.amount) || 0,
      failure_reason: payment.failure_reason || 'Unknown',
      retry_count: payment.retry_count || 0,
      next_retry_at: payment.next_retry_at,
      failed_at: payment.updated_at,
      can_retry: (payment.retry_count || 0) < this.MAX_RETRY_COUNT,
    }));

    return { data, totalResults: totalCount };
  }

  /**
   * Get quick stats for operations dashboard.
   */
  async getQuickStats(): Promise<QuickStats> {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const [
      pendingRenewals,
      failedPayments,
      gracePeriodActive,
      extensionsToday,
      suspendedToday,
      renewalsToday,
    ] = await Promise.all([
      // Pending renewals (next 7 days)
      this.subscriptionRepository
        .createQueryBuilder('subscription')
        .where('subscription.status = :status', {
          status: SubscriptionStatusEnum.ACTIVE,
        })
        .andWhere('subscription.next_billing_date >= :now', { now })
        .andWhere('subscription.next_billing_date <= :future', {
          future: sevenDaysFromNow,
        })
        .getCount(),

      // Failed payments
      this.paymentRepository.count({
        where: { payment_status: SubscriptionPaymentStatusEnum.FAILED },
      }),

      // Grace period active
      this.subscriptionRepository
        .createQueryBuilder('subscription')
        .where('subscription.grace_period_start IS NOT NULL')
        .andWhere('subscription.grace_period_end >= :now', { now })
        .getCount(),

      // Extensions today
      this.operationRepository
        .createQueryBuilder('operation')
        .where('operation.operation_type = :type', {
          type: SubscriptionOperationTypeEnum.EXTEND,
        })
        .andWhere('operation.performed_at >= :start', { start: startOfToday })
        .andWhere('operation.performed_at < :end', { end: endOfToday })
        .getCount(),

      // Suspended today
      this.operationRepository
        .createQueryBuilder('operation')
        .where('operation.operation_type = :type', {
          type: SubscriptionOperationTypeEnum.SUSPEND,
        })
        .andWhere('operation.performed_at >= :start', { start: startOfToday })
        .andWhere('operation.performed_at < :end', { end: endOfToday })
        .getCount(),

      // Renewals today
      this.operationRepository
        .createQueryBuilder('operation')
        .where('operation.operation_type = :type', {
          type: SubscriptionOperationTypeEnum.RENEW,
        })
        .andWhere('operation.performed_at >= :start', { start: startOfToday })
        .andWhere('operation.performed_at < :end', { end: endOfToday })
        .getCount(),
    ]);

    return {
      pendingRenewals,
      failedPayments,
      gracePeriodActive,
      extensionsToday,
      suspendedToday,
      renewalsToday,
    };
  }
}
