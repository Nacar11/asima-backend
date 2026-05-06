import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { BaseBookingCancellationRepository } from './persistence/base-booking-cancellation.repository';
import { BookingCancellation } from './domain/booking-cancellation';
import { CreateBookingCancellationDto } from './dto/create-booking-cancellation.dto';
import { QueryBookingCancellationDto } from './dto/query-booking-cancellation.dto';
import { CancellationPreviewDto } from './dto/cancellation-preview.dto';
import { User } from '@/users/domain/user';
import { BookingsService } from '@/bookings/bookings.service';
import { BookingStatusEnum } from '@/bookings/enums/booking-status.enum';
import { CancellationRoleEnum } from './enums/cancellation-role.enum';
import { CancellationPolicyEnum } from './enums/cancellation-policy.enum';
import { EscrowTransactionsService } from '@/escrow-transactions/escrow-transactions.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { BookingNotificationService } from '@/notifications/services/booking-notification.service';
import { VouchersService } from '@/vouchers/vouchers.service';
import { BaseBookingMilestoneRepository } from '@/booking-milestones/persistence/base-booking-milestone.repository';
import {
  isVenueServiceType,
  VENUE_CANCELLATION_NOT_ALLOWED_ERROR_MESSAGE,
} from '@/bookings/utils/venue-booking-policy.util';

