import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BaseBookingRepository } from './persistence/base-booking.repository';
import { Booking } from './domain/booking';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { QueryBookingDto } from './dto/query-booking.dto';
import { AssignMemberDto } from './dto/assign-member.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { DeclineBookingDto } from './dto/decline-booking.dto';
import { UpdateProviderNotesDto } from './dto/update-provider-notes.dto';
import { RescheduleBookingDto } from './dto/reschedule-booking.dto';
import { User } from '@/users/domain/user';
import { CheckoutOrdersService } from '@/checkout-orders/checkout-orders.service';
import { ServicesService } from '@/services/services.service';
import { ServicePackagesService } from '@/service-packages/service-packages.service';
import { SellersService } from '@/sellers/sellers.service';
import { SellerMembersService } from '@/seller-members/seller-members.service';
import { BookingStatusEnum } from './enums/booking-status.enum';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { ServiceStatusEnum } from '@/services/enums/service-status.enum';
import { ServicePackageStatusEnum } from '@/service-packages/enums/service-package-status.enum';
import { CalendarDay } from './domain/calendar-day';
import { DayScheduleItem } from './domain/day-schedule-item';
import { BaseStoreUnavailabilityRepository } from '@/store-unavailability/persistence/base-store-unavailability.repository';
import { BookingCancellationsService } from '@/booking-cancellations/booking-cancellations.service';
import { CreateBookingCancellationDto } from '@/booking-cancellations/dto/create-booking-cancellation.dto';
import { BookingCancellation } from '@/booking-cancellations/domain/booking-cancellation';
import { CancellationReasonEnum } from '@/booking-cancellations/enums/cancellation-reason.enum';
import { EscrowTransactionsService } from '@/escrow-transactions/escrow-transactions.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { NotificationTypeEnum } from '@/notifications/enums/notification-type.enum';
import { BookingNotificationService } from '@/notifications/services/booking-notification.service';
import { SalesOrderItemAddonRepository } from '@/sales-order-item-addons/persistence/repositories/sales-order-item-addon.repository';
import { SalesOrderItemOptionRepository } from '@/sales-order-item-options/persistence/repositories/sales-order-item-option.repository';
import { BookingAddonRepository } from '@/booking-addons/persistence/repositories/booking-addon.repository';
import { BookingOptionRepository } from '@/booking-options/persistence/repositories/booking-option.repository';
import { BaseServiceMilestoneTemplateRepository } from '@/service-milestone-templates/persistence/base-service-milestone-template.repository';
import { QueryServiceMilestoneTemplateDto } from '@/service-milestone-templates/dto/query-service-milestone-template.dto';
import { ServiceMilestoneTemplateStatusEnum } from '@/service-milestone-templates/enums/service-milestone-template-status.enum';
import { BookingMilestone } from '@/booking-milestones/domain/booking-milestone';
import { MilestoneStatusEnum } from '@/booking-milestones/enums/milestone-status.enum';
import { BaseBookingMilestoneRepository } from '@/booking-milestones/persistence/base-booking-milestone.repository';
import { MilestoneTypeEnum } from '@/booking-milestones/enums/milestone-type.enum';
import { ServiceTypeEnum } from '@/services/enums/service-type.enum';
import { ServiceLocationTypeEnum } from '@/services/enums/service-location-type.enum';
import { AppointmentLocationTypeEnum } from './enums/appointment-location-type.enum';
import { FormSubmissionsService } from '@/form-submissions/form-submissions.service';
import { CreatePreventiveBookingRequestDto } from './dto/create-preventive-booking-request.dto';
import { SellerEarningsService } from '@/seller-earnings/seller-earnings.service';
import { VouchersService } from '@/vouchers/vouchers.service';
import { PaymentStatusEnum } from '@/checkout-orders/enums/payment-status.enum';
import { EscrowTransaction } from '@/escrow-transactions/domain/escrow-transaction';
import { EscrowTransactionTypeEnum } from '@/escrow-transactions/enums/escrow-transaction-type.enum';
import { EscrowTransactionStatusEnum } from '@/escrow-transactions/enums/escrow-transaction-status.enum';
import { SellerSchedulesService } from '@/seller-schedules/seller-schedules.service';
import { MailService } from '@/mail/mail.service';
import { UserGroupEntity } from '@/user-groups/persistence/entities/user-group.entity';
import { UserAssignmentEntity } from '@/user-assignments/persistence/entities/user-assignment.entity';
import { StatusEnum as UserGroupStatusEnum } from '@/user-groups/user-groups.enum';
import { StatusEnum as UserAssignmentStatusEnum } from '@/user-assignments/user-assignments.enum';
import { StatusEnum as UserStatusEnum } from '@/users/users.enum';
import { ParametersService } from '@/parameters/parameters.service';
import { SalesOrderVoucherEntity } from '@/sales-order-vouchers/persistence/entities/sales-order-voucher.entity';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import { PaymentStatusEnum as SalesOrderPaymentStatusEnum } from '@/sales-orders/domain/payment-status.enum';
import { OrderStatusEnum as SalesOrderStatusEnum } from '@/sales-orders/domain/order-status.enum';
import {
  isVenueServiceType,
  VENUE_CANCELLATION_NOT_ALLOWED_ERROR_MESSAGE,
  VENUE_REFUND_NOT_ALLOWED_ERROR_MESSAGE,
} from './utils/venue-booking-policy.util';

const MAX_BOOKING_NUMBER_RETRIES = 3;

