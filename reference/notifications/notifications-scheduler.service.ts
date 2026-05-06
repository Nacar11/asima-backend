import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';
import { NotificationTypeEnum } from './enums/notification-type.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingEntity } from '@/bookings/persistence/entities/booking.entity';
import { BookingMilestoneEntity } from '@/booking-milestones/persistence/entities/booking-milestone.entity';
import { QuoteRequestEntity } from '@/quote-requests/persistence/entities/quote-request.entity';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import { OrderStatusEnum } from '@/sales-orders/domain/order-status.enum';
import { BookingStatusEnum } from '@/bookings/enums/booking-status.enum';
import { MilestoneStatusEnum } from '@/booking-milestones/enums/milestone-status.enum';
import { QuoteRequestStatusEnum } from '@/quote-requests/domain/quote-request';

/**
 * Notifications Scheduler Service.
 *
 * Handles scheduled/time-based notifications for:
 * - Booking reminders and starting soon alerts
 * - Milestone deadline warnings and overdue alerts
 * - Quote expiration warnings
 * - Review reminders
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class NotificationsSchedulerService {
  private readonly logger = new Logger(NotificationsSchedulerService.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
    @InjectRepository(BookingMilestoneEntity)
    private readonly milestoneRepository: Repository<BookingMilestoneEntity>,
    @InjectRepository(QuoteRequestEntity)
    private readonly quoteRequestRepository: Repository<QuoteRequestEntity>,
    @InjectRepository(SalesOrderEntity)
    private readonly salesOrderRepository: Repository<SalesOrderEntity>,
  ) {}

  /**
   * Check for bookings starting in ~1 hour.
   * Runs every 15 minutes.
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async sendBookingStartingSoonNotifications(): Promise<void> {
    this.logger.debug('Checking for bookings starting soon...');

    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    try {
      // Find confirmed bookings starting in 1-2 hours that haven't been notified
      const bookings = await this.bookingRepository
        .createQueryBuilder('booking')
        .leftJoinAndSelect('booking.customer', 'customer')
        .where('booking.status IN (:...statuses)', {
          statuses: [
            BookingStatusEnum.CONFIRMED,
            BookingStatusEnum.PROVIDER_ASSIGNED,
          ],
        })
        .andWhere('booking.scheduled_date = :today', {
          today: now.toISOString().split('T')[0],
        })
        .andWhere('booking.scheduled_start_time BETWEEN :start AND :end', {
          start: oneHourFromNow.toTimeString().substring(0, 5),
          end: twoHoursFromNow.toTimeString().substring(0, 5),
        })
        .andWhere('booking.starting_soon_notified IS NULL')
        .getMany();

      for (const booking of bookings) {
        await this.notificationsService.notify(
          booking.customer_id,
          NotificationTypeEnum.BOOKING_STARTING_SOON,
          'Booking Starting Soon!',
          `Your booking #${booking.booking_number} starts in about 1 hour.`,
          'booking',
          booking.id,
          `/bookings/${booking.id}`,
        );

        // Mark as notified
        await this.bookingRepository.update(booking.id, {
          starting_soon_notified: new Date(),
        });
      }

      if (bookings.length > 0) {
        this.logger.log(
          `Sent ${bookings.length} booking starting soon notifications`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to send starting soon notifications:', error);
    }
  }

  /**
   * Check for bookings scheduled for tomorrow (24h reminder).
   * Runs every hour.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async sendBookingReminderNotifications(): Promise<void> {
    this.logger.debug('Checking for booking reminders...');

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];

    try {
      // Find confirmed bookings scheduled for tomorrow that haven't been reminded
      const bookings = await this.bookingRepository
        .createQueryBuilder('booking')
        .leftJoinAndSelect('booking.customer', 'customer')
        .where('booking.status IN (:...statuses)', {
          statuses: [
            BookingStatusEnum.CONFIRMED,
            BookingStatusEnum.PROVIDER_ASSIGNED,
          ],
        })
        .andWhere('booking.scheduled_date = :tomorrow', {
          tomorrow: tomorrowDate,
        })
        .andWhere('booking.reminder_notified IS NULL')
        .getMany();

      for (const booking of bookings) {
        await this.notificationsService.notify(
          booking.customer_id,
          NotificationTypeEnum.BOOKING_REMINDER,
          'Booking Tomorrow!',
          `Reminder: Your booking #${booking.booking_number} is scheduled for tomorrow.`,
          'booking',
          booking.id,
          `/bookings/${booking.id}`,
        );

        // Mark as notified
        await this.bookingRepository.update(booking.id, {
          reminder_notified: new Date(),
        });
      }

      if (bookings.length > 0) {
        this.logger.log(
          `Sent ${bookings.length} booking reminder notifications`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to send booking reminders:', error);
    }
  }

  /**
   * Check for milestones with approaching deadlines (24h warning).
   * Runs every 2 hours.
   */
  @Cron(CronExpression.EVERY_2_HOURS)
  async sendMilestoneDeadlineNotifications(): Promise<void> {
    this.logger.debug('Checking for milestone deadline warnings...');

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    try {
      // Find in-progress milestones with deadline approaching
      const milestones = await this.milestoneRepository
        .createQueryBuilder('milestone')
        .leftJoinAndSelect('milestone.booking', 'booking')
        .leftJoinAndSelect('booking.seller', 'seller')
        .where('milestone.status = :status', {
          status: MilestoneStatusEnum.IN_PROGRESS,
        })
        .andWhere('milestone.due_date IS NOT NULL')
        .andWhere('milestone.due_date BETWEEN :now AND :tomorrow', {
          now: now.toISOString(),
          tomorrow: tomorrow.toISOString(),
        })
        .andWhere('milestone.deadline_warning_notified IS NULL')
        .getMany();

      for (const milestone of milestones) {
        if (milestone.booking?.seller?.user_id) {
          await this.notificationsService.notify(
            milestone.booking.seller.user_id,
            NotificationTypeEnum.MILESTONE_DEADLINE_APPROACHING,
            'Deadline Approaching!',
            `Milestone "${milestone.name}" is due within 24 hours.`,
            'milestone',
            milestone.id,
            `/bookings/${milestone.booking_id}/milestones/${milestone.id}`,
          );

          // Mark as notified
          await this.milestoneRepository.update(milestone.id, {
            deadline_warning_notified: new Date(),
          });
        }
      }

      if (milestones.length > 0) {
        this.logger.log(
          `Sent ${milestones.length} milestone deadline warnings`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to send milestone deadline warnings:', error);
    }
  }

  /**
   * Check for overdue milestones.
   * Runs every 4 hours.
   */
  @Cron(CronExpression.EVERY_4_HOURS)
  async sendMilestoneOverdueNotifications(): Promise<void> {
    this.logger.debug('Checking for overdue milestones...');

    const now = new Date();

    try {
      // Find in-progress milestones that are past due date
      const milestones = await this.milestoneRepository
        .createQueryBuilder('milestone')
        .leftJoinAndSelect('milestone.booking', 'booking')
        .leftJoinAndSelect('booking.seller', 'seller')
        .where('milestone.status = :status', {
          status: MilestoneStatusEnum.IN_PROGRESS,
        })
        .andWhere('milestone.due_date IS NOT NULL')
        .andWhere('milestone.due_date < :now', { now: now.toISOString() })
        .andWhere('milestone.overdue_notified IS NULL')
        .getMany();

      for (const milestone of milestones) {
        if (milestone.booking?.seller?.user_id) {
          await this.notificationsService.notify(
            milestone.booking.seller.user_id,
            NotificationTypeEnum.MILESTONE_OVERDUE,
            'Milestone Overdue!',
            `Milestone "${milestone.name}" is now overdue. Please complete it as soon as possible.`,
            'milestone',
            milestone.id,
            `/bookings/${milestone.booking_id}/milestones/${milestone.id}`,
          );

          // Mark as notified
          await this.milestoneRepository.update(milestone.id, {
            overdue_notified: new Date(),
          });
        }
      }

      if (milestones.length > 0) {
        this.logger.log(
          `Sent ${milestones.length} milestone overdue notifications`,
        );
      }
    } catch (error) {
      this.logger.error(
        'Failed to send milestone overdue notifications:',
        error,
      );
    }
  }

  /**
   * Check for quotes expiring soon (24h warning).
   * Runs every 4 hours.
   */
  @Cron(CronExpression.EVERY_4_HOURS)
  async sendQuoteExpiringNotifications(): Promise<void> {
    this.logger.debug('Checking for expiring quotes...');

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    try {
      // Find quoted requests expiring soon
      const quotes = await this.quoteRequestRepository
        .createQueryBuilder('quote')
        .leftJoinAndSelect('quote.customer', 'customer')
        .where('quote.status = :status', {
          status: QuoteRequestStatusEnum.QUOTED,
        })
        .andWhere('quote.quote_expires_at IS NOT NULL')
        .andWhere('quote.quote_expires_at BETWEEN :now AND :tomorrow', {
          now: now.toISOString(),
          tomorrow: tomorrow.toISOString(),
        })
        .andWhere('quote.expiring_soon_notified IS NULL')
        .getMany();

      for (const quote of quotes) {
        await this.notificationsService.notify(
          quote.customer_id,
          NotificationTypeEnum.QUOTE_EXPIRING_SOON,
          'Quote Expiring Soon!',
          `Your quote #${quote.quote_number} expires within 24 hours. Accept it before it expires.`,
          'quote_request',
          quote.id,
          `/quote-requests/${quote.id}`,
        );

        // Mark as notified
        await this.quoteRequestRepository.update(quote.id, {
          expiring_soon_notified: new Date(),
        });
      }

      if (quotes.length > 0) {
        this.logger.log(`Sent ${quotes.length} quote expiring notifications`);
      }
    } catch (error) {
      this.logger.error('Failed to send quote expiring notifications:', error);
    }
  }

  /**
   * Check for expired quotes and send notification.
   * Runs every 6 hours.
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async sendQuoteExpiredNotifications(): Promise<void> {
    this.logger.debug('Checking for expired quotes...');

    const now = new Date();

    try {
      // Find quoted requests that have expired
      const quotes = await this.quoteRequestRepository
        .createQueryBuilder('quote')
        .leftJoinAndSelect('quote.customer', 'customer')
        .where('quote.status = :status', {
          status: QuoteRequestStatusEnum.QUOTED,
        })
        .andWhere('quote.quote_expires_at IS NOT NULL')
        .andWhere('quote.quote_expires_at < :now', { now: now.toISOString() })
        .andWhere('quote.expired_notified IS NULL')
        .getMany();

      for (const quote of quotes) {
        await this.notificationsService.notify(
          quote.customer_id,
          NotificationTypeEnum.QUOTE_EXPIRED,
          'Quote Expired',
          `Your quote #${quote.quote_number} has expired. You can request a new quote.`,
          'quote_request',
          quote.id,
          `/quote-requests/${quote.id}`,
        );

        // Update status to expired and mark as notified
        await this.quoteRequestRepository.update(quote.id, {
          status: QuoteRequestStatusEnum.EXPIRED,
          expired_notified: new Date(),
        });
      }

      if (quotes.length > 0) {
        this.logger.log(`Sent ${quotes.length} quote expired notifications`);
      }
    } catch (error) {
      this.logger.error('Failed to send quote expired notifications:', error);
    }
  }

  /**
   * Check for pending bookings that need seller confirmation.
   * Runs every 4 hours.
   */
  @Cron(CronExpression.EVERY_4_HOURS)
  async sendBookingPendingConfirmationNotifications(): Promise<void> {
    this.logger.debug('Checking for pending bookings...');

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    try {
      // Find pending bookings created more than 24 hours ago that haven't been reminded
      const bookings = await this.bookingRepository
        .createQueryBuilder('booking')
        .leftJoinAndSelect('booking.seller', 'seller')
        .where('booking.status = :status', {
          status: BookingStatusEnum.PENDING,
        })
        .andWhere('booking.created_at < :oneDayAgo', {
          oneDayAgo: oneDayAgo.toISOString(),
        })
        .andWhere('booking.pending_confirmation_notified IS NULL')
        .getMany();

      for (const booking of bookings) {
        if (booking.seller?.user_id) {
          await this.notificationsService.notify(
            booking.seller.user_id,
            NotificationTypeEnum.BOOKING_PENDING_CONFIRMATION,
            'Pending Booking Confirmation',
            `You have a pending booking request #${booking.booking_number} that needs your confirmation.`,
            'booking',
            booking.id,
            `/bookings/${booking.id}`,
          );

          // Mark as notified
          await this.bookingRepository.update(booking.id, {
            pending_confirmation_notified: new Date(),
          });
        }
      }

      if (bookings.length > 0) {
        this.logger.log(
          `Sent ${bookings.length} pending booking confirmation reminders`,
        );
      }
    } catch (error) {
      this.logger.error(
        'Failed to send pending booking confirmation notifications:',
        error,
      );
    }
  }

  /**
   * Send review reminders 24h after booking completion.
   * Runs every 6 hours.
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async sendReviewReminderNotifications(): Promise<void> {
    this.logger.debug('Checking for review reminders...');

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    try {
      // Find completed bookings from 24-48h ago without reviews
      const bookings = await this.bookingRepository
        .createQueryBuilder('booking')
        .leftJoinAndSelect('booking.customer', 'customer')
        .leftJoin('booking.reviews', 'review')
        .where('booking.status = :status', {
          status: BookingStatusEnum.COMPLETED,
        })
        .andWhere('booking.completed_at BETWEEN :twoDaysAgo AND :yesterday', {
          twoDaysAgo: twoDaysAgo.toISOString(),
          yesterday: yesterday.toISOString(),
        })
        .andWhere('booking.review_reminder_notified IS NULL')
        .andWhere('review.id IS NULL')
        .getMany();

      for (const booking of bookings) {
        await this.notificationsService.notify(
          booking.customer_id,
          NotificationTypeEnum.REVIEW_REMINDER,
          'Share Your Experience!',
          `How was your experience with booking #${booking.booking_number}? Leave a review to help others.`,
          'booking',
          booking.id,
          `/bookings/${booking.id}/review`,
        );

        // Mark as notified
        await this.bookingRepository.update(booking.id, {
          review_reminder_notified: new Date(),
        });
      }

      if (bookings.length > 0) {
        this.logger.log(
          `Sent ${bookings.length} review reminder notifications`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to send review reminders:', error);
    }
  }

  /**
   * Send pickup reminders 30 minutes before scheduled pickup time.
   * Runs every 15 minutes.
   */
  @Cron('*/15 * * * *')
  async sendPickupReminderNotifications(): Promise<void> {
    this.logger.debug('Checking for upcoming pickup reminders...');

    const now = new Date();
    const in30min = new Date(now.getTime() + 30 * 60 * 1000);
    const in45min = new Date(now.getTime() + 45 * 60 * 1000);

    const todayDate = now.toISOString().split('T')[0];
    const from30 = in30min.toTimeString().substring(0, 5);
    const from45 = in45min.toTimeString().substring(0, 5);

    try {
      const orders = await this.salesOrderRepository
        .createQueryBuilder('o')
        .leftJoinAndSelect('o.user', 'user')
        .where('o.fulfillment_type = :type', { type: 'pickup' })
        .andWhere('o.status = :status', {
          status: OrderStatusEnum.READY_FOR_PICKUP,
        })
        .andWhere('o.pickup_date = :date', { date: todayDate })
        .andWhere('o.pickup_time BETWEEN :from AND :to', {
          from: from30,
          to: from45,
        })
        .andWhere('o.pickup_reminder_notified_at IS NULL')
        .getMany();

      for (const order of orders) {
        await this.notificationsService.notify(
          order.user_id,
          NotificationTypeEnum.ORDER_PICKUP_REMINDER,
          'Pickup Reminder',
          `Your order #${order.order_number} is ready for pickup in ~30 minutes.`,
          'sales_order',
          order.id,
          `/orders/${order.id}`,
        );

        await this.salesOrderRepository.update(order.id, {
          pickup_reminder_notified_at: new Date(),
        } as any);
      }

      if (orders.length > 0) {
        this.logger.log(`Sent ${orders.length} pickup reminder notifications`);
      }
    } catch (error) {
      this.logger.error('Failed to send pickup reminders:', error);
    }
  }

  /**
   * Send first no-show warning 1 hour after order was marked ready_for_pickup.
   * Grace period extension (grace_period_extension column) delays this.
   * Runs every 15 minutes.
   */
  @Cron('*/15 * * * *')
  async sendPickupNoShowWarning1(): Promise<void> {
    this.logger.debug('Checking for pickup no-show warning #1...');

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const seventyFiveMinAgo = new Date(now.getTime() - 75 * 60 * 1000);

    try {
      // Warning triggers 1 hour after ready_for_pickup_at.
      // If grace_period_extension is set, the effective threshold is
      // ready_for_pickup_at + 60min + grace_period_extension minutes.
      const orders = await this.salesOrderRepository
        .createQueryBuilder('o')
        .leftJoinAndSelect('o.user', 'user')
        .where('o.fulfillment_type = :type', { type: 'pickup' })
        .andWhere('o.status = :status', {
          status: OrderStatusEnum.READY_FOR_PICKUP,
        })
        .andWhere('o.ready_for_pickup_at IS NOT NULL')
        .andWhere(
          `o.ready_for_pickup_at + (COALESCE(o.grace_period_extension, 0) || ' minutes')::interval BETWEEN :from AND :to`,
          { from: seventyFiveMinAgo, to: oneHourAgo },
        )
        .andWhere('o.noshow_warning_1_notified_at IS NULL')
        .getMany();

      for (const order of orders) {
        await this.notificationsService.notify(
          order.user_id,
          NotificationTypeEnum.ORDER_PICKUP_NOSHOW_WARNING,
          'Pickup Overdue',
          `Your order #${order.order_number} has been ready for over 1 hour. Please pick it up soon.`,
          'sales_order',
          order.id,
          `/orders/${order.id}`,
        );

        await this.salesOrderRepository.update(order.id, {
          noshow_warning_1_notified_at: new Date(),
        } as any);
      }

      if (orders.length > 0) {
        this.logger.log(
          `Sent ${orders.length} pickup no-show warning #1 notifications`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to send pickup no-show warning #1:', error);
    }
  }

  /**
   * Send second no-show warning 1.5 hours after order was marked ready_for_pickup.
   * Grace period extension delays this.
   * Runs every 15 minutes.
   */
  @Cron('*/15 * * * *')
  async sendPickupNoShowWarning2(): Promise<void> {
    this.logger.debug('Checking for pickup no-show warning #2...');

    const now = new Date();
    const ninetyMinAgo = new Date(now.getTime() - 90 * 60 * 1000);
    const oneHundredFiveMinAgo = new Date(now.getTime() - 105 * 60 * 1000);

    try {
      const orders = await this.salesOrderRepository
        .createQueryBuilder('o')
        .leftJoinAndSelect('o.user', 'user')
        .where('o.fulfillment_type = :type', { type: 'pickup' })
        .andWhere('o.status = :status', {
          status: OrderStatusEnum.READY_FOR_PICKUP,
        })
        .andWhere('o.ready_for_pickup_at IS NOT NULL')
        .andWhere(
          `o.ready_for_pickup_at + (COALESCE(o.grace_period_extension, 0) || ' minutes')::interval BETWEEN :from AND :to`,
          { from: oneHundredFiveMinAgo, to: ninetyMinAgo },
        )
        .andWhere('o.noshow_warning_2_notified_at IS NULL')
        .andWhere('o.noshow_warning_1_notified_at IS NOT NULL')
        .getMany();

      for (const order of orders) {
        await this.notificationsService.notify(
          order.user_id,
          NotificationTypeEnum.ORDER_PICKUP_NOSHOW_WARNING,
          'Final Pickup Warning',
          `Your order #${order.order_number} is still waiting for pickup. It may be cancelled soon.`,
          'sales_order',
          order.id,
          `/orders/${order.id}`,
        );

        await this.salesOrderRepository.update(order.id, {
          noshow_warning_2_notified_at: new Date(),
        } as any);
      }

      if (orders.length > 0) {
        this.logger.log(
          `Sent ${orders.length} pickup no-show warning #2 notifications`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to send pickup no-show warning #2:', error);
    }
  }
}
