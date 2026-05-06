import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuoteRequestEntity } from './persistence/entities/quote-request.entity';
import { QuoteRequest, QuoteRequestStatusEnum } from './domain/quote-request';
import { CreateQuoteRequestDto } from './dto/create-quote-request.dto';
import {
  RespondQuoteRequestDto,
  CustomerRespondQuoteDto,
} from './dto/respond-quote-request.dto';
import { User } from '@/users/domain/user';
import { ServicesService } from '@/services/services.service';
import { SellersService } from '@/sellers/sellers.service';
import { ServicePackagesService } from '@/service-packages/service-packages.service';
import { BookingsService } from '@/bookings/bookings.service';
import { BookingStatusEnum } from '@/bookings/enums/booking-status.enum';
import { BookingEntity } from '@/bookings/persistence/entities/booking.entity';
import { NotificationsService } from '@/notifications/notifications.service';
import { NotificationTypeEnum } from '@/notifications/enums/notification-type.enum';
import { ServiceStatusEnum } from '@/services/enums/service-status.enum';
import { QuoteTypeEnum } from './enums/quote-type.enum';
import { QuotationItemsService } from '@/quotation-items/quotation-items.service';
import { CreateQuotationItemDto } from '@/quotation-items/dto/create-quotation-item.dto';
import { FormSubmissionsService } from '@/form-submissions/form-submissions.service';
import { ParametersService } from '@/parameters/parameters.service';

const MAX_QUOTE_NUMBER_RETRIES = 3;

