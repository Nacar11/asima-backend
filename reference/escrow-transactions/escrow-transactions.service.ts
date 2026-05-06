import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { BaseEscrowTransactionRepository } from './persistence/base-escrow-transaction.repository';
import { EscrowTransaction } from './domain/escrow-transaction';
import { CreateEscrowTransactionDto } from './dto/create-escrow-transaction.dto';
import { UpdateEscrowTransactionDto } from './dto/update-escrow-transaction.dto';
import { QueryEscrowTransactionDto } from './dto/query-escrow-transaction.dto';
import { ReleaseEscrowDto } from './dto/release-escrow.dto';
import { User } from '@/users/domain/user';
import { EscrowTransactionTypeEnum } from './enums/escrow-transaction-type.enum';
import { EscrowTransactionStatusEnum } from './enums/escrow-transaction-status.enum';
import { BookingsService } from '@/bookings/bookings.service';
import { BookingStatusEnum } from '@/bookings/enums/booking-status.enum';
import { BookingMilestonesService } from '@/booking-milestones/booking-milestones.service';
import { BaseBookingMilestoneRepository } from '@/booking-milestones/persistence/base-booking-milestone.repository';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { NotificationsService } from '@/notifications/notifications.service';
import { NotificationTypeEnum } from '@/notifications/enums/notification-type.enum';
import { formatCurrency } from '@/utils/currency.util';
import {
  isVenueServiceType,
  VENUE_REFUND_NOT_ALLOWED_ERROR_MESSAGE,
} from '@/bookings/utils/venue-booking-policy.util';