/**
 * Bookings Service.
 *
 * Handles business logic for service bookings created from checkout orders.
 * Manages booking lifecycle, member assignment, status transitions, and
 * booking number generation.
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class BookingsService {
  private static readonly BOOKING_APPROVERS_GROUP_NAME = 'Booking Approvers';
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly repository: BaseBookingRepository,
    private readonly checkoutOrdersService: CheckoutOrdersService,
    private readonly servicesService: ServicesService,
    private readonly servicePackagesService: ServicePackagesService,
    private readonly sellersService: SellersService,
    private readonly sellerMembersService: SellerMembersService,
    private readonly storeUnavailabilityRepository: BaseStoreUnavailabilityRepository,
    @Inject(forwardRef(() => BookingCancellationsService))
    private readonly bookingCancellationsService: BookingCancellationsService,
    @Inject(forwardRef(() => EscrowTransactionsService))
    private readonly escrowTransactionsService: EscrowTransactionsService,
    private readonly notificationsService: NotificationsService,
    private readonly salesOrderItemAddonRepository: SalesOrderItemAddonRepository,
    private readonly salesOrderItemOptionRepository: SalesOrderItemOptionRepository,
    private readonly bookingAddonRepository: BookingAddonRepository,
    private readonly bookingOptionRepository: BookingOptionRepository,
    private readonly bookingNotificationService: BookingNotificationService,
    private readonly serviceMilestoneTemplateRepository: BaseServiceMilestoneTemplateRepository,
    private readonly bookingMilestoneRepository: BaseBookingMilestoneRepository,
    private readonly formSubmissionsService: FormSubmissionsService,
    private readonly sellerEarningsService: SellerEarningsService,
    private readonly vouchersService: VouchersService,
    private readonly sellerSchedulesService: SellerSchedulesService,
    private readonly mailService: MailService,
    private readonly parametersService: ParametersService,
    @InjectRepository(UserGroupEntity)
    private readonly userGroupRepository: Repository<UserGroupEntity>,
    @InjectRepository(UserAssignmentEntity)
    private readonly userAssignmentRepository: Repository<UserAssignmentEntity>,
    @InjectRepository(SalesOrderVoucherEntity)
    private readonly salesOrderVoucherRepository: Repository<SalesOrderVoucherEntity>,
    @InjectRepository(SalesOrderEntity)
    private readonly salesOrderRepository: Repository<SalesOrderEntity>,
    private readonly dataSource: DataSource,
  ) {}

  private async resolvePlatformFeePercent(params: {
    explicitPlatformFeePercent?: number | null;
  }): Promise<number> {
    const { explicitPlatformFeePercent } = params;

    if (
      explicitPlatformFeePercent !== null &&
      explicitPlatformFeePercent !== undefined
    ) {
      return Number(explicitPlatformFeePercent);
    }

    const globalPlatformFeeParameter = await this.parametersService.findByCode(
      'platform_fee_percent',
    );
    const globalPlatformFeePercent = Number(
      globalPlatformFeeParameter?.numeric_value,
    );

    if (
      Number.isFinite(globalPlatformFeePercent) &&
      globalPlatformFeePercent >= 0
    ) {
      return globalPlatformFeePercent;
    }

    return 0.0;
  }

  private resolveInitialBookingStatus(params: {
    total: number;
  }): BookingStatusEnum {
    return Number(params.total ?? 0) <= 0
      ? BookingStatusEnum.AWAITING_CONFIRMATION
      : BookingStatusEnum.PENDING;
  }

  /**
   * Create booking from checkout order.
   *
   * Creates a booking from a checkout order that contains service items.
   * Validates service, seller, and calculates pricing.
   *
   * @param input - Create booking DTO
   * @param user - Current authenticated user
   * @returns Created booking
   */
  async createFromCheckout(
    input: CreateBookingDto,
    user: User,
  ): Promise<Booking> {
    // 1. Validate checkout order exists and belongs to user
    const checkoutOrder = await this.checkoutOrdersService.findById(
      input.checkout_order_id,
      user,
    );

    if (!checkoutOrder.has_services) {
      throw new BadRequestException(
        'Checkout order does not contain service items',
      );
    }

    // 2. Validate service exists and is active
    const service = await this.servicesService.findById(input.service_id);
    if (service.status !== ServiceStatusEnum.ACTIVE) {
      throw new BadRequestException('Service is not active');
    }

    // 2a. Validate service doesn't require a quote (cannot book directly)
    if (service.requires_quote) {
      throw new BadRequestException(
        'This service requires a custom quote. Please request a quote before booking.',
      );
    }

    const isVenueBooking = service.service_type === ServiceTypeEnum.VENUE;

    // 2b. Determine appointment location type (venue always walk-in)
    const appointmentLocationType = isVenueBooking
      ? AppointmentLocationTypeEnum.WALK_IN
      : input.appointment_location_type ||
        AppointmentLocationTypeEnum.HOME_SERVICE;

    // 2b2. Venue bookings require scheduled_end_time
    if (isVenueBooking && !input.scheduled_end_time) {
      throw new BadRequestException(
        'Venue bookings require a scheduled end time.',
      );
    }

    // 2c. Cross-validate: booking location must be compatible with service
    const serviceLocationType =
      service.service_location_type || ServiceLocationTypeEnum.HOME_SERVICE;
    if (
      appointmentLocationType === AppointmentLocationTypeEnum.WALK_IN &&
      serviceLocationType === ServiceLocationTypeEnum.HOME_SERVICE
    ) {
      throw new BadRequestException(
        'This service only supports home service appointments.',
      );
    }
    if (
      appointmentLocationType === AppointmentLocationTypeEnum.HOME_SERVICE &&
      serviceLocationType === ServiceLocationTypeEnum.WALK_IN
    ) {
      throw new BadRequestException(
        'This service only supports walk-in appointments.',
      );
    }

    // 2d. Validate service address for home service
    if (appointmentLocationType === AppointmentLocationTypeEnum.HOME_SERVICE) {
      if (!input.service_address_id && !input.service_address_text) {
        throw new BadRequestException(
          'This service requires a physical address. Please provide a service address.',
        );
      }
    }

    // 2e. For walk-in, verify seller has a service location
    if (appointmentLocationType === AppointmentLocationTypeEnum.WALK_IN) {
      const seller = await this.sellersService.findById(input.seller_id);
      if (!seller.service_location_address_id) {
        throw new BadRequestException(
          'This provider has not set up a walk-in service location.',
        );
      }
    }

    // 3. Validate seller exists and matches service seller
    await this.sellersService.findById(input.seller_id);
    if (service.seller_id !== input.seller_id) {
      throw new BadRequestException(
        'Seller ID does not match the service seller',
      );
    }

    // 4. Validate package if provided
    if (input.package_id) {
      const pkg = await this.servicePackagesService.findById(input.package_id);
      if (pkg.service_id !== input.service_id) {
        throw new BadRequestException(
          'Package does not belong to the specified service',
        );
      }
      if (pkg.status !== ServicePackageStatusEnum.ACTIVE) {
        throw new BadRequestException('Service package is not active');
      }
    }

    // 5. Validate customer matches checkout order user
    if (input.customer_id !== checkoutOrder.user_id) {
      throw new BadRequestException(
        'Customer ID must match checkout order user',
      );
    }

    // 5b. Apply vouchers if provided
    let discountAmount = input.discount_amount ?? 0;
    let appliedVouchers: Array<{
      voucherId: number;
      voucherCode: string;
      discountAmount: number;
    }> = [];
    if (
      input.voucher_codes &&
      input.voucher_codes.length > 0 &&
      input.subtotal > 0
    ) {
      await this.vouchersService.ensureUserHasClaimedVoucherCodes(
        input.voucher_codes,
        user.id,
        { allowDuplicateCodes: true },
      );
      const stackedResult =
        await this.vouchersService.applyStackedVoucherDiscounts({
          codes: input.voucher_codes,
          userId: user.id,
          applicableSubtotal: input.subtotal,
          addons_total: input.addons_total ?? 0,
          sellerId: input.seller_id,
          categoryIds: undefined,
          productIds: undefined,
          serviceCategoryIds: service.category_id
            ? [service.category_id]
            : undefined,
          serviceIds: [input.service_id],
          allowDuplicateCodes: true,
        });
      discountAmount = Math.min(
        stackedResult.totalDiscountAmount,
        input.subtotal,
      );
      appliedVouchers = stackedResult.appliedVouchers;
    }

    // 6. Calculate pricing
    const platformFeePercent = await this.resolvePlatformFeePercent({
      explicitPlatformFeePercent: input.platform_fee_percent,
    });
    const basePrice = input.base_price ?? 0;
    const addonsTotal = input.addons_total ?? 0;
    const optionsTotal = input.options_total ?? 0;
    const locationAdditionalFee = input.location_additional_fee ?? 0;
    const subtotal = input.subtotal;
    const { platformFee, providerPayout } = this.calculateFeeBreakdown(
      subtotal,
      platformFeePercent,
    );
    const total = Math.max(0, subtotal - discountAmount);

    // 7. Generate booking number with retry logic
    let bookingNumber: string;
    let retries = 0;
    do {
      bookingNumber = this.generateBookingNumber();
      const existing = await this.repository.findByBookingNumber(bookingNumber);
      if (!existing) {
        break;
      }
      retries++;
      if (retries >= MAX_BOOKING_NUMBER_RETRIES) {
        throw new BadRequestException(
          'Failed to generate unique booking number. Please try again.',
        );
      }
    } while (retries < MAX_BOOKING_NUMBER_RETRIES);

    // 8. Create booking
    const booking = new Booking();
    booking.checkout_order_id = input.checkout_order_id;
    booking.seller_id = input.seller_id;
    booking.service_id = input.service_id;
    booking.package_id = input.package_id || null;
    booking.customer_id = input.customer_id;
    booking.booking_number = bookingNumber;
    booking.scheduled_date = new Date(input.scheduled_date);
    booking.scheduled_start_time = input.scheduled_start_time;
    booking.scheduled_end_time = input.scheduled_end_time || null;
    booking.appointment_location_type = appointmentLocationType;
    booking.guest_email = this.normalizeEmail(user.email);

    // Set address based on appointment location type
    if (appointmentLocationType === AppointmentLocationTypeEnum.WALK_IN) {
      const sellerForAddress = await this.sellersService.findById(
        input.seller_id,
      );
      if (sellerForAddress.service_location_address) {
        const addr = sellerForAddress.service_location_address;
        booking.service_address_id = null;
        booking.service_address_text = [
          addr.address_line1,
          addr.address_line2,
          addr.city,
          addr.state_province,
          addr.postal_code,
        ]
          .filter(Boolean)
          .join(', ');
        booking.service_latitude = addr.latitude || null;
        booking.service_longitude = addr.longitude || null;
      }
      booking.location_additional_fee = 0;
    } else if (appointmentLocationType === AppointmentLocationTypeEnum.REMOTE) {
      booking.service_address_id = null;
      booking.service_address_text = null;
      booking.service_latitude = null;
      booking.service_longitude = null;
      booking.location_additional_fee = 0;
    } else {
      booking.service_address_id = input.service_address_id || null;
      booking.service_address_text = input.service_address_text || null;
      booking.service_latitude = input.service_latitude || null;
      booking.service_longitude = input.service_longitude || null;
      booking.location_additional_fee = locationAdditionalFee;
    }
    // Price breakdown
    booking.base_price = basePrice;
    booking.addons_total = addonsTotal;
    booking.options_total = optionsTotal;
    booking.subtotal = subtotal;
    booking.discount_amount = discountAmount;
    booking.platform_fee = platformFee;
    booking.platform_fee_percent = platformFeePercent;
    booking.provider_payout = providerPayout;
    booking.total = total;
    // Bookings with no remaining balance skip payment and move straight to the
    // seller/admin confirmation queue. Otherwise they stay pending until paid.
    booking.status = this.resolveInitialBookingStatus({ total });
    booking.customer_notes = input.customer_notes || null;
    booking.created_by = user as any;

    const createdBooking = await this.repository.create(booking);

    // When the booking total is zero (fully covered by voucher or free service),
    // mark the order as paid immediately — no payment record will be created.
    if (total === 0) {
      const salesOrderId = this.resolveBookingSalesOrderId(createdBooking);
      if (salesOrderId) {
        await this.salesOrderRepository.update(
          { id: salesOrderId },
          { payment_status: SalesOrderPaymentStatusEnum.PAID },
        );
      } else if (input.checkout_order_id) {
        // createFromCheckout sets checkout_order_id, not sales_order_id.
        // resolveBookingSalesOrderId returns null for this path, so update
        // the checkout order directly (also sets paid_at via the service).
        await this.checkoutOrdersService.update(
          input.checkout_order_id,
          { payment_status: PaymentStatusEnum.PAID },
          user,
        );
      }
    }

    // 8a. Record voucher redemptions for this booking if any vouchers were applied
    if (appliedVouchers.length > 0) {
      await this.vouchersService.recordStackedVoucherRedemptionsForBooking(
        createdBooking.id,
        user.id,
        appliedVouchers,
        subtotal,
      );
    }

    // 8b. Create booking milestones from service milestone templates
    await this.createBookingMilestonesFromTemplates(createdBooking, user);

    // 9. Send notification to seller about new booking
    await this.bookingNotificationService.sendBookingCreatedNotification(
      createdBooking,
    );

    // 10. Send notification to customer about booking submission
    try {
      const serviceTitle =
        createdBooking.service?.title ||
        createdBooking.service?.name ||
        service.title;
      const isQrPayment = this.isQrPaymentMethod(
        createdBooking.guest_payment_method ||
          createdBooking.sales_order?.payment_method,
      );
      const bookingTotal = Number(createdBooking.total ?? 0);
      const customerBody =
        isQrPayment && bookingTotal > 0
          ? `Your booking #${bookingNumber} for ${serviceTitle} has been submitted. Complete your payment - the provider will confirm once payment is verified.`
          : bookingTotal <= 0
            ? `Your booking #${bookingNumber} for ${serviceTitle} is pending store approval.`
            : `Your booking #${bookingNumber} for ${serviceTitle} has been submitted and is awaiting provider approval.`;

      await this.notificationsService.notify(
        input.customer_id,
        NotificationTypeEnum.BOOKING_SUBMITTED,
        'Booking Request Submitted',
        customerBody,
        'booking',
        createdBooking.id,
        `/bookings/${createdBooking.id}`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to send booking submitted notification to customer:',
        error,
      );
    }

    // 10b. Send booking-created email event (customer + approvers + owner)
    try {
      const bookingForEmail = await this.findById(
        createdBooking.id,
        user,
        true,
      );
      await this.sendBookingCreatedEmails({
        booking: bookingForEmail,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to send booking-created email for booking ${createdBooking.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // 11. Create escrow deposit (simulates payment collection at booking time)
    // TODO: When DragonPay is integrated, move this to payment webhook callback
    this.escrowTransactionsService
      .createDepositForBooking(
        createdBooking.id,
        createdBooking.total,
        null,
        createdBooking.booking_number,
      )
      .catch((error) => {
        this.logger.error(
          `Failed to create escrow deposit for booking ${createdBooking.id}: ${error.message}`,
        );
      });

    return createdBooking;
  }

  /**
   * Create a preventive booking request.
   *
   * Used for services that require a quote (requires_quote = true).
   * Creates:
   * 1. A FormSubmission with the customer's form values
   * 2. A Booking with status AWAITING_QUOTATION (no payment required)
   *
   * For recurring requests, creates multiple bookings with linked recurrence_group_id.
   *
   * @param input - Preventive booking request DTO
   * @param user - Current authenticated user (customer)
   * @returns Created booking(s)
   */
  async createPreventiveRequest(
    input: CreatePreventiveBookingRequestDto,
    user: User,
  ): Promise<Booking | Booking[]> {
    // 1. Validate service exists and requires a quote
    const service = await this.servicesService.findById(input.service_id);
    if (!service.requires_quote) {
      throw new BadRequestException(
        'This service does not require a quote. Please use the standard booking flow.',
      );
    }

    // 2. Determine appointment location type
    const preventiveLocationType =
      input.appointment_location_type ||
      AppointmentLocationTypeEnum.HOME_SERVICE;

    // 2a. Validate service address for home service
    if (preventiveLocationType === AppointmentLocationTypeEnum.HOME_SERVICE) {
      if (!input.service_address_id && !input.service_address_text) {
        throw new BadRequestException(
          'This service requires a physical address. Please provide a service address.',
        );
      }
    }

    // 2b. For walk-in, verify seller has a service location
    if (preventiveLocationType === AppointmentLocationTypeEnum.WALK_IN) {
      const seller = await this.sellersService.findById(service.seller_id);
      if (!seller.service_location_address_id) {
        throw new BadRequestException(
          'This provider has not set up a walk-in service location.',
        );
      }
    }

    // 3. Create one FormSubmission with the customer's form values (used for first booking; copies for rest)
    const formSubmission = await this.formSubmissionsService.create(
      {
        service_id: input.service_id,
        values: input.form_values.map((fv) => ({
          form_template_id: fv.form_template_id,
          field_code: fv.field_code,
          value: fv.value,
        })),
      },
      user,
    );

    // 4. Determine recurrence settings
    const isRecurring = input.is_recurring || false;
    const recurrenceCount = isRecurring ? input.recurrence_count || 1 : 1;
    const recurrenceGroupId = isRecurring
      ? `RG-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      : null;
    const defaultPlatformFeePercent = await this.resolvePlatformFeePercent({});

    // 5. Create booking(s); each booking gets a form_submission with its own booking_id (no nulls)
    const createdBookings: Booking[] = [];

    for (let index = 0; index < recurrenceCount; index++) {
      // Calculate scheduled date for recurring bookings
      const scheduledDate = this.calculateRecurringDate(
        new Date(input.scheduled_date),
        input.recurrence_interval || 'monthly',
        index,
      );

      // Generate booking number
      let bookingNumber: string;
      let retries = 0;
      do {
        bookingNumber = this.generateBookingNumber();
        const existing =
          await this.repository.findByBookingNumber(bookingNumber);
        if (!existing) {
          break;
        }
        retries++;
        if (retries >= MAX_BOOKING_NUMBER_RETRIES) {
          throw new BadRequestException(
            'Failed to generate unique booking number. Please try again.',
          );
        }
      } while (retries < MAX_BOOKING_NUMBER_RETRIES);

      // Create booking with AWAITING_QUOTATION status
      const booking = new Booking();
      booking.seller_id = service.seller_id;
      booking.service_id = input.service_id;
      booking.customer_id = user.id;
      booking.booking_number = bookingNumber;
      booking.scheduled_date = scheduledDate;
      booking.scheduled_start_time = input.scheduled_start_time || '09:00:00';
      booking.scheduled_end_time = null;
      booking.appointment_location_type = preventiveLocationType;

      // Set address based on appointment location type
      if (preventiveLocationType === AppointmentLocationTypeEnum.WALK_IN) {
        const sellerForAddr = await this.sellersService.findById(
          service.seller_id,
        );
        if (sellerForAddr.service_location_address) {
          const addr = sellerForAddr.service_location_address;
          booking.service_address_id = null;
          booking.service_address_text = [
            addr.address_line1,
            addr.address_line2,
            addr.city,
            addr.state_province,
            addr.postal_code,
          ]
            .filter(Boolean)
            .join(', ');
          booking.service_latitude = addr.latitude || null;
          booking.service_longitude = addr.longitude || null;
        }
      } else if (
        preventiveLocationType === AppointmentLocationTypeEnum.REMOTE
      ) {
        booking.service_address_id = null;
        booking.service_address_text = null;
        booking.service_latitude = null;
        booking.service_longitude = null;
      } else {
        booking.service_address_id = input.service_address_id || null;
        booking.service_address_text = input.service_address_text || null;
        booking.service_latitude = input.service_latitude || null;
        booking.service_longitude = input.service_longitude || null;
      }

      // Pricing fields - will be set after quotation is accepted
      booking.base_price = 0;
      booking.addons_total = 0;
      booking.options_total = 0;
      booking.location_additional_fee = 0;
      booking.subtotal = 0;
      booking.discount_amount = 0;
      booking.platform_fee = 0;
      booking.platform_fee_percent = defaultPlatformFeePercent;
      booking.provider_payout = 0;
      booking.total = 0;

      // Status: AWAITING_QUOTATION (no payment yet)
      booking.status = BookingStatusEnum.AWAITING_QUOTATION;

      // Link to form submission: first booking uses the one we created; recurring others get a copy each (so form_submission.booking_id is never null)
      booking.form_submission_id = formSubmission.id;

      // Recurrence tracking
      booking.recurrence_group_id = recurrenceGroupId;
      booking.recurrence_index = isRecurring ? index : null;

      booking.customer_notes = input.customer_notes || null;
      booking.created_by = user as any;

      const createdBooking = await this.repository.create(booking);
      createdBookings.push(createdBooking);
    }

    // 6. Link form submission to first booking; for recurring, create a copy per booking so each form_submission has booking_id set
    if (createdBookings.length > 0) {
      await this.formSubmissionsService.linkToBooking(
        formSubmission.id,
        createdBookings[0].id,
      );
      for (let i = 1; i < createdBookings.length; i++) {
        const booking = createdBookings[i];
        const newSubmission =
          await this.formSubmissionsService.createCopyForBooking(
            formSubmission.id,
            booking.id,
            user,
          );
        await this.repository.update(booking.id, {
          form_submission_id: newSubmission.id,
        });
      }
    }

    // 7. Send notification to seller about new booking request
    try {
      const seller = await this.sellersService.findById(service.seller_id);
      if (seller.user_id) {
        await this.notificationsService.create({
          user_id: seller.user_id,
          type: NotificationTypeEnum.NEW_BOOKING_REQUEST,
          title: 'New Quotation Request',
          body: `${user.first_name} ${user.last_name} has requested a quote for ${service.title}. ${createdBookings.length > 1 ? `This is a recurring request for ${createdBookings.length} sessions.` : ''}`,
          entity_type: 'booking',
          entity_id: createdBookings[0].id,
          action_url: `/bookings/${createdBookings[0].id}`,
          send_push: true,
        });
      }
    } catch (error) {
      this.logger.error(
        'Failed to send booking request notification to seller:',
        error,
      );
    }

    // 8. Send confirmation to customer
    try {
      await this.notificationsService.notify(
        user.id,
        NotificationTypeEnum.BOOKING_SUBMITTED,
        'Quotation Request Submitted',
        `Your quotation request for ${service.title} has been submitted. The seller will review and provide a quote soon.`,
        'booking',
        createdBookings[0].id,
        `/bookings/${createdBookings[0].id}`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to send quotation request confirmation to customer:',
        error,
      );
    }

    // Return single booking or array based on recurrence
    return createdBookings.length === 1 ? createdBookings[0] : createdBookings;
  }

  /**
   * Calculate the scheduled date for a recurring booking.
   *
   * @param startDate - The initial start date
   * @param interval - The recurrence interval (weekly, biweekly, monthly, quarterly)
   * @param index - The recurrence index (0 = first occurrence)
   * @returns Calculated date for this recurrence
   */
  private calculateRecurringDate(
    startDate: Date,
    interval: string,
    index: number,
  ): Date {
    const date = new Date(startDate);

    switch (interval) {
      case 'daily':
        date.setDate(date.getDate() + index);
        break;
      case 'weekly':
        date.setDate(date.getDate() + index * 7);
        break;
      case 'biweekly':
        date.setDate(date.getDate() + index * 14);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + index);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + index * 3);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + index);
        break;
      default:
        date.setMonth(date.getMonth() + index);
    }

    return date;
  }

  /**
   * Create booking from a sales order item.
   *
   * Creates a booking directly from a sales order item (new flow).
   * This replaces the checkout order flow for service bookings.
   * The sales_order_item becomes the source of truth for add-ons and options.
   *
   * @param salesOrderId - The sales order ID
   * @param salesOrderItemId - The sales order item ID
   * @param serviceId - The service ID
   * @param sellerId - The seller ID
   * @param packageId - Optional package ID
   * @param scheduledDate - Scheduled date (YYYY-MM-DD)
   * @param scheduledStartTime - Scheduled start time (HH:mm:ss)
   * @param scheduledEndTime - Optional scheduled end time
   * @param serviceAddressId - Optional service address ID
   * @param subtotal - Subtotal amount
   * @param customerNotes - Optional customer notes
   * @param user - Current authenticated user
   * @returns Created booking
   */
  async createFromSalesOrderItem(params: {
    salesOrderId: number;
    salesOrderItemId: number;
    serviceId: number;
    sellerId: number;
    packageId?: number | null;
    scheduledDate: string;
    scheduledStartTime: string;
    scheduledEndTime?: string | null;
    serviceAddressId?: number | null;
    appointmentLocationType?: string | null;
    subtotal: number;
    customerNotes?: string | null;
    formSubmissionId?: number | null;
    user: User;
    voucherCodes?: string[];
    guestEmail?: string | null;
    sendCreationEmails?: boolean;
    paymentMethodCode?: string | null;
    addonsTotal?: number;
    optionsTotal?: number;
    basePrice?: number;
  }): Promise<Booking> {
    const {
      salesOrderId,
      salesOrderItemId,
      serviceId,
      sellerId,
      packageId,
      scheduledDate,
      scheduledStartTime,
      scheduledEndTime,
      serviceAddressId,
      appointmentLocationType: rawAppointmentLocationType,
      subtotal,
      customerNotes,
      formSubmissionId,
      user,
      voucherCodes,
      guestEmail,
      sendCreationEmails = false,
      paymentMethodCode,
    } = params;
    const effectiveAddonsTotal = params.addonsTotal ?? 0;
    const effectiveOptionsTotal = params.optionsTotal ?? 0;
    const effectiveBasePrice =
      params.basePrice ?? Math.max(0, subtotal - effectiveAddonsTotal - effectiveOptionsTotal);

    // 1. Validate service exists and is active
    const service = await this.servicesService.findById(serviceId);
    if (service.status !== ServiceStatusEnum.ACTIVE) {
      throw new BadRequestException('Service is not active');
    }

    // 2. Validate service doesn't require a quote
    if (service.requires_quote) {
      throw new BadRequestException(
        'This service requires a custom quote. Please request a quote before booking.',
      );
    }

    const isVenue = service.service_type === ServiceTypeEnum.VENUE;

    // 3. Determine appointment location type (venue always walk-in)
    const soiLocationType = isVenue
      ? AppointmentLocationTypeEnum.WALK_IN
      : (rawAppointmentLocationType as AppointmentLocationTypeEnum) ||
        AppointmentLocationTypeEnum.HOME_SERVICE;

    // 3a. Validate service address for home service (not required for venues)
    if (
      !isVenue &&
      soiLocationType === AppointmentLocationTypeEnum.HOME_SERVICE &&
      !serviceAddressId
    ) {
      throw new BadRequestException(
        'This service requires a physical address. Please provide a service address.',
      );
    }

    // 3b. Venue services require scheduled end time
    if (isVenue && !scheduledEndTime) {
      throw new BadRequestException(
        'Venue bookings require a scheduled end time.',
      );
    }

    // 4. Validate seller matches service seller
    if (service.seller_id !== sellerId) {
      throw new BadRequestException(
        'Seller ID does not match the service seller',
      );
    }

    // 5. Validate package if provided
    if (packageId) {
      const pkg = await this.servicePackagesService.findById(packageId);
      if (pkg.service_id !== serviceId) {
        throw new BadRequestException(
          'Package does not belong to the specified service',
        );
      }
      if (pkg.status !== ServicePackageStatusEnum.ACTIVE) {
        throw new BadRequestException('Service package is not active');
      }
    }

    // 5b. Apply vouchers if provided (Travajo booking vouchers from place order)
    let discountAmount = 0;
    let appliedVouchers: Array<{
      voucherId: number;
      voucherCode: string;
      discountAmount: number;
    }> = [];
    if (voucherCodes && voucherCodes.length > 0 && subtotal > 0) {
      await this.vouchersService.ensureUserHasClaimedVoucherCodes(
        voucherCodes,
        user.id,
        { allowDuplicateCodes: true },
      );
      const stackedResult =
        await this.vouchersService.applyStackedVoucherDiscounts({
          codes: voucherCodes,
          userId: user.id,
          applicableSubtotal: subtotal,
          addons_total: effectiveAddonsTotal,
          sellerId,
          categoryIds: undefined,
          productIds: undefined,
          serviceCategoryIds: service.category_id
            ? [service.category_id]
            : undefined,
          serviceIds: [serviceId],
          allowDuplicateCodes: true,
        });
      discountAmount = Math.min(stackedResult.totalDiscountAmount, subtotal);
      appliedVouchers = stackedResult.appliedVouchers;
    }

    // 6. Calculate pricing
    const platformFeePercent = await this.resolvePlatformFeePercent({});
    const { platformFee, providerPayout } = this.calculateFeeBreakdown(
      subtotal,
      platformFeePercent,
    );
    const total = Math.max(0, subtotal - discountAmount);

    // 7. Generate booking number with retry logic
    let bookingNumber: string;
    let retries = 0;
    do {
      bookingNumber = this.generateBookingNumber();
      const existing = await this.repository.findByBookingNumber(bookingNumber);
      if (!existing) {
        break;
      }
      retries++;
      if (retries >= MAX_BOOKING_NUMBER_RETRIES) {
        throw new BadRequestException(
          'Failed to generate unique booking number. Please try again.',
        );
      }
    } while (retries < MAX_BOOKING_NUMBER_RETRIES);

    // 8. Create booking
    const booking = new Booking();
    // New fields (sales order flow)
    booking.sales_order_id = salesOrderId;
    booking.sales_order_item_id = salesOrderItemId;
    // Legacy field (not used in new flow)
    booking.checkout_order_id = null;
    // Core fields
    booking.seller_id = sellerId;
    booking.service_id = serviceId;
    booking.package_id = packageId || null;
    booking.customer_id = user.id;
    booking.booking_number = bookingNumber;
    booking.scheduled_date = new Date(scheduledDate);
    booking.scheduled_start_time = scheduledStartTime;
    booking.scheduled_end_time = scheduledEndTime || null;
    booking.appointment_location_type = soiLocationType;
    booking.guest_email = this.normalizeEmail(guestEmail || user.email || null);

    // For venue / walk-in: populate provider's service location address
    if (isVenue || soiLocationType === AppointmentLocationTypeEnum.WALK_IN) {
      const sellerForAddress = await this.sellersService.findById(sellerId);
      if (sellerForAddress.service_location_address) {
        const addr = sellerForAddress.service_location_address;
        booking.service_address_id = null;
        booking.service_address_text = [
          addr.address_line1,
          addr.address_line2,
          addr.city,
          addr.state_province,
          addr.postal_code,
        ]
          .filter(Boolean)
          .join(', ');
        booking.service_latitude = addr.latitude || null;
        booking.service_longitude = addr.longitude || null;
      }
      booking.location_additional_fee = 0;
    } else {
      booking.service_address_id = serviceAddressId || null;
    }

    booking.base_price = effectiveBasePrice;
    booking.addons_total = effectiveAddonsTotal;
    booking.options_total = effectiveOptionsTotal;
    booking.subtotal = subtotal;
    booking.discount_amount = discountAmount;
    booking.platform_fee = platformFee;
    booking.platform_fee_percent = platformFeePercent;
    booking.provider_payout = providerPayout;
    booking.total = total;
    // Bookings with no remaining balance skip payment and move straight to the
    // seller/admin confirmation queue. Otherwise they stay pending until paid.
    booking.status = this.resolveInitialBookingStatus({ total });
    booking.customer_notes = customerNotes || null;
    booking.form_submission_id = formSubmissionId || null;
    booking.guest_payment_method = paymentMethodCode || null;
    booking.created_by = user as any;

    const createdBooking = await this.repository.create(booking);

    // When the booking total is zero (fully covered by voucher or free service),
    // mark the sales order as paid immediately — no payment record will be created.
    if (total === 0 && salesOrderId) {
      await this.salesOrderRepository.update(
        { id: salesOrderId },
        {
          payment_status: SalesOrderPaymentStatusEnum.PAID,
          status: SalesOrderStatusEnum.CONFIRMED,
        },
      );
    }

    // 8a. Record voucher redemptions for this booking if any vouchers were applied
    if (appliedVouchers.length > 0) {
      await this.vouchersService.recordStackedVoucherRedemptionsForBooking(
        createdBooking.id,
        user.id,
        appliedVouchers,
        subtotal,
        salesOrderId,
      );
    }

    // Link form_submission to booking if provided
    if (formSubmissionId) {
      try {
        await this.formSubmissionsService.linkToBooking(
          formSubmissionId,
          createdBooking.id,
        );
      } catch (error) {
        this.logger.warn(
          `Failed to link form submission ${formSubmissionId} to booking ${createdBooking.id}: ${error}`,
        );
      }
    }

    // 9. Copy addons and options from sales order item to booking
    await this.copyAddonsAndOptionsToBooking(
      salesOrderItemId,
      createdBooking.id,
      user,
    );

    // 9b. Create booking milestones from service milestone templates
    await this.createBookingMilestonesFromTemplates(createdBooking, user);

    // 10. Send push notifications for the new booking
    try {
      await this.bookingNotificationService.sendBookingCreatedNotification(
        createdBooking,
      );

      const serviceTitle =
        createdBooking.service?.title ||
        createdBooking.service?.name ||
        service.title;
      const isQrPayment = this.isQrPaymentMethod(
        createdBooking.guest_payment_method ||
          createdBooking.sales_order?.payment_method,
      );
      const bookingTotal = Number(createdBooking.total ?? 0);
      const customerBody =
        isQrPayment && bookingTotal > 0
          ? `Your booking #${bookingNumber} for ${serviceTitle} has been submitted. Complete your payment - the provider will confirm once payment is verified.`
          : bookingTotal <= 0
            ? `Your booking #${bookingNumber} for ${serviceTitle} is pending store approval.`
            : `Your booking #${bookingNumber} for ${serviceTitle} has been submitted and is awaiting provider approval.`;

      await this.notificationsService.notify(
        createdBooking.customer_id,
        NotificationTypeEnum.BOOKING_SUBMITTED,
        'Booking Request Submitted',
        customerBody,
        'booking',
        createdBooking.id,
        `/bookings/${createdBooking.id}`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to send booking creation push notifications:',
        error,
      );
    }

    // 11. Send booking-created email event (customer + approvers + owner)
    if (sendCreationEmails) {
      try {
        const bookingForEmail = await this.findById(
          createdBooking.id,
          user,
          true,
        );
        await this.sendBookingCreatedEmails({
          booking: bookingForEmail,
        });
      } catch (error) {
        this.logger.warn(
          `Failed to send booking-created email for booking ${createdBooking.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    // 12. Create escrow deposit (simulates payment collection at booking time)
    // TODO: When DragonPay is integrated, move this to payment webhook callback
    this.escrowTransactionsService
      .createDepositForBooking(
        createdBooking.id,
        createdBooking.total,
        null,
        createdBooking.booking_number,
      )
      .catch((error) => {
        this.logger.error(
          `Failed to create escrow deposit for booking ${createdBooking.id}: ${error.message}`,
        );
      });

    return createdBooking;
  }

  /**
   * Copy addons and options from a sales order item to a booking.
   *
   * Creates snapshot records in booking_addons and booking_options tables
   * based on the sales_order_item_addons and sales_order_item_options.
   *
   * @param salesOrderItemId - Source sales order item ID
   * @param bookingId - Target booking ID
   * @param user - Current authenticated user
   */
  private async copyAddonsAndOptionsToBooking(
    salesOrderItemId: number,
    bookingId: number,
    user: User,
  ): Promise<void> {
    // Copy addons
    const soiAddons =
      await this.salesOrderItemAddonRepository.findBySalesOrderItemId(
        salesOrderItemId,
      );
    if (soiAddons.length > 0) {
      const bookingAddons = soiAddons.map((soiAddon) => ({
        booking_id: bookingId,
        addon_id: soiAddon.addon_id,
        addon_name: soiAddon.addon_name,
        addon_code: soiAddon.addon_code,
        addon_description: soiAddon.addon_description,
        unit_type: soiAddon.unit_type,
        quantity: soiAddon.quantity,
        unit_price: soiAddon.unit_price,
        total_price: soiAddon.total_price,
        duration_minutes: soiAddon.duration_minutes,
        created_by: user.id,
        updated_by: user.id,
      }));
      await this.bookingAddonRepository.createMany(bookingAddons);
    }

    // Copy options
    const soiOptions =
      await this.salesOrderItemOptionRepository.findBySalesOrderItemId(
        salesOrderItemId,
      );
    if (soiOptions.length > 0) {
      const bookingOptions = soiOptions.map((soiOption) => ({
        booking_id: bookingId,
        option_group_id: soiOption.option_group_id,
        option_value_id: soiOption.option_value_id,
        group_name: soiOption.group_name,
        group_code: soiOption.group_code,
        value_label: soiOption.value_label,
        value_code: soiOption.value_code,
        quantity: soiOption.quantity,
        price_adjustment: soiOption.price_adjustment,
        duration_adjustment_minutes: soiOption.duration_adjustment_minutes,
        created_by: user.id,
        updated_by: user.id,
      }));
      await this.bookingOptionRepository.createMany(bookingOptions);
    }
  }

  /**
   * Create booking milestones from service milestone templates.
   *
   * Retrieves active service milestone templates for the booking's service
   * and creates corresponding booking milestones. This is called automatically
   * when a booking is created.
   *
   * Template selection logic:
   * - Templates with package_id = null apply to all packages for that service
   * - Templates with specific package_id only apply when booking has matching package_id
   *
   * @param booking - The newly created booking
   * @param user - Current authenticated user
   * @returns Promise<void>
   */
  private async createBookingMilestonesFromTemplates(
    booking: Booking,
    user: User,
  ): Promise<void> {
    try {
      // 1. Query ALL service milestone templates by service_id and status
      // Note: We query all templates for the service, then filter by package logic
      const queryDto: QueryServiceMilestoneTemplateDto = {
        service_id: booking.service_id,
        status: ServiceMilestoneTemplateStatusEnum.ACTIVE,
        skip: 0,
        take: 100, // Reasonable limit for milestones per service
      };

      const templatesResult =
        await this.serviceMilestoneTemplateRepository.findAll(queryDto);
      const allTemplates = templatesResult.data;

      // 2. Filter templates based on package_id logic:
      // - Templates with package_id = null apply to all packages
      // - Templates with specific package_id only apply when booking has matching package_id
      const applicableTemplates = allTemplates.filter((template) => {
        // If template has no package_id, it applies to all packages
        if (template.package_id === null || template.package_id === undefined) {
          return true;
        }
        // If template has package_id, it only applies if booking has matching package_id
        return template.package_id === booking.package_id;
      });

      // 3. If no templates found, log warning and return (non-blocking)
      if (applicableTemplates.length === 0) {
        this.logger.warn(
          `No active service milestone templates found for service_id: ${booking.service_id}, package_id: ${booking.package_id || 'null'}. Booking created without milestones.`,
        );
        return;
      }

      // 4. Check if milestones already exist (defensive check)
      const existingMilestones =
        await this.bookingMilestoneRepository.findByBookingId(booking.id);
      if (existingMilestones.length > 0) {
        this.logger.warn(
          `Booking ${booking.id} already has ${existingMilestones.length} milestones. Skipping automatic milestone creation.`,
        );
        return;
      }

      // 5. Handle duplicate sequence_order: Group by sequence_order and select one template per sequence
      // Priority: package-specific templates over general templates (package_id = null)
      const templatesBySequence = new Map<
        number,
        (typeof applicableTemplates)[0]
      >();

      for (const template of applicableTemplates) {
        const existing = templatesBySequence.get(template.sequence_order);

        // If no template exists for this sequence_order, add it
        if (!existing) {
          templatesBySequence.set(template.sequence_order, template);
        } else {
          // If template exists, prefer package-specific over general
          // (template with package_id over template with package_id = null)
          const existingIsGeneral =
            existing.package_id === null || existing.package_id === undefined;
          const currentIsGeneral =
            template.package_id === null || template.package_id === undefined;

          // Prefer package-specific template
          if (existingIsGeneral && !currentIsGeneral) {
            templatesBySequence.set(template.sequence_order, template);
          }
          // If both are same type, keep the first one (already in map)
        }
      }

      // Convert map to array and sort by sequence_order
      const uniqueTemplates = Array.from(templatesBySequence.values()).sort(
        (a, b) => a.sequence_order - b.sequence_order,
      );

      // 6. Create milestones from unique templates
      let successCount = 0;
      for (const template of uniqueTemplates) {
        try {
          // Calculate payment amount from booking total
          const paymentAmount =
            (Number(booking.total) * Number(template.payment_percent)) / 100;

          // Create booking milestone domain object
          const milestone = new BookingMilestone();
          milestone.booking_id = booking.id;
          milestone.template_id = template.id;
          milestone.name = template.name;
          milestone.description = template.description || null;
          milestone.sequence_order = template.sequence_order;
          milestone.status = MilestoneStatusEnum.PENDING;
          milestone.payment_percent = Number(template.payment_percent);
          milestone.payment_amount = paymentAmount;
          milestone.payment_released = false;
          milestone.auto_approved = false;
          milestone.auto_approve_after_hours =
            template.auto_approve_after_hours || 48;
          // Copy checklist-specific fields from template
          milestone.milestone_type =
            template.template_type || MilestoneTypeEnum.MILESTONE;
          milestone.category = template.category || null;
          milestone.response_type = template.response_type || null;
          milestone.measurement_unit = template.measurement_unit || null;
          milestone.is_required = template.is_required ?? false;
          milestone.created_by = user as any;

          // Save milestone via repository
          await this.bookingMilestoneRepository.create(milestone);
          successCount++;
        } catch (error) {
          this.logger.error(
            `Failed to create booking milestone from template ${template.id} (sequence_order: ${template.sequence_order}) for booking ${booking.id}:`,
            error,
          );
        }
      }

      if (successCount > 0) {
        this.logger.debug(
          `Created ${successCount} booking milestone(s) for booking ${booking.id}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to create booking milestones for booking ${booking.id}:`,
        error,
      );
    }
  }

  /**
   * Phase D1: Create booking milestones from quotation service items (preventive flow).
   * When a preventive booking is confirmed via quotation-checkout, one milestone per
   * quotation service line is created so progress reflects each service quotation item.
   *
   * @param bookingId - Booking ID (preventive, just confirmed)
   * @param quotationId - Quotation ID
   * @param user - Current user (for audit; typically the customer who checked out)
   */
  async createMilestonesFromQuotationServiceItems(
    bookingId: number,
    quotationId: number,
    user: User,
  ): Promise<void> {
    const booking = await this.findById(bookingId, user);
    const bookingTotal = Number(booking.total) || 0;
    if (bookingTotal <= 0) return;

    const items = await this.dataSource.query(
      `SELECT id, name, description, total_price, sequence_order
       FROM quotation_items
       WHERE quotation_id = $1 AND item_type = 'service' AND deleted_at IS NULL
       ORDER BY sequence_order ASC, id ASC`,
      [quotationId],
    );
    if (items.length === 0) return;

    const existing =
      await this.bookingMilestoneRepository.findByBookingId(bookingId);
    if (existing.length > 0) return;

    let sequenceOrder = 0;
    for (const item of items) {
      sequenceOrder += 1;
      const itemTotal = parseFloat(item.total_price) || 0;
      const paymentPercent =
        bookingTotal > 0 ? (itemTotal / bookingTotal) * 100 : 0;

      const milestone = new BookingMilestone();
      milestone.booking_id = bookingId;
      milestone.template_id = null;
      milestone.source_quotation_item_id = item.id;
      milestone.name = item.name || `Service item ${sequenceOrder}`;
      milestone.description = item.description ?? null;
      milestone.sequence_order = sequenceOrder;
      milestone.status = MilestoneStatusEnum.PENDING;
      milestone.payment_percent = paymentPercent;
      milestone.payment_amount = itemTotal;
      milestone.payment_released = false;
      milestone.auto_approved = false;
      milestone.auto_approve_after_hours = 48;
      milestone.created_by = user as any;
      milestone.milestone_type = MilestoneTypeEnum.MILESTONE;
      milestone.is_required = false;

      await this.bookingMilestoneRepository.create(milestone);
    }
  }

  /**
   * Assign a member to a booking.
   *
   * Assigns a seller member to handle the booking.
   *
   * @param id - Booking ID
   * @param input - Assign member DTO
   * @param user - Current authenticated user
   * @returns Updated booking
   */
  async assignMember(
    id: number,
    input: AssignMemberDto,
    user: User,
  ): Promise<Booking> {
    const booking = await this.findById(id, user);

    // Validate member belongs to the seller
    const member = await this.sellerMembersService.findOne(
      input.assigned_member_id,
    );
    if (member.seller_id !== booking.seller_id) {
      throw new BadRequestException(
        'Member does not belong to the booking seller',
      );
    }

    await this.repository.update(id, {
      assigned_member_id: input.assigned_member_id,
      status: BookingStatusEnum.PROVIDER_ASSIGNED,
      updated_by: user as any,
    });

    // Get updated booking with relations for notification
    const updatedBooking = await this.findById(id, user);

    // Send notification to customer
    await this.bookingNotificationService.sendBookingAssignedNotification(
      updatedBooking,
    );

    return updatedBooking;
  }

  /**
   * Confirm a booking.
   *
   * Transitions booking status to CONFIRMED.
   *
   * @param id - Booking ID
   * @param user - Current authenticated user
   * @returns Updated booking
   */
  async confirmBooking(id: number, user: User): Promise<Booking> {
    const booking = await this.findById(id, user);

    if (
      booking.status !== BookingStatusEnum.PENDING &&
      booking.status !== BookingStatusEnum.AWAITING_CONFIRMATION
    ) {
      throw new BadRequestException(
        `Cannot confirm booking with status: ${booking.status}`,
      );
    }

    await this.repository.update(id, {
      status: BookingStatusEnum.CONFIRMED,
      confirmed_at: new Date(),
      updated_by: user as any,
    });

    // Get updated booking with relations for notification
    const updatedBooking = await this.findById(id, user);

    // Send notification to buyer
    await this.bookingNotificationService.sendBookingConfirmedNotification(
      updatedBooking,
    );

    // Send lifecycle emails to all recipients (customer, seller, approvers)
    this.sendBookingLifecycleEmails({
      booking: updatedBooking,
      event: 'confirmed',
    }).catch((error) => {
      this.logger.warn(
        `Failed to send booking confirmed emails for booking ${id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    });

    return updatedBooking;
  }

  /**
   * Start service.
   *
   * Transitions booking status to IN_PROGRESS and records actual start time.
   *
   * @param id - Booking ID
   * @param user - Current authenticated user
   * @returns Updated booking
   */
  async startService(id: number, user: User): Promise<Booking> {
    const isAdmin = Boolean(user.system_admin);
    const booking = await this.findById(id, user, isAdmin);

    if (
      booking.status !== BookingStatusEnum.CONFIRMED &&
      booking.status !== BookingStatusEnum.PROVIDER_ASSIGNED
    ) {
      // Idempotent: already in progress is ok (e.g. double-tap or stale UI)
      if (booking.status === BookingStatusEnum.IN_PROGRESS) {
        return booking;
      }
      throw new BadRequestException(
        `Cannot start service with status: ${booking.status}`,
      );
    }

    await this.repository.update(id, {
      status: BookingStatusEnum.IN_PROGRESS,
      actual_start_time: new Date(),
      updated_by: user as any,
    });

    // Get updated booking with relations for notification
    const updatedBooking = await this.findById(id, user, isAdmin);

    // Send notification to buyer
    await this.bookingNotificationService.sendBookingStartedNotification(
      updatedBooking,
    );

    // Send lifecycle emails to all recipients (customer, seller, approvers)
    this.sendBookingLifecycleEmails({
      booking: updatedBooking,
      event: 'started',
    }).catch((error) => {
      this.logger.warn(
        `Failed to send service started emails for booking ${id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    });

    return updatedBooking;
  }

  /**
   * Complete service.
   *
   * Transitions booking status to COMPLETED and records actual end time.
   *
   * @param id - Booking ID
   * @param user - Current authenticated user
   * @returns Updated booking
   */
  async completeService(id: number, user: User): Promise<Booking> {
    const booking = await this.findById(id, user);

    if (booking.status !== BookingStatusEnum.IN_PROGRESS) {
      throw new BadRequestException(
        `Cannot complete service with status: ${booking.status}`,
      );
    }

    await this.repository.update(id, {
      status: BookingStatusEnum.COMPLETED,
      actual_end_time: new Date(),
      completed_at: new Date(),
      updated_by: user as any,
    });

    // Get updated booking with relations for notification
    const updatedBooking = await this.findById(id, user);

    // Send notification to buyer
    await this.bookingNotificationService.sendBookingCompletedNotification(
      updatedBooking,
    );

    // Send lifecycle emails to all recipients (customer, seller, approvers)
    this.sendBookingLifecycleEmails({
      booking: updatedBooking,
      event: 'completed',
    }).catch((error) => {
      this.logger.warn(
        `Failed to send service completed emails for booking ${id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    });

    // Release escrow to provider and record seller earning
    this.releaseEscrowAndRecordEarning(updatedBooking, user).catch((error) => {
      this.logger.error(
        `Failed to release escrow for booking ${id}: ${error.message}`,
      );
    });

    return updatedBooking;
  }

  /**
   * Cancel a booking.
   *
   * Transitions booking status to CANCELLED with optional reason.
   *
   * @param id - Booking ID
   * @param cancellationReason - Optional cancellation reason
   * @param user - Current authenticated user
   * @returns Updated booking
   */
  async cancelBooking(
    id: number,
    cancellationReason: string | null,
    user: User,
  ): Promise<Booking> {
    const booking = await this.findById(id, user);
    if (isVenueServiceType(booking.service?.service_type)) {
      throw new BadRequestException(
        VENUE_CANCELLATION_NOT_ALLOWED_ERROR_MESSAGE,
      );
    }

    if (
      booking.status === BookingStatusEnum.COMPLETED ||
      booking.status === BookingStatusEnum.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot cancel booking with status: ${booking.status}`,
      );
    }

    return this.repository.update(id, {
      status: BookingStatusEnum.CANCELLED,
      cancelled_at: new Date(),
      cancelled_by: user.id,
      cancellation_reason: cancellationReason || null,
      updated_by: user as any,
    });
  }

  /**
   * Generate unique booking number.
   *
   * Format: BK-YYYYMMDD-XXXX
   * Example: BK-20241211-1234
   *
   * @returns Generated booking number
   */
  private generateBookingNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    // Generate 4-digit random number
    const random = Math.floor(1000 + Math.random() * 9000);

    return `BK-${dateStr}-${random}`;
  }

  /**
   * Get calendar data for a seller for a specific month.
   *
   * Returns calendar days with booking counts and unavailability info.
   *
   * @param sellerId - Seller ID
   * @param year - Year (YYYY)
   * @param month - Month (1-12)
   * @param user - Current authenticated user (for authorization)
   * @returns Array of calendar days
   */
  async getCalendarMonth(
    sellerId: number,
    year: number,
    month: number,
    user: User,
  ): Promise<CalendarDay[]> {
    // Verify user has access to this seller
    const seller = await this.sellersService.findById(sellerId);
    if (seller.user_id !== user.id) {
      throw new ForbiddenException('Access denied to seller calendar');
    }

    // Get all bookings for the month
    const bookings = await this.repository.findBySellerAndMonth(
      sellerId,
      year,
      month,
    );

    // Get all unavailability for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Query unavailability for the month
    const unavailabilityList = await this.storeUnavailabilityRepository.findAll(
      {
        seller_id: sellerId,
        skip: 0,
        take: 1000, // Get all for the month
      },
    );

    // Filter unavailability for the month
    const monthUnavailability = unavailabilityList.data.filter((u) => {
      const uDate = new Date(u.unavailable_date);
      return uDate >= startDate && uDate <= endDate;
    });

    // Group bookings by date
    const bookingsByDate = new Map<string, Booking[]>();
    bookings.forEach((booking) => {
      const dateStr =
        booking.scheduled_date instanceof Date
          ? booking.scheduled_date.toISOString().split('T')[0]
          : String(booking.scheduled_date).split('T')[0];
      if (!bookingsByDate.has(dateStr)) {
        bookingsByDate.set(dateStr, []);
      }
      bookingsByDate.get(dateStr)!.push(booking);
    });

    // Group unavailability by date
    const unavailabilityByDate = new Map<string, boolean>();
    monthUnavailability.forEach((u) => {
      unavailabilityByDate.set(u.unavailable_date, true);
    });

    // Generate calendar days for the month
    const calendarDays: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= endDate.getDate(); day++) {
      // Format date as YYYY-MM-DD without timezone conversion
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const date = new Date(year, month - 1, day);
      const dayBookings = bookingsByDate.get(dateStr) || [];
      const hasUnavailability = unavailabilityByDate.has(dateStr);
      const isToday =
        date.getTime() === today.getTime() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

      calendarDays.push({
        date: dateStr,
        bookings_count: dayBookings.length,
        has_unavailability: hasUnavailability,
        is_today: isToday,
        is_selected: false,
      });
    }

    return calendarDays;
  }

  /**
   * Get day schedule for a seller for a specific date.
   *
   * Returns timeline items (bookings and unavailability) for the day.
   *
   * @param sellerId - Seller ID
   * @param date - Date (YYYY-MM-DD)
   * @param user - Current authenticated user (for authorization)
   * @returns Array of schedule items
   */
  async getDaySchedule(
    sellerId: number,
    date: string,
    user: User,
  ): Promise<DayScheduleItem[]> {
    // Verify user has access to this seller
    const seller = await this.sellersService.findById(sellerId);
    if (seller.user_id !== user.id) {
      throw new ForbiddenException('Access denied to seller schedule');
    }

    // Get bookings for the date
    const bookings = await this.repository.findBySellerAndDate(sellerId, date);

    // Get unavailability for the date
    const unavailabilityList = await this.storeUnavailabilityRepository.findAll(
      {
        seller_id: sellerId,
        unavailable_date: date,
        skip: 0,
        take: 100,
      },
    );

    const scheduleItems: DayScheduleItem[] = [];

    // Add bookings to schedule
    bookings.forEach((booking) => {
      scheduleItems.push({
        type: 'booking',
        start_time: booking.scheduled_start_time,
        end_time: booking.scheduled_end_time || booking.scheduled_start_time,
        title: booking.service?.title || 'Service',
        subtitle:
          `Customer: ${booking.customer?.first_name || ''} ${booking.customer?.last_name || ''}`.trim() ||
          null,
        booking_id: booking.id,
        status: booking.status,
      });
    });

    // Add unavailability to schedule
    unavailabilityList.data.forEach((u) => {
      if (u.is_full_day) {
        scheduleItems.push({
          type: 'unavailability',
          start_time: '00:00:00',
          end_time: '23:59:59',
          title: 'Unavailable (Full Day)',
          subtitle: u.reason || null,
          booking_id: null,
          status: null,
        });
      } else if (u.start_time && u.end_time) {
        scheduleItems.push({
          type: 'unavailability',
          start_time: u.start_time,
          end_time: u.end_time,
          title: 'Unavailable',
          subtitle: u.reason || null,
          booking_id: null,
          status: null,
        });
      }
    });

    // Sort by start time
    scheduleItems.sort((a, b) => {
      const timeA = a.start_time.split(':').map(Number);
      const timeB = b.start_time.split(':').map(Number);
      const minutesA = timeA[0] * 60 + timeA[1];
      const minutesB = timeB[0] * 60 + timeB[1];
      return minutesA - minutesB;
    });

    return scheduleItems;
  }

  /**
   * Find booking by ID.
   *
   * @param id - Booking ID
   * @param user - Current authenticated user (for authorization)
   * @param isAdmin - Whether user is admin (bypasses access check)
   * @returns Booking if found
   */
  async findById(id: number, user: User, isAdmin = false): Promise<Booking> {
    const booking = await this.repository.findById(id);

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    // Admins can access any booking
    if (isAdmin && user.system_admin) {
      await this.attachBookingDetails(booking);
      return booking;
    }

    // Verify access (customer, seller, or assigned member)
    // Check if user is the customer
    const isCustomer = booking.customer_id === user.id;

    // Check if user is the seller (seller.user_id matches user.id)
    const isSeller = booking.seller?.user_id === user.id;

    // Check if user is seller-scoped (e.g. store member under the same seller)
    const scopedSellerId = Number(user.seller_id);
    const hasSellerScopeAccess =
      Number.isInteger(scopedSellerId) &&
      scopedSellerId > 0 &&
      booking.seller_id === scopedSellerId;

    // Check if user is the assigned member
    const isAssignedMember = booking.assigned_member_id === user.id;

    const hasAccess =
      isCustomer || isSeller || hasSellerScopeAccess || isAssignedMember;

    if (!hasAccess) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    await this.attachBookingDetails(booking);
    return booking;
  }

  /**
   * Find booking by ID (internal, no authorization check).
   *
   * For internal service-to-service calls where user context is unavailable
   * (e.g., cron jobs, escrow service callbacks, payment webhooks).
   *
   * @param id - Booking ID
   * @returns Booking if found
   */
  async findByIdInternal(id: number): Promise<Booking> {
    const booking = await this.repository.findById(id);
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }
    await this.attachBookingDetails(booking);
    return booking;
  }

  private async attachBookingPaymentStatus(booking: Booking): Promise<void> {
    if (booking.checkout_order?.payment_status) {
      booking.payment_status = booking.checkout_order.payment_status;
      return;
    }

    if ((booking.sales_order as any)?.payment_status) {
      booking.payment_status = (booking.sales_order as any).payment_status;
      return;
    }

    // The sales_order relation may not be loaded (e.g. list queries omit it).
    // Fall back to a direct DB lookup using the FK so zero-balance bookings
    // (fully covered by voucher, no escrow transactions) report 'paid' correctly.
    const salesOrderId = this.resolveBookingSalesOrderId(booking);
    if (salesOrderId) {
      const order = await this.salesOrderRepository.findOne({
        where: { id: salesOrderId },
        select: ['id', 'payment_status'],
      });
      if (order?.payment_status) {
        booking.payment_status = order.payment_status as PaymentStatusEnum;
        return;
      }
    }

    const transactions =
      await this.escrowTransactionsService.findByBookingIdInternal(booking.id);
    booking.payment_status =
      this.derivePaymentStatusFromEscrowTransactions(transactions);
  }

  private resolveBookingSalesOrderId(booking: Booking): number | null {
    const candidates = [
      booking.sales_order_id,
      (booking.sales_order as any)?.id,
      (booking.sales_order_item as any)?.order_id,
    ];
    for (const candidate of candidates) {
      const id = Number(candidate ?? 0);
      if (Number.isInteger(id) && id > 0) return id;
    }
    return null;
  }

  private calculateFeeBreakdown(
    subtotal: number,
    platformFeePercent: number,
  ): { platformFee: number; providerPayout: number } {
    const platformFee = (subtotal * platformFeePercent) / 100;
    return { platformFee, providerPayout: subtotal - platformFee };
  }

  private async attachBookingDetails(booking: Booking): Promise<void> {
    await Promise.all([
      this.attachBookingPaymentStatus(booking),
      this.attachBookingVoucherDetails(booking),
    ]);
  }

  private async attachBookingVoucherDetails(booking: Booking): Promise<void> {
    const salesOrderId = this.resolveBookingSalesOrderId(booking);
    const appliedVouchers =
      salesOrderId !== null
        ? await this.salesOrderVoucherRepository.find({
            where: { sales_order_id: salesOrderId },
            relations: ['user_voucher', 'user_voucher.voucher'],
            order: { id: 'ASC' },
          })
        : [];

    const normalizedVouchers = appliedVouchers.map((voucher) => ({
      id: voucher.id,
      voucher_code: voucher.voucher_code,
      voucher_discount: Number(voucher.voucher_discount ?? 0),
      user_voucher_id: voucher.user_voucher_id,
      include_addons_flag:
        voucher.user_voucher?.voucher?.include_addons_flag ?? false,
    }));

    booking.applied_vouchers = normalizedVouchers;

    if (booking.sales_order && typeof booking.sales_order === 'object') {
      (
        booking.sales_order as { vouchers?: typeof normalizedVouchers }
      ).vouchers = normalizedVouchers;
    }
  }

  private derivePaymentStatusFromEscrowTransactions(
    transactions: EscrowTransaction[],
  ): PaymentStatusEnum {
    if (transactions.length === 0) {
      return PaymentStatusEnum.PENDING;
    }

    const completedDeposits = transactions.filter(
      (transaction) =>
        transaction.transaction_type === EscrowTransactionTypeEnum.DEPOSIT &&
        transaction.status === EscrowTransactionStatusEnum.COMPLETED,
    );
    const failedDeposits = transactions.filter(
      (transaction) =>
        transaction.transaction_type === EscrowTransactionTypeEnum.DEPOSIT &&
        transaction.status === EscrowTransactionStatusEnum.FAILED,
    );
    const inFlightDeposits = transactions.filter(
      (transaction) =>
        transaction.transaction_type === EscrowTransactionTypeEnum.DEPOSIT &&
        [
          EscrowTransactionStatusEnum.PENDING,
          EscrowTransactionStatusEnum.PROCESSING,
        ].includes(transaction.status),
    );

    const completedRefunds = transactions.filter(
      (transaction) =>
        transaction.transaction_type === EscrowTransactionTypeEnum.REFUND &&
        transaction.status === EscrowTransactionStatusEnum.COMPLETED,
    );
    const inFlightRefunds = transactions.filter(
      (transaction) =>
        transaction.transaction_type === EscrowTransactionTypeEnum.REFUND &&
        [
          EscrowTransactionStatusEnum.PENDING,
          EscrowTransactionStatusEnum.PROCESSING,
        ].includes(transaction.status),
    );

    if (inFlightDeposits.length > 0 || inFlightRefunds.length > 0) {
      return PaymentStatusEnum.PROCESSING;
    }

    const totalDeposited = completedDeposits.reduce(
      (sum, transaction) => sum + Number(transaction.amount ?? 0),
      0,
    );
    const totalRefunded = completedRefunds.reduce(
      (sum, transaction) => sum + Number(transaction.amount ?? 0),
      0,
    );

    if (totalRefunded > 0) {
      if (totalDeposited > 0 && totalRefunded < totalDeposited) {
        return PaymentStatusEnum.PARTIAL;
      }
      return PaymentStatusEnum.REFUNDED;
    }

    if (totalDeposited > 0) {
      return PaymentStatusEnum.PAID;
    }

    if (failedDeposits.length > 0) {
      return PaymentStatusEnum.FAILED;
    }

    return PaymentStatusEnum.PENDING;
  }

  /**
   * Convert query pagination parameters to IPaginationOptions.
   * Supports both skip/take and page/limit patterns.
   *
   * @param query - Query parameters
   * @returns Pagination options
   */
  private getPaginationOptions(query: QueryBookingDto): IPaginationOptions {
    // Support both take/skip and page/limit patterns
    if (query.take !== undefined || query.skip !== undefined) {
      // Use take/skip if provided
      const skip = query.skip ?? 0;
      const take = query.take ?? 20;
      const page = take > 0 ? Math.floor(skip / take) + 1 : 1;
      return {
        page,
        limit: take,
      };
    } else {
      // Use page/limit if provided
      return {
        page: query.page || 1,
        limit: query.limit || 20,
      };
    }
  }

  /**
   * Find bookings by customer ID.
   *
   * @param user - Current authenticated user
   * @param query - Query parameters
   * @returns Paginated bookings
   */
  async findByCustomerId(
    user: User,
    query: QueryBookingDto,
  ): Promise<IPaginatedResult<Booking>> {
    const paginationOptions = this.getPaginationOptions(query);
    const filterOptions: {
      status?: string;
      statuses?: string[];
      scheduled_date?: string;
      start_date?: string;
      end_date?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {};

    if (query.statuses && query.statuses.length > 0) {
      filterOptions.statuses = query.statuses.map((s) =>
        String(s).toLowerCase(),
      );
    } else if (query.status != null) {
      filterOptions.status = String(query.status).toLowerCase();
    }
    if (query.scheduled_date) {
      filterOptions.scheduled_date = query.scheduled_date;
    }
    if (query.start_date) {
      filterOptions.start_date = query.start_date;
    }
    if (query.end_date) {
      filterOptions.end_date = query.end_date;
    }
    if (query.sortBy) {
      filterOptions.sortBy = query.sortBy;
    }
    if (query.sortOrder) {
      filterOptions.sortOrder = query.sortOrder;
    }

    const opts =
      Object.keys(filterOptions).length > 0 ? filterOptions : undefined;

    return this.repository.findByCustomerId(user.id, paginationOptions, opts);
  }

  /**
   * Find bookings for current user's seller account.
   *
   * @param user - Current authenticated user
   * @param query - Query parameters
   * @returns Paginated bookings
   */
  async findMySellerBookings(
    user: User,
    query: QueryBookingDto,
  ): Promise<IPaginatedResult<Booking>> {
    const seller = await this.findSellerForUser(user);

    const paginationOptions = this.getPaginationOptions(query);
    const filterOptions: {
      status?: string;
      statuses?: string[];
      scheduled_date?: string;
      start_date?: string;
      end_date?: string;
      awaiting_quotation?: boolean;
    } = {};

    if (query.statuses && query.statuses.length > 0) {
      filterOptions.statuses = query.statuses.map((s) =>
        String(s).toLowerCase(),
      );
    } else if (query.status != null) {
      const statusStr = String(query.status).toLowerCase();
      filterOptions.status = statusStr;
      // Note: pending and awaiting_quotation are now separate tabs, no merging
    }
    if (query.scheduled_date) {
      filterOptions.scheduled_date = query.scheduled_date;
    }
    if (query.start_date) {
      filterOptions.start_date = query.start_date;
    }
    if (query.end_date) {
      filterOptions.end_date = query.end_date;
    }
    // awaiting_quotation query param is no longer used - each status is a separate tab

    // Always pass filterOptions when we have status or awaiting_quotation so pending tab works
    const opts =
      Object.keys(filterOptions).length > 0 ? filterOptions : undefined;
    if (query.status === 'pending' || query.awaiting_quotation === true) {
      this.logger.debug(
        `findMySellerBookings: user.id=${user.id} seller.id=${seller.id} query.status=${query.status} query.awaiting_quotation=${query.awaiting_quotation} filterOptions=${JSON.stringify(opts)}`,
      );
    }
    return this.repository.findBySellerId(seller.id, paginationOptions, opts);
  }

  async getStatusCountsForSeller(
    sellerId: number,
    query: QueryBookingDto,
  ): Promise<Record<string, number>> {
    return this.repository.findCountsBySellerId({
      sellerId,
      startDate: query.start_date,
      endDate: query.end_date,
    });
  }

  async getStatusCountsForCustomer(
    customerId: number,
    query: QueryBookingDto,
  ): Promise<Record<string, number>> {
    return this.repository.findCountsByCustomerId({
      customerId,
      startDate: query.start_date,
      endDate: query.end_date,
    });
  }

  async findSellerForUser(user: User) {
    const seller = await this.sellersService.findByUserId(user.id);
    if (!seller) {
      throw new NotFoundException('Seller profile not found for current user');
    }
    return seller;
  }

  /**
   * Find bookings by seller ID.
   *
   * @param sellerId - Seller ID
   * @param user - Current authenticated user (for authorization)
   * @param query - Query parameters
   * @returns Paginated bookings
   */
  async findBySellerId(
    sellerId: number,
    user: User,
    query: QueryBookingDto,
  ): Promise<IPaginatedResult<Booking>> {
    // Verify user has access to this seller
    const seller = await this.sellersService.findById(sellerId);
    if (seller.user_id !== user.id) {
      throw new ForbiddenException('Access denied to seller bookings');
    }

    const paginationOptions = this.getPaginationOptions(query);
    const filterOptions: {
      status?: string;
      statuses?: string[];
      scheduled_date?: string;
      start_date?: string;
      end_date?: string;
      awaiting_quotation?: boolean;
    } = {};

    if (query.statuses && query.statuses.length > 0) {
      filterOptions.statuses = query.statuses.map((s) => String(s));
    } else if (query.status) {
      filterOptions.status = String(query.status);
      if (query.status === 'pending') {
        filterOptions.awaiting_quotation = true;
      }
    }
    if (query.scheduled_date) {
      filterOptions.scheduled_date = query.scheduled_date;
    }
    if (query.start_date) {
      filterOptions.start_date = query.start_date;
    }
    if (query.end_date) {
      filterOptions.end_date = query.end_date;
    }
    if (query.awaiting_quotation === true) {
      filterOptions.awaiting_quotation = true;
      if (!filterOptions.status) {
        filterOptions.status = 'pending';
      }
    }

    return this.repository.findBySellerId(
      sellerId,
      paginationOptions,
      Object.keys(filterOptions).length > 0 ? filterOptions : undefined,
    );
  }

  /**
   * Find bookings by checkout order ID.
   *
   * @param checkoutOrderId - Checkout order ID
   * @param user - Current authenticated user (for authorization)
   * @returns Array of bookings
   */
  async findByCheckoutOrderId(
    checkoutOrderId: number,
    user: User,
  ): Promise<Booking[]> {
    // Verify checkout order belongs to user
    await this.checkoutOrdersService.findById(checkoutOrderId, user);

    return this.repository.findByCheckoutOrderId(checkoutOrderId);
  }

  /**
   * Update a booking.
   *
   * @param id - Booking ID
   * @param input - Update DTO
   * @param user - Current authenticated user
   * @returns Updated booking
   */
  async update(
    id: number,
    input: UpdateBookingDto,
    user: User,
  ): Promise<Booking> {
    // Verify access
    await this.findById(id, user);

    const updateData: Partial<Booking> = {};

    if (input.status !== undefined) {
      updateData.status = input.status;
    }

    if (input.scheduled_date !== undefined) {
      updateData.scheduled_date = new Date(input.scheduled_date);
    }

    if (input.scheduled_start_time !== undefined) {
      updateData.scheduled_start_time = input.scheduled_start_time;
    }

    if (input.scheduled_end_time !== undefined) {
      updateData.scheduled_end_time = input.scheduled_end_time;
    }

    if (input.assigned_member_id !== undefined) {
      updateData.assigned_member_id = input.assigned_member_id;
    }

    if (input.service_address_id !== undefined) {
      updateData.service_address_id = input.service_address_id;
    }

    if (input.service_address_text !== undefined) {
      updateData.service_address_text = input.service_address_text;
    }

    if (input.service_latitude !== undefined) {
      updateData.service_latitude = input.service_latitude;
    }

    if (input.service_longitude !== undefined) {
      updateData.service_longitude = input.service_longitude;
    }

    if (input.customer_notes !== undefined) {
      updateData.customer_notes = input.customer_notes;
    }

    if (input.provider_notes !== undefined) {
      updateData.provider_notes = input.provider_notes;
    }

    if (input.internal_notes !== undefined) {
      updateData.internal_notes = input.internal_notes;
    }

    if (input.cancellation_reason !== undefined) {
      updateData.cancellation_reason = input.cancellation_reason;
    }

    updateData.updated_by = user as any;

    return this.repository.update(id, updateData);
  }

  /**
   * Update booking status.
   *
   * @param id - Booking ID
   * @param input - Update status DTO
   * @param user - Current authenticated user
   * @returns Updated booking
   */
  async updateStatus(
    id: number,
    input: UpdateBookingStatusDto,
    user: User,
  ): Promise<Booking> {
    const booking = await this.findById(id, user, user.system_admin);

    const updateData: Partial<Booking> = {
      status: input.status,
      updated_by: user as any,
    };

    // Set timestamps based on status
    if (input.status === BookingStatusEnum.CONFIRMED && !booking.confirmed_at) {
      updateData.confirmed_at = new Date();
    }

    if (
      input.status === BookingStatusEnum.IN_PROGRESS &&
      !booking.actual_start_time
    ) {
      updateData.actual_start_time = new Date();
    }

    if (input.status === BookingStatusEnum.COMPLETED) {
      updateData.actual_end_time = new Date();
      updateData.completed_at = new Date();
    }

    if (input.status === BookingStatusEnum.CANCELLED) {
      updateData.cancelled_at = new Date();
      updateData.cancelled_by = user.id;
    }

    // Add notes if provided
    if (input.notes) {
      if (input.status === BookingStatusEnum.CANCELLED) {
        updateData.cancellation_reason = input.notes;
      } else {
        updateData.provider_notes = input.notes;
      }
    }

    const updatedBooking = await this.repository.update(id, updateData);

    // Dispatch lifecycle emails for status transitions that have a corresponding
    // email event. This mirrors what the dedicated action endpoints do, so that
    // email notifications are sent regardless of which endpoint is used.
    const lifecycleEvent = this.resolveLifecycleEmailEvent(
      input.status,
      booking.customer_id,
      user.id,
    );
    if (lifecycleEvent) {
      this.sendBookingLifecycleEmails({
        booking: updatedBooking,
        event: lifecycleEvent,
        reason: input.notes || undefined,
      }).catch((error) => {
        this.logger.warn(
          `Failed to send status-update lifecycle email (${lifecycleEvent}) for booking ${id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      });
    }

    return updatedBooking;
  }

  private resolveLifecycleEmailEvent(
    status: BookingStatusEnum,
    customerId: number | null | undefined,
    actorUserId: number,
  ):
    | 'confirmed'
    | 'started'
    | 'completed'
    | 'cancelled_by_customer'
    | 'cancelled_by_provider'
    | null {
    switch (status) {
      case BookingStatusEnum.CONFIRMED:
        return 'confirmed';
      case BookingStatusEnum.IN_PROGRESS:
        return 'started';
      case BookingStatusEnum.COMPLETED:
        return 'completed';
      case BookingStatusEnum.CANCELLED:
        return customerId === actorUserId
          ? 'cancelled_by_customer'
          : 'cancelled_by_provider';
      default:
        return null;
    }
  }

  /**
   * Find all bookings (admin only).
   *
   * @param query - Query parameters
   * @returns Paginated bookings
   */
  async findAll(query: QueryBookingDto): Promise<IPaginatedResult<Booking>> {
    const paginationOptions = this.getPaginationOptions(query);

    return this.repository.findAllWithPagination({
      filterQuery: {
        status: query.status,
        seller_id: query.seller_id,
        customer_id: query.customer_id,
        scheduled_date: query.scheduled_date,
      },
      paginationOptions,
      sortBy: query.sortBy ?? 'created_at',
      sortOrder: query.sortOrder ?? 'desc',
    });
  }

  /**
   * Admin: Force cancel a booking.
   *
   * Allows admin to cancel any booking with custom refund percentage.
   *
   * @param id - Booking ID
   * @param reason - Cancellation reason
   * @param reasonDetails - Cancellation reason details
   * @param refundPercent - Optional refund percentage (0-100)
   * @param user - Admin user
   * @returns Cancellation record
   */
  async adminForceCancel(
    id: number,
    reason: CancellationReasonEnum,
    reasonDetails: string,
    refundPercent: number | undefined,
    user: User,
  ): Promise<BookingCancellation> {
    // Use cancellation service with admin override
    const cancellationDto: CreateBookingCancellationDto = {
      reason,
      reason_details: reasonDetails,
    };

    // Pass refundPercent to cancelBooking for admin override
    const cancellation = await this.bookingCancellationsService.cancelBooking(
      id,
      cancellationDto,
      user,
      refundPercent, // Pass refundPercent as adminRefundPercent
    );

    return cancellation;
  }

  /**
   * Admin: Force complete a booking.
   *
   * Allows admin to mark any booking as completed.
   *
   * @param id - Booking ID
   * @param user - Admin user
   * @returns Updated booking
   */
  async adminForceComplete(id: number, user: User): Promise<Booking> {
    // Get booking without access check (admin)
    await this.findById(id, user, true);

    return this.repository.update(id, {
      status: BookingStatusEnum.COMPLETED,
      actual_end_time: new Date(),
      completed_at: new Date(),
      updated_by: user as any,
    });
  }

  /**
   * Admin: Initiate refund for a booking.
   *
   * Allows admin to initiate a refund for any booking.
   *
   * @param id - Booking ID
   * @param amount - Refund amount
   * @param reason - Refund reason
   * @param user - Admin user
   * @returns Escrow transaction
   */
  async adminInitiateRefund(
    id: number,
    amount: number,
    reason: string,
    user: User,
  ): Promise<any> {
    // Get booking without access check (admin)
    const booking = await this.findById(id, user, true);
    if (isVenueServiceType(booking.service?.service_type)) {
      throw new BadRequestException(VENUE_REFUND_NOT_ALLOWED_ERROR_MESSAGE);
    }

    // Process refund via escrow service
    return this.escrowTransactionsService.processRefund(
      id,
      amount,
      1, // Default currency
      `Admin refund: ${reason}`,
      user,
    );
  }

  /**
   * Decline a pending booking.
   *
   * Allows the seller to decline a booking with a reason.
   * Transitions the booking status to CANCELLED with decline reason.
   *
   * @param id - Booking ID
   * @param input - Decline booking DTO with reason
   * @param user - Current authenticated user (seller)
   * @returns Updated booking
   */
  async declineBooking(
    id: number,
    input: DeclineBookingDto,
    user: User,
  ): Promise<Booking> {
    const booking = await this.findById(id, user);

    // Validate user is seller of this booking or admin
    const seller = await this.sellersService.findByUserId(user.id);
    const isSeller = seller && booking.seller_id === seller.id;

    if (!isSeller && !user.system_admin) {
      throw new ForbiddenException('Only the seller can decline this booking');
    }

    // Validate status allows decline (AWAITING_QUOTATION, PENDING, CONFIRMED, PROVIDER_ASSIGNED, IN_PROGRESS)
    const allowedDeclineStatuses = [
      BookingStatusEnum.AWAITING_QUOTATION,
      BookingStatusEnum.PENDING,
      BookingStatusEnum.CONFIRMED,
      BookingStatusEnum.PROVIDER_ASSIGNED,
      BookingStatusEnum.IN_PROGRESS,
    ];
    if (!allowedDeclineStatuses.includes(booking.status as BookingStatusEnum)) {
      throw new BadRequestException(
        `Cannot decline booking with status: ${booking.status}`,
      );
    }

    // Use the cancellation service with PROVIDER_UNAVAILABLE reason (declined by provider)
    const cancellationDto: CreateBookingCancellationDto = {
      reason: CancellationReasonEnum.PROVIDER_UNAVAILABLE,
      reason_details: `Declined: ${input.reason}`,
    };

    await this.bookingCancellationsService.cancelBooking(
      id,
      cancellationDto,
      user,
    );

    // Cancel any linked quotations for this booking (e.g. diagnostic assessment quotation)
    try {
      await this.dataSource.query(
        `UPDATE quote_requests SET status = 'cancelled', updated_at = NOW()
         WHERE (assessment_booking_id = $1 OR id IN (
           SELECT quotation_id FROM bookings WHERE id = $1 AND quotation_id IS NOT NULL
           UNION
           SELECT source_quotation_id FROM bookings WHERE id = $1 AND source_quotation_id IS NOT NULL
         ))
         AND status NOT IN ('cancelled', 'accepted', 'rejected')`,
        [id],
      );
    } catch (error) {
      this.logger.error(
        `Failed to cancel linked quotations for booking ${id}:`,
        error,
      );
    }

    // Get updated booking and send notification to buyer about rejection
    const updatedBooking = await this.findById(id, user);
    await this.bookingNotificationService.sendBookingDeclinedNotification(
      updatedBooking,
      input.reason,
    );

    // Send lifecycle emails to all recipients (customer, seller, approvers)
    this.sendBookingLifecycleEmails({
      booking: updatedBooking,
      event: 'declined',
      reason: input.reason,
    }).catch((error) => {
      this.logger.warn(
        `Failed to send booking declined emails for booking ${id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    });

    return updatedBooking;
  }

  /**
   * Update provider notes for a booking.
   *
   * Allows seller or assigned member to update provider notes.
   *
   * @param id - Booking ID
   * @param input - Update provider notes DTO
   * @param user - Current authenticated user
   * @returns Updated booking
   */
  async updateProviderNotes(
    id: number,
    input: UpdateProviderNotesDto,
    user: User,
  ): Promise<Booking> {
    const booking = await this.findById(id, user);

    // Validate user is seller, assigned member, or admin
    const seller = await this.sellersService.findByUserId(user.id);
    const isSeller = seller && booking.seller_id === seller.id;
    const isAssignedMember = booking.assigned_member_id === user.id;

    if (!isSeller && !isAssignedMember && !user.system_admin) {
      throw new ForbiddenException(
        'You do not have permission to update notes for this booking',
      );
    }

    await this.repository.update(id, {
      provider_notes: input.provider_notes,
      updated_by: user as any,
    });

    // Get updated booking with relations for notification
    const updatedBooking = await this.findById(id, user);

    // Send notification to customer about booking update
    await this.bookingNotificationService.sendBookingUpdatedNotification(
      updatedBooking,
    );

    return updatedBooking;
  }

  /**
   * Reschedule a booking to a new date/time.
   *
   * Validates the new date/time is in the future and the booking
   * is in a reschedulable state.
   *
   * @param id - Booking ID
   * @param input - Reschedule booking DTO
   * @param user - Current authenticated user
   * @returns Updated booking
   */
  async rescheduleBooking(
    id: number,
    input: RescheduleBookingDto,
    user: User,
  ): Promise<Booking> {
    const booking = await this.findById(id, user);

    // Validate booking can be rescheduled (not completed/cancelled)
    if (
      booking.status === BookingStatusEnum.COMPLETED ||
      booking.status === BookingStatusEnum.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot reschedule booking with status: ${booking.status}`,
      );
    }

    if (booking.open_play_event_id) {
      throw new BadRequestException('Open play bookings cannot be rescheduled');
    }

    const requestedStartTime = input.scheduled_time;
    const requestedEndTime =
      input.scheduled_end_time ||
      booking.scheduled_end_time ||
      this.addMinutesToTime(
        requestedStartTime,
        this.resolveFallbackRescheduleDurationMinutes(booking),
      );
    const originalDurationMinutes =
      this.resolveFallbackRescheduleDurationMinutes(booking);
    const requestedDurationMinutes = this.resolveDurationBetweenTimes(
      requestedStartTime,
      requestedEndTime,
    );
    const requestedServiceId =
      typeof input.service_id === 'number' && input.service_id > 0
        ? input.service_id
        : booking.service_id;

    if (
      !Number.isInteger(requestedServiceId) ||
      Number(requestedServiceId) <= 0
    ) {
      throw new BadRequestException('Selected service is invalid.');
    }

    if (Number(requestedServiceId) !== Number(booking.service_id)) {
      const requestedService =
        await this.servicesService.findById(requestedServiceId);

      if (requestedService.seller_id !== booking.seller_id) {
        throw new BadRequestException(
          'Selected court/service does not belong to this seller.',
        );
      }

      if (requestedService.status !== ServiceStatusEnum.ACTIVE) {
        throw new BadRequestException('Selected court/service is not active.');
      }

      if (requestedService.service_type !== ServiceTypeEnum.VENUE) {
        throw new BadRequestException(
          'Reschedule service change is only supported for venue bookings.',
        );
      }
    }

    if (requestedDurationMinutes !== originalDurationMinutes) {
      throw new BadRequestException(
        `Rescheduled booking must keep the original slot count (${originalDurationMinutes} minutes).`,
      );
    }

    const previousSchedule = {
      date: this.normalizeDateOnly(booking.scheduled_date),
      start_time: booking.scheduled_start_time,
      end_time: booking.scheduled_end_time ?? null,
    };

    // Validate new date/time is in the future
    const newDateTime = new Date(
      `${input.scheduled_date}T${requestedStartTime}`,
    );
    if (Number.isNaN(newDateTime.getTime()) || newDateTime <= new Date()) {
      throw new BadRequestException(
        'Scheduled date/time must be in the future',
      );
    }

    const availability = await this.sellerSchedulesService.checkAvailability({
      seller_id: booking.seller_id,
      date: input.scheduled_date,
      start_time: requestedStartTime,
      end_time: requestedEndTime,
      service_id: requestedServiceId,
      exclude_booking_id: booking.id,
    });

    if (!availability?.available) {
      throw new BadRequestException(
        availability?.reason || 'Selected slot is no longer available',
      );
    }

    // Build update data
    const updateData: Partial<Booking> = {
      scheduled_date: new Date(input.scheduled_date),
      scheduled_start_time: requestedStartTime,
      scheduled_end_time: requestedEndTime,
      updated_by: user as any,
    };

    if (Number(requestedServiceId) !== Number(booking.service_id)) {
      updateData.service_id = requestedServiceId;
    }

    if (input.service_address_id !== undefined) {
      updateData.service_address_id = input.service_address_id;
    }

    // Store reschedule reason in provider notes (append to existing)
    if (input.reason) {
      const timestamp = new Date().toISOString();
      const rescheduleNote = `[${timestamp}] Rescheduled: ${input.reason}`;
      updateData.provider_notes = booking.provider_notes
        ? `${booking.provider_notes}\n${rescheduleNote}`
        : rescheduleNote;
    }

    await this.repository.update(id, updateData);

    // Get updated booking with relations for notification
    const updatedBooking = await this.findById(id, user);

    // Send notification - if customer reschedules, notify seller
    if (booking.customer_id === user.id) {
      await this.bookingNotificationService.sendBookingRescheduledNotification(
        updatedBooking,
      );
    } else {
      await this.bookingNotificationService.sendBookingRescheduledBySellerNotification(
        updatedBooking,
      );
    }

    const actorType =
      booking.customer_id === user.id
        ? ('customer' as const)
        : ('seller' as const);
    this.sendBookingRescheduledEmails({
      bookingBeforeUpdate: booking,
      updatedBooking,
      actor: user,
      actorType,
      oldSchedule: previousSchedule,
      newSchedule: {
        date: input.scheduled_date,
        start_time: requestedStartTime,
        end_time:
          input.scheduled_end_time ||
          updatedBooking.scheduled_end_time ||
          requestedEndTime,
      },
      reason: input.reason || null,
    }).catch((error) => {
      this.logger.warn(
        `Failed to send booking reschedule email for booking ${updatedBooking.booking_number}: ${error instanceof Error ? error.message : String(error)}`,
      );
    });

    return updatedBooking;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = String(time)
      .split(':')
      .map((value) => Number(value));
    return hours * 60 + minutes;
  }

  private resolveFallbackRescheduleDurationMinutes(booking: Booking): number {
    if (booking.scheduled_start_time && booking.scheduled_end_time) {
      const startMinutes = this.timeToMinutes(booking.scheduled_start_time);
      const endMinutes = this.timeToMinutes(booking.scheduled_end_time);
      if (endMinutes > startMinutes) {
        return endMinutes - startMinutes;
      }
    }

    const serviceSlotDuration = Number(
      (booking.service as { slot_duration_minutes?: number } | undefined)
        ?.slot_duration_minutes,
    );
    if (Number.isFinite(serviceSlotDuration) && serviceSlotDuration > 0) {
      return Math.max(1, Math.floor(serviceSlotDuration));
    }

    return 60;
  }

  private resolveDurationBetweenTimes(
    startTime: string,
    endTime: string,
  ): number {
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);

    if (
      !Number.isFinite(startMinutes) ||
      !Number.isFinite(endMinutes) ||
      endMinutes <= startMinutes
    ) {
      throw new BadRequestException(
        'Scheduled end time must be later than scheduled start time',
      );
    }

    return endMinutes - startMinutes;
  }

  private addMinutesToTime(value: string, minutesToAdd: number): string {
    const match = String(value)
      .trim()
      .match(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/);
    if (!match) {
      throw new BadRequestException(
        'Unable to derive schedule end time from the requested start time',
      );
    }

    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    const seconds = Number(match[3] ?? 0);
    const normalizedMinutesToAdd = Math.max(1, Math.floor(minutesToAdd));
    const totalSeconds =
      hours * 3600 + minutes * 60 + seconds + normalizedMinutesToAdd * 60;
    const secondsPerDay = 24 * 3600;
    const boundedTotalSeconds = Math.min(totalSeconds, secondsPerDay - 1);
    const resultHour = Math.floor(boundedTotalSeconds / 3600);
    const resultMinute = Math.floor((boundedTotalSeconds % 3600) / 60);
    const resultSecond = boundedTotalSeconds % 60;

    return `${String(resultHour).padStart(2, '0')}:${String(resultMinute).padStart(2, '0')}:${String(resultSecond).padStart(2, '0')}`;
  }

  private normalizeDateOnly(value: Date | string | null | undefined): string {
    if (!value) {
      return '';
    }

    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) {
        return '';
      }
      return value.toISOString().split('T')[0];
    }

    const normalized = String(value).trim();
    const match = normalized.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) {
      return match[1];
    }

    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) {
      return normalized;
    }

    return parsed.toISOString().split('T')[0];
  }

  private normalizeEmail(value?: string | null): string | null {
    const normalized = String(value || '')
      .trim()
      .toLowerCase();
    return normalized.length > 0 ? normalized : null;
  }

  private isQrPaymentMethod(paymentMethod?: string | null): boolean {
    const normalized = String(paymentMethod || '')
      .trim()
      .toLowerCase();
    if (!normalized) return false;
    if (normalized.startsWith('custom-')) return true;
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

  private formatStatusLabel(value?: string | null): string {
    const normalized = String(value || '')
      .trim()
      .replace(/_/g, ' ')
      .toLowerCase();
    if (!normalized) {
      return 'N/A';
    }
    return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private resolvePrimaryGuestInfo(booking: Booking): {
    name: string;
    email: string | null;
    phone: string | null;
  } {
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

    const primaryGuest =
      guests.find((guest) => guest.is_primary_contact) ||
      guests[0] ||
      booking.primary_guest ||
      null;

    const guestName = primaryGuest
      ? `${primaryGuest.first_name || ''} ${primaryGuest.last_name || ''}`.trim()
      : '';
    const fallbackCustomerName = booking.customer
      ? `${booking.customer.first_name || ''} ${booking.customer.last_name || ''}`.trim()
      : '';
    const name = guestName || fallbackCustomerName || 'Customer';
    const email = this.normalizeEmail(
      primaryGuest?.email ||
        booking.guest_email ||
        booking.customer?.email ||
        null,
    );
    const phone =
      String(
        (primaryGuest as any)?.phone || booking.customer?.phone_number || '',
      ).trim() || null;

    return {
      name,
      email,
      phone,
    };
  }

  private getSellerDisplayName(booking: Booking): string {
    const seller = booking.seller || {};
    const fromStoreName = String(
      (seller as { store_name?: string }).store_name || '',
    ).trim();
    const fromBusinessName = String(
      (seller as { business_name?: string }).business_name || '',
    ).trim();
    const fromSellerName = String(
      (seller as { name?: string }).name || '',
    ).trim();
    return fromStoreName || fromBusinessName || fromSellerName || 'Seller';
  }

  private buildBookingEmailPricingContext(input: {
    booking: Booking;
    includeGeneralBreakdown?: boolean;
  }): {
    vouchersApplied: Array<{
      voucher_code: string;
      voucher_discount: number;
    }>;
    orderSubtotal: number;
    orderTotalAmount: number;
    serviceAmount?: number;
    addOnsTotal?: number;
    addOns?: Array<{ name: string; amount: number }>;
    optionsTotal?: number;
    options?: Array<{ label: string; adjustment: number }>;
  } {
    const pricingContext: {
      vouchersApplied: Array<{
        voucher_code: string;
        voucher_discount: number;
      }>;
      orderSubtotal: number;
      orderTotalAmount: number;
      serviceAmount?: number;
      addOnsTotal?: number;
      addOns?: Array<{ name: string; amount: number }>;
      optionsTotal?: number;
      options?: Array<{ label: string; adjustment: number }>;
    } = {
      vouchersApplied: (input.booking.applied_vouchers || []).map(
        (voucher) => ({
          voucher_code: voucher.voucher_code,
          voucher_discount: Number(voucher.voucher_discount ?? 0),
        }),
      ),
      orderSubtotal: Number(input.booking.subtotal ?? 0),
      orderTotalAmount: Number(input.booking.total ?? 0),
    };

    if (!input.includeGeneralBreakdown) {
      return pricingContext;
    }

    return {
      ...pricingContext,
      serviceAmount: Math.max(
        0,
        Number(input.booking.subtotal ?? 0) -
          Number(input.booking.addons_total ?? 0) -
          Number(input.booking.options_total ?? 0) -
          Number(input.booking.location_additional_fee ?? 0),
      ),
      addOnsTotal: Number(input.booking.addons_total ?? 0),
      addOns: (input.booking.booking_addons || []).map((addon) => ({
        name: addon.addon_name,
        amount: Number(addon.total_price ?? 0),
      })),
      optionsTotal: Number(input.booking.options_total ?? 0),
      options: (input.booking.booking_options || []).map((option) => ({
        label: `${option.group_name}: ${option.value_label}`,
        adjustment: Number(option.price_adjustment ?? 0),
      })),
    };
  }

  private async getBookingApproverRecipientEmails(
    sellerId: number,
  ): Promise<string[]> {
    const approverGroup = await this.userGroupRepository.findOne({
      where: {
        seller_id: sellerId,
        group_name: BookingsService.BOOKING_APPROVERS_GROUP_NAME,
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
      .andWhere("COALESCE(user.email, '') <> ''")
      .getMany();

    const uniqueEmails = new Set<string>();
    for (const assignment of assignments) {
      const email = this.normalizeEmail(assignment.user?.email);
      if (email) {
        uniqueEmails.add(email);
      }
    }

    return [...uniqueEmails];
  }

  private async resolveBookingRecipientEmails(input: {
    booking: Booking;
    customerEmail: string | null;
  }): Promise<string[]> {
    const recipientEmailSet = new Set<string>();

    if (input.customerEmail) {
      recipientEmailSet.add(input.customerEmail);
    }

    const sellerOwnerEmail = this.normalizeEmail(
      input.booking.seller?.user?.email,
    );
    const sellerTableEmail = this.normalizeEmail(input.booking.seller?.email);

    if (sellerOwnerEmail) {
      recipientEmailSet.add(sellerOwnerEmail);
    }
    if (sellerTableEmail) {
      recipientEmailSet.add(sellerTableEmail);
    }

    const sellerId = Number(
      input.booking.seller_id || input.booking.seller?.id,
    );
    if (Number.isFinite(sellerId) && sellerId > 0) {
      const approverEmails =
        await this.getBookingApproverRecipientEmails(sellerId);
      for (const approverEmail of approverEmails) {
        recipientEmailSet.add(approverEmail);
      }
    }

    return [...recipientEmailSet];
  }

  private async sendBookingCreatedEmails(input: {
    booking: Booking;
  }): Promise<void> {
    const primaryGuest = this.resolvePrimaryGuestInfo(input.booking);
    const customerEmail = primaryGuest.email;
    const recipientEmails = await this.resolveBookingRecipientEmails({
      booking: input.booking,
      customerEmail,
    });

    if (recipientEmails.length === 0) {
      this.logger.warn(
        `No recipients found for booking-created email (booking=${input.booking.booking_number}).`,
      );
      return;
    }

    const sellerName = this.getSellerDisplayName(input.booking);
    const sellerContact = (input.booking.seller as any)?.contact ?? null;
    const sellerEmail = (input.booking.seller as any)?.email ?? null;
    const serviceTitle =
      input.booking.service?.title ||
      input.booking.service?.name ||
      'Service Booking';
    const scheduledDate = this.normalizeDateOnly(input.booking.scheduled_date);
    const scheduledStartTime = input.booking.scheduled_start_time || 'N/A';
    const scheduledEndTime =
      input.booking.scheduled_end_time ||
      input.booking.scheduled_start_time ||
      'N/A';
    const amount = Number(input.booking.total ?? input.booking.subtotal ?? 0);
    const safeAmount = Number.isFinite(amount) ? amount : 0;
    const isFullyCovered = safeAmount === 0;
    const bookingStatusLabel = isFullyCovered
      ? 'Awaiting Confirmation'
      : this.formatStatusLabel(input.booking.status);
    // Resolve payment status from the sales order (authoritative source).
    // Fall back to the derived booking.payment_status when the relation is absent.
    const rawPaymentStatus =
      (input.booking as any).sales_order?.payment_status ||
      (input.booking as any).payment_status;
    const paymentStatusLabel = isFullyCovered
      ? 'Paid'
      : this.formatStatusLabel(rawPaymentStatus);
    const isGeneralBooking =
      input.booking.service?.service_type !== ServiceTypeEnum.VENUE;
    const isGeneralServiceType =
      input.booking.service?.service_type === ServiceTypeEnum.GENERAL;
    const isQrPayment = this.isQrPaymentMethod(
      input.booking.guest_payment_method ||
        input.booking.sales_order?.payment_method,
    );

    const sendResults = await Promise.allSettled(
      recipientEmails.map((email) => {
        const isCustomerRecipient = Boolean(
          customerEmail && email === customerEmail,
        );
        return this.mailService.sendBookingPaymentStatusEmail({
          to: email,
          data: {
            recipientName: isCustomerRecipient ? primaryGuest.name : sellerName,
            emailTitle: isFullyCovered
              ? isGeneralBooking
                ? 'Service Booking Created - Awaiting Confirmation'
                : 'Regular Slot Booking Created - Awaiting Confirmation'
              : isQrPayment
                ? isGeneralBooking
                  ? 'Service Booking Created - Pending Payment'
                  : 'Regular Slot Booking Created - Pending Payment'
                : 'Booking Request Submitted',
            emailIntro: isCustomerRecipient
              ? isFullyCovered
                ? 'your booking has been created and is awaiting provider confirmation. No payment is required.'
                : isQrPayment
                  ? 'your booking has been created. Complete your payment — the provider will confirm once payment is verified.'
                  : 'your booking has been submitted and is awaiting provider approval.'
              : isFullyCovered
                ? `${primaryGuest.name} submitted a booking. The booking is fully covered by a voucher — no payment required.`
                : isQrPayment
                  ? `${primaryGuest.name} submitted a booking. Payment is pending — confirm once payment proof is received.`
                  : `${primaryGuest.name} submitted a booking that is awaiting approval.`,
            bookingNumber: input.booking.booking_number,
            guestName: primaryGuest.name,
            guestEmail: customerEmail || 'N/A',
            primaryGuestName: primaryGuest.name,
            primaryGuestEmail: customerEmail || 'N/A',
            primaryGuestPhone: primaryGuest.phone,
            additionalGuestNames: [],
            serviceTitle,
            sellerName,
            scheduledDate,
            scheduledStartTime,
            scheduledEndTime,
            paymentReference: null,
            paymentNotifiedAt: null,
            paymentStatusLabel,
            bookingStatusLabel,
            recipientRole: isCustomerRecipient ? 'customer' : 'merchant',
            isGeneralBooking,
            isQrPayment,
            isFullyCovered,
            sellerContact,
            sellerEmail,
            requiresAction: !isCustomerRecipient,
            // Customers on non-venue service bookings have no dedicated booking
            // detail page yet — hide the CTA by omitting actionUrl.
            actionUrl:
              isCustomerRecipient && isGeneralBooking
                ? undefined
                : isCustomerRecipient
                  ? '/bookings'
                  : isGeneralBooking
                    ? `/en/service-booking?bookingNumber=${input.booking.booking_number}`
                    : `/en/court-details?bookingNumber=${input.booking.booking_number}`,
            ctaLabel: isCustomerRecipient
              ? 'View Booking Status'
              : 'Review Booking',
            amount: safeAmount,
            currency: 'PHP',
            ...this.buildBookingEmailPricingContext({
              booking: input.booking,
              includeGeneralBreakdown: isGeneralServiceType,
            }),
          },
        });
      }),
    );

    const failedCount = sendResults.filter(
      (result) => result.status === 'rejected',
    ).length;
    if (failedCount > 0) {
      this.logger.warn(
        `Booking-created email completed with ${failedCount} failure(s) for booking=${input.booking.booking_number}.`,
      );
      return;
    }

    this.logger.log(
      `Sent booking-created email to ${recipientEmails.length} recipient(s) for booking=${input.booking.booking_number}.`,
    );
  }

  /**
   * Send lifecycle email notifications for booking status changes.
   *
   * Sends differentiated emails to customer, seller, and approvers using the
   * existing booking-payment-status template. Called from lifecycle methods
   * (confirm, start, complete, cancel, decline).
   */
  async sendBookingLifecycleEmails(input: {
    booking: Booking;
    event:
      | 'confirmed'
      | 'started'
      | 'completed'
      | 'cancelled_by_customer'
      | 'cancelled_by_provider'
      | 'declined';
    reason?: string;
  }): Promise<void> {
    const primaryGuest = this.resolvePrimaryGuestInfo(input.booking);
    const customerEmail = primaryGuest.email;
    const recipientEmails = await this.resolveBookingRecipientEmails({
      booking: input.booking,
      customerEmail,
    });

    if (recipientEmails.length === 0) {
      this.logger.warn(
        `No recipients found for booking ${input.event} email (booking=${input.booking.booking_number}).`,
      );
      return;
    }

    const sellerName = this.getSellerDisplayName(input.booking);
    const sellerContact = (input.booking.seller as any)?.contact ?? null;
    const sellerEmail = (input.booking.seller as any)?.email ?? null;
    const serviceTitle =
      input.booking.service?.title ||
      input.booking.service?.name ||
      'Service Booking';
    const scheduledDate = this.normalizeDateOnly(input.booking.scheduled_date);
    const scheduledStartTime = input.booking.scheduled_start_time || 'N/A';
    const scheduledEndTime =
      input.booking.scheduled_end_time ||
      input.booking.scheduled_start_time ||
      'N/A';
    const amount = Number(input.booking.total ?? input.booking.subtotal ?? 0);
    const safeAmount = Number.isFinite(amount) ? amount : 0;
    const rawLifecyclePaymentStatus =
      (input.booking as any).sales_order?.payment_status ||
      (input.booking as any).payment_status;
    const paymentStatusLabel = this.formatStatusLabel(
      rawLifecyclePaymentStatus,
    );
    const isFullyCovered = safeAmount === 0;
    const isGeneralBooking =
      input.booking.service?.service_type !== ServiceTypeEnum.VENUE;
    const isGeneralServiceType =
      input.booking.service?.service_type === ServiceTypeEnum.GENERAL;
    const isQrPayment = this.isQrPaymentMethod(
      input.booking.sales_order?.payment_method,
    );
    const bookingNum = input.booking.booking_number;

    // Map event to email content
    const eventConfig = this.getLifecycleEmailConfig(
      input.event,
      bookingNum,
      sellerName,
      primaryGuest.name,
      input.reason,
    );

    const sendResults = await Promise.allSettled(
      recipientEmails.map((email) => {
        const isCustomerRecipient = Boolean(
          customerEmail && email === customerEmail,
        );
        return this.mailService.sendBookingPaymentStatusEmail({
          to: email,
          data: {
            recipientName: isCustomerRecipient ? primaryGuest.name : sellerName,
            emailTitle: eventConfig.emailTitle,
            emailIntro: isCustomerRecipient
              ? eventConfig.customerIntro
              : eventConfig.staffIntro,
            bookingNumber: bookingNum,
            guestName: primaryGuest.name,
            guestEmail: customerEmail || 'N/A',
            primaryGuestName: primaryGuest.name,
            primaryGuestEmail: customerEmail || 'N/A',
            primaryGuestPhone: primaryGuest.phone,
            additionalGuestNames: [],
            serviceTitle,
            sellerName,
            scheduledDate,
            scheduledStartTime,
            scheduledEndTime,
            paymentReference: null,
            paymentNotifiedAt: null,
            paymentStatusLabel,
            bookingStatusLabel: eventConfig.bookingStatusLabel,
            recipientRole: isCustomerRecipient ? 'customer' : 'merchant',
            isGeneralBooking,
            isQrPayment,
            isFullyCovered,
            sellerContact,
            sellerEmail,
            requiresAction:
              isCustomerRecipient && input.event === 'completed' ? true : false,
            rejectionReason: input.reason || undefined,
            // Customers on non-venue service bookings have no dedicated booking
            // detail page yet — hide the CTA by omitting actionUrl.
            actionUrl:
              isCustomerRecipient && isGeneralBooking
                ? undefined
                : isCustomerRecipient
                  ? '/bookings'
                  : isGeneralBooking
                    ? `/en/service-booking?bookingNumber=${bookingNum}`
                    : `/en/court-details?bookingNumber=${bookingNum}`,
            ctaLabel:
              isCustomerRecipient && input.event === 'completed'
                ? 'Leave a Review'
                : isCustomerRecipient
                  ? 'View Booking'
                  : 'View Details',
            amount: safeAmount,
            currency: 'PHP',
            ...this.buildBookingEmailPricingContext({
              booking: input.booking,
              includeGeneralBreakdown: isGeneralServiceType,
            }),
          },
        });
      }),
    );

    const failedCount = sendResults.filter(
      (result) => result.status === 'rejected',
    ).length;
    if (failedCount > 0) {
      this.logger.warn(
        `Booking ${input.event} email completed with ${failedCount} failure(s) for booking=${bookingNum}.`,
      );
      return;
    }

    this.logger.log(
      `Sent booking ${input.event} email to ${recipientEmails.length} recipient(s) for booking=${bookingNum}.`,
    );
  }

  private getLifecycleEmailConfig(
    event: string,
    bookingNum: string,
    sellerName: string,
    customerName: string,
    reason?: string,
  ): {
    emailTitle: string;
    customerIntro: string;
    staffIntro: string;
    bookingStatusLabel: string;
  } {
    const reasonSuffix = reason ? ` Reason: ${reason}` : '';

    switch (event) {
      case 'confirmed':
        return {
          emailTitle: 'Booking Confirmed',
          customerIntro: `your booking #${bookingNum} has been confirmed by ${sellerName}.`,
          staffIntro: `${customerName}'s booking #${bookingNum} has been confirmed.`,
          bookingStatusLabel: 'Confirmed',
        };
      case 'started':
        return {
          emailTitle: 'Service Started',
          customerIntro: `your service for booking #${bookingNum} has started.`,
          staffIntro: `${customerName}'s service for booking #${bookingNum} has started.`,
          bookingStatusLabel: 'In Progress',
        };
      case 'completed':
        return {
          emailTitle: 'Service Completed',
          customerIntro: `your booking #${bookingNum} has been completed. We'd love to hear your feedback!`,
          staffIntro: `${customerName}'s booking #${bookingNum} has been completed.`,
          bookingStatusLabel: 'Completed',
        };
      case 'cancelled_by_customer':
        return {
          emailTitle: 'Booking Cancelled',
          customerIntro: `your booking #${bookingNum} has been cancelled.`,
          staffIntro: `${customerName} has cancelled booking #${bookingNum}.${reasonSuffix}`,
          bookingStatusLabel: 'Cancelled',
        };
      case 'cancelled_by_provider':
        return {
          emailTitle: 'Booking Cancelled',
          customerIntro: `your booking #${bookingNum} has been cancelled by ${sellerName}.${reasonSuffix}`,
          staffIntro: `Booking #${bookingNum} has been cancelled.${reasonSuffix}`,
          bookingStatusLabel: 'Cancelled',
        };
      case 'declined':
        return {
          emailTitle: 'Booking Declined',
          customerIntro: `your booking #${bookingNum} has been declined by ${sellerName}.${reasonSuffix}`,
          staffIntro: `${customerName}'s booking #${bookingNum} has been declined.${reasonSuffix}`,
          bookingStatusLabel: 'Declined',
        };
      default:
        return {
          emailTitle: 'Booking Update',
          customerIntro: `your booking #${bookingNum} has been updated.`,
          staffIntro: `Booking #${bookingNum} has been updated.`,
          bookingStatusLabel: 'Updated',
        };
    }
  }

  private async resolveBookingRescheduleRecipientEmails(input: {
    booking: Booking;
    actorType: 'customer' | 'seller';
    customerEmail: string | null;
  }): Promise<string[]> {
    const recipientEmailSet = new Set<string>();
    const sellerOwnerEmail = this.normalizeEmail(
      input.booking.seller?.user?.email,
    );
    const sellerTableEmail = this.normalizeEmail(input.booking.seller?.email);

    if (input.actorType !== 'customer' && input.customerEmail) {
      recipientEmailSet.add(input.customerEmail);
    }

    if (sellerOwnerEmail) {
      recipientEmailSet.add(sellerOwnerEmail);
    }
    if (sellerTableEmail) {
      recipientEmailSet.add(sellerTableEmail);
    }

    const sellerId = Number(
      input.booking.seller_id || input.booking.seller?.id,
    );
    if (Number.isFinite(sellerId) && sellerId > 0) {
      const approverEmails =
        await this.getBookingApproverRecipientEmails(sellerId);
      for (const approverEmail of approverEmails) {
        recipientEmailSet.add(approverEmail);
      }
    }

    return [...recipientEmailSet];
  }

  private async sendBookingRescheduledEmails(input: {
    bookingBeforeUpdate: Booking;
    updatedBooking: Booking;
    actor: User;
    actorType: 'customer' | 'seller';
    oldSchedule: {
      date: string;
      start_time: string | null;
      end_time: string | null;
    };
    newSchedule: {
      date: string;
      start_time: string | null;
      end_time: string | null;
    };
    reason?: string | null;
  }): Promise<void> {
    const primaryGuest = this.resolvePrimaryGuestInfo(input.updatedBooking);
    const customerEmail = primaryGuest.email;
    const recipientEmails = await this.resolveBookingRescheduleRecipientEmails({
      booking: input.updatedBooking,
      actorType: input.actorType,
      customerEmail,
    });

    if (recipientEmails.length === 0) {
      this.logger.warn(
        `No recipients found for reschedule email (booking=${input.updatedBooking.booking_number}).`,
      );
      return;
    }

    const sellerName = this.getSellerDisplayName(input.updatedBooking);
    const isVenueReschedule =
      input.updatedBooking.service?.service_type === ServiceTypeEnum.VENUE;
    const serviceTitle =
      input.updatedBooking.service?.title ||
      input.updatedBooking.service?.name ||
      'Service Booking';
    const actorName =
      `${input.actor.first_name || ''} ${input.actor.last_name || ''}`.trim() ||
      (input.actorType === 'customer'
        ? 'Customer'
        : input.actor.system_admin
          ? 'Admin'
          : 'Seller');
    const actorRole =
      input.actorType === 'customer'
        ? 'Customer'
        : input.actor.system_admin
          ? 'Admin'
          : 'Seller';

    const sendResults = await Promise.allSettled(
      recipientEmails.map((email) => {
        const isCustomerRecipient = Boolean(
          customerEmail && email === customerEmail,
        );
        const actionUrl = isCustomerRecipient
          ? '/bookings'
          : isVenueReschedule
            ? `/en/court-details?bookingNumber=${input.updatedBooking.booking_number}`
            : `/en/service-booking?bookingNumber=${input.updatedBooking.booking_number}`;
        return this.mailService.sendBookingRescheduledEmail({
          to: email,
          data: {
            recipientName: isCustomerRecipient ? primaryGuest.name : sellerName,
            recipientRole: isCustomerRecipient ? 'customer' : 'merchant',
            bookingNumber: input.updatedBooking.booking_number,
            serviceTitle,
            sellerName,
            customerName: primaryGuest.name,
            customerEmail,
            guestCount: Number(
              input.updatedBooking.guest_count ??
                (input.updatedBooking.booking_guests?.length || 1),
            ),
            oldScheduledDate:
              input.oldSchedule.date ||
              this.normalizeDateOnly(input.bookingBeforeUpdate.scheduled_date),
            oldScheduledStartTime:
              input.oldSchedule.start_time ||
              input.bookingBeforeUpdate.scheduled_start_time ||
              'N/A',
            oldScheduledEndTime:
              input.oldSchedule.end_time ||
              input.bookingBeforeUpdate.scheduled_end_time ||
              input.bookingBeforeUpdate.scheduled_start_time ||
              'N/A',
            newScheduledDate: this.normalizeDateOnly(input.newSchedule.date),
            newScheduledStartTime: input.newSchedule.start_time || 'N/A',
            newScheduledEndTime:
              input.newSchedule.end_time ||
              input.newSchedule.start_time ||
              'N/A',
            reason: input.reason || undefined,
            actorName,
            actorRole,
            actionUrl,
            ctaLabel: isCustomerRecipient
              ? 'View Updated Booking'
              : 'Open Court Details',
          },
        });
      }),
    );

    const failedCount = sendResults.filter(
      (result) => result.status === 'rejected',
    ).length;
    if (failedCount > 0) {
      this.logger.warn(
        `Booking reschedule email completed with ${failedCount} failure(s) for booking=${input.updatedBooking.booking_number}.`,
      );
      return;
    }

    this.logger.log(
      `Sent booking reschedule email to ${recipientEmails.length} recipient(s) for booking=${input.updatedBooking.booking_number}.`,
    );
  }

  /**
   * Get escrow status for a booking.
   *
   * Returns escrow transactions and summary for the booking.
   *
   * @param id - Booking ID
   * @param user - Current authenticated user
   * @returns Escrow transactions and summary
   */
  async getEscrowStatus(
    id: number,
    user: User,
  ): Promise<{
    transactions: any[];
    summary: {
      total_held: number;
      total_released: number;
      total_refunded: number;
      balance: number;
    };
  }> {
    // Verify access
    await this.findById(id, user);

    // Get escrow transactions for this booking
    const transactions = await this.escrowTransactionsService.findByBookingId(
      id,
      user,
    );

    // Calculate summary
    let totalHeld = 0;
    let totalReleased = 0;
    let totalRefunded = 0;

    transactions.forEach((tx) => {
      const txType = String(tx.transaction_type).toLowerCase();
      if (txType === 'deposit' || txType === 'dispute_hold') {
        totalHeld += Number(tx.amount) || 0;
      } else if (txType === 'release' || txType === 'dispute_release') {
        totalReleased += Number(tx.amount) || 0;
      } else if (txType === 'refund') {
        totalRefunded += Number(tx.amount) || 0;
      }
    });

    return {
      transactions,
      summary: {
        total_held: totalHeld,
        total_released: totalReleased,
        total_refunded: totalRefunded,
        balance: totalHeld - totalReleased - totalRefunded,
      },
    };
  }

  /**
   * Get payment configuration for a booking.
   *
   * Returns payment model and amounts for the booking.
   *
   * @param id - Booking ID
   * @param user - Current authenticated user
   * @returns Payment configuration
   */
  async getPaymentConfig(
    id: number,
    user: User,
  ): Promise<{
    booking_id: number;
    total: number;
    subtotal: number;
    platform_fee: number;
    platform_fee_percent: number;
    provider_payout: number;
    discount_amount: number;
    payment_model: string;
    upfront_percent: number;
    upfront_amount: number;
    escrow_amount: number;
  }> {
    const booking = await this.findById(id, user);

    // Default payment model (can be enhanced to read from service or seller settings)
    const paymentModel = 'milestone'; // or 'upfront', 'completion'
    const upfrontPercent = 0; // Percentage paid upfront (non-refundable)
    const upfrontAmount = (booking.total * upfrontPercent) / 100;
    const escrowAmount = booking.total - upfrontAmount;

    return {
      booking_id: booking.id,
      total: booking.total,
      subtotal: booking.subtotal,
      platform_fee: booking.platform_fee,
      platform_fee_percent: booking.platform_fee_percent,
      provider_payout: booking.provider_payout || 0,
      discount_amount: booking.discount_amount,
      payment_model: paymentModel,
      upfront_percent: upfrontPercent,
      upfront_amount: upfrontAmount,
      escrow_amount: escrowAmount,
    };
  }

  /**
   * Delete a booking (admin only).
   *
   * Soft deletes a booking record. Only accessible to system administrators.
   *
   * @param id - Booking ID to delete
   * @returns Promise<void>
   */
  async delete(id: number): Promise<void> {
    const booking = await this.repository.findById(id);
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    await this.repository.remove(id);
  }

  /**
   * Bulk delete bookings (admin only).
   *
   * Soft deletes multiple booking records. Only accessible to system administrators.
   *
   * @param ids - Array of booking IDs to delete
   * @returns Promise<void>
   */
  async bulkDelete(ids: number[]): Promise<void> {
    // Validate that all bookings exist before attempting deletion
    for (const id of ids) {
      const booking = await this.repository.findById(id);
      if (!booking) {
        throw new NotFoundException(`Booking with ID ${id} not found`);
      }
    }

    // Delete all bookings
    for (const id of ids) {
      await this.repository.remove(id);
    }
  }

  /**
   * Find booking by booking number.
   *
   * Allows looking up a booking by its human-readable booking number
   * (e.g., BK-20250101-1234) instead of numeric ID.
   *
   * @param bookingNumber - The booking number to search for
   * @param user - Current authenticated user
   * @returns Booking if found and user has access
   */
  async findByBookingNumber(
    bookingNumber: string,
    user: User,
  ): Promise<Booking> {
    const booking = await this.repository.findByBookingNumber(bookingNumber);
    if (!booking) {
      throw new NotFoundException(
        `Booking with number ${bookingNumber} not found`,
      );
    }

    // Verify access - customer, seller, or assigned member
    const hasAccess = await this.verifyBookingAccess(booking, user);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this booking');
    }

    return booking;
  }

  /**
   * Customer approval of a completed booking.
   *
   * Allows customer to confirm satisfaction with the service after
   * the seller marks it complete. This triggers escrow release.
   *
   * @param id - Booking ID
   * @param feedback - Optional feedback from customer
   * @param rating - Optional rating (1-5)
   * @param user - Current authenticated user
   * @returns Updated booking
   */
  async customerApprove(
    id: number,
    feedback: string | undefined,
    rating: number | undefined,
    user: User,
  ): Promise<Booking> {
    const booking = await this.repository.findById(id);
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    // Verify customer ownership
    if (booking.customer_id !== user.id) {
      throw new ForbiddenException('Only the customer can approve the booking');
    }

    // Verify booking is in COMPLETED status (awaiting customer approval)
    if (booking.status !== BookingStatusEnum.COMPLETED) {
      throw new BadRequestException(
        'Booking must be in COMPLETED status to approve. Current status: ' +
          booking.status,
      );
    }

    // Update booking with customer approval
    const updatedBooking = await this.repository.update(id, {
      customer_approved: true,
      customer_approved_at: new Date(),
      customer_feedback: feedback || null,
      customer_rating: rating || null,
      updated_by: user,
    });

    // Escrow release is handled at completeService() time, not at customer approval.
    // Customer approval captures feedback and rating only.

    return updatedBooking;
  }

  /**
   * Seller requests customer to reschedule the booking.
   *
   * Used when seller cannot fulfill the booking at the scheduled time
   * and needs to request the customer to choose a new time.
   *
   * @param id - Booking ID
   * @param reason - Reason for requesting reschedule
   * @param suggestedTimes - Optional suggested alternative times
   * @param user - Current authenticated user
   * @returns Updated booking
   */
  async requestReschedule(
    id: number,
    reason: string,
    suggestedTimes: string[] | undefined,
    user: User,
  ): Promise<Booking> {
    const booking = await this.repository.findById(id);
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    // Verify seller ownership
    const seller = await this.sellersService.findByUserId(user.id);
    if (!seller || booking.seller_id !== seller.id) {
      throw new ForbiddenException('Only the seller can request reschedule');
    }

    // Verify booking is in a rescheduable state
    if (
      booking.status !== BookingStatusEnum.PENDING &&
      booking.status !== BookingStatusEnum.CONFIRMED
    ) {
      throw new BadRequestException(
        'Booking cannot be rescheduled in current status: ' + booking.status,
      );
    }

    // Update booking status to indicate reschedule request
    const updatedBooking = await this.repository.update(id, {
      status: BookingStatusEnum.RESCHEDULE_REQUESTED,
      reschedule_reason: reason,
      reschedule_suggested_times: suggestedTimes
        ? JSON.stringify(suggestedTimes)
        : null,
      reschedule_requested_at: new Date(),
      reschedule_requested_by: 'seller',
      updated_by: user,
    });

    // TODO: Send notification to customer about reschedule request

    return updatedBooking;
  }

  /**
   * Export booking history.
   *
   * Generates an export of bookings based on filters.
   * Returns data in requested format (CSV or JSON).
   *
   * @param fromDate - Start date filter
   * @param toDate - End date filter
   * @param status - Status filter
   * @param format - Export format (csv or json)
   * @param user - Current authenticated user
   * @returns Export data with metadata
   */
  async exportBookings(
    fromDate: string | undefined,
    toDate: string | undefined,
    status: BookingStatusEnum | undefined,
    format: 'csv' | 'json',
    user: User,
  ): Promise<{ data: string; filename: string; contentType: string }> {
    // Build query based on user role
    const seller = await this.sellersService.findByUserId(user.id);

    const query: QueryBookingDto = {
      status,
      page: 1,
      limit: 10000, // Large limit for export
    };

    let bookings: Booking[];

    if (seller) {
      // Seller export
      const result = await this.findBySellerId(seller.id, user, query);
      bookings = result.data;
    } else {
      // Customer export
      const result = await this.findByCustomerId(user, query);
      bookings = result.data;
    }

    // Filter by date range
    if (fromDate || toDate) {
      const from = fromDate ? new Date(fromDate) : new Date(0);
      const to = toDate ? new Date(toDate) : new Date();
      to.setHours(23, 59, 59, 999);

      bookings = bookings.filter((b) => {
        const bookingDate = new Date(b.created_at);
        return bookingDate >= from && bookingDate <= to;
      });
    }

    const timestamp = new Date().toISOString().split('T')[0];

    if (format === 'json') {
      return {
        data: JSON.stringify(bookings, null, 2),
        filename: `bookings-export-${timestamp}.json`,
        contentType: 'application/json',
      };
    }

    // Generate CSV
    const headers = [
      'Booking Number',
      'Status',
      'Service',
      'Package',
      'Scheduled Date',
      'Start Time',
      'End Time',
      'Subtotal',
      'Platform Fee',
      'Total',
      'Created At',
    ];

    const rows = bookings.map((b) => [
      b.booking_number,
      b.status,
      b.service?.title || '',
      b.package?.name || '',
      b.scheduled_date?.toString() || '',
      b.scheduled_start_time || '',
      b.scheduled_end_time || '',
      b.subtotal?.toString() || '0',
      b.platform_fee?.toString() || '0',
      b.total?.toString() || '0',
      b.created_at?.toISOString() || '',
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    return {
      data: csv,
      filename: `bookings-export-${timestamp}.csv`,
      contentType: 'text/csv',
    };
  }

  /**
   * Verify if user has access to a booking.
   *
   * @param booking - Booking to check access for
   * @param user - User to verify access for
   * @returns True if user has access
   */
  private async verifyBookingAccess(
    booking: Booking,
    user: User,
  ): Promise<boolean> {
    // Customer access
    if (booking.customer_id === user.id) {
      return true;
    }

    // Seller access
    try {
      const seller = await this.sellersService.findByUserId(user.id);
      if (seller && booking.seller_id === seller.id) {
        return true;
      }
    } catch {
      // User is not a seller
    }

    // Seller-scoped member access (user belongs to the same seller account)
    const scopedSellerId = Number(user.seller_id);
    if (
      Number.isInteger(scopedSellerId) &&
      scopedSellerId > 0 &&
      booking.seller_id === scopedSellerId
    ) {
      return true;
    }

    // Assigned member access - simplified check
    // If user is associated with the seller that owns this booking
    if (booking.assigned_member_id) {
      try {
        const member = await this.sellerMembersService.findOne(
          booking.assigned_member_id,
        );
        if (member && member.user_id === user.id) {
          return true;
        }
      } catch {
        // Member not found or user doesn't have access
      }
    }

    return false;
  }

  // ==================== DPO Assessment Methods ====================

  /**
   * Create an assessment booking.
   *
   * Used for DPO flow when customer books an assessment service.
   * Creates booking with is_assessment=true and generates checklist milestones
   * from service's milestone templates.
   *
   * @param params - Assessment booking parameters
   * @param user - Current authenticated user
   * @returns Created assessment booking
   */
  async createAssessmentBooking(params: {
    service_id: number;
    customer_id: number;
    seller_id: number;
    scheduled_date: Date;
    scheduled_start_time: string;
    service_address_id?: number;
    service_address_text?: string;
    service_latitude?: number;
    service_longitude?: number;
    customer_notes?: string;
    base_price: number;
    total: number;
    sales_order_id?: number;
    sales_order_item_id?: number;
  }): Promise<Booking> {
    // 1. Verify service exists and is an assessment service
    const service = await this.servicesService.findById(params.service_id);
    if (service.service_type !== ServiceTypeEnum.ASSESSMENT) {
      throw new BadRequestException(
        'This service is not an assessment service',
      );
    }

    // 2. Generate booking number
    let bookingNumber: string;
    let retries = 0;
    do {
      bookingNumber = this.generateBookingNumber();
      const existing = await this.repository.findByBookingNumber(bookingNumber);
      if (!existing) break;
      retries++;
    } while (retries < MAX_BOOKING_NUMBER_RETRIES);

    if (retries >= MAX_BOOKING_NUMBER_RETRIES) {
      throw new BadRequestException(
        'Failed to generate unique booking number. Please try again.',
      );
    }

    // 3. Create assessment booking
    const booking = await this.repository.create({
      booking_number: bookingNumber,
      seller_id: params.seller_id,
      service_id: params.service_id,
      customer_id: params.customer_id,
      is_assessment: true,
      scheduled_date: params.scheduled_date,
      scheduled_start_time: params.scheduled_start_time,
      scheduled_end_time: null,
      service_address_id: params.service_address_id || null,
      service_address_text: params.service_address_text || null,
      service_latitude: params.service_latitude || null,
      service_longitude: params.service_longitude || null,
      base_price: params.base_price,
      addons_total: 0,
      options_total: 0,
      location_additional_fee: 0,
      subtotal: params.total,
      discount_amount: 0,
      platform_fee: 0,
      platform_fee_percent: 0,
      provider_payout: params.total,
      total: params.total,
      status: BookingStatusEnum.CONFIRMED,
      customer_notes: params.customer_notes || null,
      sales_order_id: params.sales_order_id || null,
      sales_order_item_id: params.sales_order_item_id || null,
    } as any);

    // 4. Create checklist milestones from templates
    await this.createChecklistFromTemplates(booking.id, params.service_id);

    return booking;
  }

  /**
   * Create checklist milestones from service templates.
   *
   * Copies all milestone templates (including checklist items) from the
   * service to the booking.
   *
   * @param bookingId - Booking ID
   * @param serviceId - Service ID to copy templates from
   */
  async createChecklistFromTemplates(
    bookingId: number,
    serviceId: number,
  ): Promise<void> {
    // Get booking total for payment calculations
    const booking = await this.repository.findById(bookingId);
    if (!booking) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }

    // Get service milestone templates
    const templates = await this.serviceMilestoneTemplateRepository.findAll({
      service_id: serviceId,
      status: ServiceMilestoneTemplateStatusEnum.ACTIVE,
    } as QueryServiceMilestoneTemplateDto);

    // Create booking milestones from templates
    for (const template of templates.data) {
      const paymentAmount =
        ((template.payment_percent || 0) / 100) * booking.total;

      await this.bookingMilestoneRepository.create({
        booking_id: bookingId,
        template_id: template.id,
        name: template.name,
        description: template.description,
        milestone_type: template.template_type || MilestoneTypeEnum.MILESTONE,
        category: template.category || null,
        response_type: template.response_type || null,
        measurement_unit: template.measurement_unit || null,
        is_required: template.is_required || false,
        sequence_order: template.sequence_order,
        status: MilestoneStatusEnum.PENDING,
        payment_percent: template.payment_percent || 0,
        payment_amount: paymentAmount,
        auto_approve_after_hours: template.auto_approve_after_hours || 48,
      } as any);
    }
  }

  /**
   * Complete an assessment booking.
   *
   * Validates all required checklist items are complete, then transitions
   * booking to COMPLETED status.
   *
   * @param bookingId - Booking ID
   * @param user - Current authenticated user (seller)
   * @returns Updated booking
   */
  async completeAssessment(bookingId: number, user: User): Promise<Booking> {
    const booking = await this.findById(bookingId, user);

    // Verify it's an assessment booking
    if (!booking.is_assessment) {
      throw new BadRequestException('This is not an assessment booking');
    }

    // Verify user is the seller
    const seller = await this.sellersService.findByUserId(user.id);
    if (!seller || seller.id !== booking.seller_id) {
      throw new ForbiddenException(
        'Only the seller can complete this assessment',
      );
    }

    // Verify booking is in progress
    if (
      booking.status !== BookingStatusEnum.IN_PROGRESS &&
      booking.status !== BookingStatusEnum.CONFIRMED
    ) {
      throw new BadRequestException(
        `Cannot complete assessment with status: ${booking.status}`,
      );
    }

    // Validate all required checklist items are complete
    const milestones =
      await this.bookingMilestoneRepository.findByBookingId(bookingId);
    const requiredIncomplete = milestones.filter(
      (m) =>
        m.milestone_type === MilestoneTypeEnum.CHECKLIST &&
        m.is_required &&
        m.status !== MilestoneStatusEnum.COMPLETED,
    );

    if (requiredIncomplete.length > 0) {
      const names = requiredIncomplete.map((m) => m.name).join(', ');
      throw new BadRequestException(
        `Cannot complete assessment. Required checklist items incomplete: ${names}`,
      );
    }

    // Mark all milestones as completed
    for (const milestone of milestones) {
      if (milestone.status !== MilestoneStatusEnum.COMPLETED) {
        await this.bookingMilestoneRepository.update(milestone.id, {
          status: MilestoneStatusEnum.COMPLETED,
          completed_at: new Date(),
        } as any);
      }
    }

    // Update booking status to completed
    const updatedBooking = await this.repository.update(bookingId, {
      status: BookingStatusEnum.COMPLETED,
      completed_at: new Date(),
      actual_end_time: new Date(),
    } as any);

    // Send notification to customer
    try {
      await this.notificationsService.create({
        user_id: booking.customer_id,
        type: NotificationTypeEnum.BOOKING_COMPLETED,
        title: 'Assessment Completed',
        body: `Your assessment booking #${booking.booking_number} has been completed. The provider will send you a quotation.`,
        entity_type: 'booking',
        entity_id: bookingId,
        action_url: `/bookings/${bookingId}`,
        send_push: true,
      });
    } catch (error) {
      this.logger.error(
        'Failed to send assessment completion notification:',
        error,
      );
    }

    return updatedBooking;
  }

  /**
   * Get assessment checklist for a booking.
   *
   * Returns all checklist items (milestones with type CHECKLIST) for display.
   *
   * @param bookingId - Booking ID
   * @param user - Current authenticated user
   * @returns Checklist items
   */
  async getAssessmentChecklist(
    bookingId: number,
    user: User,
  ): Promise<BookingMilestone[]> {
    const booking = await this.findById(bookingId, user);

    if (!booking.is_assessment) {
      throw new BadRequestException('This is not an assessment booking');
    }

    const milestones =
      await this.bookingMilestoneRepository.findByBookingId(bookingId);

    // Filter to only checklist items
    return milestones.filter(
      (m) => m.milestone_type === MilestoneTypeEnum.CHECKLIST,
    );
  }

  /**
   * Create a booking from a quotation item.
   *
   * Used when customer accepts a post-assessment quotation.
   *
   * @param params - Quotation item details
   * @returns Created booking
   */
  async createFromQuotationItem(params: {
    quotation_id: number;
    quotation_item_id: number;
    service_id: number;
    seller_id: number;
    customer_id: number;
    scheduled_date: Date;
    unit_price: number;
    quantity: number;
    total_price: number;
    notes?: string;
    skipTemplateMilestones?: boolean;
  }): Promise<Booking> {
    // 1. Validate service exists and get service details for is_assessment flag
    const service = await this.servicesService.findById(params.service_id);

    // 2. Generate booking number
    let bookingNumber: string;
    let retries = 0;
    do {
      bookingNumber = this.generateBookingNumber();
      const existing = await this.repository.findByBookingNumber(bookingNumber);
      if (!existing) break;
      retries++;
    } while (retries < MAX_BOOKING_NUMBER_RETRIES);

    if (retries >= MAX_BOOKING_NUMBER_RETRIES) {
      throw new BadRequestException(
        'Failed to generate unique booking number. Please try again.',
      );
    }

    // 3. Calculate pricing using the global platform fee setting
    const platformFeePercent = await this.resolvePlatformFeePercent({});
    const subtotal = params.total_price;
    const { platformFee, providerPayout } = this.calculateFeeBreakdown(
      subtotal,
      platformFeePercent,
    );

    // 4. Create booking
    const booking = await this.repository.create({
      booking_number: bookingNumber,
      seller_id: params.seller_id,
      service_id: params.service_id,
      customer_id: params.customer_id,
      is_assessment: service.service_type === ServiceTypeEnum.ASSESSMENT,
      source_quotation_id: params.quotation_id,
      source_quotation_item_id: params.quotation_item_id,
      scheduled_date: params.scheduled_date,
      scheduled_start_time: '09:00', // Default time
      scheduled_end_time: null,
      base_price: params.unit_price,
      addons_total: 0,
      options_total: 0,
      location_additional_fee: 0,
      subtotal: subtotal,
      discount_amount: 0,
      platform_fee: platformFee,
      platform_fee_percent: platformFeePercent,
      provider_payout: providerPayout,
      total: subtotal,
      status: BookingStatusEnum.PENDING,
      customer_notes: params.notes || null,
    } as any);

    // 5. Create milestones from service templates (skip if caller will create from quotation items)
    if (!params.skipTemplateMilestones) {
      await this.createBookingMilestonesFromTemplates(booking, {
        id: params.customer_id,
      } as any);
    }

    return booking;
  }

  /**
   * Release escrow to provider and record seller earning.
   *
   * Called when a booking is completed (manually or by venue auto-complete).
   * Non-blocking — errors are logged but don't fail the calling operation.
   *
   * @param booking - Completed booking
   * @param user - User performing the action (null for system/cron)
   */
  async releaseEscrowAndRecordEarning(
    booking: Booking,
    user: User | null,
  ): Promise<void> {
    // Release escrow
    await this.escrowTransactionsService.releaseFullBooking(booking.id, user);

    // Record seller earning
    if (booking.seller_id && booking.total > 0) {
      const grossAmount = Number(booking.subtotal) || 0;
      const platformFee = Number(booking.platform_fee) || 0;
      const netAmount =
        Number(booking.provider_payout) || grossAmount - platformFee;

      await this.sellerEarningsService.recordEarning(
        booking.seller_id,
        {
          seller_id: booking.seller_id,
          source_type: 'booking',
          source_id: booking.id,
          gross_amount: grossAmount,
          platform_fee: platformFee,
          net_amount: netAmount,
        },
        user || ({ id: 0 } as any),
      );
    }
  }
}
