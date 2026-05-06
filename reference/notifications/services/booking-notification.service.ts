import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PushNotificationService } from './push-notification.service';
import { NotificationsService } from '../notifications.service';
import { NotificationTypeEnum } from '../enums/notification-type.enum';
import { Booking } from '@/bookings/domain/booking';
import { BookingMilestone } from '@/booking-milestones/domain/booking-milestone';
import { UserGroupEntity } from '@/user-groups/persistence/entities/user-group.entity';
import { UserAssignmentEntity } from '@/user-assignments/persistence/entities/user-assignment.entity';
import { StatusEnum as UserGroupStatusEnum } from '@/user-groups/user-groups.enum';
import { StatusEnum as UserAssignmentStatusEnum } from '@/user-assignments/user-assignments.enum';
import { StatusEnum as UserStatusEnum } from '@/users/users.enum';

/**
 * Booking Notification Service.
 *
 * Handles push notifications for all booking-related API endpoints.
 * Sends notifications immediately after successful API operations.
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class BookingNotificationService {
  private readonly logger = new Logger(BookingNotificationService.name);

  constructor(
    private readonly pushNotificationService: PushNotificationService,
    private readonly notificationsService: NotificationsService,
    @InjectRepository(UserGroupEntity)
    private readonly userGroupRepository: Repository<UserGroupEntity>,
    @InjectRepository(UserAssignmentEntity)
    private readonly userAssignmentRepository: Repository<UserAssignmentEntity>,
  ) {}

  /**
   * Send notification for booking created (Customer → Seller)
   */
  async sendBookingCreatedNotification(booking: Booking): Promise<void> {
    try {
      // Get seller user ID - try from seller relation first, then fallback to seller_id
      let sellerId: number;
      if (booking.seller?.user_id) {
        sellerId = booking.seller.user_id;
      } else {
        // If seller relation not loaded, we need to get it from the booking's seller_id
        // For now, we'll log a warning and skip notification
        this.logger.warn(
          `Seller relation not loaded for booking ${booking.id}, cannot send notification`,
        );
        return;
      }

      const serviceName = this.resolveServiceTitle(booking);
      const customerName = this.resolveCustomerName(booking);
      const isQrPayment = this.isQrPaymentMethod(
        booking.guest_payment_method || booking.sales_order?.payment_method,
      );
      const bookingTotal = Number(booking.total ?? 0);
      const needsPayment = isQrPayment && bookingTotal > 0;

      await this.notificationsService.create({
        user_id: sellerId,
        type: NotificationTypeEnum.NEW_BOOKING_REQUEST,
        title: needsPayment ? 'Booking Request Submitted' : 'New Booking Request',
        body: needsPayment
          ? `${customerName} submitted a booking request for ${serviceName}. Payment is pending - confirm once payment proof is received.`
          : `${customerName} submitted a booking request for ${serviceName}.`,
        entity_type: 'provider_booking',
        entity_id: booking.id,
        send_push: true,
      });

      this.logger.log(
        `Booking created notification sent to seller ${sellerId} for booking ${booking.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send booking created notification: ${error.message}`,
      );
    }
  }

  /**
   * Send notification for booking confirmed (Seller → Customer)
   */
  async sendBookingConfirmedNotification(booking: Booking): Promise<void> {
    try {
      const customerId = booking.customer_id;
      const providerName =
        booking.seller?.business_name ||
        booking.seller?.user?.first_name ||
        'Provider';

      await this.notificationsService.create({
        user_id: customerId,
        type: NotificationTypeEnum.BOOKING_CONFIRMED,
        title: 'Booking Confirmed!',
        body: `Your booking #${booking.booking_number} has been confirmed by ${providerName}`,
        entity_type: 'booking',
        entity_id: booking.id,
        send_push: true,
      });

      this.logger.log(
        `Booking confirmed notification sent to customer ${customerId} for booking ${booking.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send booking confirmed notification: ${error.message}`,
      );
    }
  }

  /**
   * Send notification for booking declined (Seller → Customer)
   */
  async sendBookingDeclinedNotification(
    booking: Booking,
    reason?: string,
  ): Promise<void> {
    try {
      const customerId = booking.customer_id;
      const reasonText = reason ? ` Reason: ${reason}` : '';

      await this.notificationsService.create({
        user_id: customerId,
        type: NotificationTypeEnum.BOOKING_REJECTED,
        title: 'Booking Declined',
        body: `Your booking #${booking.booking_number} has been declined.${reasonText}`,
        entity_type: 'booking',
        entity_id: booking.id,
        send_push: true,
      });

      this.logger.log(
        `Booking declined notification sent to customer ${customerId} for booking ${booking.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send booking declined notification: ${error.message}`,
      );
    }
  }

  /**
   * Send notification for booking assigned (Seller → Customer)
   */
  async sendBookingAssignedNotification(booking: Booking): Promise<void> {
    try {
      const customerId = booking.customer_id;

      await this.notificationsService.create({
        user_id: customerId,
        type: NotificationTypeEnum.BOOKING_ASSIGNED,
        title: 'Service Provider Assigned',
        body: `A service provider has been assigned to your booking #${booking.booking_number}`,
        entity_type: 'booking',
        entity_id: booking.id,
        send_push: true,
      });

      this.logger.log(
        `Booking assigned notification sent to customer ${customerId} for booking ${booking.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send booking assigned notification: ${error.message}`,
      );
    }
  }

  /**
   * Send notification for booking started (Seller → Customer)
   */
  async sendBookingStartedNotification(booking: Booking): Promise<void> {
    try {
      const customerId = booking.customer_id;

      await this.notificationsService.create({
        user_id: customerId,
        type: NotificationTypeEnum.BOOKING_STARTED,
        title: 'Service Started',
        body: `Your service for booking #${booking.booking_number} has started`,
        entity_type: 'booking',
        entity_id: booking.id,
        send_push: true,
      });

      this.logger.log(
        `Booking started notification sent to customer ${customerId} for booking ${booking.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send booking started notification: ${error.message}`,
      );
    }
  }

  /**
   * Send notification for booking completed (Seller → Customer)
   */
  async sendBookingCompletedNotification(booking: Booking): Promise<void> {
    try {
      const customerId = booking.customer_id;

      await this.notificationsService.create({
        user_id: customerId,
        type: NotificationTypeEnum.BOOKING_COMPLETED,
        title: 'Service Completed!',
        body: `Your booking #${booking.booking_number} has been completed. Please leave a review!`,
        entity_type: 'booking',
        entity_id: booking.id,
        send_push: true,
      });

      this.logger.log(
        `Booking completed notification sent to customer ${customerId} for booking ${booking.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send booking completed notification: ${error.message}`,
      );
    }
  }

  /**
   * Send notification for booking rescheduled (Customer → Seller)
   */
  async sendBookingRescheduledNotification(booking: Booking): Promise<void> {
    try {
      const recipientIds =
        await this.resolveSellerAndApproverRecipientUserIds(booking);
      if (recipientIds.length === 0) {
        this.logger.warn(
          `Seller relation not loaded for booking ${booking.id}, cannot send reschedule notification`,
        );
        return;
      }

      await Promise.all(
        recipientIds.map((recipientId) =>
          this.notificationsService.create({
            user_id: recipientId,
            type: NotificationTypeEnum.BOOKING_RESCHEDULED,
            title: 'Booking Rescheduled',
            body: `Booking #${booking.booking_number} has been rescheduled by the customer`,
            entity_type: 'provider_booking',
            entity_id: booking.id,
            send_push: true,
          }),
        ),
      );

      this.logger.log(
        `Booking rescheduled notification sent to ${recipientIds.length} provider recipient(s) for booking ${booking.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send booking rescheduled notification: ${error.message}`,
      );
    }
  }

  /**
   * Send notification for booking rescheduled by seller/admin (Seller/Admin → Customer)
   */
  async sendBookingRescheduledBySellerNotification(
    booking: Booking,
  ): Promise<void> {
    try {
      const customerId = booking.customer_id;

      await this.notificationsService.create({
        user_id: customerId,
        type: NotificationTypeEnum.BOOKING_RESCHEDULED,
        title: 'Booking Rescheduled',
        body: `Your booking #${booking.booking_number} has been rescheduled by the provider`,
        entity_type: 'booking',
        entity_id: booking.id,
        send_push: true,
      });

      this.logger.log(
        `Booking rescheduled-by-seller notification sent to customer ${customerId} for booking ${booking.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send booking rescheduled-by-seller notification: ${error.message}`,
      );
    }
  }

  /**
   * Send notification for booking cancelled (Customer → Seller)
   */
  async sendBookingCancelledNotification(booking: Booking): Promise<void> {
    try {
      let sellerId: number;
      if (booking.seller?.user_id) {
        sellerId = booking.seller.user_id;
      } else {
        this.logger.warn(
          `Seller relation not loaded for booking ${booking.id}, cannot send notification`,
        );
        return;
      }

      await this.notificationsService.create({
        user_id: sellerId,
        type: NotificationTypeEnum.BOOKING_CANCELLED_BY_BUYER,
        title: 'Booking Cancelled',
        body: `Booking #${booking.booking_number} has been cancelled by the customer`,
        entity_type: 'provider_booking',
        entity_id: booking.id,
        send_push: true,
      });

      this.logger.log(
        `Booking cancelled notification sent to seller ${sellerId} for booking ${booking.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send booking cancelled notification: ${error.message}`,
      );
    }
  }

  /**
   * Send notification for booking cancelled by provider/admin (Seller → Customer)
   */
  async sendBookingCancelledByProviderNotification(
    booking: Booking,
    reason?: string,
  ): Promise<void> {
    try {
      const customerId = booking.customer_id;
      const reasonText = reason ? ` Reason: ${reason}` : '';

      await this.notificationsService.create({
        user_id: customerId,
        type: NotificationTypeEnum.BOOKING_CANCELLED,
        title: 'Booking Cancelled',
        body: `Your booking #${booking.booking_number} has been cancelled by the provider.${reasonText}`,
        entity_type: 'booking',
        entity_id: booking.id,
        send_push: true,
      });

      this.logger.log(
        `Booking cancelled by provider notification sent to customer ${customerId} for booking ${booking.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send booking cancelled by provider notification: ${error.message}`,
      );
    }
  }

  /**
   * Send notification for booking updated (Seller → Customer)
   */
  async sendBookingUpdatedNotification(booking: Booking): Promise<void> {
    try {
      const customerId = booking.customer_id;

      await this.notificationsService.create({
        user_id: customerId,
        type: NotificationTypeEnum.BOOKING_UPDATED,
        title: 'Booking Updated',
        body: `Your booking #${booking.booking_number} has been updated with new information`,
        entity_type: 'booking',
        entity_id: booking.id,
        send_push: true,
      });

      this.logger.log(
        `Booking updated notification sent to customer ${customerId} for booking ${booking.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send booking updated notification: ${error.message}`,
      );
    }
  }

  /**
   * Send notification for milestone started (Seller → Customer)
   */
  async sendMilestoneStartedNotification(
    milestone: BookingMilestone,
  ): Promise<void> {
    try {
      const booking = milestone.booking;
      if (!booking) {
        this.logger.warn(
          `Cannot send milestone started notification: booking not found for milestone ${milestone.id}`,
        );
        return;
      }

      const customerId = booking.customer_id;

      await this.notificationsService.create({
        user_id: customerId,
        type: NotificationTypeEnum.MILESTONE_STARTED,
        title: 'Milestone Started',
        body: `A milestone for booking #${booking.booking_number} has started`,
        entity_type: 'booking',
        entity_id: booking.id,
        send_push: true,
      });

      this.logger.log(
        `Milestone started notification sent to customer ${customerId} for booking ${booking.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send milestone started notification: ${error.message}`,
      );
    }
  }

  /**
   * Send notification for milestone submitted (Seller → Customer)
   */
  async sendMilestoneSubmittedNotification(
    milestone: BookingMilestone,
  ): Promise<void> {
    try {
      const booking = milestone.booking;
      if (!booking) {
        this.logger.warn(
          `Cannot send milestone submitted notification: booking not found for milestone ${milestone.id}`,
        );
        return;
      }

      const customerId = booking.customer_id;

      await this.notificationsService.create({
        user_id: customerId,
        type: NotificationTypeEnum.MILESTONE_SUBMITTED,
        title: 'Milestone Update',
        body: `New milestone deliverables submitted for booking #${booking.booking_number}`,
        entity_type: 'booking',
        entity_id: booking.id,
        send_push: true,
      });

      this.logger.log(
        `Milestone submitted notification sent to customer ${customerId} for booking ${booking.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send milestone submitted notification: ${error.message}`,
      );
    }
  }

  /**
   * Send notification for milestone approved (Customer → Seller)
   */
  async sendMilestoneApprovedNotification(
    milestone: BookingMilestone,
  ): Promise<void> {
    try {
      const booking = milestone.booking;
      if (!booking) {
        this.logger.warn(
          `Cannot send milestone approved notification: booking not found for milestone ${milestone.id}`,
        );
        return;
      }

      let sellerId: number;
      if (booking.seller?.user_id) {
        sellerId = booking.seller.user_id;
      } else {
        this.logger.warn(
          `Seller relation not loaded for booking ${booking.id}, cannot send notification`,
        );
        return;
      }

      await this.notificationsService.create({
        user_id: sellerId,
        type: NotificationTypeEnum.MILESTONE_APPROVED,
        title: 'Milestone Approved',
        body: `Customer has approved milestone for booking #${booking.booking_number}`,
        entity_type: 'provider_booking',
        entity_id: booking.id,
        send_push: true,
      });

      this.logger.log(
        `Milestone approved notification sent to seller ${sellerId} for booking ${booking.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send milestone approved notification: ${error.message}`,
      );
    }
  }

  /**
   * Send notification for milestone completed (Seller → Customer)
   */
  async sendMilestoneCompletedNotification(
    milestone: BookingMilestone,
  ): Promise<void> {
    try {
      const booking = milestone.booking;
      if (!booking) {
        this.logger.warn(
          `Cannot send milestone completed notification: booking not found for milestone ${milestone.id}`,
        );
        return;
      }

      const customerId = booking.customer_id;

      await this.notificationsService.create({
        user_id: customerId,
        type: NotificationTypeEnum.ALL_MILESTONES_COMPLETED,
        title: 'Milestone Completed',
        body: `A milestone for booking #${booking.booking_number} has been completed`,
        entity_type: 'booking',
        entity_id: booking.id,
        send_push: true,
      });

      this.logger.log(
        `Milestone completed notification sent to customer ${customerId} for booking ${booking.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send milestone completed notification: ${error.message}`,
      );
    }
  }

  /**
   * Send notification for milestone rejected (Customer → Seller)
   */
  async sendMilestoneRejectedNotification(
    milestone: BookingMilestone,
  ): Promise<void> {
    try {
      const booking = milestone.booking;
      if (!booking) {
        this.logger.warn(
          `Cannot send milestone rejected notification: booking not found for milestone ${milestone.id}`,
        );
        return;
      }

      let sellerId: number;
      if (booking.seller?.user_id) {
        sellerId = booking.seller.user_id;
      } else {
        this.logger.warn(
          `Seller relation not loaded for booking ${booking.id}, cannot send notification`,
        );
        return;
      }

      await this.notificationsService.create({
        user_id: sellerId,
        type: NotificationTypeEnum.MILESTONE_REVISION_REQUESTED,
        title: 'Milestone Revision Requested',
        body: `Customer requested revision for milestone in booking #${booking.booking_number}`,
        entity_type: 'provider_booking',
        entity_id: booking.id,
        send_push: true,
      });

      this.logger.log(
        `Milestone rejected notification sent to seller ${sellerId} for booking ${booking.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send milestone rejected notification: ${error.message}`,
      );
    }
  }

  private async resolveSellerAndApproverRecipientUserIds(
    booking: Booking,
  ): Promise<number[]> {
    const recipientIds = new Set<number>();
    const sellerUserId = booking.seller?.user_id;

    if (sellerUserId) {
      recipientIds.add(sellerUserId);
    }

    const sellerId = Number(booking.seller_id ?? booking.seller?.id);
    if (Number.isFinite(sellerId) && sellerId > 0) {
      const approverUserIds = await this.resolveApproverUserIds(sellerId);
      for (const approverUserId of approverUserIds) {
        recipientIds.add(approverUserId);
      }
    }

    return [...recipientIds];
  }

  private async resolveApproverUserIds(sellerId: number): Promise<number[]> {
    const approverGroup = await this.userGroupRepository.findOne({
      where: {
        seller_id: sellerId,
        group_name: 'Booking Approvers',
        status: UserGroupStatusEnum.ACTIVE,
      },
    });

    if (!approverGroup) {
      return [];
    }

    const assignments = await this.userAssignmentRepository
      .createQueryBuilder('assignment')
      .innerJoinAndSelect('assignment.user', 'user')
      .where('assignment.group_id = :groupId', { groupId: approverGroup.id })
      .andWhere('assignment.status = :assignmentStatus', {
        assignmentStatus: UserAssignmentStatusEnum.ACTIVE,
      })
      .andWhere('assignment.deleted_at IS NULL')
      .andWhere('user.deleted_at IS NULL')
      .andWhere('user.status = :userStatus', {
        userStatus: UserStatusEnum.ACTIVE,
      })
      .select(['assignment.id', 'user.id'])
      .getMany();

    return [
      ...new Set(
        assignments
          .map((assignment) => Number(assignment.user?.id))
          .filter((userId) => Number.isFinite(userId) && userId > 0),
      ),
    ];
  }

  private resolveServiceTitle(booking: Booking): string {
    return booking.service?.title || booking.service?.name || 'Service';
  }

  private resolveCustomerName(booking: Booking): string {
    const primaryGuestName =
      booking.primary_guest?.full_name ||
      `${booking.primary_guest?.first_name || ''} ${booking.primary_guest?.last_name || ''}`.trim();
    const customerName =
      `${booking.customer?.first_name || ''} ${booking.customer?.last_name || ''}`.trim() ||
      (booking.customer as any)?.full_name ||
      '';

    return primaryGuestName || customerName || 'Customer';
  }

  private isQrPaymentMethod(paymentMethod?: string | null): boolean {
    const normalized = String(paymentMethod || '')
      .trim()
      .toLowerCase();
    if (!normalized) {
      return false;
    }
    if (normalized.startsWith('custom-')) {
      return true;
    }

    return new Set([
      'gcash',
      'maya_qr',
      'unionbank_qr',
      'maya',
      'paymaya',
      'paymaya_direct',
      'unionbank',
      'union_bank',
    ]).has(normalized);
  }
}
