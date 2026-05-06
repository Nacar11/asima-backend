import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from '../notifications.service';
import { NotificationTypeEnum } from '../enums/notification-type.enum';
import { BookingEntity } from '@/bookings/persistence/entities/booking.entity';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { UserGroupEntity } from '@/user-groups/persistence/entities/user-group.entity';
import { UserAssignmentEntity } from '@/user-assignments/persistence/entities/user-assignment.entity';
import { StatusEnum as UserGroupStatusEnum } from '@/user-groups/user-groups.enum';
import { StatusEnum as UserAssignmentStatusEnum } from '@/user-assignments/user-assignments.enum';
import { StatusEnum as UserStatusEnum } from '@/users/users.enum';

type BookingPaymentMirrorEventType =
  | 'awaiting_confirmation'
  | 'confirmed'
  | 'rejected'
  | 'expired';

@Injectable()
export class BookingEmailMirrorNotificationService {
  private static readonly BOOKING_APPROVERS_GROUP_NAME = 'Booking Approvers';
  private readonly logger = new Logger(
    BookingEmailMirrorNotificationService.name,
  );

  constructor(
    private readonly notificationsService: NotificationsService,
    @InjectRepository(SellerEntity)
    private readonly sellerRepository: Repository<SellerEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserGroupEntity)
    private readonly userGroupRepository: Repository<UserGroupEntity>,
    @InjectRepository(UserAssignmentEntity)
    private readonly userAssignmentRepository: Repository<UserAssignmentEntity>,
  ) {}

  async sendVenueBookingSubmittedNotifications(
    booking: BookingEntity,
  ): Promise<void> {
    try {
      const [customerId, staffRecipientIds] = await Promise.all([
        this.resolveCustomerRecipientUserId(booking),
        this.resolveStaffRecipientUserIds(booking),
      ]);

      const venueName = this.resolveServiceTitle(booking);
      const bookingLabel = this.resolveBookingLabel(booking);
      const customerName = this.resolveCustomerName(booking);
      const isQrPayment = this.isQrPaymentMethod(
        booking.guest_payment_method || booking.sales_order?.payment_method,
      );
      const bookingTotal = Number(booking.total ?? 0);
      const needsPayment = isQrPayment && bookingTotal > 0;

      if (customerId) {
        await this.notificationsService.create({
          user_id: customerId,
          type: NotificationTypeEnum.VENUE_BOOKING_SUBMITTED,
          title: 'Booking Request Submitted',
          body: needsPayment
            ? `Your venue booking ${bookingLabel} for ${venueName} has been submitted. Complete your payment - the provider will confirm once payment is verified.`
            : bookingTotal <= 0
              ? `Your venue booking ${bookingLabel} for ${venueName} is pending store approval.`
              : `Your venue booking ${bookingLabel} for ${venueName} has been submitted and is awaiting provider approval.`,
          entity_type: 'booking',
          entity_id: booking.id,
          send_push: true,
        });
      }

      await this.createNotifications(
        staffRecipientIds,
        NotificationTypeEnum.NEW_BOOKING_REQUEST,
        needsPayment ? 'Booking Request Submitted' : 'New Venue Booking Request',
        needsPayment
          ? `${customerName} submitted a booking request for ${venueName}. Payment is pending - confirm once payment proof is received.`
          : `${customerName} submitted a venue booking request for ${venueName}.`,
        'provider_booking',
        booking.id,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send venue booking submitted mirror notifications: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async sendBookingPaymentEventNotifications(input: {
    eventType: BookingPaymentMirrorEventType;
    booking: BookingEntity;
    actorUserId?: number | null;
    rejectionReason?: string | null;
  }): Promise<void> {
    try {
      const { customerConfig, staffConfig } =
        this.buildPaymentEventNotificationConfig(input);
      const [customerId, staffRecipientIds] = await Promise.all([
        this.resolveCustomerRecipientUserId(input.booking),
        this.resolveStaffRecipientUserIds(input.booking, {
          suppressUserIds: input.actorUserId ? [input.actorUserId] : [],
        }),
      ]);

      if (customerId && customerConfig) {
        await this.notificationsService.create({
          user_id: customerId,
          type: customerConfig.type,
          title: customerConfig.title,
          body: customerConfig.body,
          entity_type: 'booking',
          entity_id: input.booking.id,
          send_push: true,
        });
      }

      if (staffConfig) {
        await this.createNotifications(
          staffRecipientIds,
          staffConfig.type,
          staffConfig.title,
          staffConfig.body,
          'provider_booking',
          input.booking.id,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to send booking payment mirror notifications: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async createNotifications(
    userIds: number[],
    type: NotificationTypeEnum,
    title: string,
    body: string,
    entityType: 'booking' | 'provider_booking',
    entityId: number,
  ): Promise<void> {
    if (!userIds.length) {
      return;
    }

    await Promise.all(
      userIds.map((userId) =>
        this.notificationsService.create({
          user_id: userId,
          type,
          title,
          body,
          entity_type: entityType,
          entity_id: entityId,
          send_push: true,
        }),
      ),
    );
  }

  private resolveServiceTitle(booking: BookingEntity): string {
    return booking.service?.title || booking.seller?.store_name || 'Booking';
  }

  private resolveBookingLabel(booking: BookingEntity): string {
    const bookingNumber = String(booking.booking_number || '').trim();
    return bookingNumber ? `#${bookingNumber}` : 'request';
  }

  private resolvePrimaryGuest(booking: BookingEntity) {
    const guests = Array.isArray(booking.booking_guests)
      ? [...booking.booking_guests]
      : [];

    guests.sort((left, right) => {
      const leftOrder = Number(left?.sort_order ?? 0);
      const rightOrder = Number(right?.sort_order ?? 0);
      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }

      return Number(left?.id ?? 0) - Number(right?.id ?? 0);
    });

    return (
      guests.find((guest) => guest.is_primary_contact) || guests[0] || null
    );
  }

  private resolveCustomerName(booking: BookingEntity): string {
    const primaryGuest = this.resolvePrimaryGuest(booking);
    const primaryGuestName =
      `${primaryGuest?.first_name || ''} ${primaryGuest?.last_name || ''}`.trim();
    const customerName =
      `${booking.customer?.first_name || ''} ${booking.customer?.last_name || ''}`.trim() ||
      (booking.customer as any)?.full_name ||
      '';

    return primaryGuestName || customerName || 'Customer';
  }

  private resolveSellerName(booking: BookingEntity): string {
    const sellerUserName =
      `${booking.seller?.user?.first_name || ''} ${booking.seller?.user?.last_name || ''}`.trim();

    return (
      booking.seller?.store_name ||
      sellerUserName ||
      'the provider'
    );
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

  private async resolveCustomerRecipientUserId(
    booking: BookingEntity,
  ): Promise<number | null> {
    const customerId = Number(booking.customer_id ?? booking.customer?.id);
    if (!Number.isFinite(customerId) || customerId <= 0) {
      return null;
    }

    const isGuest =
      typeof booking.customer?.is_guest === 'boolean'
        ? booking.customer.is_guest
        : (
            await this.userRepository.findOne({
              where: { id: customerId },
              select: ['id', 'is_guest'],
            })
          )?.is_guest;

    return isGuest ? null : customerId;
  }

  private async resolveStaffRecipientUserIds(
    booking: BookingEntity,
    options: { suppressUserIds?: number[] } = {},
  ): Promise<number[]> {
    const sellerId = Number(booking.seller_id ?? booking.seller?.id);
    const suppressedIds = new Set(
      (options.suppressUserIds || []).filter(
        (value) => Number.isFinite(value) && value > 0,
      ),
    );
    const recipientIds = new Set<number>();

    const sellerOwnerUserId = await this.resolveSellerOwnerUserId(booking);
    if (
      sellerOwnerUserId &&
      !suppressedIds.has(sellerOwnerUserId) &&
      sellerOwnerUserId > 0
    ) {
      recipientIds.add(sellerOwnerUserId);
    }

    if (Number.isFinite(sellerId) && sellerId > 0) {
      const approverUserIds = await this.resolveApproverUserIds(sellerId);
      for (const approverUserId of approverUserIds) {
        if (!suppressedIds.has(approverUserId) && approverUserId > 0) {
          recipientIds.add(approverUserId);
        }
      }
    }

    return [...recipientIds];
  }

  private async resolveSellerOwnerUserId(
    booking: BookingEntity,
  ): Promise<number | null> {
    if (booking.seller?.user_id) {
      return booking.seller.user_id;
    }

    const sellerId = Number(booking.seller_id ?? booking.seller?.id);
    if (!Number.isFinite(sellerId) || sellerId <= 0) {
      return null;
    }

    const seller = await this.sellerRepository.findOne({
      where: { id: sellerId },
      select: ['id', 'user_id'],
    });

    return seller?.user_id ?? null;
  }

  private async resolveApproverUserIds(sellerId: number): Promise<number[]> {
    const approverGroup = await this.userGroupRepository.findOne({
      where: {
        seller_id: sellerId,
        group_name:
          BookingEmailMirrorNotificationService.BOOKING_APPROVERS_GROUP_NAME,
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

  private buildPaymentEventNotificationConfig(input: {
    eventType: BookingPaymentMirrorEventType;
    booking: BookingEntity;
    rejectionReason?: string | null;
  }): {
    customerConfig: {
      type: NotificationTypeEnum;
      title: string;
      body: string;
    } | null;
    staffConfig: {
      type: NotificationTypeEnum;
      title: string;
      body: string;
    } | null;
  } {
    const bookingLabel = this.resolveBookingLabel(input.booking);
    const serviceTitle = this.resolveServiceTitle(input.booking);
    const customerName = this.resolveCustomerName(input.booking);
    const sellerName = this.resolveSellerName(input.booking);
    const reasonSuffix = input.rejectionReason
      ? ` Reason: ${input.rejectionReason}`
      : '';

    switch (input.eventType) {
      case 'awaiting_confirmation':
        return {
          customerConfig: {
            type: NotificationTypeEnum.BOOKING_PAYMENT_AWAITING_CONFIRMATION,
            title: 'Booking Awaiting Payment Confirmation',
            body: `We received your payment submission for booking ${bookingLabel} for ${serviceTitle}. Your booking is pending store approval.`,
          },
          staffConfig: {
            type: NotificationTypeEnum.BOOKING_PENDING_CONFIRMATION,
            title: 'Booking Awaiting Payment Confirmation',
            body: `${customerName} submitted payment proof for booking ${bookingLabel} for ${serviceTitle}. The booking is awaiting confirmation.`,
          },
        };
      case 'confirmed':
        return {
          customerConfig: {
            type: NotificationTypeEnum.BOOKING_PAYMENT_CONFIRMED,
            title: 'Booking Payment Confirmed',
            body: `Your payment for booking ${bookingLabel} for ${serviceTitle} has been approved by ${sellerName}.`,
          },
          staffConfig: {
            type: NotificationTypeEnum.BOOKING_PAYMENT_CONFIRMED,
            title: 'Booking Payment Confirmed',
            body: `Payment for booking ${bookingLabel} for ${serviceTitle} has been confirmed.`,
          },
        };
      case 'rejected':
        return {
          customerConfig: {
            type: NotificationTypeEnum.BOOKING_PAYMENT_REJECTED,
            title: 'Booking Payment Rejected',
            body: `Your payment for booking ${bookingLabel} for ${serviceTitle} was rejected by ${sellerName}. Please review the details and submit again.${reasonSuffix}`,
          },
          staffConfig: {
            type: NotificationTypeEnum.BOOKING_PAYMENT_REJECTED,
            title: 'Booking Payment Rejected',
            body: `Payment for booking ${bookingLabel} for ${serviceTitle} was rejected.${reasonSuffix}`,
          },
        };
      case 'expired':
        return {
          customerConfig: {
            type: NotificationTypeEnum.BOOKING_PAYMENT_EXPIRED,
            title: 'QR Payment Link Expired',
            body: `Your QR payment link for booking ${bookingLabel} for ${serviceTitle} has expired. Please contact the provider or submit a new booking to proceed.`,
          },
          staffConfig: {
            type: NotificationTypeEnum.BOOKING_PAYMENT_EXPIRED,
            title: 'QR Payment Link Expired',
            body: `The payment link for booking ${bookingLabel} for ${serviceTitle} has expired without payment being submitted.`,
          },
        };
      default:
        return {
          customerConfig: null,
          staffConfig: null,
        };
    }
  }
}