/**
 * Booking Cancellations Service.
 *
 * Handles business logic for booking cancellations including policy application,
 * refund calculations, and escrow refund processing.
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class BookingCancellationsService {
  constructor(
    private readonly repository: BaseBookingCancellationRepository,
    @Inject(forwardRef(() => BookingsService))
    private readonly bookingsService: BookingsService,
    private readonly escrowTransactionsService: EscrowTransactionsService,
    private readonly notificationsService: NotificationsService,
    private readonly bookingNotificationService: BookingNotificationService,
    private readonly vouchersService: VouchersService,
    private readonly bookingMilestoneRepository: BaseBookingMilestoneRepository,
  ) {}

  /**
   * Cancel a booking.
   *
   * Calculates refund based on cancellation policy and processes escrow refund.
   *
   * @param bookingId - Booking ID
   * @param createDto - Cancellation details
   * @param user - Current authenticated user
   * @returns Created cancellation record
   */
  async cancelBooking(
    bookingId: number,
    createDto: CreateBookingCancellationDto,
    user: User,
    adminRefundPercent?: number,
  ): Promise<BookingCancellation> {
    // 1. Get booking and validate
    const booking = await this.bookingsService.findById(bookingId, user);
    if (isVenueServiceType(booking.service?.service_type)) {
      throw new BadRequestException(
        VENUE_CANCELLATION_NOT_ALLOWED_ERROR_MESSAGE,
      );
    }

    // 2. Check if booking can be cancelled
    if (booking.status === BookingStatusEnum.CANCELLED) {
      throw new BadRequestException('Booking is already cancelled');
    }

    if (booking.status === BookingStatusEnum.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed booking');
    }

    // 3. Determine cancellation role
    let cancellationRole: CancellationRoleEnum;
    if (booking.customer_id === user.id) {
      cancellationRole = CancellationRoleEnum.CUSTOMER;
    } else if (booking.seller_id === user.seller_id) {
      cancellationRole = CancellationRoleEnum.STORE;
    } else if (user.system_admin) {
      cancellationRole = CancellationRoleEnum.ADMIN;
    } else {
      throw new ForbiddenException(
        'You do not have permission to cancel this booking',
      );
    }

    // 4. Check if already cancelled
    const existingCancellation =
      await this.repository.findByBookingId(bookingId);
    if (existingCancellation) {
      throw new BadRequestException('Booking is already cancelled');
    }

    // 5. Calculate hours before scheduled
    const scheduledDateTime = new Date(
      `${booking.scheduled_date}T${booking.scheduled_start_time}`,
    );
    const now = new Date();
    const hoursBeforeScheduled = Math.floor(
      (scheduledDateTime.getTime() - now.getTime()) / (1000 * 60 * 60),
    );

    // 6. Determine policy and calculate refund
    let policyResult: { policy: CancellationPolicyEnum; feePercent: number };

    if (adminRefundPercent !== undefined) {
      // Admin override - use provided refund percentage
      policyResult = {
        policy: CancellationPolicyEnum.ADMIN_OVERRIDE,
        feePercent: 100 - adminRefundPercent, // Convert refund percent to fee percent
      };
    } else {
      // Normal policy-based calculation
      policyResult = this.calculateCancellationPolicy(
        hoursBeforeScheduled,
        cancellationRole,
        createDto.reason,
      );
    }

    // Calculate refundable amount: for milestone-based bookings, subtract already-released payments
    const refundableAmount = await this.getRefundableAmount(
      bookingId,
      booking.total,
    );

    const refundCalculation = this.calculateRefund(
      refundableAmount,
      policyResult.policy,
      policyResult.feePercent,
      Number(booking.platform_fee_percent ?? 0),
    );

    // 7. Create cancellation record
    const cancellation = new BookingCancellation();
    cancellation.booking_id = bookingId;
    cancellation.cancelled_by = user.id;
    cancellation.cancelled_by_role = cancellationRole;
    cancellation.reason = createDto.reason;
    cancellation.reason_details = createDto.reason_details;
    // Convert scheduled_date to string format YYYY-MM-DD
    const scheduledDate =
      booking.scheduled_date instanceof Date
        ? booking.scheduled_date.toISOString().split('T')[0]
        : String(booking.scheduled_date).split('T')[0];
    cancellation.scheduled_date = scheduledDate;
    cancellation.scheduled_time = booking.scheduled_start_time;
    cancellation.cancelled_at = new Date().toISOString();
    cancellation.hours_before_scheduled = hoursBeforeScheduled;
    cancellation.policy_applied = policyResult.policy;
    cancellation.cancellation_fee_percent = policyResult.feePercent;
    cancellation.cancellation_fee_amount = refundCalculation.cancellationFee;
    cancellation.original_amount = booking.total;
    cancellation.refund_amount = refundCalculation.refundAmount;
    cancellation.store_compensation = refundCalculation.storeCompensation;
    cancellation.platform_fee_refunded = refundCalculation.platformFeeRefunded;
    cancellation.escrow_refunded = refundCalculation.refundAmount;
    cancellation.escrow_released_to_store = refundCalculation.storeCompensation;

    const createdCancellation = await this.repository.create(cancellation);

    // 8. Process escrow refund if refund amount > 0
    if (refundCalculation.refundAmount > 0) {
      await this.escrowTransactionsService.processRefund(
        bookingId,
        refundCalculation.refundAmount,
        1, // Default to currency 1 (currency should come from checkout order)
        `Cancellation refund: ${createDto.reason}`,
        user,
      );
    }

    // 9. Update booking status to cancelled
    await this.bookingsService.updateStatus(
      bookingId,
      {
        status: BookingStatusEnum.CANCELLED,
        notes: createDto.reason_details || undefined,
      },
      user,
    );

    // 9b. Restore vouchers used on this booking
    await this.vouchersService.restoreVouchersForCancelledBooking(
      bookingId,
      booking.sales_order_id ?? undefined,
    );

    // 10. Send cancellation notifications (push + email)
    if (cancellationRole === CancellationRoleEnum.CUSTOMER) {
      // Customer cancelled - push notify seller
      await this.bookingNotificationService.sendBookingCancelledNotification(
        booking,
      );
      // Email all recipients
      this.bookingsService
        .sendBookingLifecycleEmails({
          booking,
          event: 'cancelled_by_customer',
          reason: createDto.reason_details || createDto.reason,
        })
        .catch((error) => {
          console.error(
            `Failed to send cancellation emails for booking ${bookingId}:`,
            error,
          );
        });
    } else {
      // Provider or admin cancelled - push notify customer
      await this.bookingNotificationService.sendBookingCancelledByProviderNotification(
        booking,
        createDto.reason_details || createDto.reason,
      );
      // Email all recipients
      this.bookingsService
        .sendBookingLifecycleEmails({
          booking,
          event: 'cancelled_by_provider',
          reason: createDto.reason_details || createDto.reason,
        })
        .catch((error) => {
          console.error(
            `Failed to send cancellation emails for booking ${bookingId}:`,
            error,
          );
        });
    }

    return createdCancellation;
  }

  /**
   * Calculate cancellation policy based on timing and role.
   *
   * @param hoursBeforeScheduled - Hours before scheduled appointment
   * @param role - Who is cancelling
   * @param reason - Cancellation reason
   * @returns Policy and fee percentage
   */
  private calculateCancellationPolicy(
    hoursBeforeScheduled: number,
    role: CancellationRoleEnum,
    reason: string,
  ): { policy: CancellationPolicyEnum; feePercent: number } {
    // Provider fault - full refund
    if (
      role === CancellationRoleEnum.STORE ||
      role === CancellationRoleEnum.STORE_MEMBER
    ) {
      return {
        policy: CancellationPolicyEnum.PROVIDER_FAULT,
        feePercent: 0,
      };
    }

    // Customer no-show - full charge
    if (reason === 'customer_no_show' || hoursBeforeScheduled < 0) {
      return {
        policy: CancellationPolicyEnum.FULL_CHARGE,
        feePercent: 100,
      };
    }

    // Free cancellation (>48 hours)
    if (hoursBeforeScheduled >= 48) {
      return {
        policy: CancellationPolicyEnum.FREE_CANCELLATION,
        feePercent: 0,
      };
    }

    // Partial charge (24-48 hours)
    if (hoursBeforeScheduled >= 24) {
      return {
        policy: CancellationPolicyEnum.PARTIAL_CHARGE,
        feePercent: 50,
      };
    }

    // Full charge (<24 hours)
    return {
      policy: CancellationPolicyEnum.FULL_CHARGE,
      feePercent: 100,
    };
  }

  /**
   * Calculate refund amounts based on policy.
   *
   * @param originalAmount - Original booking amount
   * @param policy - Cancellation policy
   * @param feePercent - Cancellation fee percentage
   * @returns Refund calculation breakdown
   */
  private calculateRefund(
    originalAmount: number,
    policy: CancellationPolicyEnum,
    feePercent: number,
    platformFeePercent: number,
  ): {
    refundAmount: number;
    cancellationFee: number;
    storeCompensation: number;
    platformFeeRefunded: number;
  } {
    const platformFee = (originalAmount * platformFeePercent) / 100;

    const cancellationFee = (originalAmount * feePercent) / 100;
    const refundAmount = originalAmount - cancellationFee;

    let storeCompensation = 0;
    let platformFeeRefunded = 0;

    if (policy === CancellationPolicyEnum.PROVIDER_FAULT) {
      // Provider fault - full refund, no compensation
      storeCompensation = 0;
      platformFeeRefunded = platformFee;
    } else if (policy === CancellationPolicyEnum.FREE_CANCELLATION) {
      // Free cancellation - full refund
      storeCompensation = 0;
      platformFeeRefunded = platformFee;
    } else {
      // Partial or full charge - store keeps cancellation fee
      storeCompensation = cancellationFee;
      platformFeeRefunded = 0; // Platform fee not refunded if store keeps fee
    }

    return {
      refundAmount,
      cancellationFee,
      storeCompensation,
      platformFeeRefunded,
    };
  }

  /**
   * Find all cancellations with filters.
   *
   * @param queryDto - Query parameters
   * @returns Paginated list of cancellations
   */
  async findAll(queryDto: QueryBookingCancellationDto) {
    return this.repository.findAll(queryDto);
  }

  /**
   * Find cancellation by ID.
   *
   * @param id - Cancellation ID
   * @param user - Current authenticated user
   * @returns Cancellation record
   */
  async findById(id: number): Promise<BookingCancellation> {
    const cancellation = await this.repository.findById(id);
    if (!cancellation) {
      throw new NotFoundException('Cancellation not found');
    }
    return cancellation;
  }

  /**
   * Find cancellation by booking ID.
   *
   * @param bookingId - Booking ID
   * @param user - Current authenticated user
   * @returns Cancellation record or null
   */
  async findByBookingId(
    bookingId: number,
  ): Promise<BookingCancellation | null> {
    return this.repository.findByBookingId(bookingId);
  }

  /**
   * Update cancellation record.
   *
   * Used for admin overrides (e.g., custom refund percentages).
   *
   * @param id - Cancellation ID
   * @param updates - Partial cancellation updates
   * @returns Updated cancellation
   */
  async updateCancellation(
    id: number,
    updates: Partial<BookingCancellation>,
  ): Promise<BookingCancellation> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException('Cancellation not found');
    }

    const updated = { ...existing, ...updates };
    return this.repository.update(id, updated);
  }

  /**
   * Calculate refundable amount for a booking.
   *
   * For milestone-based bookings, subtracts already-released milestone payments
   * from the booking total. This prevents double-refunding amounts that have
   * already been paid out to the provider.
   *
   * @param bookingId - Booking ID
   * @param bookingTotal - Original booking total
   * @returns Refundable amount (total minus released milestone payments)
   */
  private async getRefundableAmount(
    bookingId: number,
    bookingTotal: number,
  ): Promise<number> {
    const total = Number(bookingTotal || 0);
    if (total <= 0) return 0;

    const milestones =
      await this.bookingMilestoneRepository.findByBookingId(bookingId);

    if (!milestones || milestones.length === 0) {
      return total;
    }

    const releasedAmount = milestones
      .filter((m) => m.payment_released)
      .reduce((sum, m) => sum + Number(m.payment_amount || 0), 0);

    return Math.max(0, total - releasedAmount);
  }

  /**
   * Get cancellation preview.
   *
   * Shows preview of refund amounts before confirming cancellation.
   *
   * @param bookingId - Booking ID
   * @param user - Current authenticated user
   * @returns Cancellation preview with refund amounts
   */
  async getCancellationPreview(
    bookingId: number,
    user: User,
  ): Promise<CancellationPreviewDto> {
    // Get booking
    const booking = await this.bookingsService.findById(bookingId, user);
    if (isVenueServiceType(booking.service?.service_type)) {
      throw new BadRequestException(
        VENUE_CANCELLATION_NOT_ALLOWED_ERROR_MESSAGE,
      );
    }

    // Check if booking can be cancelled
    if (booking.status === BookingStatusEnum.CANCELLED) {
      throw new BadRequestException('Booking is already cancelled');
    }

    if (booking.status === BookingStatusEnum.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed booking');
    }

    // Determine cancellation role
    let cancellationRole: CancellationRoleEnum;
    if (booking.customer_id === user.id) {
      cancellationRole = CancellationRoleEnum.CUSTOMER;
    } else if (booking.seller_id === user.seller_id) {
      cancellationRole = CancellationRoleEnum.STORE;
    } else if (user.system_admin) {
      cancellationRole = CancellationRoleEnum.ADMIN;
    } else {
      throw new ForbiddenException(
        'You do not have permission to cancel this booking',
      );
    }

    // Calculate hours before scheduled
    const scheduledDateTime = new Date(
      `${booking.scheduled_date}T${booking.scheduled_start_time}`,
    );
    const now = new Date();
    const hoursBeforeScheduled = Math.floor(
      (scheduledDateTime.getTime() - now.getTime()) / (1000 * 60 * 60),
    );

    // Get policy result
    const policyResult = this.calculateCancellationPolicy(
      hoursBeforeScheduled,
      cancellationRole,
      'preview', // Dummy reason for preview
    );

    // Calculate refundable amount: for milestone-based bookings, subtract already-released payments
    const refundableAmount = await this.getRefundableAmount(
      bookingId,
      booking.total,
    );

    // Calculate refund
    const refundCalculation = this.calculateRefund(
      refundableAmount,
      policyResult.policy,
      policyResult.feePercent,
      Number(booking.platform_fee_percent ?? 0),
    );

    // Generate human-readable message
    let message = '';
    switch (policyResult.policy) {
      case CancellationPolicyEnum.FREE_CANCELLATION:
        message = `Full refund - cancelled more than 48 hours before booking`;
        break;
      case CancellationPolicyEnum.PARTIAL_CHARGE:
        message = `50% refund - cancelled between 24-48 hours before booking`;
        break;
      case CancellationPolicyEnum.FULL_CHARGE:
        message = `No refund - cancelled less than 24 hours before booking`;
        break;
      case CancellationPolicyEnum.PROVIDER_FAULT:
        message = `Full refund - cancelled by provider`;
        break;
      default:
        message = `Refund calculated based on cancellation policy`;
    }

    // Convert scheduled_date to string format YYYY-MM-DD
    const scheduledDate =
      booking.scheduled_date instanceof Date
        ? booking.scheduled_date.toISOString().split('T')[0]
        : String(booking.scheduled_date).split('T')[0];

    return {
      booking_id: bookingId,
      scheduled_date: scheduledDate,
      scheduled_time: booking.scheduled_start_time,
      original_amount: booking.total,
      hours_before_scheduled: hoursBeforeScheduled,
      policy_applied: policyResult.policy,
      cancellation_fee_percent: policyResult.feePercent,
      cancellation_fee_amount: refundCalculation.cancellationFee,
      refund_amount: refundCalculation.refundAmount,
      store_compensation: refundCalculation.storeCompensation,
      message,
    };
  }
}