/**
 * Escrow Transactions Service.
 *
 * Handles business logic for escrow transactions. Manages deposits,
 * releases, refunds, and dispute holds for booking payments.
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class EscrowTransactionsService {
  constructor(
    private readonly repository: BaseEscrowTransactionRepository,
    @Inject(forwardRef(() => BookingsService))
    private readonly bookingsService: BookingsService,
    @Inject(forwardRef(() => BookingMilestonesService))
    private readonly bookingMilestonesService: BookingMilestonesService,
    private readonly bookingMilestoneRepository: BaseBookingMilestoneRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async findBookingForActor(bookingId: number, user: User) {
    return this.bookingsService.findById(
      bookingId,
      user,
      Boolean(user?.system_admin),
    );
  }

  /**
   * Create a deposit transaction when booking is paid.
   *
   * Called when a checkout payment is completed for a booking.
   * Records the deposit of funds into escrow.
   *
   * @param bookingId - Booking ID
   * @param amount - Amount deposited
   * @param currencyId - Currency ID
   * @param user - Current authenticated user
   * @returns Created escrow transaction
   */
  async createDeposit(
    bookingId: number,
    amount: number,
    currencyId: number,
    user: User,
  ): Promise<EscrowTransaction> {
    // Validate booking exists
    const booking = await this.findBookingForActor(bookingId, user);
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }

    // Create deposit transaction
    const transaction = new EscrowTransaction();
    transaction.booking_id = bookingId;
    transaction.milestone_id = null;
    transaction.transaction_type = EscrowTransactionTypeEnum.DEPOSIT;
    transaction.amount = amount;
    transaction.currency_id = currencyId;
    transaction.status = EscrowTransactionStatusEnum.COMPLETED;
    transaction.notes = `Deposit for booking ${booking.booking_number}`;
    transaction.processed_by = user.id;
    transaction.processed_at = new Date();
    transaction.created_by = user as any;

    return this.repository.create(transaction);
  }

  /**
   * Create a deposit for a booking (internal, no user context required).
   *
   * Idempotent: if a COMPLETED deposit already exists for this booking,
   * returns the existing one instead of creating a duplicate.
   *
   * Currently called at booking creation time to simulate payment collection.
   * TODO: When DragonPay is integrated, move this call to the payment
   * webhook/postback handler so deposits are only created after real payment.
   *
   * @param bookingId - Booking ID
   * @param amount - Amount deposited
   * @param currencyId - Currency ID (null if not yet known from payment gateway)
   * @param bookingNumber - Booking number for notes
   * @returns Created or existing escrow transaction
   */
  async createDepositForBooking(
    bookingId: number,
    amount: number,
    currencyId: number | null,
    bookingNumber: string,
  ): Promise<EscrowTransaction> {
    // Guard: Check for existing COMPLETED deposit (idempotent for retries)
    const existingDeposits = await this.repository.findByTransactionType(
      EscrowTransactionTypeEnum.DEPOSIT,
      bookingId,
    );
    const completedDeposit = existingDeposits.find(
      (d) => d.status === EscrowTransactionStatusEnum.COMPLETED,
    );
    if (completedDeposit) {
      return completedDeposit;
    }

    const transaction = new EscrowTransaction();
    transaction.booking_id = bookingId;
    transaction.milestone_id = null;
    transaction.transaction_type = EscrowTransactionTypeEnum.DEPOSIT;
    transaction.amount = amount;
    transaction.currency_id = currencyId;
    transaction.status = EscrowTransactionStatusEnum.COMPLETED;
    transaction.notes = `Deposit for booking ${bookingNumber}`;
    transaction.processed_at = new Date();

    return this.repository.create(transaction);
  }

  /**
   * Release full booking escrow to provider on completion.
   *
   * Called when provider completes a booking (manual or auto-complete).
   * Releases the full booking amount in one shot (no milestone-based release).
   *
   * Guards:
   * - Booking must be COMPLETED
   * - Booking must not be DISPUTED
   * - A DEPOSIT must exist for the booking
   * - No existing RELEASE must exist (prevents double-release)
   *
   * @param bookingId - Booking ID
   * @param user - User performing the action (null for system/cron)
   * @returns Created escrow transaction
   */
  async releaseFullBooking(
    bookingId: number,
    user: User | null,
  ): Promise<EscrowTransaction> {
    // Fetch booking (internal, no auth check)
    const booking = await this.bookingsService.findByIdInternal(bookingId);

    // Guard: Booking must be COMPLETED
    if (booking.status !== BookingStatusEnum.COMPLETED) {
      throw new BadRequestException(
        `Cannot release escrow for booking with status: ${booking.status}`,
      );
    }

    // Guard: Check for existing RELEASE (prevent double-release)
    const existingReleases = await this.repository.findByTransactionType(
      EscrowTransactionTypeEnum.RELEASE,
      bookingId,
    );
    const activeRelease = existingReleases.find(
      (r) => r.status !== EscrowTransactionStatusEnum.FAILED,
    );
    if (activeRelease) {
      throw new BadRequestException('Escrow already released for this booking');
    }

    // Guard: Verify a DEPOSIT exists
    const deposits = await this.repository.findByTransactionType(
      EscrowTransactionTypeEnum.DEPOSIT,
      bookingId,
    );
    const completedDeposit = deposits.find(
      (d) => d.status === EscrowTransactionStatusEnum.COMPLETED,
    );
    if (!completedDeposit) {
      throw new BadRequestException('No escrow deposit found for this booking');
    }

    // Determine released_to (seller's user_id)
    const releasedTo = booking.seller?.user_id || null;

    // Create RELEASE transaction
    const transaction = new EscrowTransaction();
    transaction.booking_id = bookingId;
    transaction.milestone_id = null;
    transaction.transaction_type = EscrowTransactionTypeEnum.RELEASE;
    transaction.amount = booking.total;
    transaction.currency_id = completedDeposit.currency_id;
    transaction.released_to = releasedTo;
    transaction.release_method = 'platform';
    transaction.status = EscrowTransactionStatusEnum.COMPLETED;
    transaction.notes = `Full booking release for booking #${booking.booking_number}`;
    transaction.processed_at = new Date();
    if (user) {
      transaction.processed_by = user.id;
      transaction.created_by = user as any;
    }

    const createdTransaction = await this.repository.create(transaction);

    // Notify seller only. Customer receives BOOKING_COMPLETED from
    // completeService → sendBookingCompletedNotification; the escrow flow
    // is internal accounting and does not need to surface to the buyer.
    try {
      if (releasedTo) {
        await this.notificationsService.notify(
          releasedTo,
          NotificationTypeEnum.ESCROW_RELEASED,
          'Payment Released!',
          `${formatCurrency(booking.total)} has been released for booking #${booking.booking_number}.`,
          'booking',
          bookingId,
          `/bookings/${bookingId}`,
        );
      }
    } catch (error) {
      console.error('Failed to send escrow release notification:', error);
    }

    return createdTransaction;
  }

  /**
   * Release escrow funds to provider after milestone approval.
   *
   * Called when a milestone is approved. Releases the milestone payment
   * amount from escrow to the provider.
   *
   * @param milestoneId - Milestone ID
   * @param input - Release escrow DTO
   * @param user - Current authenticated user
   * @returns Created escrow transaction
   */
  async releaseToProvider(
    milestoneId: number,
    input: ReleaseEscrowDto,
    user: User,
  ): Promise<EscrowTransaction> {
    // Validate milestone exists and is approved
    const milestone = await this.bookingMilestonesService.findById(
      milestoneId,
      user,
    );
    if (!milestone) {
      throw new NotFoundException(`Milestone with ID ${milestoneId} not found`);
    }

    if (milestone.payment_released) {
      throw new BadRequestException(
        'Payment already released for this milestone',
      );
    }

    // Get booking to determine seller
    const booking = await this.findBookingForActor(milestone.booking_id, user);
    if (!booking) {
      throw new NotFoundException(
        `Booking with ID ${milestone.booking_id} not found`,
      );
    }

    // Get checkout order to get currency_id
    const checkoutOrder = booking.checkout_order;
    const currencyId = checkoutOrder?.currency_id || null;

    // Determine release amount (use milestone payment_amount if not specified)
    const releaseAmount = input.amount || milestone.payment_amount;

    if (releaseAmount > milestone.payment_amount) {
      throw new BadRequestException(
        'Release amount cannot exceed milestone payment amount',
      );
    }

    // Determine released_to (seller's user_id)
    const releasedTo = input.released_to || booking.seller_id;

    // Create release transaction
    const transaction = new EscrowTransaction();
    transaction.booking_id = milestone.booking_id;
    transaction.milestone_id = milestoneId;
    transaction.transaction_type = EscrowTransactionTypeEnum.RELEASE;
    transaction.amount = releaseAmount;
    transaction.currency_id = currencyId;
    transaction.released_to = releasedTo;
    transaction.release_method = input.release_method || 'bank_transfer';
    transaction.status = EscrowTransactionStatusEnum.PENDING;
    transaction.reference_number = input.reference_number || null;
    transaction.notes =
      input.notes ||
      `Release for milestone: ${milestone.name} (${milestone.sequence_order})`;
    transaction.created_by = user as any;

    const createdTransaction = await this.repository.create(transaction);

    // Mark milestone payment as released
    await this.bookingMilestoneRepository.update(milestoneId, {
      payment_released: true,
      payment_released_at: new Date(),
    } as any);

    // Notify seller only. Customer does not receive escrow-release pushes —
    // milestone progress surfaces through other booking/quotation notifications.
    try {
      if (booking.seller?.user_id) {
        await this.notificationsService.notify(
          booking.seller.user_id,
          NotificationTypeEnum.MILESTONE_PAYMENT_RELEASED,
          'Payment Released!',
          `₱${releaseAmount.toFixed(2)} has been released for milestone "${milestone.name}".`,
          'booking',
          milestone.booking_id,
          `/bookings/${milestone.booking_id}`,
        );
      }
    } catch (error) {
      console.error('Failed to send milestone payment notification:', error);
    }

    return createdTransaction;
  }

  /**
   * Process refund when booking is cancelled.
   *
   * Creates a refund transaction to return funds to customer.
   *
   * @param bookingId - Booking ID
   * @param amount - Refund amount
   * @param currencyId - Currency ID
   * @param notes - Refund notes
   * @param user - Current authenticated user
   * @returns Created escrow transaction
   */
  async processRefund(
    bookingId: number,
    amount: number,
    currencyId: number,
    notes: string,
    user: User,
  ): Promise<EscrowTransaction> {
    // Validate booking exists
    const booking = await this.findBookingForActor(bookingId, user);
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }
    if (isVenueServiceType(booking.service?.service_type)) {
      throw new BadRequestException(VENUE_REFUND_NOT_ALLOWED_ERROR_MESSAGE);
    }

    // Create refund transaction
    const transaction = new EscrowTransaction();
    transaction.booking_id = bookingId;
    transaction.milestone_id = null;
    transaction.transaction_type = EscrowTransactionTypeEnum.REFUND;
    transaction.amount = amount;
    transaction.currency_id = currencyId;
    transaction.status = EscrowTransactionStatusEnum.PENDING;
    transaction.notes = notes || `Refund for booking ${booking.booking_number}`;
    transaction.created_by = user as any;

    const createdTransaction = await this.repository.create(transaction);

    // Send notification to buyer (REFUND_PROCESSED)
    try {
      await this.notificationsService.notify(
        booking.customer_id,
        NotificationTypeEnum.REFUND_PROCESSED,
        'Refund Processed',
        `A refund of ${formatCurrency(amount)} has been initiated for booking #${booking.booking_number}.`,
        'booking',
        bookingId,
        `/bookings/${bookingId}`,
      );
    } catch (error) {
      console.error('Failed to send refund notification:', error);
    }

    return createdTransaction;
  }

  /**
   * Hold funds in escrow for dispute.
   *
   * Creates a dispute hold transaction to prevent funds from being released.
   *
   * @param bookingId - Booking ID
   * @param amount - Amount to hold
   * @param currencyId - Currency ID
   * @param notes - Hold notes
   * @param user - Current authenticated user
   * @returns Created escrow transaction
   */
  async holdForDispute(
    bookingId: number,
    amount: number,
    currencyId: number,
    notes: string,
    user: User,
  ): Promise<EscrowTransaction> {
    // Validate booking exists
    const booking = await this.findBookingForActor(bookingId, user);
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }

    // Create dispute hold transaction
    const transaction = new EscrowTransaction();
    transaction.booking_id = bookingId;
    transaction.milestone_id = null;
    transaction.transaction_type = EscrowTransactionTypeEnum.DISPUTE_HOLD;
    transaction.amount = amount;
    transaction.currency_id = currencyId;
    transaction.status = EscrowTransactionStatusEnum.COMPLETED;
    transaction.notes =
      notes || `Dispute hold for booking ${booking.booking_number}`;
    transaction.processed_by = user.id;
    transaction.processed_at = new Date();
    transaction.created_by = user as any;

    return this.repository.create(transaction);
  }

  /**
   * Release funds from dispute hold.
   *
   * Creates a dispute release transaction to release previously held funds.
   *
   * @param bookingId - Booking ID
   * @param amount - Amount to release
   * @param currencyId - Currency ID
   * @param releasedTo - User ID to release to
   * @param notes - Release notes
   * @param user - Current authenticated user
   * @returns Created escrow transaction
   */
  async releaseFromDispute(
    bookingId: number,
    amount: number,
    currencyId: number,
    releasedTo: number,
    notes: string,
    user: User,
  ): Promise<EscrowTransaction> {
    // Validate booking exists
    const booking = await this.findBookingForActor(bookingId, user);
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }

    // Create dispute release transaction
    const transaction = new EscrowTransaction();
    transaction.booking_id = bookingId;
    transaction.milestone_id = null;
    transaction.transaction_type = EscrowTransactionTypeEnum.DISPUTE_RELEASE;
    transaction.amount = amount;
    transaction.currency_id = currencyId;
    transaction.released_to = releasedTo;
    transaction.release_method = 'bank_transfer';
    transaction.status = EscrowTransactionStatusEnum.PENDING;
    transaction.notes =
      notes || `Dispute release for booking ${booking.booking_number}`;
    transaction.created_by = user as any;

    return this.repository.create(transaction);
  }

  /**
   * Create an escrow transaction.
   *
   * @param input - Create escrow transaction DTO
   * @param user - Current authenticated user
   * @returns Created escrow transaction
   */
  async create(
    input: CreateEscrowTransactionDto,
    user: User,
  ): Promise<EscrowTransaction> {
    // Validate booking exists
    const booking = await this.findBookingForActor(input.booking_id, user);
    if (!booking) {
      throw new NotFoundException(
        `Booking with ID ${input.booking_id} not found`,
      );
    }

    // Get checkout order to get currency_id
    const checkoutOrder = booking.checkout_order;
    const currencyId = input.currency_id || checkoutOrder?.currency_id || null;

    const transaction = new EscrowTransaction();
    transaction.booking_id = input.booking_id;
    transaction.milestone_id = input.milestone_id || null;
    transaction.transaction_type = input.transaction_type;
    transaction.amount = input.amount;
    transaction.currency_id = currencyId;
    transaction.released_to = input.released_to || null;
    transaction.release_method = input.release_method || null;
    transaction.status = EscrowTransactionStatusEnum.PENDING;
    transaction.reference_number = input.reference_number || null;
    transaction.notes = input.notes || null;
    transaction.created_by = user as any;

    return this.repository.create(transaction);
  }

  /**
   * Find all escrow transactions with pagination.
   *
   * @param query - Query parameters
   * @param _user - Current authenticated user (for future authorization checks)
   * @returns Paginated escrow transactions
   */
  async findAll(
    query: QueryEscrowTransactionDto,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _user: User,
  ): Promise<IPaginatedResult<EscrowTransaction>> {
    const paginationOptions: IPaginationOptions = {
      page: query.page || 1,
      limit: query.limit || 20,
    };

    const filterQuery: any = {};
    if (query.booking_id) {
      filterQuery.booking_id = query.booking_id;
    }
    if (query.milestone_id) {
      filterQuery.milestone_id = query.milestone_id;
    }
    if (query.transaction_type) {
      filterQuery.transaction_type = query.transaction_type;
    }
    if (query.status) {
      filterQuery.status = query.status;
    }

    return this.repository.findAllWithPagination({
      filterQuery,
      paginationOptions,
    });
  }

  /**
   * Find escrow transaction by ID.
   *
   * @param id - Escrow transaction ID
   * @param user - Current authenticated user
   * @returns Escrow transaction if found
   */
  async findById(id: number, user: User): Promise<EscrowTransaction> {
    const transaction = await this.repository.findById(id);
    if (!transaction) {
      throw new NotFoundException(`Escrow transaction with ID ${id} not found`);
    }

    // Verify user has access to the booking
    await this.findBookingForActor(transaction.booking_id, user);

    return transaction;
  }

  /**
   * Find escrow transactions by booking ID.
   *
   * @param bookingId - Booking ID
   * @param user - Current authenticated user
   * @returns Array of escrow transactions
   */
  async findByBookingId(
    bookingId: number,
    user: User,
  ): Promise<EscrowTransaction[]> {
    // Verify user has access to the booking
    await this.findBookingForActor(bookingId, user);

    return this.repository.findByBookingId(bookingId);
  }

  /**
   * Find escrow transactions by booking ID (internal, no authorization check).
   *
   * @param bookingId - Booking ID
   * @returns Array of escrow transactions
   */
  async findByBookingIdInternal(
    bookingId: number,
  ): Promise<EscrowTransaction[]> {
    return this.repository.findByBookingId(bookingId);
  }

  /**
   * Update an escrow transaction.
   *
   * @param id - Escrow transaction ID
   * @param input - Update escrow transaction DTO
   * @param user - Current authenticated user
   * @returns Updated escrow transaction
   */
  async update(
    id: number,
    input: UpdateEscrowTransactionDto,
    user: User,
  ): Promise<EscrowTransaction> {
    await this.findById(id, user);

    const updateData: Partial<EscrowTransaction> = {};
    if (input.status !== undefined) {
      updateData.status = input.status;
    }
    if (input.reference_number !== undefined) {
      updateData.reference_number = input.reference_number;
    }
    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }
    if (input.processed_by !== undefined) {
      updateData.processed_by = input.processed_by;
    }
    if (input.processed_at !== undefined) {
      updateData.processed_at = input.processed_at;
    }

    updateData.updated_by = user as any;

    return this.repository.update(id, updateData);
  }
}
