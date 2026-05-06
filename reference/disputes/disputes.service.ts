import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { BaseDisputeRepository } from './persistence/base-dispute.repository';
import { Dispute } from './domain/dispute';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { QueryDisputeDto } from './dto/query-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { ProviderRespondDisputeDto } from './dto/provider-respond-dispute.dto';
import { CustomerReplyDisputeDto } from './dto/customer-reply-dispute.dto';
import { DisputeStatusEnum } from './enums/dispute-status.enum';
import { DisputeResolutionEnum } from './enums/dispute-resolution.enum';
import { User } from '@/users/domain/user';
import { BookingsService } from '@/bookings/bookings.service';
import { BookingStatusEnum } from '@/bookings/enums/booking-status.enum';
import { SellersService } from '@/sellers/sellers.service';
import { EscrowTransactionsService } from '@/escrow-transactions/escrow-transactions.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { NotificationTypeEnum } from '@/notifications/enums/notification-type.enum';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { BaseBookingMilestoneRepository } from '@/booking-milestones/persistence/base-booking-milestone.repository';
import { formatCurrency } from '@/utils/currency.util';
import { BaseDisputeMessageRepository } from './persistence/base-dispute-message.repository';
import { DisputeMessage } from './domain/dispute-message';
import {
  isVenueServiceType,
  VENUE_DISPUTE_NOT_ALLOWED_ERROR_MESSAGE,
} from '@/bookings/utils/venue-booking-policy.util';

