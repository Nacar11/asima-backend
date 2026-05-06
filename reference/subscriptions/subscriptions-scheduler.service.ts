import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, LessThanOrEqual } from 'typeorm';
import { SubscriptionEntity } from '@/subscriptions/persistence/entities/subscription.entity';
import { SubscriptionPaymentEntity } from '@/subscription-payments/persistence/entities/subscription-payment.entity';
import { SubscriptionStatusEnum } from '@/subscriptions/enums/subscription-status.enum';
import { SubscriptionPaymentStatusEnum } from '@/subscription-payments/enums/subscription-payment-status.enum';
import { BillingCycleEnum } from '@/subscription-plans/enums/billing-cycle.enum';

/**
 * Subscription Scheduler Service.
 *
 * Handles automated subscription tasks via cron jobs:
 * - Expiration checking
 * - Auto-renewal processing
 * - Grace period management
 * - Payment retry scheduling
 * - Renewal reminder sending
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class SubscriptionsSchedulerService {
  private readonly logger = new Logger(SubscriptionsSchedulerService.name);
  private readonly DEFAULT_GRACE_PERIOD_DAYS = 7;
  private readonly MAX_PAYMENT_RETRIES = 3;
  private readonly RETRY_INTERVALS_HOURS = [6, 24, 72]; // 6h, 1d, 3d

  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepository: Repository<SubscriptionEntity>,
    @InjectRepository(SubscriptionPaymentEntity)
    private readonly paymentRepository: Repository<SubscriptionPaymentEntity>,
  ) {}

  /**
   * Check for expired subscriptions and mark them as expired.
   * Runs daily at midnight.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkExpiredSubscriptions(): Promise<number> {
    this.logger.log('Starting subscription expiration check...');

    try {
      const now = new Date();

      // Find active subscriptions where end_date has passed
      const expiredSubscriptions = await this.subscriptionRepository.find({
        where: {
          status: SubscriptionStatusEnum.ACTIVE,
          end_date: LessThan(now),
          auto_renew: false,
        },
      });

      if (expiredSubscriptions.length === 0) {
        this.logger.log('No expired subscriptions found.');
        return 0;
      }

      this.logger.log(
        `Found ${expiredSubscriptions.length} expired subscriptions.`,
      );

      for (const subscription of expiredSubscriptions) {
        await this.subscriptionRepository.update(subscription.id, {
          status: SubscriptionStatusEnum.EXPIRED,
        });

        this.logger.log(
          `Marked subscription #${subscription.subscription_number} as expired.`,
        );
      }

      this.logger.log(
        `Expiration check complete. ${expiredSubscriptions.length} subscriptions expired.`,
      );

      return expiredSubscriptions.length;
    } catch (error) {
      this.logger.error('Error in expiration check:', error);
      return 0;
    }
  }

  /**
   * Process auto-renewals for subscriptions about to expire.
   * Runs daily at 6 AM.
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async processAutoRenewals(): Promise<number> {
    this.logger.log('Starting auto-renewal processing...');

    try {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Find active subscriptions with auto_renew=true that expire tomorrow
      const subscriptionsToRenew = await this.subscriptionRepository.find({
        where: {
          status: SubscriptionStatusEnum.ACTIVE,
          auto_renew: true,
          end_date: LessThanOrEqual(tomorrow),
        },
        relations: ['plan'],
      });

      if (subscriptionsToRenew.length === 0) {
        this.logger.log('No subscriptions due for auto-renewal.');
        return 0;
      }

      this.logger.log(
        `Found ${subscriptionsToRenew.length} subscriptions for auto-renewal.`,
      );

      let renewedCount = 0;

      for (const subscription of subscriptionsToRenew) {
        try {
          if (!subscription.plan) {
            this.logger.warn(
              `Subscription #${subscription.subscription_number} has no plan, skipping.`,
            );
            continue;
          }

          // Calculate new billing period
          const newStartDate = new Date();
          const newEndDate = this.calculateEndDate(
            newStartDate,
            subscription.plan.billing_cycle,
          );

          // Create pending payment record
          await this.paymentRepository.save({
            subscription_id: subscription.id,
            payment_number: this.generatePaymentNumber(),
            amount: subscription.plan.price,
            payment_status: SubscriptionPaymentStatusEnum.PENDING,
            billing_cycle_start: newStartDate,
            billing_cycle_end: newEndDate,
            due_date: newStartDate,
          });

          // Update subscription to pending payment status
          await this.subscriptionRepository.update(subscription.id, {
            status: SubscriptionStatusEnum.PENDING_PAYMENT,
            start_date: newStartDate,
            end_date: newEndDate,
            next_billing_date: newEndDate,
          });

          renewedCount++;
          this.logger.log(
            `Created renewal payment for subscription #${subscription.subscription_number}.`,
          );
        } catch (error) {
          this.logger.error(
            `Error renewing subscription #${subscription.subscription_number}:`,
            error,
          );
        }
      }

      this.logger.log(
        `Auto-renewal complete. ${renewedCount} subscriptions processed.`,
      );

      return renewedCount;
    } catch (error) {
      this.logger.error('Error in auto-renewal processing:', error);
      return 0;
    }
  }

  /**
   * Handle grace period - suspend subscriptions after grace period ends.
   * Runs daily at midnight.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleGracePeriods(): Promise<number> {
    this.logger.log('Starting grace period check...');

    try {
      const now = new Date();

      // Find subscriptions where grace period has ended
      const expiredGracePeriods = await this.subscriptionRepository
        .createQueryBuilder('subscription')
        .where('subscription.grace_period_end IS NOT NULL')
        .andWhere('subscription.grace_period_end < :now', { now })
        .andWhere('subscription.status = :status', {
          status: SubscriptionStatusEnum.PENDING_PAYMENT,
        })
        .getMany();

      if (expiredGracePeriods.length === 0) {
        this.logger.log('No expired grace periods found.');
        return 0;
      }

      this.logger.log(
        `Found ${expiredGracePeriods.length} subscriptions with expired grace periods.`,
      );

      for (const subscription of expiredGracePeriods) {
        await this.subscriptionRepository.update(subscription.id, {
          status: SubscriptionStatusEnum.SUSPENDED,
          grace_period_start: null,
          grace_period_end: null,
          grace_period_days: null,
        });

        this.logger.log(
          `Suspended subscription #${subscription.subscription_number} after grace period.`,
        );
      }

      this.logger.log(
        `Grace period check complete. ${expiredGracePeriods.length} subscriptions suspended.`,
      );

      return expiredGracePeriods.length;
    } catch (error) {
      this.logger.error('Error in grace period check:', error);
      return 0;
    }
  }

  /**
   * Retry failed payments automatically.
   * Runs every 6 hours.
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async retryFailedPayments(): Promise<number> {
    this.logger.log('Starting failed payment retry...');

    try {
      const now = new Date();

      // Find failed payments that are due for retry
      const paymentsToRetry = await this.paymentRepository.find({
        where: {
          payment_status: SubscriptionPaymentStatusEnum.FAILED,
          next_retry_at: LessThanOrEqual(now),
        },
        relations: ['subscription'],
      });

      if (paymentsToRetry.length === 0) {
        this.logger.log('No payments due for retry.');
        return 0;
      }

      this.logger.log(`Found ${paymentsToRetry.length} payments to retry.`);

      let retriedCount = 0;

      for (const payment of paymentsToRetry) {
        try {
          if (payment.retry_count >= this.MAX_PAYMENT_RETRIES) {
            // Max retries reached, start grace period
            await this.startGracePeriod(payment.subscription_id);
            this.logger.log(
              `Max retries reached for payment #${payment.payment_number}, starting grace period.`,
            );
            continue;
          }

          // TODO: Integrate with actual payment gateway here
          // For now, we just update the retry count and schedule next retry

          const newRetryCount = payment.retry_count + 1;
          const nextRetryHours =
            this.RETRY_INTERVALS_HOURS[newRetryCount] ||
            this.RETRY_INTERVALS_HOURS[this.RETRY_INTERVALS_HOURS.length - 1];
          const nextRetryAt = new Date();
          nextRetryAt.setHours(nextRetryAt.getHours() + nextRetryHours);

          await this.paymentRepository.update(payment.id, {
            retry_count: newRetryCount,
            next_retry_at: nextRetryAt,
          });

          retriedCount++;
          this.logger.log(
            `Scheduled retry ${newRetryCount} for payment #${payment.payment_number} at ${nextRetryAt.toISOString()}.`,
          );
        } catch (error) {
          this.logger.error(
            `Error retrying payment #${payment.payment_number}:`,
            error,
          );
        }
      }

      this.logger.log(
        `Payment retry complete. ${retriedCount} payments scheduled for retry.`,
      );

      return retriedCount;
    } catch (error) {
      this.logger.error('Error in payment retry:', error);
      return 0;
    }
  }

  /**
   * Send renewal reminders for upcoming renewals.
   * Runs daily at 9 AM.
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendRenewalReminders(): Promise<number> {
    this.logger.log('Starting renewal reminder check...');

    try {
      const now = new Date();
      const reminderDays = [7, 3, 1]; // Send reminders at 7, 3, and 1 day before

      let sentCount = 0;

      for (const daysAhead of reminderDays) {
        const targetDate = new Date(now);
        targetDate.setDate(targetDate.getDate() + daysAhead);
        targetDate.setHours(0, 0, 0, 0);

        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);

        // Find subscriptions expiring on the target date
        const subscriptions = await this.subscriptionRepository
          .createQueryBuilder('subscription')
          .leftJoinAndSelect('subscription.user', 'user')
          .leftJoinAndSelect('subscription.plan', 'plan')
          .where('subscription.status = :status', {
            status: SubscriptionStatusEnum.ACTIVE,
          })
          .andWhere('subscription.next_billing_date >= :targetDate', {
            targetDate,
          })
          .andWhere('subscription.next_billing_date < :nextDay', { nextDay })
          .getMany();

        for (const subscription of subscriptions) {
          // TODO: Integrate with email/notification service
          // For now, just log the reminder
          this.logger.log(
            `Reminder: Subscription #${subscription.subscription_number} renews in ${daysAhead} day(s).`,
          );
          sentCount++;
        }
      }

      this.logger.log(
        `Reminder check complete. ${sentCount} reminders logged.`,
      );

      return sentCount;
    } catch (error) {
      this.logger.error('Error in reminder check:', error);
      return 0;
    }
  }

  /**
   * Start grace period for a subscription.
   */
  private async startGracePeriod(subscriptionId: number): Promise<void> {
    const now = new Date();
    const gracePeriodEnd = new Date(now);
    gracePeriodEnd.setDate(
      gracePeriodEnd.getDate() + this.DEFAULT_GRACE_PERIOD_DAYS,
    );

    await this.subscriptionRepository.update(subscriptionId, {
      grace_period_start: now,
      grace_period_end: gracePeriodEnd,
      grace_period_days: this.DEFAULT_GRACE_PERIOD_DAYS,
    });
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
   * Generate payment number.
   */
  private generatePaymentNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `SUBPAY-${year}${month}${day}-${random}`;
  }
}