/**
 * Quote Requests Service.
 *
 * Handles business logic for quote requests from customers
 * for services that require custom pricing.
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class QuoteRequestsService {
  constructor(
    @InjectRepository(QuoteRequestEntity)
    private readonly repository: Repository<QuoteRequestEntity>,
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
    @Inject(forwardRef(() => ServicesService))
    private readonly servicesService: ServicesService,
    @Inject(forwardRef(() => SellersService))
    private readonly sellersService: SellersService,
    @Inject(forwardRef(() => ServicePackagesService))
    private readonly servicePackagesService: ServicePackagesService,
    @Inject(forwardRef(() => BookingsService))
    private readonly bookingsService: BookingsService,
    private readonly notificationsService: NotificationsService,
    @Inject(forwardRef(() => QuotationItemsService))
    private readonly quotationItemsService: QuotationItemsService,
    private readonly formSubmissionsService: FormSubmissionsService,
    private readonly parametersService: ParametersService,
  ) {}

  private async getPlatformFeePercent(): Promise<number> {
    const parameter = await this.parametersService.findByCode(
      'platform_fee_percent',
    );
    const platformFeePercent = Number(parameter?.numeric_value);

    if (Number.isFinite(platformFeePercent) && platformFeePercent >= 0) {
      return platformFeePercent;
    }

    return 0.0;
  }

  /**
   * Create a new quote request.
   *
   * Customer submits a request for a custom quote on a service
   * that has `requires_quote = true`.
   *
   * @param input - Create quote request DTO
   * @param user - Current authenticated user (customer)
   * @returns Created quote request
   */
  async create(
    input: CreateQuoteRequestDto,
    user: User,
  ): Promise<QuoteRequest> {
    // 1. Validate service exists, is active, and requires quote
    const service = await this.servicesService.findById(input.service_id);

    if (service.status !== ServiceStatusEnum.ACTIVE) {
      throw new BadRequestException('Service is not active');
    }

    if (!service.requires_quote) {
      throw new BadRequestException(
        'This service does not require a quote. You can book it directly.',
      );
    }

    // 2. Validate package if provided
    if (input.package_id) {
      const pkg = await this.servicePackagesService.findById(input.package_id);
      if (pkg.service_id !== input.service_id) {
        throw new BadRequestException(
          'Package does not belong to the specified service',
        );
      }
    }

    // 3. Generate quote number
    let quoteNumber: string;
    let retries = 0;
    do {
      quoteNumber = this.generateQuoteNumber();
      const existing = await this.repository.findOne({
        where: { quote_number: quoteNumber },
      });
      if (!existing) {
        break;
      }
      retries++;
      if (retries >= MAX_QUOTE_NUMBER_RETRIES) {
        throw new BadRequestException(
          'Failed to generate unique quote number. Please try again.',
        );
      }
    } while (retries < MAX_QUOTE_NUMBER_RETRIES);

    // 4. Create quote request entity
    const entity = this.repository.create({
      quote_number: quoteNumber,
      customer_id: user.id,
      seller_id: service.seller_id,
      service_id: input.service_id,
      package_id: input.package_id || null,
      status: QuoteRequestStatusEnum.PENDING,
      description: input.description,
      special_requirements: input.special_requirements || null,
      quantity: input.quantity || 1,
      preferred_date: input.preferred_date || null,
      preferred_time: input.preferred_time || null,
      service_address_id: input.service_address_id || null,
      service_address_text: input.service_address_text || null,
      service_latitude: input.service_latitude || null,
      service_longitude: input.service_longitude || null,
      created_by: user as any,
      updated_by: user as any,
    });

    const saved = await this.repository.save(entity);

    // 5. Send notification to seller
    try {
      const seller = await this.sellersService.findById(service.seller_id);
      if (seller.user_id) {
        await this.notificationsService.create({
          user_id: seller.user_id,
          type: NotificationTypeEnum.QUOTE_REQUESTED,
          title: 'New Quote Request',
          body: `${user.first_name} ${user.last_name} has requested a quote for ${service.title}`,
          entity_type: 'quote_request',
          entity_id: saved.id,
          action_url: `/seller/quote-requests/${saved.id}`,
          send_push: true,
        });
      }
    } catch (error) {
      console.error('Failed to send quote request notification:', error);
    }

    return this.mapToDomain(saved);
  }

  /**
   * Seller responds to a quote request with pricing.
   *
   * @param id - Quote request ID
   * @param input - Response DTO with pricing
   * @param user - Current authenticated user (seller)
   * @returns Updated quote request
   */
  async sellerRespond(
    id: number,
    input: RespondQuoteRequestDto,
    user: User,
  ): Promise<QuoteRequest> {
    const quoteRequest = await this.findById(id);

    // Verify user is the seller
    const seller = await this.sellersService.findByUserId(user.id);
    if (!seller || seller.id !== quoteRequest.seller_id) {
      throw new ForbiddenException(
        'Only the seller can respond to this quote request',
      );
    }

    // Verify status allows response
    if (
      quoteRequest.status !== QuoteRequestStatusEnum.PENDING &&
      quoteRequest.status !== QuoteRequestStatusEnum.REVIEWING
    ) {
      throw new BadRequestException(
        `Cannot respond to quote request with status: ${quoteRequest.status}`,
      );
    }

    // Calculate expiry date (default 7 days from now)
    const expiresAt = input.quote_expires_at
      ? new Date(input.quote_expires_at)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Update quote request
    await this.repository.update(id, {
      status: QuoteRequestStatusEnum.QUOTED,
      quoted_price: input.quoted_price,
      currency_id: input.currency_id || null,
      seller_response: input.seller_response,
      quote_breakdown: input.quote_breakdown
        ? JSON.stringify(input.quote_breakdown)
        : null,
      estimated_duration_minutes: input.estimated_duration_minutes || null,
      quoted_at: new Date(),
      quote_expires_at: expiresAt,
      updated_by: user as any,
    });

    // Send notification to customer
    try {
      await this.notificationsService.create({
        user_id: quoteRequest.customer_id,
        type: NotificationTypeEnum.QUOTE_RECEIVED,
        title: 'Quote Received',
        body: `You have received a quote of ${input.quoted_price} for your request`,
        entity_type: 'quote_request',
        entity_id: id,
        action_url: `/quote-requests/${id}`,
        send_push: true,
      });
    } catch (error) {
      console.error('Failed to send quote response notification:', error);
    }

    return this.findById(id);
  }

  /**
   * Customer responds to a quote (accept or reject).
   *
   * If accepting, creates a booking from the quote.
   *
   * @param id - Quote request ID
   * @param input - Customer response DTO
   * @param user - Current authenticated user (customer)
   * @returns Updated quote request (with booking_id if accepted)
   */
  async customerRespond(
    id: number,
    input: CustomerRespondQuoteDto,
    user: User,
  ): Promise<QuoteRequest> {
    const quoteRequest = await this.findById(id);

    // Verify user is the customer
    if (quoteRequest.customer_id !== user.id) {
      throw new ForbiddenException(
        'Only the customer can respond to this quote',
      );
    }

    // Verify status allows response
    if (quoteRequest.status !== QuoteRequestStatusEnum.QUOTED) {
      throw new BadRequestException(
        `Cannot respond to quote with status: ${quoteRequest.status}`,
      );
    }

    // Check if quote has expired
    if (
      quoteRequest.quote_expires_at &&
      new Date(quoteRequest.quote_expires_at) < new Date()
    ) {
      await this.repository.update(id, {
        status: QuoteRequestStatusEnum.EXPIRED,
      });
      throw new BadRequestException('This quote has expired');
    }

    if (input.action === 'accept') {
      // Validate required booking fields
      if (!input.scheduled_date || !input.scheduled_time) {
        throw new BadRequestException(
          'scheduled_date and scheduled_time are required when accepting a quote',
        );
      }

      // Update quote request status
      await this.repository.update(id, {
        status: QuoteRequestStatusEnum.ACCEPTED,
        customer_response: input.customer_response || null,
        responded_at: new Date(),
        updated_by: user as any,
      });

      // TODO: Create booking from quote
      // This would integrate with the existing booking flow
      // For now, we'll just update the status

      // Notify seller
      try {
        const seller = await this.sellersService.findById(
          quoteRequest.seller_id,
        );
        if (seller.user_id) {
          await this.notificationsService.create({
            user_id: seller.user_id,
            type: NotificationTypeEnum.QUOTE_ACCEPTED,
            title: 'Quote Accepted',
            body: `Your quote #${quoteRequest.quote_number} has been accepted`,
            entity_type: 'quote_request',
            entity_id: id,
            action_url: `/seller/quote-requests/${id}`,
            send_push: true,
          });
        }
      } catch (error) {
        console.error('Failed to send quote acceptance notification:', error);
      }
    } else if (input.action === 'revision_requested') {
      // Customer requests revision - set status and notify provider
      await this.repository.update(id, {
        status: QuoteRequestStatusEnum.REVISION_REQUESTED,
        customer_response: input.customer_response || null,
        responded_at: new Date(),
        updated_by: user as any,
      });

      // Notify seller to create revision
      try {
        const seller = await this.sellersService.findById(
          quoteRequest.seller_id,
        );
        if (seller.user_id) {
          await this.notificationsService.create({
            user_id: seller.user_id,
            type: NotificationTypeEnum.QUOTATION_REVISION_REQUESTED,
            title: 'Revision Requested',
            body: `Customer requested revision for quote #${quoteRequest.quote_number}`,
            entity_type: 'quote_request',
            entity_id: id,
            action_url: `/seller/quote-requests/${id}`,
            send_push: true,
          });
        }
      } catch (error) {
        console.error('Failed to send revision request notification:', error);
      }
    } else {
      // Reject quote
      await this.repository.update(id, {
        status: QuoteRequestStatusEnum.REJECTED,
        customer_response: input.customer_response || null,
        responded_at: new Date(),
        updated_by: user as any,
      });

      // Reactive/Diagnostic (service_type = 'assessment'): complete the assessment booking
      if (quoteRequest.assessment_booking_id) {
        try {
          await this.bookingRepository.update(
            quoteRequest.assessment_booking_id,
            {
              status: BookingStatusEnum.COMPLETED,
              completed_at: new Date(),
            },
          );
        } catch (error) {
          console.error('Failed to complete assessment booking:', error);
        }
      }

      // Maintenance/Preventive (service_type = 'standard'): cancel all bookings linked to this quotation (flow: REJECT → Booking status = CANCELLED)
      try {
        const preventiveBookings = await this.bookingRepository.find({
          where: { quotation_id: id },
          select: ['id'],
        });
        for (const booking of preventiveBookings) {
          await this.bookingRepository.update(booking.id, {
            status: BookingStatusEnum.CANCELLED,
          });
        }
      } catch (error) {
        console.error(
          'Failed to cancel preventive bookings on quote reject:',
          error,
        );
      }

      // Notify seller
      try {
        const seller = await this.sellersService.findById(
          quoteRequest.seller_id,
        );
        if (seller.user_id) {
          await this.notificationsService.create({
            user_id: seller.user_id,
            type: NotificationTypeEnum.QUOTE_REJECTED,
            title: 'Quote Rejected',
            body: `Your quote #${quoteRequest.quote_number} has been rejected`,
            entity_type: 'quote_request',
            entity_id: id,
            action_url: `/seller/quote-requests/${id}`,
            send_push: true,
          });
        }
      } catch (error) {
        console.error('Failed to send quote rejection notification:', error);
      }
    }

    return this.findById(id);
  }

  /**
   * Find quote request by ID.
   */
  async findById(id: number): Promise<QuoteRequest> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: [
        'customer',
        'seller',
        'service',
        'package',
        'currency',
        'booking',
        'service.gallery',
        'service.category',
        'seller.user',
      ],
    });

    // Check if soft-deleted
    if (entity && entity.deleted_at) {
      return null as any;
    }

    if (!entity) {
      throw new NotFoundException(`Quote request with ID ${id} not found`);
    }

    return this.mapToDomain(entity);
  }

  /**
   * Find quote requests for a customer.
   */
  async findByCustomerId(
    userId: number,
    options?: {
      page?: number;
      limit?: number;
      status?: QuoteRequestStatusEnum;
    },
  ): Promise<{ data: QuoteRequest[]; totalCount: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;

    const qb = this.repository
      .createQueryBuilder('qr')
      .leftJoinAndSelect('qr.service', 'service')
      .leftJoinAndSelect('qr.seller', 'seller')
      .leftJoinAndSelect('qr.package', 'package')
      .leftJoinAndSelect('service.gallery', 'gallery')
      .leftJoinAndSelect('service.category', 'category')
      .leftJoinAndSelect('seller.user', 'sellerUser')
      .where('qr.customer_id = :userId', { userId })
      .andWhere('qr.deleted_at IS NULL');

    if (options?.status) {
      qb.andWhere('qr.status = :status', { status: options.status });
    }

    qb.orderBy('qr.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [entities, totalCount] = await qb.getManyAndCount();

    return {
      data: entities.map((e) => this.mapToDomain(e)),
      totalCount,
    };
  }

  /**
   * Find quote requests for a seller.
   */
  async findBySellerId(
    sellerId: number,
    options?: {
      page?: number;
      limit?: number;
      status?: QuoteRequestStatusEnum;
    },
  ): Promise<{ data: QuoteRequest[]; totalCount: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;

    const qb = this.repository
      .createQueryBuilder('qr')
      .leftJoinAndSelect('qr.service', 'service')
      .leftJoinAndSelect('qr.customer', 'customer')
      .leftJoinAndSelect('qr.seller', 'seller')
      .leftJoinAndSelect('qr.package', 'package')
      .leftJoinAndSelect('service.gallery', 'gallery')
      .leftJoinAndSelect('service.category', 'category')
      .leftJoinAndSelect('seller.user', 'sellerUser')
      .where('qr.seller_id = :sellerId', { sellerId })
      .andWhere('qr.deleted_at IS NULL');

    if (options?.status) {
      qb.andWhere('qr.status = :status', { status: options.status });
    }

    qb.orderBy('qr.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [entities, totalCount] = await qb.getManyAndCount();

    return {
      data: entities.map((e) => this.mapToDomain(e)),
      totalCount,
    };
  }

  /**
   * Cancel a quote request (customer only).
   */
  async cancel(id: number, user: User): Promise<QuoteRequest> {
    const quoteRequest = await this.findById(id);

    if (quoteRequest.customer_id !== user.id) {
      throw new ForbiddenException(
        'Only the customer can cancel this quote request',
      );
    }

    if (
      quoteRequest.status === QuoteRequestStatusEnum.ACCEPTED ||
      quoteRequest.status === QuoteRequestStatusEnum.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot cancel quote request with status: ${quoteRequest.status}`,
      );
    }

    await this.repository.update(id, {
      status: QuoteRequestStatusEnum.CANCELLED,
      updated_by: user as any,
    });

    return this.findById(id);
  }

  /**
   * Generate unique quote number.
   *
   * Format: QR-YYYYMMDD-XXXX
   */
  private generateQuoteNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    const random = Math.floor(1000 + Math.random() * 9000);

    return `QR-${dateStr}-${random}`;
  }

  /**
   * Map entity to domain model.
   */
  private mapToDomain(entity: QuoteRequestEntity): QuoteRequest {
    const domain = new QuoteRequest();
    domain.id = entity.id;
    domain.quote_number = entity.quote_number;
    domain.customer_id = entity.customer_id;
    domain.customer = entity.customer as any;
    domain.seller_id = entity.seller_id;
    domain.seller = entity.seller as any;
    domain.service_id = entity.service_id;
    domain.service = entity.service as any;

    if (domain.service) {
      // Map primary image URL from gallery or category
      if (entity.service.gallery && entity.service.gallery.length > 0) {
        const primaryImage =
          entity.service.gallery.find((img) => img.is_primary) ||
          entity.service.gallery.sort(
            (a, b) => a.display_order - b.display_order,
          )[0];
        if (primaryImage) {
          domain.service.primary_image_url = primaryImage.image_url;
        }
      } else if (
        entity.service.category &&
        (entity.service.category.icon_url || entity.service.category.image_url)
      ) {
        domain.service.primary_image_url =
          entity.service.category.icon_url || entity.service.category.image_url;
      }
    }

    if (domain.seller) {
      if (!domain.seller.store_logo_url && entity.seller.user?.image) {
        domain.seller.store_logo_url = entity.seller.user.image;
      }
    }
    domain.package_id = entity.package_id;
    domain.package = entity.package as any;
    domain.status = entity.status;
    domain.description = entity.description;
    domain.special_requirements = entity.special_requirements;
    domain.quantity = entity.quantity;
    domain.preferred_date = entity.preferred_date;
    domain.preferred_time = entity.preferred_time;
    domain.service_address_id = entity.service_address_id;
    domain.service_address_text = entity.service_address_text;
    domain.service_latitude = entity.service_latitude;
    domain.service_longitude = entity.service_longitude;
    domain.quoted_price = entity.quoted_price;
    domain.currency_id = entity.currency_id;
    domain.seller_response = entity.seller_response;
    domain.quote_breakdown = entity.quote_breakdown;
    domain.estimated_duration_minutes = entity.estimated_duration_minutes;
    domain.quoted_at = entity.quoted_at;
    domain.quote_expires_at = entity.quote_expires_at;
    domain.customer_response = entity.customer_response;
    domain.responded_at = entity.responded_at;
    domain.booking_id = entity.booking_id;
    domain.quote_type = entity.quote_type;
    domain.assessment_booking_id = entity.assessment_booking_id;
    domain.result_sales_order_id = entity.result_sales_order_id;
    domain.parent_quotation_id = entity.parent_quotation_id;
    domain.revision_number = entity.revision_number;
    domain.created_at = entity.created_at;
    domain.updated_at = entity.updated_at;
    return domain;
  }

  // ==================== DPO Quotation Methods ====================

  /**
   * Create a post-assessment quotation.
   *
   * Seller creates a quotation after completing an assessment booking.
   * The quotation is linked to the assessment booking and contains
   * itemized services and materials.
   *
   * @param params - Quotation parameters
   * @param user - Current authenticated user (seller)
   * @returns Created quotation
   */
  async createPostAssessmentQuotation(
    params: {
      assessment_booking_id: number;
      seller_response?: string;
      estimated_duration_minutes?: number;
      quote_expires_days?: number;
      preferred_date?: string; // date of service for the quotation (YYYY-MM-DD)
      items?: CreateQuotationItemDto[];
    },
    user: User,
  ): Promise<QuoteRequest> {
    // 1. Get the booking (assessment_booking_id is the booking to create a quotation for)
    const booking = await this.bookingsService.findById(
      params.assessment_booking_id,
      user,
    );

    // 2. Note: Quotations can now be created for any booking type, not just assessments
    // The field name 'assessment_booking_id' is kept for backwards compatibility

    // 3. Verify user is the seller or system admin
    const seller = await this.sellersService.findByUserId(user.id);
    const isSystemAdmin = (user as any).system_admin === true;
    if (!isSystemAdmin && (!seller || seller.id !== booking.seller_id)) {
      throw new ForbiddenException(
        'Only the seller or admin can create a quotation for this booking',
      );
    }

    // 4. Check if quotation already exists for this booking
    const existing = await this.repository.findOne({
      where: {
        assessment_booking_id: params.assessment_booking_id,
        deleted_at: null as any,
      } as any,
    });

    if (existing) {
      throw new BadRequestException(
        'A quotation already exists for this booking. Use createRevision() to update.',
      );
    }

    // 4. Generate quote number
    let quoteNumber: string;
    let retries = 0;
    do {
      quoteNumber = this.generateQuoteNumber();
      const exists = await this.repository.findOne({
        where: { quote_number: quoteNumber },
      });
      if (!exists) break;
      retries++;
    } while (retries < MAX_QUOTE_NUMBER_RETRIES);

    if (retries >= MAX_QUOTE_NUMBER_RETRIES) {
      throw new BadRequestException(
        'Failed to generate unique quote number. Please try again.',
      );
    }

    // 5. Calculate expiry date
    const expireDays = params.quote_expires_days || 7;
    const expiresAt = new Date(Date.now() + expireDays * 24 * 60 * 60 * 1000);

    // 6. Create quotation
    const entity = this.repository.create({
      quote_number: quoteNumber,
      quote_type: QuoteTypeEnum.POST_ASSESSMENT,
      customer_id: booking.customer_id,
      seller_id: booking.seller_id,
      service_id: booking.service_id,
      assessment_booking_id: params.assessment_booking_id,
      status: QuoteRequestStatusEnum.PENDING, // Will be QUOTED when seller sends it
      seller_response: params.seller_response || null,
      estimated_duration_minutes: params.estimated_duration_minutes || null,
      quote_expires_at: expiresAt,
      preferred_date: params.preferred_date || null,
      revision_number: 0,
      created_by: user as any,
      updated_by: user as any,
    });

    const saved = await this.repository.save(entity);

    // 8. Link quotation to booking (Phase A4: only this booking is updated on checkout;
    // for recurring, if quoting multiple occurrences, link each via quotation_id elsewhere).
    await this.repository.manager.query(
      `UPDATE bookings SET quotation_id = $1 WHERE id = $2`,
      [saved.id, params.assessment_booking_id],
    );

    // 8. Optionally add services and materials in the same request
    if (params.items?.length) {
      await this.quotationItemsService.addItems(
        { quotation_id: saved.id, items: params.items },
        user,
      );
    }

    // Sync linked booking(s) totals from quotation items so total is not 0 on list/detail
    await this.syncBookingTotalsFromQuotation(saved.id);

    return this.mapToDomain(saved);
  }

  /**
   * Send quotation to customer.
   *
   * Updates status to QUOTED and notifies customer.
   *
   * @param quotationId - Quotation ID
   * @param user - Current authenticated user (seller)
   * @returns Updated quotation
   */
  async sendQuotation(quotationId: number, user: User): Promise<QuoteRequest> {
    const quotation = await this.findById(quotationId);

    // Verify user is the seller
    const seller = await this.sellersService.findByUserId(user.id);
    if (!seller || seller.id !== quotation.seller_id) {
      throw new ForbiddenException('Only the seller can send this quotation');
    }

    // Update status (idempotent: allow re-send when already Quoted, e.g. after edit)
    await this.repository.update(quotationId, {
      status: QuoteRequestStatusEnum.QUOTED,
      quoted_at: new Date(),
      updated_by: user as any,
    });

    // Sync linked booking(s) totals from quotation items (in case items were added after create)
    await this.syncBookingTotalsFromQuotation(quotationId);

    // Update linked booking(s) status from AWAITING_QUOTATION to PENDING_REVIEW
    // so customer sees the booking is ready for their review
    await this.repository.manager.query(
      `UPDATE bookings SET status = $1, updated_at = NOW()
       WHERE quotation_id = $2 AND status = 'awaiting_quotation' AND deleted_at IS NULL`,
      [BookingStatusEnum.PENDING_REVIEW, quotationId],
    );

    // Also transition diagnostic/assessment bookings from IN_PROGRESS to PENDING_REVIEW
    // Diagnostic bookings are IN_PROGRESS when provider creates & sends the quotation.
    // Diagnostic services have service_type = 'assessment' AND s.requires_quote = false on the linked service.
    await this.repository.manager.query(
      `UPDATE bookings b SET status = $1, updated_at = NOW()
       WHERE b.quotation_id = $2 AND b.status = 'in_progress'
         AND b.deleted_at IS NULL
         AND EXISTS (
           SELECT 1 FROM services s
           WHERE s.id = b.service_id AND s.service_type = 'assessment' AND s.requires_quote = false
         )`,
      [BookingStatusEnum.PENDING_REVIEW, quotationId],
    );

    // Send notification to customer
    try {
      await this.notificationsService.create({
        user_id: quotation.customer_id,
        type: NotificationTypeEnum.QUOTE_RECEIVED,
        title: 'Quotation Received',
        body: `You have received a quotation for your assessment. Please review and respond.`,
        entity_type: 'quote_request',
        entity_id: quotationId,
        action_url: `/quote-requests/${quotationId}`,
        send_push: true,
      });
    } catch (error) {
      console.error('Failed to send quotation notification:', error);
    }

    return this.findById(quotationId);
  }

  /**
   * Create a revision of an existing quotation.
   *
   * Creates a new quotation linked to the parent, with incremented revision number.
   *
   * @param parentQuotationId - Parent quotation ID
   * @param user - Current authenticated user (seller)
   * @returns New revision quotation
   */
  async createRevision(
    parentQuotationId: number,
    user: User,
  ): Promise<QuoteRequest> {
    const parent = await this.findById(parentQuotationId);

    // Verify user is the seller
    const seller = await this.sellersService.findByUserId(user.id);
    if (!seller || seller.id !== parent.seller_id) {
      throw new ForbiddenException('Only the seller can revise this quotation');
    }

    // Generate new quote number
    let quoteNumber: string;
    let retries = 0;
    do {
      quoteNumber = this.generateQuoteNumber();
      const exists = await this.repository.findOne({
        where: { quote_number: quoteNumber },
      });
      if (!exists) break;
      retries++;
    } while (retries < MAX_QUOTE_NUMBER_RETRIES);

    // Calculate new revision number
    const newRevisionNumber = (parent.revision_number || 0) + 1;

    // Create new quotation as revision
    const entity = this.repository.create({
      quote_number: quoteNumber,
      quote_type: parent.quote_type,
      customer_id: parent.customer_id,
      seller_id: parent.seller_id,
      service_id: parent.service_id,
      assessment_booking_id: parent.assessment_booking_id,
      parent_quotation_id: parentQuotationId,
      revision_number: newRevisionNumber,
      status: QuoteRequestStatusEnum.PENDING,
      quote_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      created_by: user as any,
      updated_by: user as any,
    });

    const saved = await this.repository.save(entity);

    // Cancel the parent quotation
    await this.repository.update(parentQuotationId, {
      status: QuoteRequestStatusEnum.CANCELLED,
      updated_by: user as any,
    });

    return this.mapToDomain(saved);
  }

  /**
   * Accept a post-assessment quotation (reactive flow only).
   *
   * Customer accepts the quotation; creates new bookings from quotation service items.
   * Phase A: Preventive quotations must NOT use this endpoint — they must use
   * quotation-checkout so existing bookings are updated, not duplicated. This method
   * throws if the quotation is preventive (PRE_BOOKING or has linked awaiting_quotation bookings).
   *
   * Recurrence (A4): For reactive, one quotation can have multiple items → multiple new bookings.
   * For preventive, one quotation is linked to one or more existing bookings via booking.quotation_id;
   * only quotation-checkout may update those.
   *
   * @param quotationId - ID of the quotation to accept
   * @param user - Current authenticated user (customer)
   * @returns Updated quotation
   */
  async acceptQuotation(
    quotationId: number,
    user: User,
  ): Promise<QuoteRequest> {
    const quotation = await this.findById(quotationId);

    // Verify user is the customer
    if (quotation.customer_id !== user.id) {
      throw new ForbiddenException(
        'Only the customer can accept this quotation',
      );
    }

    // Verify quotation is in QUOTED status
    if (quotation.status !== QuoteRequestStatusEnum.QUOTED) {
      throw new BadRequestException(
        `Cannot accept quotation with status: ${quotation.status}`,
      );
    }

    // Check if quote has expired
    if (
      quotation.quote_expires_at &&
      new Date(quotation.quote_expires_at) < new Date()
    ) {
      await this.repository.update(quotationId, {
        status: QuoteRequestStatusEnum.EXPIRED,
      });
      throw new BadRequestException('This quotation has expired');
    }

    // Phase A (single path for preventive): Do NOT create new bookings for preventive quotations.
    // Preventive = (1) quote_type is PRE_BOOKING, or (2) existing booking(s) linked to this quotation.
    // Those must be updated via quotation-checkout only, to avoid duplicate bookings.
    const linkedBookings = await this.repository.manager.query(
      `SELECT b.id FROM bookings b
       WHERE b.quotation_id = $1 AND b.status IN ('awaiting_quotation', 'pending_review')
         AND b.deleted_at IS NULL
         AND EXISTS (
           SELECT 1 FROM services s
           WHERE s.id = b.service_id AND s.service_type = 'standard'
         )`,
      [quotationId],
    );
    const hasLinkedBookings =
      Array.isArray(linkedBookings) && linkedBookings.length > 0;
    const isPreventive =
      quotation.quote_type === QuoteTypeEnum.PRE_BOOKING || hasLinkedBookings;
    if (isPreventive) {
      throw new BadRequestException(
        'This is a preventive quotation. Please use the quotation checkout flow to accept and pay. Do not use accept-quotation for preventive quotes.',
      );
    }

    // Get quotation items (service items only - materials are informational)
    const items = await this.repository.manager
      .getRepository('quotation_items')
      .find({
        where: {
          quotation_id: quotationId,
          item_type: 'service',
        },
        order: { sequence_order: 'ASC' },
      });

    if (items.length === 0) {
      throw new BadRequestException(
        'Cannot accept quotation with no service items',
      );
    }

    // Use quotation's date of service (preferred_date) for all bookings; fallback to first item date or now
    const quotationDate =
      quotation.preferred_date != null
        ? new Date(quotation.preferred_date)
        : null;

    // Reactive/diagnostic flow: Create ONE single booking for the entire quotation.
    // All quotation service items become milestones on this single booking.
    const firstItem = items[0];
    const effectiveServiceId = firstItem.service_id || quotation.service_id;

    const scheduledDate =
      quotationDate ||
      (firstItem.suggested_schedule_date
        ? new Date(firstItem.suggested_schedule_date)
        : new Date());

    // Total price is the sum of ALL service items
    const totalPrice = items.reduce(
      (sum, item) => sum + Number(item.total_price || 0),
      0,
    );

    // skipTemplateMilestones = false so the booking gets proper
    // checklist milestones from service milestone templates
    // (with response_type, category, measurement_unit, etc.).
    const booking = await this.bookingsService.createFromQuotationItem({
      quotation_id: quotationId,
      quotation_item_id: firstItem.id,
      service_id: effectiveServiceId,
      seller_id: quotation.seller_id,
      customer_id: user.id,
      scheduled_date: scheduledDate,
      unit_price: totalPrice,
      quantity: 1,
      total_price: totalPrice,
      notes: firstItem.description || undefined,
      skipTemplateMilestones: false,
    });

    const bookingIds: number[] = [booking.id];

    // Update quotation status
    await this.repository.update(quotationId, {
      status: QuoteRequestStatusEnum.ACCEPTED,
      responded_at: new Date(),
      updated_by: user as any,
    });

    // Complete the assessment booking (diagnostic assessment is done)
    if (quotation.assessment_booking_id) {
      await this.bookingRepository.update(quotation.assessment_booking_id, {
        status: BookingStatusEnum.COMPLETED,
        completed_at: new Date(),
      });
    }

    // Copy form submission (Requirements) from assessment booking
    if (quotation.assessment_booking_id) {
      try {
        const assessmentBooking = await this.bookingRepository.findOne({
          where: { id: quotation.assessment_booking_id },
        });
        if (assessmentBooking?.form_submission_id) {
          const copiedSubmission =
            await this.formSubmissionsService.createCopyForBooking(
              assessmentBooking.form_submission_id,
              booking.id,
              user,
            );
          await this.bookingRepository.update(booking.id, {
            form_submission_id: copiedSubmission.id,
          });
        }
      } catch (err) {
        console.error(
          `Failed to copy form submission to booking ${booking.id}:`,
          err,
        );
      }
    }

    // Create booking milestones from quotation service items as fallback
    // (only if no template milestones were created above)
    for (const bid of bookingIds) {
      try {
        await this.bookingsService.createMilestonesFromQuotationServiceItems(
          bid,
          quotationId,
          user,
        );
      } catch (err) {
        console.error(
          `Failed to create milestones from quotation for booking ${bid}:`,
          err,
        );
      }
    }

    // Notify seller
    try {
      const seller = await this.sellersService.findById(quotation.seller_id);
      if (seller.user_id) {
        await this.notificationsService.create({
          user_id: seller.user_id,
          type: NotificationTypeEnum.QUOTE_ACCEPTED,
          title: 'Quotation Accepted',
          body: `Your quotation #${quotation.quote_number} has been accepted. ${bookingIds.length} booking(s) created.`,
        });

        // Also send SERVICE_BOOKINGS_CREATED notification
        await this.notificationsService.create({
          user_id: seller.user_id,
          type: NotificationTypeEnum.SERVICE_BOOKINGS_CREATED,
          title: 'New Bookings Created',
          body: `${bookingIds.length} booking(s) created from quotation #${quotation.quote_number}`,
        });
      }
    } catch (error) {
      console.error('Failed to send acceptance notification:', error);
    }

    // Return updated quotation
    const updated = await this.repository.findOneOrFail({
      where: { id: quotationId },
      relations: ['customer', 'seller', 'service'],
    });

    return this.mapToDomain(updated);
  }

  /**
   * Find quotations linked to a booking.
   *
   * Finds quotations by:
   * 1. assessment_booking_id - Post-assessment quotations created from the booking
   * 2. booking.quotation_id - Quotations linked to preventive bookings
   * 3. booking.source_quotation_id - Quotations that were accepted to create the booking
   *
   * @param bookingId - Booking ID
   * @returns Array of quotations linked to the booking
   */
  async findByBookingId(bookingId: number): Promise<QuoteRequest[]> {
    // 1. Find quotations where assessment_booking_id = bookingId
    const byAssessmentBooking = await this.repository.find({
      where: {
        assessment_booking_id: bookingId,
        deleted_at: null as any,
      } as any,
      relations: ['customer', 'seller', 'service', 'package'],
      order: { revision_number: 'ASC', created_at: 'ASC' },
    });

    // 2. Find quotations linked via booking.quotation_id or booking.source_quotation_id
    const bookingResult = await this.repository.manager.query(
      `SELECT quotation_id, source_quotation_id FROM bookings WHERE id = $1`,
      [bookingId],
    );

    const additionalIds: number[] = [];
    if (bookingResult.length > 0) {
      const booking = bookingResult[0];
      if (booking.quotation_id) additionalIds.push(booking.quotation_id);
      if (booking.source_quotation_id)
        additionalIds.push(booking.source_quotation_id);
    }

    // 3. Fetch additional quotations if any
    let additionalQuotations: QuoteRequestEntity[] = [];
    if (additionalIds.length > 0) {
      additionalQuotations = await this.repository.find({
        where: additionalIds.map((id) => ({ id, deleted_at: null as any })),
        relations: ['customer', 'seller', 'service', 'package'],
      });
    }

    // 4. Combine and deduplicate
    const allEntities = [...byAssessmentBooking, ...additionalQuotations];
    const uniqueMap = new Map<number, QuoteRequestEntity>();
    for (const entity of allEntities) {
      uniqueMap.set(entity.id, entity);
    }

    // 5. Sort by revision_number and created_at
    const uniqueEntities = Array.from(uniqueMap.values()).sort((a, b) => {
      if (a.revision_number !== b.revision_number) {
        return a.revision_number - b.revision_number;
      }
      return (
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });

    return uniqueEntities.map((e) => this.mapToDomain(e));
  }

  /**
   * Get revision history for a quotation.
   *
   * Returns all quotations in the revision chain (parent and children).
   *
   * @param quotationId - Quotation ID
   * @returns Array of quotations in the revision chain
   */
  async getRevisionHistory(quotationId: number): Promise<QuoteRequest[]> {
    const quotation = await this.findById(quotationId);

    // Find all quotations with the same assessment_booking_id or in the parent chain
    const whereConditions: any[] = [{ id: quotationId }];

    if (quotation.assessment_booking_id) {
      whereConditions.push({
        assessment_booking_id: quotation.assessment_booking_id,
        deleted_at: null as any,
      });
    }

    if (quotation.parent_quotation_id) {
      whereConditions.push({ id: quotation.parent_quotation_id });
    }

    const entities = await this.repository.find({
      where: whereConditions,
      relations: ['customer', 'seller', 'service'],
      order: { revision_number: 'ASC', created_at: 'ASC' },
    });

    // Deduplicate
    const uniqueMap = new Map<number, QuoteRequestEntity>();
    for (const entity of entities) {
      uniqueMap.set(entity.id, entity);
    }

    return Array.from(uniqueMap.values())
      .sort((a, b) => a.revision_number - b.revision_number)
      .map((e) => this.mapToDomain(e));
  }

  /**
   * Sync booking totals from quotation items.
   * When a quotation is created or sent, linked bookings (quotation_id = quotationId)
   * should show the quoted amount so list/detail display correct total instead of 0.
   *
   * Uses same formula as quotation-checkout: services_subtotal, materials_subtotal,
   * subtotal, platform_fee, provider_payout. Only updates bookings that are still
   * awaiting_quotation (not yet confirmed).
   *
   * Public so quotation-items.service can call after addItems when items are added in a separate request.
   */
  async syncBookingTotalsFromQuotation(quotationId: number): Promise<void> {
    const items = await this.repository.manager.query(
      `SELECT item_type, total_price FROM quotation_items WHERE quotation_id = $1 AND deleted_at IS NULL`,
      [quotationId],
    );

    if (items.length === 0) return;

    const serviceItems = items.filter((i: any) => i.item_type === 'service');
    const materialItems = items.filter((i: any) => i.item_type === 'material');
    const servicesSubtotal = serviceItems.reduce(
      (sum: number, i: any) => sum + parseFloat(i.total_price),
      0,
    );
    const materialsSubtotal = materialItems.reduce(
      (sum: number, i: any) => sum + parseFloat(i.total_price),
      0,
    );
    const subtotal = servicesSubtotal + materialsSubtotal;
    const platformFeePercent = await this.getPlatformFeePercent();
    const platformFee = (subtotal * platformFeePercent) / 100;
    const providerPayout = subtotal - platformFee;
    const basePrice = servicesSubtotal;
    const addonsTotal = 0;
    const optionsTotal = materialsSubtotal;

    await this.repository.manager.query(
      `UPDATE bookings
       SET base_price = $1, addons_total = $2, options_total = $3,
           subtotal = $4, total = $4, platform_fee = $5,
           platform_fee_percent = $6, provider_payout = $7, updated_at = NOW()
       WHERE quotation_id = $8 AND status IN ('awaiting_quotation', 'pending_review', 'in_progress') AND deleted_at IS NULL`,
      [
        basePrice,
        addonsTotal,
        optionsTotal,
        subtotal,
        platformFee,
        platformFeePercent,
        providerPayout,
        quotationId,
      ],
    );
  }
}