/**
 * Disputes Service.
 *
 * Handles business logic for customer-initiated disputes on completed bookings.
 * Manages dispute lifecycle: creation, evidence, provider response, and resolution.
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class DisputesService {
  private readonly logger = new Logger(DisputesService.name);

  constructor(
    private readonly repository: BaseDisputeRepository,
    private readonly messageRepository: BaseDisputeMessageRepository,
    @Inject(forwardRef(() => BookingsService))
    private readonly bookingsService: BookingsService,
    private readonly sellersService: SellersService,
    @Inject(forwardRef(() => EscrowTransactionsService))
    private readonly escrowTransactionsService: EscrowTransactionsService,
    private readonly notificationsService: NotificationsService,
    private readonly bookingMilestoneRepository: BaseBookingMilestoneRepository,
  ) {}

  /**
   * Create a dispute on a completed booking.
   *
   * Validates booking is COMPLETED, user is the customer, and no existing
   * open dispute exists. Creates dispute, updates booking status to DISPUTED,
   * holds escrow funds, and notifies seller + admin.
   *
   * @param input - Create dispute DTO
   * @param user - Current authenticated user (customer)
   * @returns Created dispute
   */
  async createDispute(input: CreateDisputeDto, user: User): Promise<Dispute> {
    // 1. Validate booking exists
    const booking = await this.bookingsService.findById(input.booking_id, user);
    if (!booking) {
      throw new NotFoundException(
        `Booking with ID ${input.booking_id} not found`,
      );
    }
    if (isVenueServiceType(booking.service?.service_type)) {
      throw new BadRequestException(VENUE_DISPUTE_NOT_ALLOWED_ERROR_MESSAGE);
    }

    // 2. Validate booking is COMPLETED
    if (booking.status !== BookingStatusEnum.COMPLETED) {
      throw new BadRequestException('Only completed bookings can be disputed');
    }

    // 3. Validate user is the customer
    if (booking.customer_id !== user.id) {
      throw new ForbiddenException(
        'Only the customer of this booking can file a dispute',
      );
    }

    // 4. Validate no existing open dispute for this booking
    const existingDispute = await this.repository.findByBookingId(
      input.booking_id,
    );
    if (existingDispute) {
      throw new BadRequestException(
        'A dispute already exists for this booking',
      );
    }

    // 5. Generate dispute number
    const disputeNumber = this.generateDisputeNumber();

    // 6. Create dispute record
    const dispute = new Dispute();
    dispute.booking_id = input.booking_id;
    dispute.customer_id = user.id;
    dispute.seller_id = booking.seller_id;
    dispute.dispute_number = disputeNumber;
    dispute.status = DisputeStatusEnum.OPEN;
    dispute.reason = input.reason;
    dispute.description = input.description;
    dispute.evidence_urls = input.evidence_urls || null;
    dispute.requested_resolution = input.requested_resolution || null;
    dispute.requested_refund_amount = input.requested_refund_amount || null;
    dispute.refund_amount = 0;
    dispute.created_by = user as any;

    const createdDispute = await this.repository.create(dispute);

    // 7. Update booking status to DISPUTED
    await this.bookingsService.updateStatus(
      input.booking_id,
      { status: BookingStatusEnum.DISPUTED } as any,
      user,
    );

    // 8. Hold escrow funds (only unreleased portion for milestone-based bookings)
    try {
      const checkoutOrder = booking.checkout_order;
      const currencyId = checkoutOrder?.currency_id || null;
      const holdAmount = await this.getDisputeHoldAmount(
        input.booking_id,
        Number(booking.total || 0),
      );

      if (holdAmount > 0) {
        await this.escrowTransactionsService.holdForDispute(
          input.booking_id,
          holdAmount,
          currencyId,
          `Dispute hold: ${disputeNumber}`,
          user,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to hold escrow for dispute ${disputeNumber}:`,
        error,
      );
    }

    // 9. Notify seller
    try {
      if (booking.seller?.user_id) {
        await this.notificationsService.notify(
          booking.seller.user_id,
          NotificationTypeEnum.DISPUTE_FILED,
          'Dispute Filed',
          `Customer has filed a dispute for booking #${booking.booking_number}. Reason: ${input.reason}.`,
          'dispute',
          createdDispute.id,
          `/disputes/${createdDispute.id}`,
        );
      }
    } catch (error) {
      this.logger.error(
        'Failed to send dispute notification to seller:',
        error,
      );
    }

    // 10. Notify admin
    try {
      await this.notificationsService.notify(
        0, // admin user ID (system)
        NotificationTypeEnum.DISPUTE_FILED_ADMIN,
        'New Dispute Filed',
        `Dispute ${disputeNumber} filed for booking #${booking.booking_number}. Reason: ${input.reason}.`,
        'dispute',
        createdDispute.id,
        `/admin/disputes/${createdDispute.id}`,
      );
    } catch (error) {
      this.logger.error('Failed to send dispute notification to admin:', error);
    }

    return createdDispute;
  }

  /**
   * Add evidence to an existing dispute.
   *
   * @param disputeId - Dispute ID
   * @param evidenceUrls - Array of evidence URLs
   * @param user - Current authenticated user
   * @returns Updated dispute
   */
  async addEvidence(
    disputeId: number,
    evidenceUrls: string[] = [],
    user: User,
  ): Promise<Dispute> {
    const dispute = await this.findById(disputeId);

    // Validate user is the customer
    if (dispute.customer_id !== user.id) {
      throw new ForbiddenException(
        'Only the customer can add evidence to this dispute',
      );
    }

    // Validate dispute is still open or under review
    if (
      dispute.status !== DisputeStatusEnum.OPEN &&
      dispute.status !== DisputeStatusEnum.UNDER_REVIEW
    ) {
      throw new BadRequestException(
        'Cannot add evidence to a resolved or closed dispute',
      );
    }

    if (!Array.isArray(evidenceUrls) || evidenceUrls.length === 0) {
      throw new BadRequestException('At least one evidence URL is required');
    }

    // Append to existing evidence
    const existingUrls = dispute.evidence_urls || [];
    const updatedUrls = [...existingUrls, ...evidenceUrls];

    const updatedDispute = await this.repository.update(disputeId, {
      evidence_urls: updatedUrls,
      updated_by: { id: user.id } as any,
    });

    // Notify seller about new evidence
    try {
      const booking = await this.bookingsService.findById(
        dispute.booking_id,
        user,
      );
      if (booking?.seller?.user_id) {
        await this.notificationsService.notify(
          booking.seller.user_id,
          NotificationTypeEnum.DISPUTE_EVIDENCE_ADDED,
          'New Evidence Added',
          `Customer has added new evidence to dispute ${dispute.dispute_number}.`,
          'dispute',
          disputeId,
          `/disputes/${disputeId}`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to send evidence notification:', error);
    }

    return updatedDispute;
  }

  /**
   * Find a dispute by ID.
   *
   * @param disputeId - Dispute ID
   * @returns Dispute
   * @throws NotFoundException if not found
   */
  async findById(disputeId: number): Promise<Dispute> {
    const dispute = await this.repository.findById(disputeId);
    if (!dispute) {
      throw new NotFoundException(`Dispute with ID ${disputeId} not found`);
    }
    return dispute;
  }

  /**
   * Find a dispute by booking ID.
   *
   * @param bookingId - Booking ID
   * @returns Dispute or null
   */
  async findByBookingId(bookingId: number): Promise<Dispute | null> {
    return this.repository.findByBookingId(bookingId);
  }

  /**
   * Find all disputes (admin).
   *
   * @param query - Query parameters
   * @returns Paginated disputes
   */
  async findAll(query: QueryDisputeDto): Promise<IPaginatedResult<Dispute>> {
    return this.repository.findAllWithPagination({
      filterQuery: {
        status: query.status,
        booking_id: query.booking_id,
        customer_id: query.customer_id,
        seller_id: query.seller_id,
      },
      paginationOptions: {
        page: query.page || 1,
        limit: query.limit || 20,
      },
    });
  }

  /**
   * Find disputes by customer ID.
   *
   * @param customerId - Customer user ID
   * @param query - Query parameters
   * @returns Paginated disputes
   */
  async findByCustomerId(
    customerId: number,
    query: QueryDisputeDto,
  ): Promise<IPaginatedResult<Dispute>> {
    return this.repository.findByCustomerId(
      customerId,
      { page: query.page || 1, limit: query.limit || 20 },
      { status: query.status },
    );
  }

  /**
   * Find disputes by seller ID.
   *
   * @param sellerId - Seller ID
   * @param query - Query parameters
   * @returns Paginated disputes
   */
  async findBySellerId(
    sellerId: number,
    query: QueryDisputeDto,
  ): Promise<IPaginatedResult<Dispute>> {
    return this.repository.findBySellerId(
      sellerId,
      { page: query.page || 1, limit: query.limit || 20 },
      { status: query.status },
    );
  }

  /**
   * Provider responds to a dispute.
   *
   * Validates user is the seller of the booking, dispute is open/under_review.
   * Saves provider response, updates status to UNDER_REVIEW, notifies customer + admin.
   *
   * @param disputeId - Dispute ID
   * @param input - Provider response DTO
   * @param user - Current authenticated user (provider)
   * @returns Updated dispute
   */
  async respondToDispute(
    disputeId: number,
    input: ProviderRespondDisputeDto,
    user: User,
  ): Promise<Dispute> {
    const dispute = await this.findById(disputeId);

    // Validate user is the seller
    const seller = await this.sellersService.findByUserId(user.id);
    if (!seller || dispute.seller_id !== seller.id) {
      throw new ForbiddenException(
        'Only the seller of this booking can respond to the dispute',
      );
    }

    // Validate dispute status allows response
    if (
      dispute.status !== DisputeStatusEnum.OPEN &&
      dispute.status !== DisputeStatusEnum.UNDER_REVIEW
    ) {
      throw new BadRequestException(
        'Cannot respond to a resolved or closed dispute',
      );
    }

    // Update dispute with provider response
    const updatePayload: Partial<Dispute> = {
      provider_response: input.response,
      provider_responded_at: new Date(),
      updated_by: user as any,
    };

    if (input.provider_evidence_urls?.length) {
      const existingUrls = dispute.provider_evidence_urls || [];
      updatePayload.provider_evidence_urls = [
        ...existingUrls,
        ...input.provider_evidence_urls,
      ];
    }

    // Transition to UNDER_REVIEW if was OPEN
    if (dispute.status === DisputeStatusEnum.OPEN) {
      updatePayload.status = DisputeStatusEnum.UNDER_REVIEW;
    }

    const updatedDispute = await this.repository.update(
      disputeId,
      updatePayload,
    );

    await this.createConversationMessage({
      disputeId,
      senderId: user.id,
      senderRole: 'seller',
      message: input.response,
      attachmentUrls: input.provider_evidence_urls,
    });

    // Notify customer about provider response
    try {
      await this.notificationsService.notify(
        dispute.customer_id,
        NotificationTypeEnum.DISPUTE_PROVIDER_RESPONDED,
        'Provider Responded to Dispute',
        `The provider has responded to your dispute ${dispute.dispute_number}.`,
        'dispute',
        disputeId,
        `/disputes/${disputeId}`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to send provider response notification:',
        error,
      );
    }

    return updatedDispute;
  }

  /**
   * Customer replies to a provider's dispute response.
   *
   * Validates user is the customer who filed the dispute,
   * dispute is open/under_review, and provider has responded.
   *
   * @param disputeId - Dispute ID
   * @param input - Customer reply DTO
   * @param user - Current authenticated user (customer)
   * @returns Updated dispute
   */
  async customerReplyToDispute(
    disputeId: number,
    input: CustomerReplyDisputeDto,
    user: User,
  ): Promise<Dispute> {
    const dispute = await this.findById(disputeId);

    // Validate user is the customer who filed the dispute
    if (dispute.customer_id !== user.id) {
      throw new ForbiddenException(
        'Only the customer who filed this dispute can reply',
      );
    }

    // Validate dispute status allows reply
    if (
      dispute.status !== DisputeStatusEnum.OPEN &&
      dispute.status !== DisputeStatusEnum.UNDER_REVIEW
    ) {
      throw new BadRequestException(
        'Cannot reply to a resolved or closed dispute',
      );
    }

    // Validate provider has responded
    if (!dispute.provider_response) {
      throw new BadRequestException(
        'Cannot reply before the provider has responded',
      );
    }

    const updatedDispute = await this.repository.update(disputeId, {
      customer_reply: input.reply,
      customer_replied_at: new Date(),
      updated_by: user as any,
    });

    await this.createConversationMessage({
      disputeId,
      senderId: user.id,
      senderRole: 'customer',
      message: input.reply,
      attachmentUrls: input.attachment_urls,
    });

    // Notify provider about customer reply
    try {
      const booking = await this.bookingsService.findById(
        dispute.booking_id,
        user,
      );
      if (booking?.seller?.user_id) {
        await this.notificationsService.notify(
          booking.seller.user_id,
          NotificationTypeEnum.DISPUTE_CUSTOMER_REPLIED,
          'Customer Replied to Dispute',
          `The customer has replied to your response on dispute ${dispute.dispute_number}.`,
          'dispute',
          disputeId,
          `/disputes/${disputeId}`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to send customer reply notification:', error);
    }

    return updatedDispute;
  }

  /**
   * Add provider evidence to a dispute.
   *
   * @param disputeId - Dispute ID
   * @param evidenceUrls - Array of evidence URLs
   * @param user - Current authenticated user (provider)
   * @returns Updated dispute
   */
  async addProviderEvidence(
    disputeId: number,
    evidenceUrls: string[] = [],
    user: User,
  ): Promise<Dispute> {
    const dispute = await this.findById(disputeId);

    // Validate user is the seller
    const seller = await this.sellersService.findByUserId(user.id);
    if (!seller || dispute.seller_id !== seller.id) {
      throw new ForbiddenException(
        'Only the seller can add evidence to this dispute',
      );
    }

    // Validate dispute status
    if (
      dispute.status !== DisputeStatusEnum.OPEN &&
      dispute.status !== DisputeStatusEnum.UNDER_REVIEW
    ) {
      throw new BadRequestException(
        'Cannot add evidence to a resolved or closed dispute',
      );
    }

    if (!Array.isArray(evidenceUrls) || evidenceUrls.length === 0) {
      throw new BadRequestException('At least one evidence URL is required');
    }

    // Append to existing provider evidence
    const existingUrls = dispute.provider_evidence_urls || [];
    const updatedUrls = [...existingUrls, ...evidenceUrls];

    return this.repository.update(disputeId, {
      provider_evidence_urls: updatedUrls,
      updated_by: { id: user.id } as any,
    });
  }

  /**
   * Resolve a dispute (admin action).
   *
   * Handles refund logic based on resolution type:
   * - full_refund → processRefund(fullAmount)
   * - partial_refund → processRefund(partial) + releaseFromDispute(remaining)
   * - no_refund → releaseFromDispute(fullAmount)
   * - redo_service / mutual_agreement → custom handling
   *
   * @param disputeId - Dispute ID
   * @param input - Resolve dispute DTO
   * @param user - Current authenticated admin user
   * @returns Updated dispute
   */
  async resolveDispute(
    disputeId: number,
    input: ResolveDisputeDto,
    user: User,
  ): Promise<Dispute> {
    const dispute = await this.findById(disputeId);

    // Validate dispute is not already resolved
    if (
      dispute.status === DisputeStatusEnum.RESOLVED ||
      dispute.status === DisputeStatusEnum.CLOSED
    ) {
      throw new BadRequestException('Dispute is already resolved or closed');
    }

    // Get booking for escrow operations
    const booking = await this.bookingsService.findById(
      dispute.booking_id,
      user,
      true,
    );
    if (!booking) {
      throw new NotFoundException(
        `Booking with ID ${dispute.booking_id} not found`,
      );
    }

    const checkoutOrder = booking.checkout_order;
    const currencyId = checkoutOrder?.currency_id || null;
    const totalAmount = Number(booking.total || 0);
    // For milestone-based bookings, only the unreleased portion is disputable
    const disputeAmount = await this.getDisputeHoldAmount(
      dispute.booking_id,
      totalAmount,
    );

    // Process based on resolution type
    let refundAmount = 0;

    try {
      switch (input.resolution) {
        case DisputeResolutionEnum.FULL_REFUND:
          refundAmount = input.refund_amount || disputeAmount;
          if (refundAmount > disputeAmount) {
            refundAmount = disputeAmount; // Cap at disputable amount
          }
          if (refundAmount > 0) {
            await this.escrowTransactionsService.processRefund(
              dispute.booking_id,
              refundAmount,
              currencyId,
              `Full refund for dispute ${dispute.dispute_number}`,
              user,
            );
          }
          break;

        case DisputeResolutionEnum.PARTIAL_REFUND:
          refundAmount = input.refund_amount || 0;
          if (refundAmount <= 0) {
            throw new BadRequestException(
              'Refund amount is required for partial refund',
            );
          }
          if (refundAmount > disputeAmount) {
            throw new BadRequestException(
              'Refund amount cannot exceed disputable amount (unreleased escrow)',
            );
          }
          // Refund partial to customer
          await this.escrowTransactionsService.processRefund(
            dispute.booking_id,
            refundAmount,
            currencyId,
            `Partial refund for dispute ${dispute.dispute_number}`,
            user,
          );
          // Release remaining to provider
          const remaining = disputeAmount - refundAmount;
          if (remaining > 0 && booking.seller?.user_id) {
            await this.escrowTransactionsService.releaseFromDispute(
              dispute.booking_id,
              remaining,
              currencyId,
              booking.seller.user_id,
              `Dispute release (remaining) for ${dispute.dispute_number}`,
              user,
            );
          }
          break;

        case DisputeResolutionEnum.NO_REFUND:
          // Release all held funds to provider
          if (disputeAmount > 0 && booking.seller?.user_id) {
            await this.escrowTransactionsService.releaseFromDispute(
              dispute.booking_id,
              disputeAmount,
              currencyId,
              booking.seller.user_id,
              `No refund — funds released for dispute ${dispute.dispute_number}`,
              user,
            );
          }
          break;

        case DisputeResolutionEnum.REDO_SERVICE:
        case DisputeResolutionEnum.MUTUAL_AGREEMENT:
          // Custom handling — no automatic escrow action
          refundAmount = input.refund_amount || 0;
          break;
      }
    } catch (error) {
      this.logger.error(
        `Failed to process escrow for dispute ${dispute.dispute_number}:`,
        error,
      );
      throw error;
    }

    // Update dispute status based on resolution
    const finalStatus =
      input.resolution === DisputeResolutionEnum.NO_REFUND
        ? DisputeStatusEnum.CLOSED
        : DisputeStatusEnum.RESOLVED;

    const updatedDispute = await this.repository.update(disputeId, {
      status: finalStatus,
      resolution: input.resolution,
      resolution_notes: input.resolution_notes || null,
      resolved_by: user.id,
      resolved_at: new Date(),
      refund_amount: refundAmount,
      updated_by: user as any,
    });

    // Keep booking status as DISPUTED after resolution to preserve dispute history/visibility.

    // Notify customer
    try {
      const hasRefund =
        input.resolution === DisputeResolutionEnum.FULL_REFUND ||
        input.resolution === DisputeResolutionEnum.PARTIAL_REFUND;

      await this.notificationsService.notify(
        dispute.customer_id,
        hasRefund
          ? NotificationTypeEnum.DISPUTE_RESOLVED_REFUND
          : NotificationTypeEnum.DISPUTE_RESOLVED_NO_REFUND,
        'Dispute Resolved',
        hasRefund
          ? `Your dispute ${dispute.dispute_number} has been resolved. A refund of ${formatCurrency(refundAmount)} will be processed.`
          : `Your dispute ${dispute.dispute_number} has been resolved. Resolution: ${input.resolution}.`,
        'dispute',
        disputeId,
        `/disputes/${disputeId}`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to send resolution notification to customer:',
        error,
      );
    }

    // Notify seller
    try {
      if (booking.seller?.user_id) {
        await this.notificationsService.notify(
          booking.seller.user_id,
          NotificationTypeEnum.DISPUTE_RESOLVED,
          'Dispute Resolved',
          `Dispute ${dispute.dispute_number} for booking #${booking.booking_number} has been resolved. Resolution: ${input.resolution}.`,
          'dispute',
          disputeId,
          `/disputes/${disputeId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        'Failed to send resolution notification to seller:',
        error,
      );
    }

    return updatedDispute;
  }

  /**
   * Calculate the disputable/holdable amount for a booking.
   *
   * For milestone-based bookings, subtracts already-released milestone payments
   * from the booking total. Only the unreleased escrow portion can be held or refunded.
   *
   * @param bookingId - Booking ID
   * @param bookingTotal - Original booking total
   * @returns Disputable amount (total minus released milestone payments)
   */
  private async getDisputeHoldAmount(
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
   * Generate a unique dispute number.
   *
   * Format: DSP-YYYYMMDD-XXXX (e.g., DSP-20260211-1234)
   */
  private generateDisputeNumber(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `DSP-${dateStr}-${random}`;
  }

  private async createConversationMessage(input: {
    disputeId: number;
    senderId: number;
    senderRole: 'customer' | 'seller';
    message: string;
    attachmentUrls?: string[] | null;
  }): Promise<void> {
    const text = input.message.trim();
    if (!text) return;

    const message = new DisputeMessage();
    message.dispute_id = input.disputeId;
    message.sender_id = input.senderId;
    message.sender_role = input.senderRole;
    message.message = text;
    message.attachment_urls = input.attachmentUrls ?? null;

    await this.messageRepository.create(message);
  }
}
