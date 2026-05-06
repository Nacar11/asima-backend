import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, QueryFailedError, Repository } from 'typeorm';
import { extname } from 'path';
import { randomBytes } from 'crypto';
import { ServicesService } from '@/services/services.service';
import { ServiceStatusEnum } from '@/services/enums/service-status.enum';
import { ServiceTypeEnum } from '@/services/enums/service-type.enum';
import { SellerSchedulesService } from '@/seller-schedules/seller-schedules.service';
import { UsersService } from '@/users/users.service';
import { User } from '@/users/domain/user';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import { SalesOrderItemEntity } from '@/sales-orders/persistence/entities/sales-order-item.entity';
import { OrderStatusEnum } from '@/sales-orders/domain/order-status.enum';
import { PaymentStatusEnum } from '@/sales-orders/domain/payment-status.enum';
import { CartItemTypeEnum } from '@/shopping-carts/enums/cart-item-type.enum';
import { BookingsService } from '@/bookings/bookings.service';
import { BaseBookingRepository } from '@/bookings/persistence/base-booking.repository';
import { BookingEntity } from '@/bookings/persistence/entities/booking.entity';
import { BookingStatusEnum } from '@/bookings/enums/booking-status.enum';
import { Booking } from '@/bookings/domain/booking';
import { CheckoutPaymentsService } from '@/checkout-payments/checkout-payments.service';
import { CustomPaymentMethodRepository } from '@/checkout-payments/persistence/repositories/custom-payment-method.repository';
import { CustomPaymentMethodEntity } from '@/checkout-payments/persistence/entities/custom-payment-method.entity';
import { CheckoutPayment } from '@/checkout-payments/domain/checkout-payment';
import {
  CreateGuestVenueBookingDto,
  GuestVoucherAssignmentDto,
  GUEST_VENUE_PAYMENT_METHODS,
  GuestVenuePaymentMethod,
  normalizeGuestVenuePaymentMethod,
} from './dto/create-guest-venue-booking.dto';
import { CreateAdminGuestVenueBookingDto } from './dto/create-admin-guest-venue-booking.dto';
import {
  GuestBookingResponseDto,
  GuestBookingSelectedSlotDto,
} from './dto/guest-booking-response.dto';
import { GuestBookingDetailDto } from './dto/guest-booking-detail.dto';
import { GetVenueCalendarDto } from './dto/get-venue-calendar.dto';
import { ServiceAddonsService } from '@/service-addons/service-addons.service';
import { AddonStatusEnum } from '@/service-addons/enums/addon-status.enum';
import { SalesOrderItemAddonRepository } from '@/sales-order-item-addons/persistence/repositories/sales-order-item-addon.repository';
import { SalesOrderItemAddon } from '@/sales-order-item-addons/domain/sales-order-item-addon';
import { CheckoutPaymentOrderEntity } from '@/checkout-payments/persistence/entities/checkout-payment-order.entity';
import { CheckoutPaymentEntity } from '@/checkout-payments/persistence/entities/checkout-payment.entity';
import { CheckoutPaymentStatusEnum } from '@/checkout-payments/enums/checkout-payment-status.enum';
import { GuestBookingPaymentStatusDto } from './dto/guest-booking-payment-status.dto';
import {
  GuestBookingPaymentPageDto,
  GuestBookingPaymentSlotDto,
} from './dto/guest-booking-payment-page.dto';
import { NotifyGuestBookingPaymentDto } from './dto/notify-guest-booking-payment.dto';
import { NotifyServiceBookingPaymentDto } from './dto/notify-service-booking-payment.dto';
import { GuestBookingGuestDto } from './dto/guest-booking-guest.dto';
import { SellersService } from '@/sellers/sellers.service';
import { QuerySellerAwaitingConfirmationDto } from './dto/query-seller-awaiting-confirmation.dto';
import { SellerAwaitingConfirmationResponseDto } from './dto/seller-awaiting-confirmation-response.dto';
import { SellerAwaitingConfirmationBookingDto } from './dto/seller-awaiting-confirmation-booking.dto';
import { StorageService } from '@/storage/storage.service';
import { MailService } from '@/mail/mail.service';
import { UserGroupEntity } from '@/user-groups/persistence/entities/user-group.entity';
import { UserAssignmentEntity } from '@/user-assignments/persistence/entities/user-assignment.entity';
import { StatusEnum as UserGroupStatusEnum } from '@/user-groups/user-groups.enum';
import { StatusEnum as UserAssignmentStatusEnum } from '@/user-assignments/user-assignments.enum';
import { StatusEnum as UserStatusEnum } from '@/users/users.enum';
import { GuestVenueBookingExpirySchedulerService } from './guest-venue-booking-expiry-scheduler.service';
import { BookingGuestRepository } from '@/booking-guests/persistence/repositories/booking-guest.repository';
import { normalizeTimeForPresentation } from '@/bookings/utils/booking-time-presentation.util';
import { OpenPlayEventEntity } from '@/guest-venue-booking/persistence/entities/open-play-event.entity';
import { OpenPlaySkillLevelEntity } from '@/guest-venue-booking/persistence/entities/open-play-skill-level.entity';
import { CreateOpenPlayEventDto } from './dto/create-open-play-event.dto';
import {
  CreateRecurringOpenPlayEventsDto,
  OpenPlayRecurrenceType,
} from './dto/create-recurring-open-play-events.dto';
import { QueryOpenPlayEventsDto } from './dto/query-open-play-events.dto';
import { QueryPublicOpenPlayEventsDto } from './dto/query-public-open-play-events.dto';
import { QueryPublicOpenPlayEventsListDto } from './dto/query-public-open-play-events-list.dto';
import { CreateGuestOpenPlayRegistrationDto } from './dto/create-guest-open-play-registration.dto';
import { UpdateOpenPlayEventDto } from './dto/update-open-play-event.dto';
import { StoreUnavailabilityEntity } from '@/store-unavailability/persistence/entities/store-unavailability.entity';
import { AvailabilityRealtimeService } from '@/availability-realtime/availability-realtime.service';
import { VouchersService } from '@/vouchers/vouchers.service';
import { SalesOrderVoucherEntity } from '@/sales-order-vouchers/persistence/entities/sales-order-voucher.entity';
import { getCurrentTimezone } from '@/utils/helpers/timezone.helper';
import {
  formatOpenPlaySkillLevelLabel,
  OPEN_PLAY_DEFAULT_SKILL_LEVEL_CODE,
} from '@/guest-venue-booking/open-play-skill-levels.constants';
import { EdistrictEntity } from '@/discovery/persistence/entities/edistrict.entity';
import { PickleballLocationsService } from '@/pickleball-merchants/pickleball-locations.service';
import { SellerPaymentProfileEntity } from '@/pickleball-merchants/persistence/entities/seller-payment-profile.entity';
import { BookingEmailMirrorNotificationService } from '@/notifications/services/booking-email-mirror-notification.service';

const SLOT_OCCUPYING_BOOKING_STATUSES: BookingStatusEnum[] = [
  BookingStatusEnum.PENDING,
  BookingStatusEnum.AWAITING_CONFIRMATION,
  BookingStatusEnum.CONFIRMED,
  BookingStatusEnum.IN_PROGRESS,
  BookingStatusEnum.COMPLETED,
];

const MUTABLE_ORDER_STATUSES: OrderStatusEnum[] = [
  OrderStatusEnum.PENDING,
  OrderStatusEnum.CONFIRMED,
  OrderStatusEnum.PROCESSING,
];

const MANUAL_GUEST_PAYMENT_METHODS: readonly GuestVenuePaymentMethod[] =
  GUEST_VENUE_PAYMENT_METHODS;

const OPEN_PLAY_PUBLISHED_STATUSES = ['published', 'active'];

const OPEN_PLAY_REGISTRATION_MAX_ADDITIONAL_GUESTS = 31;
const OPEN_PLAY_REGISTRATION_MAX_TOTAL_GUESTS = 32;
const MINIMUM_LEAD_TIME_MINUTES = 60;
const MAX_RECURRING_OPEN_PLAY_OCCURRENCES = 120;

type RecurringOpenPlayFailureCode =
  | 'lead_time'
  | 'overlap_block'
  | 'overlap_booking'
  | 'create_failed';

type RecurringOpenPlayCreatedItem = {
  event_id: number;
  store_unavailability_id: number | null;
  event_date: string;
  start_time: string;
  end_time: string;
};

type RecurringOpenPlayFailedItem = {
  event_date: string;
  start_time: string;
  end_time: string;
  code: RecurringOpenPlayFailureCode;
  message: string;
};

type NormalizedGuestRosterEntry = {
  sort_order: number;
  is_primary_contact: boolean;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string | null;
  phone: string | null;
};

@Injectable()
export class GuestVenueBookingService {
  private static readonly BOOKING_APPROVERS_GROUP_NAME = 'Booking Approvers';
  private readonly logger = new Logger(GuestVenueBookingService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly servicesService: ServicesService,
    private readonly sellerSchedulesService: SellerSchedulesService,
    private readonly usersService: UsersService,
    @InjectRepository(SalesOrderEntity)
    private readonly salesOrderRepository: Repository<SalesOrderEntity>,
    @InjectRepository(SalesOrderItemEntity)
    private readonly salesOrderItemRepository: Repository<SalesOrderItemEntity>,
    @InjectRepository(CheckoutPaymentOrderEntity)
    private readonly paymentOrderRepository: Repository<CheckoutPaymentOrderEntity>,
    @InjectRepository(CheckoutPaymentEntity)
    private readonly checkoutPaymentRepository: Repository<CheckoutPaymentEntity>,
    @InjectRepository(BookingEntity)
    private readonly bookingEntityRepository: Repository<BookingEntity>,
    @InjectRepository(OpenPlayEventEntity)
    private readonly openPlayEventRepository: Repository<OpenPlayEventEntity>,
    @InjectRepository(StoreUnavailabilityEntity)
    private readonly storeUnavailabilityRepository: Repository<StoreUnavailabilityEntity>,
    @InjectRepository(UserGroupEntity)
    private readonly userGroupRepository: Repository<UserGroupEntity>,
    @InjectRepository(UserAssignmentEntity)
    private readonly userAssignmentRepository: Repository<UserAssignmentEntity>,
    private readonly bookingsService: BookingsService,
    private readonly bookingRepository: BaseBookingRepository,
    private readonly checkoutPaymentsService: CheckoutPaymentsService,
    private readonly serviceAddonsService: ServiceAddonsService,
    private readonly salesOrderItemAddonRepository: SalesOrderItemAddonRepository,
    private readonly sellersService: SellersService,
    private readonly storageService: StorageService,
    private readonly mailService: MailService,
    private readonly bookingEmailMirrorNotificationService: BookingEmailMirrorNotificationService,
    private readonly bookingGuestRepository: BookingGuestRepository,
    private readonly guestVenueBookingExpirySchedulerService: GuestVenueBookingExpirySchedulerService,
    private readonly availabilityRealtimeService: AvailabilityRealtimeService,
    private readonly vouchersService: VouchersService,
    @InjectRepository(SalesOrderVoucherEntity)
    private readonly salesOrderVoucherRepository: Repository<SalesOrderVoucherEntity>,
    private readonly customPaymentMethodRepository: CustomPaymentMethodRepository,
    @InjectRepository(EdistrictEntity)
    private readonly edistrictRepository: Repository<EdistrictEntity>,
    @InjectRepository(SellerPaymentProfileEntity)
    private readonly sellerPaymentProfileRepository: Repository<SellerPaymentProfileEntity>,
    private readonly pickleballLocationsService: PickleballLocationsService,
  ) {}

  private buildNameInitial(
    firstName: string | null,
    lastName: string | null,
  ): string | null {
    const initial = [firstName, lastName]
      .map((name) => String(name || '').trim())
      .filter((name) => name.length > 0)
      .map((name) => name.charAt(0).toUpperCase())
      .join('');

    return initial || null;
  }

  private resolveSlotOccupyingIdentity(occupyingBooking?: Booking | null): {
    email: string | null;
    first_name: string | null;
    last_name: string | null;
    initial: string | null;
  } {
    if (!occupyingBooking) {
      return {
        email: null,
        first_name: null,
        last_name: null,
        initial: null,
      };
    }

    const firstName =
      String(
        occupyingBooking.primary_guest?.first_name ||
          occupyingBooking.customer?.first_name ||
          '',
      ).trim() || null;
    const lastName =
      String(
        occupyingBooking.primary_guest?.last_name ||
          occupyingBooking.customer?.last_name ||
          '',
      ).trim() || null;
    const rawEmail =
      occupyingBooking.primary_guest?.email ||
      occupyingBooking.guest_email ||
      occupyingBooking.customer?.email ||
      null;

    return {
      email:
        typeof rawEmail === 'string' && rawEmail.trim()
          ? this.normalizeGuestEmail(rawEmail)
          : null,
      first_name: firstName,
      last_name: lastName,
      initial: this.buildNameInitial(firstName, lastName),
    };
  }

  private normalizeTimeToSeconds(value: string): string {
    const trimmed = String(value || '').trim();
    if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    if (/^\d{2}:\d{2}$/.test(trimmed)) {
      return `${trimmed}:00`;
    }
    return trimmed;
  }

  private getScheduleTimezone(): string {
    const configuredTimezone = this.configService
      .get<string>('DEFAULT_TIMEZONE', { infer: true })
      ?.trim();

    return configuredTimezone || process.env.DEFAULT_TIMEZONE || 'Asia/Manila';
  }

  private getOpenPlaySkillLevelRepository(): Repository<OpenPlaySkillLevelEntity> {
    return this.openPlayEventRepository.manager.getRepository(
      OpenPlaySkillLevelEntity,
    );
  }

  private normalizeOpenPlaySkillLevelCode(value?: string | null): string {
    const normalizedCode = String(value || '')
      .trim()
      .toLowerCase();

    return normalizedCode || OPEN_PLAY_DEFAULT_SKILL_LEVEL_CODE;
  }

  private async resolveOpenPlaySkillLevelCode(
    value?: string | null,
  ): Promise<string> {
    const normalizedCode = this.normalizeOpenPlaySkillLevelCode(value);
    const skillLevel = await this.getOpenPlaySkillLevelRepository().findOne({
      where: {
        code: normalizedCode,
        is_active: true,
      },
    });

    if (!skillLevel) {
      throw new BadRequestException('skill_level_code is invalid or inactive.');
    }

    return normalizedCode;
  }

  private async resolveOptionalOpenPlaySkillLevelCode(
    value?: string | null,
  ): Promise<string | undefined> {
    const normalizedValue = String(value || '').trim();
    if (!normalizedValue) {
      return undefined;
    }

    return this.resolveOpenPlaySkillLevelCode(normalizedValue);
  }

  private buildOpenPlayDateTime(eventDate: string, time: string): Date {
    const normalizedDate = String(eventDate || '').trim();
    const normalizedTime = this.normalizeTimeToSeconds(time).slice(0, 8);

    const dateMatch = normalizedDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const timeMatch = normalizedTime.match(/^(\d{2}):(\d{2}):(\d{2})$/);
    if (!dateMatch || !timeMatch) {
      return new Date(Number.NaN);
    }

    const year = Number(dateMatch[1]);
    const month = Number(dateMatch[2]);
    const day = Number(dateMatch[3]);
    const hour = Number(timeMatch[1]);
    const minute = Number(timeMatch[2]);
    const second = Number(timeMatch[3]);

    if (
      !Number.isInteger(year) ||
      !Number.isInteger(month) ||
      !Number.isInteger(day) ||
      !Number.isInteger(hour) ||
      !Number.isInteger(minute) ||
      !Number.isInteger(second) ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31 ||
      hour < 0 ||
      hour > 23 ||
      minute < 0 ||
      minute > 59 ||
      second < 0 ||
      second > 59
    ) {
      return new Date(Number.NaN);
    }

    const scheduleDateTime = getCurrentTimezone(
      undefined,
      this.getScheduleTimezone(),
    )
      .year(year)
      .month(month - 1)
      .date(day)
      .hour(hour)
      .minute(minute)
      .second(second)
      .millisecond(0);

    if (
      !scheduleDateTime.isValid() ||
      scheduleDateTime.format('YYYY-MM-DD') !== normalizedDate
    ) {
      return new Date(Number.NaN);
    }

    return scheduleDateTime.toDate();
  }

  private ensureMinimumLeadTime(
    eventDate: string,
    startTime: string,
    subjectLabel: string,
  ): void {
    const startDateTime = this.buildOpenPlayDateTime(eventDate, startTime);
    if (!Number.isFinite(startDateTime.getTime())) {
      throw new BadRequestException(`Invalid ${subjectLabel} start date/time.`);
    }

    const minimumAllowedStart = new Date(
      Date.now() + MINIMUM_LEAD_TIME_MINUTES * 60 * 1000,
    );
    if (startDateTime.getTime() < minimumAllowedStart.getTime()) {
      throw new BadRequestException(
        `${subjectLabel} must be scheduled at least 1 hour in advance.`,
      );
    }
  }

  private isOpenPlayPublishedStatus(
    status: string | null | undefined,
  ): boolean {
    const normalized = String(status || '')
      .trim()
      .toLowerCase();
    return OPEN_PLAY_PUBLISHED_STATUSES.includes(normalized);
  }

  private isOpenPlayRegistrationOpen(
    event: OpenPlayEventEntity,
    remainingSlots: number,
    now: Date = new Date(),
  ): boolean {
    const scheduleTimezone = this.getScheduleTimezone();
    const currentTime = getCurrentTimezone(now, scheduleTimezone);

    if (!this.isOpenPlayPublishedStatus(event.status)) {
      return false;
    }

    if (remainingSlots <= 0) {
      return false;
    }

    if (
      event.registration_start_at &&
      currentTime.isBefore(
        getCurrentTimezone(event.registration_start_at, scheduleTimezone),
      )
    ) {
      return false;
    }

    if (
      event.registration_end_at &&
      currentTime.isAfter(
        getCurrentTimezone(event.registration_end_at, scheduleTimezone),
      )
    ) {
      return false;
    }

    const eventStartAt = this.buildOpenPlayDateTime(
      event.event_date,
      event.start_time,
    );
    if (Number.isFinite(eventStartAt.getTime())) {
      // Joining should remain available until the event starts (or an explicit
      // registration_end_at closes it earlier).
      if (
        !currentTime.isBefore(
          getCurrentTimezone(eventStartAt, scheduleTimezone),
        )
      ) {
        return false;
      }
    }

    const eventEndAt = this.buildOpenPlayDateTime(
      event.event_date,
      event.end_time,
    );
    if (
      Number.isFinite(eventEndAt.getTime()) &&
      !currentTime.isBefore(getCurrentTimezone(eventEndAt, scheduleTimezone))
    ) {
      return false;
    }

    return true;
  }

  private mapOpenPlayEventResponse(
    event: OpenPlayEventEntity,
    registeredCount: number,
  ) {
    const maxApplicants = Number(event.max_applicants || 0);
    const remainingSlots = Math.max(0, maxApplicants - registeredCount);
    const skillLevelCode = this.normalizeOpenPlaySkillLevelCode(
      event.skill_level_code,
    );

    return {
      id: event.id,
      seller_id: event.seller_id,
      service_id: event.service_id,
      event_date: event.event_date,
      start_time: event.start_time,
      end_time: event.end_time,
      title: event.title,
      description: event.description,
      rate_per_person: Number(event.rate_per_person || 0),
      max_applicants: maxApplicants,
      skill_level_code: skillLevelCode,
      skill_level_label: formatOpenPlaySkillLevelLabel(skillLevelCode),
      status: event.status,
      registration_start_at: event.registration_start_at
        ? event.registration_start_at.toISOString()
        : null,
      registration_end_at: event.registration_end_at
        ? event.registration_end_at.toISOString()
        : null,
      store_unavailability_id: event.store_unavailability_id ?? null,
      registered_count: registeredCount,
      remaining_slots: remainingSlots,
      is_registration_open: this.isOpenPlayRegistrationOpen(
        event,
        remainingSlots,
      ),
      created_at: event.created_at,
      updated_at: event.updated_at,
      service_title: event.service?.title || null,
      venue_name: event.service?.title || null,
    };
  }

  private async getOpenPlayRegisteredCounts(
    eventIds: number[],
  ): Promise<Map<number, number>> {
    const normalizedEventIds = [
      ...new Set(
        eventIds.filter((id) => Number.isInteger(id) && Number(id) > 0),
      ),
    ];

    if (normalizedEventIds.length === 0) {
      return new Map();
    }

    const rows = await this.bookingEntityRepository
      .createQueryBuilder('booking')
      .select('booking.open_play_event_id', 'open_play_event_id')
      .addSelect('COALESCE(SUM(booking.guest_count), 0)', 'guest_count_total')
      .where('booking.open_play_event_id IN (:...eventIds)', {
        eventIds: normalizedEventIds,
      })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: SLOT_OCCUPYING_BOOKING_STATUSES,
      })
      .groupBy('booking.open_play_event_id')
      .getRawMany<{ open_play_event_id: string; guest_count_total: string }>();

    const counts = new Map<number, number>();
    for (const row of rows) {
      const eventId = Number(row.open_play_event_id);
      if (!Number.isInteger(eventId) || eventId <= 0) {
        continue;
      }
      counts.set(eventId, Number(row.guest_count_total || 0));
    }
    return counts;
  }

  private async getActiveOpenPlayEventsForDate(
    date: string,
    serviceIds: number[],
  ): Promise<OpenPlayEventEntity[]> {
    const normalizedServiceIds = [
      ...new Set(
        serviceIds
          .map((value) => Number(value))
          .filter((value) => Number.isInteger(value) && value > 0),
      ),
    ];

    if (normalizedServiceIds.length === 0) {
      return [];
    }

    const eventCandidates = await this.openPlayEventRepository.find({
      where: {
        service_id: In(normalizedServiceIds),
        event_date: date,
        deleted_at: IsNull(),
      },
      order: {
        service_id: 'ASC',
        start_time: 'ASC',
      },
    });

    const activeStatusEvents = eventCandidates.filter((event) =>
      this.isOpenPlayPublishedStatus(event.status),
    );
    if (activeStatusEvents.length === 0) {
      return [];
    }

    const activeStatusEventIds = activeStatusEvents.map((event) => event.id);
    const activeOpenPlayBlocks = await this.storeUnavailabilityRepository
      .createQueryBuilder('block')
      .select('block.open_play_event_id', 'open_play_event_id')
      .where('block.open_play_event_id IN (:...eventIds)', {
        eventIds: activeStatusEventIds,
      })
      .andWhere('block.unavailable_date = :date', { date })
      .andWhere('block.deleted_at IS NULL')
      .andWhere(`LOWER(COALESCE(block.status, '')) = :status`, {
        status: 'active',
      })
      .andWhere(`LOWER(COALESCE(block.block_type, '')) = :blockType`, {
        blockType: 'open_play',
      })
      .groupBy('block.open_play_event_id')
      .getRawMany<{ open_play_event_id: string }>();

    const activeBlockEventIds = new Set<number>(
      activeOpenPlayBlocks
        .map((row) => Number(row.open_play_event_id))
        .filter((value) => Number.isInteger(value) && value > 0),
    );

    return activeStatusEvents.filter((event) =>
      activeBlockEventIds.has(event.id),
    );
  }

  private findOpenPlayEventForSlot(
    events: OpenPlayEventEntity[],
    slotStartTime: string,
    slotEndTime: string,
  ): OpenPlayEventEntity | null {
    const slotStart = this.timeToMinutes(slotStartTime);
    const slotEnd = this.timeToMinutes(slotEndTime);

    for (const event of events) {
      const eventStart = this.timeToMinutes(event.start_time);
      const eventEnd = this.timeToMinutes(event.end_time);
      if (eventStart < slotEnd && eventEnd > slotStart) {
        return event;
      }
    }

    return null;
  }

  private enrichSlotWithOpenPlayMetadata<
    T extends {
      start_time: string;
      end_time: string;
      available_units: number;
      is_available: boolean;
      unavailable_reason?: string | null;
      unavailable_source?: string | null;
      email?: string | null;
      first_name?: string | null;
      last_name?: string | null;
      initial?: string | null;
    },
  >(slot: T, events: OpenPlayEventEntity[], eventCounts: Map<number, number>) {
    const matchingEvent = this.findOpenPlayEventForSlot(
      events,
      slot.start_time,
      slot.end_time,
    );

    if (!matchingEvent) {
      return {
        ...slot,
        slot_mode: slot.is_available ? 'regular' : 'blocked',
        open_play_event_id: null,
      };
    }

    const maxApplicants = Number(matchingEvent.max_applicants || 0);
    const registeredCount = Number(eventCounts.get(matchingEvent.id) || 0);
    const remainingSlots = Math.max(0, maxApplicants - registeredCount);
    const isRegistrationOpen = this.isOpenPlayRegistrationOpen(
      matchingEvent,
      remainingSlots,
    );

    return {
      ...slot,
      slot_mode: 'open_play',
      is_open_play_available: isRegistrationOpen,
      open_play_event_id: matchingEvent.id,
      open_play_title: matchingEvent.title ?? null,
      open_play_description: matchingEvent.description ?? null,
      open_play_rate_per_person: Number(matchingEvent.rate_per_person || 0),
      open_play_max_applicants: maxApplicants,
      open_play_skill_level_code: this.normalizeOpenPlaySkillLevelCode(
        matchingEvent.skill_level_code,
      ),
      open_play_skill_level_label: formatOpenPlaySkillLevelLabel(
        matchingEvent.skill_level_code,
      ),
      open_play_registered_count: registeredCount,
      open_play_remaining_slots: remainingSlots,
      open_play_status: matchingEvent.status ?? null,
      open_play_registration_start_at: matchingEvent.registration_start_at
        ? matchingEvent.registration_start_at.toISOString()
        : null,
      open_play_registration_end_at: matchingEvent.registration_end_at
        ? matchingEvent.registration_end_at.toISOString()
        : null,
      unavailable_reason:
        slot.unavailable_reason ||
        matchingEvent.title ||
        'Open play session is scheduled for this slot.',
      unavailable_source: slot.unavailable_source || 'blocked',
      email: null,
      first_name: null,
      last_name: null,
      initial: null,
    };
  }

  async getVenueAvailability(serviceId: number, date: string) {
    const service = await this.servicesService.findById(serviceId);

    if (service.status !== ServiceStatusEnum.ACTIVE) {
      throw new NotFoundException('Service not found');
    }

    if (service.service_type !== ServiceTypeEnum.VENUE) {
      throw new NotFoundException('Service not found');
    }

    const slots = await this.servicesService.getVenueAvailableSlots(
      serviceId,
      date,
    );
    const sellerBookings = await this.bookingRepository.findBySellerAndDate(
      service.seller_id,
      date,
    );

    const activeServiceBookings = sellerBookings.filter(
      (booking) =>
        booking.service_id === serviceId &&
        SLOT_OCCUPYING_BOOKING_STATUSES.includes(booking.status),
    );
    const openPlayEvents = await this.getActiveOpenPlayEventsForDate(date, [
      serviceId,
    ]);
    const openPlayEventCounts = await this.getOpenPlayRegisteredCounts(
      openPlayEvents.map((event) => event.id),
    );

    return {
      service_id: serviceId,
      date,
      venue_capacity: service.venue_capacity ?? 0,
      slot_duration_minutes: service.slot_duration_minutes ?? 60,
      slots: slots.map((s) => {
        const remainingUnits =
          typeof (s as any).remaining === 'number'
            ? Number((s as any).remaining)
            : null;
        const isAvailable =
          Boolean(s.available) &&
          (remainingUnits === null || remainingUnits > 0);
        const availableUnits = isAvailable ? (remainingUnits ?? 1) : 0;

        const slot = {
          start_time: s.start_time,
          end_time: s.end_time,
          available_units: availableUnits,
          is_available: isAvailable,
          unavailable_reason: isAvailable
            ? null
            : (s.unavailable_reason ?? null),
          unavailable_source: isAvailable
            ? null
            : (s.unavailable_source ?? null),
        };

        if (isAvailable) {
          return this.enrichSlotWithOpenPlayMetadata(
            slot,
            openPlayEvents,
            openPlayEventCounts,
          );
        }

        const slotStart = this.timeToMinutes(s.start_time);
        const slotEnd = this.timeToMinutes(s.end_time);
        const occupyingBooking = activeServiceBookings.find((booking) => {
          const bookingStart = this.timeToMinutes(booking.scheduled_start_time);
          const bookingEnd = booking.scheduled_end_time
            ? this.timeToMinutes(booking.scheduled_end_time)
            : bookingStart + (service.slot_duration_minutes ?? 60);

          return bookingStart < slotEnd && bookingEnd > slotStart;
        });

        const occupantIdentity =
          this.resolveSlotOccupyingIdentity(occupyingBooking);

        const slotWithIdentity = {
          ...slot,
          ...occupantIdentity,
        };

        return this.enrichSlotWithOpenPlayMetadata(
          slotWithIdentity,
          openPlayEvents,
          openPlayEventCounts,
        );
      }),
    };
  }

  async getVenueAvailabilityByDateRange(params: {
    date?: string;
    start_date?: string;
    end_date?: string;
    location?: string;
  }) {
    const { date, start_date, end_date, location } = params;
    const normalizedLocation = this.normalizePublicVenueLocation(location);
    const locationSellerId =
      await this.resolveSellerIdForPublicVenueLocation(normalizedLocation);
    const venueServices =
      normalizedLocation && locationSellerId === null
        ? []
        : await this.getAllActiveVenueServices(undefined, locationSellerId);
    // Backward compatibility: single date mode
    if (date && !start_date && !end_date) {
      const venues = await this.buildVenueSlotsForDate(date, venueServices);
      return {
        venues,
      };
    }

    if (!start_date || !end_date) {
      throw new BadRequestException(
        'Provide either date, or both start_date and end_date.',
      );
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    if (startDate > endDate) {
      throw new BadRequestException(
        'start_date must be before or equal to end_date',
      );
    }

    const days: Array<{ date: string; venues: any[] }> = [];
    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      const dateStr = cursor.toISOString().split('T')[0];
      const venues = await this.buildVenueSlotsForDate(dateStr, venueServices);
      days.push({ date: dateStr, venues });
      cursor.setDate(cursor.getDate() + 1);
    }

    return {
      start_date,
      end_date,
      total_venue_services: venueServices.length,
      days,
    };
  }

  async getPublicOpenPlayEvents(query: QueryPublicOpenPlayEventsDto): Promise<{
    date: string;
    total_count: number;
    events: any[];
  }> {
    const date = this.normalizeDateOnly(query.date, 'date');
    const skillLevelCode = await this.resolveOptionalOpenPlaySkillLevelCode(
      query.skill_level_code,
    );
    const normalizedLocation = this.normalizePublicVenueLocation(
      query.location,
    );
    const locationSellerId =
      await this.resolveSellerIdForPublicVenueLocation(normalizedLocation);

    const venueServices =
      normalizedLocation && locationSellerId === null
        ? []
        : await this.getAllActiveVenueServices(
            query.service_id,
            locationSellerId,
          );

    const serviceNameById = new Map<number, string>(
      venueServices.map((service) => [
        service.id,
        service.title || service.name || `Venue #${service.id}`,
      ]),
    );
    const serviceIds = venueServices
      .map((service) => service.id)
      .filter((id) => Number.isInteger(id) && id > 0);

    const activeEvents =
      serviceIds.length > 0
        ? await this.getActiveOpenPlayEventsForDate(date, serviceIds)
        : [];
    const counts = await this.getOpenPlayRegisteredCounts(
      activeEvents.map((event) => event.id),
    );

    const filteredEvents = skillLevelCode
      ? activeEvents.filter(
          (event) =>
            this.normalizeOpenPlaySkillLevelCode(event.skill_level_code) ===
            skillLevelCode,
        )
      : activeEvents;

    const events = filteredEvents
      .slice()
      .sort((left, right) => {
        return (
          left.start_time.localeCompare(right.start_time) ||
          left.end_time.localeCompare(right.end_time) ||
          left.service_id - right.service_id ||
          left.id - right.id
        );
      })
      .map((event) => {
        const mapped = this.mapOpenPlayEventResponse(
          event,
          counts.get(event.id) ?? 0,
        );
        const venueName =
          serviceNameById.get(event.service_id) ??
          mapped.venue_name ??
          mapped.service_title ??
          null;

        return {
          ...mapped,
          service_title: venueName,
          venue_name: venueName,
        };
      });

    return {
      date,
      total_count: events.length,
      events,
    };
  }

  async getPublicOpenPlayEventsList(
    query: QueryPublicOpenPlayEventsListDto,
  ): Promise<{
    date_from: string;
    date_to: string;
    data: any[];
    totalCount: number;
    skip: number;
    take: number;
  }> {
    const { dateFrom, dateTo } = this.resolveOpenPlayListDateRange(
      query.date_from,
      query.date_to,
    );
    const skillLevelCode = await this.resolveOptionalOpenPlaySkillLevelCode(
      query.skill_level_code,
    );
    const normalizedLocation = this.normalizePublicVenueLocation(
      query.location,
    );
    const locationSellerId =
      await this.resolveSellerIdForPublicVenueLocation(normalizedLocation);

    const skip = Number(query.skip ?? 0);
    const take = Number(query.take ?? 20);
    const normalizedSkip = Number.isFinite(skip) && skip >= 0 ? skip : 0;
    const normalizedTake =
      Number.isFinite(take) && take >= 1 ? Math.min(take, 200) : 20;

    if (normalizedLocation && locationSellerId === null) {
      return {
        date_from: dateFrom,
        date_to: dateTo,
        data: [],
        totalCount: 0,
        skip: normalizedSkip,
        take: normalizedTake,
      };
    }

    const qb = this.openPlayEventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.service', 'service')
      .where('event.deleted_at IS NULL')
      .andWhere('event.event_date >= :dateFrom', { dateFrom })
      .andWhere('event.event_date <= :dateTo', { dateTo })
      .andWhere(`LOWER(COALESCE(event.status, '')) IN (:...statuses)`, {
        statuses: OPEN_PLAY_PUBLISHED_STATUSES,
      });

    if (locationSellerId) {
      qb.andWhere('event.seller_id = :sellerId', {
        sellerId: locationSellerId,
      });
    }

    if (query.service_id) {
      qb.andWhere('event.service_id = :serviceId', {
        serviceId: query.service_id,
      });
    }

    if (skillLevelCode) {
      qb.andWhere('event.skill_level_code = :skillLevelCode', {
        skillLevelCode,
      });
    }

    qb.orderBy('event.event_date', 'ASC')
      .addOrderBy('event.start_time', 'ASC')
      .addOrderBy('event.end_time', 'ASC')
      .addOrderBy('event.id', 'ASC')
      .skip(normalizedSkip)
      .take(normalizedTake);

    const [events, totalCount] = await qb.getManyAndCount();
    const counts = await this.getOpenPlayRegisteredCounts(
      events.map((event) => event.id),
    );

    return {
      date_from: dateFrom,
      date_to: dateTo,
      data: events.map((event) =>
        this.mapOpenPlayEventResponse(event, counts.get(event.id) ?? 0),
      ),
      totalCount,
      skip: normalizedSkip,
      take: normalizedTake,
    };
  }

  private async buildVenueSlotsForDate(
    date: string,
    venueServices: Array<{
      id: number;
      seller_id: number;
      title?: string;
      name?: string;
      base_price?: number | null;
      hourly_rate?: number | null;
      venue_capacity?: number | null;
      slot_duration_minutes?: number | null;
    }>,
  ) {
    const sellerIds = Array.from(
      new Set(venueServices.map((service) => service.seller_id)),
    );
    const sellerBookingsPairs = await Promise.all(
      sellerIds.map(async (sellerId) => {
        const bookings = await this.bookingRepository.findBySellerAndDate(
          sellerId,
          date,
        );
        return [sellerId, bookings] as const;
      }),
    );
    const sellerBookingsBySeller = new Map<number, Booking[]>(
      sellerBookingsPairs,
    );
    const serviceIds = [
      ...new Set(
        venueServices
          .map((service) => service.id)
          .filter((id) => Number.isInteger(id) && Number(id) > 0),
      ),
    ];
    const openPlayEvents = await this.getActiveOpenPlayEventsForDate(
      date,
      serviceIds,
    );
    const openPlayEventCounts = await this.getOpenPlayRegisteredCounts(
      openPlayEvents.map((event) => event.id),
    );
    const openPlayEventsByService = openPlayEvents.reduce<
      Map<number, OpenPlayEventEntity[]>
    >((map, event) => {
      const current = map.get(event.service_id) ?? [];
      current.push(event);
      map.set(event.service_id, current);
      return map;
    }, new Map());

    return Promise.all(
      venueServices.map(async (service) => {
        const venueName = service.title || `Venue #${service.id}`;
        const slots = await this.servicesService.getVenueAvailableSlots(
          service.id,
          date,
        );
        const sellerBookings =
          sellerBookingsBySeller.get(service.seller_id) ?? [];

        const activeServiceBookings = sellerBookings.filter(
          (booking) =>
            booking.service_id === service.id &&
            SLOT_OCCUPYING_BOOKING_STATUSES.includes(booking.status),
        );
        const serviceOpenPlayEvents =
          openPlayEventsByService.get(service.id) ?? [];

        const fallbackPrice = Number(
          service.base_price ?? service.hourly_rate ?? 0,
        );

        return {
          service_id: service.id,
          venue_name: venueName,
          price: fallbackPrice,
          venue_capacity: service.venue_capacity ?? 0,
          slot_duration_minutes: service.slot_duration_minutes ?? 60,
          slots: slots.map((s) => {
            const remainingUnits =
              typeof (s as any).remaining === 'number'
                ? Number((s as any).remaining)
                : null;
            const isAvailable =
              Boolean(s.available) &&
              (remainingUnits === null || remainingUnits > 0);
            const availableUnits = isAvailable ? (remainingUnits ?? 1) : 0;

            const slot = {
              start_time: s.start_time,
              end_time: s.end_time,
              available_units: availableUnits,
              is_available: isAvailable,
              price:
                typeof s.hourly_rate === 'number'
                  ? s.hourly_rate
                  : fallbackPrice,
              venue_name: venueName,
              unavailable_reason: isAvailable
                ? null
                : (s.unavailable_reason ?? null),
              unavailable_source: isAvailable
                ? null
                : (s.unavailable_source ?? null),
            };

            if (isAvailable) {
              return this.enrichSlotWithOpenPlayMetadata(
                slot,
                serviceOpenPlayEvents,
                openPlayEventCounts,
              );
            }

            const slotStart = this.timeToMinutes(s.start_time);
            const slotEnd = this.timeToMinutes(s.end_time);
            const occupyingBooking = activeServiceBookings.find((booking) => {
              const bookingStart = this.timeToMinutes(
                booking.scheduled_start_time,
              );
              const bookingEnd = booking.scheduled_end_time
                ? this.timeToMinutes(booking.scheduled_end_time)
                : bookingStart + (service.slot_duration_minutes ?? 60);

              return bookingStart < slotEnd && bookingEnd > slotStart;
            });

            const occupantIdentity =
              this.resolveSlotOccupyingIdentity(occupyingBooking);

            const slotWithIdentity = {
              ...slot,
              ...occupantIdentity,
            };

            return this.enrichSlotWithOpenPlayMetadata(
              slotWithIdentity,
              serviceOpenPlayEvents,
              openPlayEventCounts,
            );
          }),
        };
      }),
    );
  }

  async getVenueCalendar(dto: GetVenueCalendarDto) {
    return this.getVenueCalendarForScope(dto, null);
  }

  async getVenueCalendarForSeller(dto: GetVenueCalendarDto, user: User) {
    const sellerScopeId = await this.resolveSellerScope(user);

    if (sellerScopeId && dto.service_id) {
      const service = await this.servicesService.findById(dto.service_id);
      if (service.seller_id !== sellerScopeId) {
        throw new ForbiddenException(
          'Access denied. This venue belongs to a different seller.',
        );
      }
    }

    return this.getVenueCalendarForScope(dto, sellerScopeId);
  }

  private async getVenueCalendarForScope(
    dto: GetVenueCalendarDto,
    sellerId: number | null,
  ) {
    const normalizedLocation = this.normalizePublicVenueLocation(dto.location);
    const locationSellerId =
      await this.resolveSellerIdForPublicVenueLocation(normalizedLocation);

    if (
      sellerId !== null &&
      locationSellerId !== null &&
      locationSellerId !== sellerId
    ) {
      throw new ForbiddenException(
        'Access denied. This location belongs to a different seller.',
      );
    }

    const venueServices =
      normalizedLocation && locationSellerId === null
        ? []
        : await this.getAllActiveVenueServices(
            dto.service_id,
            sellerId ?? locationSellerId,
          );

    let startDate: Date;
    let endDate: Date;

    if (dto.date && !dto.start_date && !dto.end_date) {
      startDate = new Date(dto.date);
      endDate = new Date(dto.date);
    } else if (dto.start_date && dto.end_date && !dto.date) {
      startDate = new Date(dto.start_date);
      endDate = new Date(dto.end_date);
    } else {
      throw new BadRequestException(
        'Provide either date, or both start_date and end_date.',
      );
    }

    if (startDate > endDate) {
      throw new BadRequestException(
        'start_date must be before or equal to end_date',
      );
    }

    const days: Array<{
      date: string;
      is_full: boolean;
      has_availability: boolean;
      total_services: number;
      full_services: number;
      services_with_availability: number;
      total_slots: number;
      available_slots: number;
      unavailable_slots: number;
      venues: Array<{
        service_id: number;
        venue_name: string;
        price: number;
        venue_capacity: number;
        slot_duration_minutes: number;
        slots: Array<{
          start_time: string;
          end_time: string;
          available_units: number;
          is_available: boolean;
          price: number;
          venue_name: string;
          unavailable_reason?: string | null;
          unavailable_source?: string | null;
          email?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          initial?: string | null;
        }>;
      }>;
    }> = [];

    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      const date = cursor.toISOString().split('T')[0];
      const venues = await this.buildVenueSlotsForDate(date, venueServices);
      const totalServices = venueServices.length;
      const servicesWithAvailability = venues.filter((venue) =>
        venue.slots.some((slot) => slot.is_available),
      ).length;
      const fullServices = totalServices - servicesWithAvailability;
      const totalSlots = venues.reduce(
        (sum, venue) => sum + venue.slots.length,
        0,
      );
      const availableSlots = venues.reduce(
        (sum, venue) =>
          sum + venue.slots.filter((slot) => slot.is_available).length,
        0,
      );
      const unavailableSlots = totalSlots - availableSlots;
      const hasAvailability = servicesWithAvailability > 0;
      const isFull = totalServices > 0 && servicesWithAvailability === 0;

      days.push({
        date,
        is_full: isFull,
        has_availability: hasAvailability,
        total_services: totalServices,
        full_services: fullServices,
        services_with_availability: servicesWithAvailability,
        total_slots: totalSlots,
        available_slots: availableSlots,
        unavailable_slots: unavailableSlots,
        venues,
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    return {
      total_venue_services: venueServices.length,
      date: dto.date,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      days,
    };
  }

  private async getAllActiveVenueServices(
    serviceId?: number,
    sellerId?: number | null,
  ): Promise<
    Array<{
      id: number;
      seller_id: number;
      title?: string;
      name?: string;
      base_price?: number | null;
      hourly_rate?: number | null;
      venue_capacity?: number | null;
      slot_duration_minutes?: number | null;
    }>
  > {
    const pageSize = 100;
    let skip = 0;
    const all: Array<{
      id: number;
      seller_id: number;
      title?: string;
      name?: string;
      base_price?: number | null;
      hourly_rate?: number | null;
      venue_capacity?: number | null;
      slot_duration_minutes?: number | null;
    }> = [];

    while (true) {
      const { data, totalCount } = await this.servicesService.findAll({
        service_type: ServiceTypeEnum.VENUE,
        status: ServiceStatusEnum.ACTIVE,
        ...(sellerId ? { seller_id: sellerId } : {}),
        skip,
        take: pageSize,
      });

      all.push(
        ...data.map((service) => ({
          id: service.id,
          seller_id: service.seller_id,
          title: service.title,
          name: (service as any).name,
          base_price: service.base_price,
          hourly_rate: service.hourly_rate,
          venue_capacity: service.venue_capacity,
          slot_duration_minutes: service.slot_duration_minutes,
        })),
      );
      skip += data.length;

      if (skip >= totalCount || data.length === 0) {
        break;
      }
    }

    if (!serviceId) {
      return all;
    }

    return all.filter((service) => service.id === serviceId);
  }

  private normalizePublicVenueLocation(
    location?: string | null,
  ): string | null {
    const normalized = String(location || '')
      .trim()
      .toLowerCase();

    return normalized || null;
  }

  private async resolveSellerIdForPublicVenueLocation(
    normalizedLocation: string | null,
  ): Promise<number | null> {
    if (!normalizedLocation) {
      return null;
    }

    const edistrict = await this.edistrictRepository.findOne({
      where: {
        key: normalizedLocation,
        status: 'active',
        deleted_at: IsNull(),
      },
      select: ['id', 'seller_id'],
    });

    if (!edistrict) {
      const independentSellerId =
        await this.pickleballLocationsService.resolveSellerIdForVisibleLocationKey(
          normalizedLocation,
        );

      if (independentSellerId !== null) {
        return independentSellerId;
      }

      const anyEdistrict = await this.edistrictRepository.findOne({
        where: { key: normalizedLocation, deleted_at: IsNull() },
        select: ['id', 'status'],
      });

      const anyIndependentLocation =
        await this.pickleballLocationsService.findAnyIndependentLocationByKey(
          normalizedLocation,
        );

      if (!anyEdistrict && !anyIndependentLocation) {
        throw new BadRequestException(
          `Invalid location: "${normalizedLocation}" is not a recognized location.`,
        );
      }

      if (anyEdistrict?.status === 'coming_soon') {
        throw new BadRequestException(
          `This location is coming soon and not yet available for bookings.`,
        );
      }

      throw new BadRequestException(
        `Location "${normalizedLocation}" is currently unavailable.`,
      );
    }

    return edistrict.seller_id ?? null;
  }

  private normalizeDateOnly(value: string, fieldLabel: string): string {
    const raw = String(value || '').trim();
    const normalized = raw.includes('T') ? raw.slice(0, 10) : raw;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      throw new BadRequestException(
        `${fieldLabel} must be in YYYY-MM-DD format.`,
      );
    }

    // Parse as UTC date-only to avoid timezone shifting (e.g. GMT+8 midnight
    // becoming previous day in ISO string checks).
    const parsed = new Date(`${normalized}T00:00:00.000Z`);
    const valid =
      Number.isFinite(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === normalized;

    if (!valid) {
      throw new BadRequestException(`${fieldLabel} is invalid.`);
    }

    return normalized;
  }

  private toLocalDateOnly(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private resolveOpenPlayListDateRange(
    dateFromRaw?: string | null,
    dateToRaw?: string | null,
  ): {
    dateFrom: string;
    dateTo: string;
  } {
    const today = this.toLocalDateOnly(new Date());
    const dateFrom = dateFromRaw
      ? this.normalizeDateOnly(dateFromRaw, 'date_from')
      : today;

    const defaultDateToValue = new Date(`${dateFrom}T00:00:00`);
    defaultDateToValue.setDate(defaultDateToValue.getDate() + 30);
    const defaultDateTo = this.toLocalDateOnly(defaultDateToValue);
    const dateTo = dateToRaw
      ? this.normalizeDateOnly(dateToRaw, 'date_to')
      : defaultDateTo;

    if (dateFrom > dateTo) {
      throw new BadRequestException(
        'date_from must be before or equal to date_to.',
      );
    }

    return {
      dateFrom,
      dateTo,
    };
  }

  private normalizeOpenPlayTimeRange(
    startTime: string,
    endTime: string,
  ): {
    start_time: string;
    end_time: string;
  } {
    const normalizedStart = this.normalizeTimeToSeconds(startTime);
    const normalizedEnd = this.normalizeTimeToSeconds(endTime);

    if (
      this.timeToMinutes(normalizedStart) >= this.timeToMinutes(normalizedEnd)
    ) {
      throw new BadRequestException('start_time must be before end_time.');
    }

    return {
      start_time: normalizedStart,
      end_time: normalizedEnd,
    };
  }

  private resolveOpenPlayRegistrationWindow(input: {
    registration_start_at?: string | null;
    registration_end_at?: string | null;
  }): {
    registrationStartAt: Date | null;
    registrationEndAt: Date | null;
  } {
    const registrationStartAt = input.registration_start_at
      ? new Date(input.registration_start_at)
      : null;
    const registrationEndAt = input.registration_end_at
      ? new Date(input.registration_end_at)
      : null;

    if (
      registrationStartAt &&
      !Number.isFinite(registrationStartAt.getTime())
    ) {
      throw new BadRequestException('registration_start_at is invalid.');
    }
    if (registrationEndAt && !Number.isFinite(registrationEndAt.getTime())) {
      throw new BadRequestException('registration_end_at is invalid.');
    }
    if (
      registrationStartAt &&
      registrationEndAt &&
      registrationStartAt > registrationEndAt
    ) {
      throw new BadRequestException(
        'registration_start_at must be earlier than registration_end_at.',
      );
    }

    return {
      registrationStartAt,
      registrationEndAt,
    };
  }

  private async resolveOpenPlayCoreFields(input: {
    title?: string;
    description?: string | null;
    status?: string;
    rate_per_person: number;
    max_applicants: number;
    skill_level_code?: string;
  }): Promise<{
    title: string;
    description: string | null;
    status: string;
    ratePerPerson: number;
    maxApplicants: number;
    skillLevelCode: string;
  }> {
    const title = String(input.title || 'Open Play').trim() || 'Open Play';
    const description = String(input.description || '').trim() || null;
    const status = String(input.status || 'Published').trim() || 'Published';
    const ratePerPerson = Number(input.rate_per_person ?? 0);
    const maxApplicants = Number(input.max_applicants ?? 1);
    const skillLevelCode = await this.resolveOpenPlaySkillLevelCode(
      input.skill_level_code,
    );

    if (!Number.isFinite(ratePerPerson) || ratePerPerson < 0) {
      throw new BadRequestException('rate_per_person must be at least 0.');
    }

    if (!Number.isInteger(maxApplicants) || maxApplicants < 1) {
      throw new BadRequestException('max_applicants must be at least 1.');
    }

    return {
      title,
      description,
      status,
      ratePerPerson,
      maxApplicants,
      skillLevelCode,
    };
  }

  private enumerateDateRange(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    const cursor = new Date(`${startDate}T00:00:00`);
    const boundary = new Date(`${endDate}T00:00:00`);

    while (cursor <= boundary) {
      dates.push(this.toLocalDateOnly(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    return dates;
  }

  private expandRecurringOpenPlayDates(input: {
    rangeStartDate: string;
    rangeEndDate: string;
    recurrenceType: OpenPlayRecurrenceType;
    weeklyDays?: number[];
    monthlyDay?: number | null;
  }): string[] {
    const allDates = this.enumerateDateRange(
      input.rangeStartDate,
      input.rangeEndDate,
    );

    if (input.recurrenceType === 'daily') {
      return allDates;
    }

    if (input.recurrenceType === 'weekly') {
      const defaultWeekday = new Date(
        `${input.rangeStartDate}T00:00:00`,
      ).getDay();
      const selectedWeekdays =
        input.weeklyDays && input.weeklyDays.length > 0
          ? input.weeklyDays
          : [defaultWeekday];
      const weekdaySet = new Set(selectedWeekdays);

      return allDates.filter((date) =>
        weekdaySet.has(new Date(`${date}T00:00:00`).getDay()),
      );
    }

    const fallbackMonthlyDay = new Date(
      `${input.rangeStartDate}T00:00:00`,
    ).getDate();
    const targetMonthlyDay = Number(input.monthlyDay ?? fallbackMonthlyDay);

    return allDates.filter(
      (date) => new Date(`${date}T00:00:00`).getDate() === targetMonthlyDay,
    );
  }

  private async findOpenPlayWindowConflict(params: {
    sellerId: number;
    serviceId: number;
    eventDate: string;
    startTime: string;
    endTime: string;
  }): Promise<{ code: RecurringOpenPlayFailureCode; message: string } | null> {
    const overlappingBlockCount = await this.storeUnavailabilityRepository
      .createQueryBuilder('block')
      .where('block.deleted_at IS NULL')
      .andWhere(`LOWER(COALESCE(block.status, '')) = :activeStatus`, {
        activeStatus: 'active',
      })
      .andWhere('block.seller_id = :sellerId', { sellerId: params.sellerId })
      .andWhere('(block.service_id IS NULL OR block.service_id = :serviceId)', {
        serviceId: params.serviceId,
      })
      .andWhere('block.unavailable_date <= :eventDate::date', {
        eventDate: params.eventDate,
      })
      .andWhere(
        'COALESCE(block.end_date, block.unavailable_date) >= :eventDate::date',
        {
          eventDate: params.eventDate,
        },
      )
      .andWhere(
        `(
          (block.is_full_day = true)
          OR (
            block.is_full_day = false
            AND block.start_time IS NOT NULL
            AND block.end_time IS NOT NULL
            AND (
              (block.start_time <= :startTime::time AND block.end_time > :startTime::time)
              OR (block.start_time < :endTime::time AND block.end_time >= :endTime::time)
              OR (block.start_time >= :startTime::time AND block.end_time <= :endTime::time)
            )
          )
        )`,
        {
          startTime: params.startTime,
          endTime: params.endTime,
        },
      )
      .getCount();

    if (overlappingBlockCount > 0) {
      return {
        code: 'overlap_block',
        message:
          'Selected schedule is already blocked. Please refresh and try again.',
      };
    }

    const overlappingBookings =
      await this.bookingRepository.findOverlappingBookings({
        seller_id: params.sellerId,
        service_id: params.serviceId,
        date: params.eventDate,
        start_time: params.startTime,
        end_time: params.endTime,
        statuses: SLOT_OCCUPYING_BOOKING_STATUSES,
      });

    if (overlappingBookings.length > 0) {
      return {
        code: 'overlap_booking',
        message:
          'Selected schedule overlaps an existing booking and can no longer be blocked. Please refresh and try again.',
      };
    }

    return null;
  }

  private async createOpenPlayEventWithLinkedBlock(input: {
    sellerId: number;
    serviceId: number;
    eventDate: string;
    startTime: string;
    endTime: string;
    title: string;
    description: string | null;
    ratePerPerson: number;
    maxApplicants: number;
    skillLevelCode: string;
    status: string;
    registrationStartAt: Date | null;
    registrationEndAt: Date | null;
    user: User;
  }): Promise<OpenPlayEventEntity> {
    return this.openPlayEventRepository.manager.transaction(async (manager) => {
      const eventRepository = manager.getRepository(OpenPlayEventEntity);
      const storeUnavailabilityRepository = manager.getRepository(
        StoreUnavailabilityEntity,
      );

      const createdEvent = await eventRepository.save(
        eventRepository.create({
          seller_id: input.sellerId,
          service_id: input.serviceId,
          event_date: input.eventDate,
          start_time: input.startTime,
          end_time: input.endTime,
          title: input.title,
          description: input.description,
          rate_per_person: input.ratePerPerson,
          max_applicants: input.maxApplicants,
          skill_level_code: input.skillLevelCode,
          status: input.status,
          registration_start_at: input.registrationStartAt,
          registration_end_at: input.registrationEndAt,
          store_unavailability_id: null,
          created_by: input.user as any,
          updated_by: input.user as any,
        }),
      );

      const blockedSlot = await storeUnavailabilityRepository.save(
        storeUnavailabilityRepository.create({
          seller_id: input.sellerId,
          service_id: input.serviceId,
          unavailable_date: input.eventDate,
          start_time: input.startTime,
          end_time: input.endTime,
          is_full_day: false,
          reason: input.title,
          block_type: 'open_play',
          open_play_event_id: createdEvent.id,
          status: 'Active',
          created_by: input.user as any,
          updated_by: input.user as any,
        }),
      );

      await eventRepository.update(createdEvent.id, {
        store_unavailability_id: blockedSlot.id,
        updated_by: input.user as any,
        updated_at: new Date(),
      } as any);

      const eventWithRelations = await eventRepository.findOne({
        where: {
          id: createdEvent.id,
        },
        relations: ['service'],
      });

      if (!eventWithRelations) {
        throw new NotFoundException('Open play event was not created.');
      }

      return eventWithRelations;
    });
  }

  private normalizeAvailabilityBlockType(
    blockType?: string | null,
  ): 'maintenance' | 'open_play' | null {
    const normalized = String(blockType || '')
      .trim()
      .toLowerCase();
    if (normalized === 'open_play') {
      return 'open_play';
    }
    if (normalized === 'maintenance') {
      return 'maintenance';
    }
    return null;
  }

  private publishBookingCreatedAvailabilityEvent(input: {
    seller_id: number;
    service_id: number;
    date: string;
    start_time: string;
    end_time: string;
    source: string;
    open_play_event_id?: number | null;
    block_type?: string | null;
  }): void {
    this.availabilityRealtimeService.publishAvailabilityChanged({
      change_type:
        typeof input.open_play_event_id === 'number'
          ? 'open_play_registered'
          : 'booking_created',
      seller_id: input.seller_id,
      service_id: input.service_id,
      date: input.date,
      start_time: this.normalizeTimeToSeconds(input.start_time),
      end_time: this.normalizeTimeToSeconds(input.end_time),
      block_type: this.normalizeAvailabilityBlockType(input.block_type),
      open_play_event_id:
        typeof input.open_play_event_id === 'number'
          ? input.open_play_event_id
          : null,
      source: input.source,
    });
  }

  private publishBookingCancelledAvailabilityEvents(
    bookings: BookingEntity[],
    source: string,
  ): void {
    bookings.forEach((booking) => {
      const scheduledDate =
        booking.scheduled_date instanceof Date
          ? booking.scheduled_date.toISOString().slice(0, 10)
          : String(booking.scheduled_date || '').slice(0, 10);

      this.availabilityRealtimeService.publishAvailabilityChanged({
        change_type: 'booking_cancelled',
        seller_id: booking.seller_id,
        service_id: booking.service_id,
        date: scheduledDate,
        start_time: booking.scheduled_start_time ?? null,
        end_time: booking.scheduled_end_time ?? null,
        block_type: this.normalizeAvailabilityBlockType(
          booking.open_play_event_id ? 'open_play' : null,
        ),
        open_play_event_id: booking.open_play_event_id ?? null,
        source,
      });
    });
  }

  private validateVenueBookingBatchSelections<
    T extends {
      service_id: number;
      scheduled_date: string;
      scheduled_start_time: string;
      scheduled_end_time: string;
    },
  >(bookings: T[]): void {
    const uniqueSlotKeys = new Set<string>();
    const groupedSelections = new Map<
      string,
      Array<{ start_time: string; end_time: string }>
    >();

    bookings.forEach((booking, index) => {
      const scheduledDate = this.normalizeDateOnly(
        booking.scheduled_date,
        `bookings[${index}].scheduled_date`,
      );
      const timeRange = this.normalizeOpenPlayTimeRange(
        booking.scheduled_start_time,
        booking.scheduled_end_time,
      );
      const slotKey = [
        booking.service_id,
        scheduledDate,
        timeRange.start_time,
        timeRange.end_time,
      ].join('|');
      const groupKey = `${booking.service_id}|${scheduledDate}`;
      if (uniqueSlotKeys.has(slotKey)) {
        throw new BadRequestException(
          'Duplicate slot selections are not allowed in one booking request.',
        );
      }
      uniqueSlotKeys.add(slotKey);

      const currentGroup = groupedSelections.get(groupKey) ?? [];
      currentGroup.push(timeRange);
      groupedSelections.set(groupKey, currentGroup);
    });

    groupedSelections.forEach((group) => {
      const orderedGroup = [...group].sort((left, right) =>
        left.start_time.localeCompare(right.start_time),
      );

      for (let index = 1; index < orderedGroup.length; index++) {
        const previous = orderedGroup[index - 1];
        const current = orderedGroup[index];
        if (
          this.timeToMinutes(current.start_time) <
          this.timeToMinutes(previous.end_time)
        ) {
          throw new BadRequestException(
            'Overlapping slot selections for the same court are not allowed in one booking request.',
          );
        }
      }
    });
  }

  private buildGuestSelectedSlot(input: {
    booking_number?: string | null;
    service_id?: number | null;
    venue_name?: string | null;
    scheduled_date: string;
    scheduled_start_time: string;
    scheduled_end_time: string;
  }): GuestBookingSelectedSlotDto {
    const slot = new GuestBookingSelectedSlotDto();
    slot.booking_number = input.booking_number ?? null;
    slot.service_id = input.service_id ?? null;
    slot.venue_name = input.venue_name ?? null;
    slot.scheduled_date = input.scheduled_date;
    slot.scheduled_start_time =
      normalizeTimeForPresentation(input.scheduled_start_time) ??
      input.scheduled_start_time;
    slot.scheduled_end_time =
      normalizeTimeForPresentation(input.scheduled_end_time) ??
      input.scheduled_end_time;
    return slot;
  }

  private buildGuestPaymentPageSlot(booking: {
    booking_number?: string | null;
    service_id?: number | null;
    scheduled_date?: Date | string | null;
    scheduled_start_time?: string | null;
    scheduled_end_time?: string | null;
    service?: {
      title?: string | null;
      name?: string | null;
      slot_duration_minutes?: number | null;
    } | null;
  }): GuestBookingPaymentSlotDto {
    const rawScheduledStartTime = String(booking.scheduled_start_time || '');
    const rawScheduledEndTime = String(
      booking.scheduled_end_time || booking.scheduled_start_time || '',
    );

    const slot = new GuestBookingPaymentSlotDto();
    slot.booking_number = String(booking.booking_number || '').trim();
    slot.service_id =
      typeof booking.service_id === 'number' ? booking.service_id : null;
    slot.venue_name = booking.service?.title || null;
    slot.scheduled_date =
      booking.scheduled_date instanceof Date
        ? booking.scheduled_date.toISOString().slice(0, 10)
        : String(booking.scheduled_date || '').slice(0, 10);
    slot.scheduled_start_time =
      normalizeTimeForPresentation(rawScheduledStartTime) ||
      rawScheduledStartTime;
    slot.scheduled_end_time =
      normalizeTimeForPresentation(rawScheduledEndTime) ||
      (rawScheduledEndTime ? rawScheduledEndTime : null);
    slot.slot_count = this.computeSlotCountForNotification(
      rawScheduledStartTime,
      rawScheduledEndTime,
      this.resolveSlotDurationForNotification(
        booking.service?.slot_duration_minutes,
      ),
    );
    return slot;
  }

  private async cleanupFailedGuestBatchRecords(
    records: Array<{ booking_id: number; order_id: number }>,
    reason: string,
  ): Promise<void> {
    if (!records.length) {
      return;
    }

    const bookingIds = [...new Set(records.map((record) => record.booking_id))];
    const orderIds = [...new Set(records.map((record) => record.order_id))];
    const now = new Date();
    const bookingsToCancel =
      bookingIds.length > 0
        ? await this.bookingEntityRepository.find({
            where: {
              id: In(bookingIds),
              status: In([
                BookingStatusEnum.PENDING,
                BookingStatusEnum.AWAITING_CONFIRMATION,
              ]),
            },
          })
        : [];

    if (bookingIds.length > 0) {
      await this.bookingEntityRepository
        .createQueryBuilder()
        .update(BookingEntity)
        .set({
          status: BookingStatusEnum.CANCELLED,
          cancelled_at: now,
          cancelled_by: null,
          cancellation_reason: reason,
          updated_at: now,
        } as any)
        .where('id IN (:...bookingIds)', { bookingIds })
        .andWhere('status IN (:...statuses)', {
          statuses: [
            BookingStatusEnum.PENDING,
            BookingStatusEnum.AWAITING_CONFIRMATION,
          ],
        })
        .execute();
    }

    if (orderIds.length > 0) {
      await this.salesOrderRepository
        .createQueryBuilder()
        .update(SalesOrderEntity)
        .set({
          status: OrderStatusEnum.CANCELLED,
          payment_status: PaymentStatusEnum.FAILED,
          cancellation_reason: reason,
          cancelled_at: now,
          status_notes: reason,
          updated_at: now,
        } as any)
        .where('id IN (:...orderIds)', { orderIds })
        .andWhere('status IN (:...statuses)', {
          statuses: MUTABLE_ORDER_STATUSES,
        })
        .execute();
    }

    if (bookingsToCancel.length > 0) {
      this.publishBookingCancelledAvailabilityEvents(
        bookingsToCancel,
        'guest_booking_batch_cleanup',
      );
    }
  }

  async createOpenPlayEvent(dto: CreateOpenPlayEventDto, user: User) {
    const service = await this.servicesService.findById(dto.service_id);

    if (service.status !== ServiceStatusEnum.ACTIVE) {
      throw new NotFoundException('Service not found.');
    }

    if (service.service_type !== ServiceTypeEnum.VENUE) {
      throw new BadRequestException(
        'Open play events can only be created for venue services.',
      );
    }

    const sellerScopeId = await this.resolveSellerScope(user);
    if (sellerScopeId && service.seller_id !== sellerScopeId) {
      throw new ForbiddenException(
        'Access denied. This venue belongs to a different seller.',
      );
    }

    const eventDate = this.normalizeDateOnly(dto.event_date, 'event_date');
    const normalizedTimeRange = this.normalizeOpenPlayTimeRange(
      dto.start_time,
      dto.end_time,
    );
    this.ensureMinimumLeadTime(
      eventDate,
      normalizedTimeRange.start_time,
      'Open play event',
    );
    const { registrationStartAt, registrationEndAt } =
      this.resolveOpenPlayRegistrationWindow({
        registration_start_at: dto.registration_start_at,
        registration_end_at: dto.registration_end_at,
      });
    const {
      title,
      description,
      status,
      ratePerPerson,
      maxApplicants,
      skillLevelCode,
    } = await this.resolveOpenPlayCoreFields({
      title: dto.title,
      description: dto.description,
      status: dto.status,
      rate_per_person: dto.rate_per_person,
      max_applicants: dto.max_applicants,
      skill_level_code: dto.skill_level_code,
    });

    const conflict = await this.findOpenPlayWindowConflict({
      sellerId: service.seller_id,
      serviceId: service.id,
      eventDate,
      startTime: normalizedTimeRange.start_time,
      endTime: normalizedTimeRange.end_time,
    });
    if (conflict) {
      throw new BadRequestException(conflict.message);
    }

    const createdEvent = await this.createOpenPlayEventWithLinkedBlock({
      sellerId: service.seller_id,
      serviceId: service.id,
      eventDate,
      startTime: normalizedTimeRange.start_time,
      endTime: normalizedTimeRange.end_time,
      title,
      description,
      ratePerPerson,
      maxApplicants,
      skillLevelCode,
      status,
      registrationStartAt,
      registrationEndAt,
      user,
    });

    this.availabilityRealtimeService.publishAvailabilityChanged({
      change_type: 'open_play_blocked',
      seller_id: createdEvent.seller_id,
      service_id: createdEvent.service_id,
      date: createdEvent.event_date,
      start_time: this.normalizeTimeToSeconds(createdEvent.start_time),
      end_time: this.normalizeTimeToSeconds(createdEvent.end_time),
      block_type: 'open_play',
      open_play_event_id: createdEvent.id,
      source: 'open_play_event',
    });

    return this.mapOpenPlayEventResponse(createdEvent, 0);
  }

  async createRecurringOpenPlayEvents(
    dto: CreateRecurringOpenPlayEventsDto,
    user: User,
  ): Promise<{
    summary: {
      generated: number;
      created: number;
      failed: number;
    };
    created: RecurringOpenPlayCreatedItem[];
    failed: RecurringOpenPlayFailedItem[];
  }> {
    const service = await this.servicesService.findById(dto.service_id);

    if (service.status !== ServiceStatusEnum.ACTIVE) {
      throw new NotFoundException('Service not found.');
    }

    if (service.service_type !== ServiceTypeEnum.VENUE) {
      throw new BadRequestException(
        'Open play events can only be created for venue services.',
      );
    }

    const sellerScopeId = await this.resolveSellerScope(user);
    if (sellerScopeId && service.seller_id !== sellerScopeId) {
      throw new ForbiddenException(
        'Access denied. This venue belongs to a different seller.',
      );
    }

    const rangeStartDate = this.normalizeDateOnly(
      dto.range_start_date,
      'range_start_date',
    );
    const rangeEndDate = this.normalizeDateOnly(
      dto.range_end_date,
      'range_end_date',
    );
    if (rangeStartDate > rangeEndDate) {
      throw new BadRequestException(
        'range_start_date must be before or equal to range_end_date.',
      );
    }

    const recurrenceType = String(dto.recurrence_type || '')
      .trim()
      .toLowerCase() as OpenPlayRecurrenceType;
    if (!['daily', 'weekly', 'monthly'].includes(recurrenceType)) {
      throw new BadRequestException(
        'recurrence_type must be daily, weekly, or monthly.',
      );
    }

    const normalizedTimeRange = this.normalizeOpenPlayTimeRange(
      dto.start_time,
      dto.end_time,
    );
    const { registrationStartAt, registrationEndAt } =
      this.resolveOpenPlayRegistrationWindow({
        registration_start_at: dto.registration_start_at,
        registration_end_at: dto.registration_end_at,
      });
    const {
      title,
      description,
      status,
      ratePerPerson,
      maxApplicants,
      skillLevelCode,
    } = await this.resolveOpenPlayCoreFields({
      title: dto.title,
      description: dto.description,
      status: dto.status,
      rate_per_person: dto.rate_per_person,
      max_applicants: dto.max_applicants,
      skill_level_code: dto.skill_level_code,
    });

    const startDateObject = new Date(`${rangeStartDate}T00:00:00`);
    const defaultWeekday = startDateObject.getDay();
    const requestedWeekdays = Array.from(
      new Set(
        (dto.weekly_days && dto.weekly_days.length > 0
          ? dto.weekly_days
          : [defaultWeekday]
        )
          .map((value) => Number(value))
          .filter(
            (value) => Number.isInteger(value) && value >= 0 && value <= 6,
          ),
      ),
    );
    if (recurrenceType === 'weekly' && requestedWeekdays.length === 0) {
      throw new BadRequestException(
        'weekly_days must include at least one value between 0 and 6 for weekly recurrence.',
      );
    }

    const defaultMonthlyDay = startDateObject.getDate();
    const requestedMonthlyDay = Number(dto.monthly_day ?? defaultMonthlyDay);
    if (
      recurrenceType === 'monthly' &&
      (!Number.isInteger(requestedMonthlyDay) ||
        requestedMonthlyDay < 1 ||
        requestedMonthlyDay > 31)
    ) {
      throw new BadRequestException(
        'monthly_day must be between 1 and 31 for monthly recurrence.',
      );
    }

    const occurrenceDates = this.expandRecurringOpenPlayDates({
      rangeStartDate,
      rangeEndDate,
      recurrenceType,
      weeklyDays: requestedWeekdays,
      monthlyDay: requestedMonthlyDay,
    });

    if (occurrenceDates.length === 0) {
      throw new BadRequestException(
        'No recurrence dates were generated. Please adjust the date range and recurrence settings.',
      );
    }

    if (occurrenceDates.length > MAX_RECURRING_OPEN_PLAY_OCCURRENCES) {
      throw new BadRequestException(
        `Recurrence generated ${occurrenceDates.length} dates, exceeding the maximum of ${MAX_RECURRING_OPEN_PLAY_OCCURRENCES}.`,
      );
    }

    const created: RecurringOpenPlayCreatedItem[] = [];
    const failed: RecurringOpenPlayFailedItem[] = [];

    for (const eventDate of occurrenceDates) {
      try {
        this.ensureMinimumLeadTime(
          eventDate,
          normalizedTimeRange.start_time,
          'Open play event',
        );
      } catch (error) {
        failed.push({
          event_date: eventDate,
          start_time: normalizedTimeRange.start_time,
          end_time: normalizedTimeRange.end_time,
          code: 'lead_time',
          message:
            error instanceof Error
              ? error.message
              : 'Open play event must be scheduled at least 1 hour in advance.',
        });
        continue;
      }

      const conflict = await this.findOpenPlayWindowConflict({
        sellerId: service.seller_id,
        serviceId: service.id,
        eventDate,
        startTime: normalizedTimeRange.start_time,
        endTime: normalizedTimeRange.end_time,
      });
      if (conflict) {
        failed.push({
          event_date: eventDate,
          start_time: normalizedTimeRange.start_time,
          end_time: normalizedTimeRange.end_time,
          code: conflict.code,
          message: conflict.message,
        });
        continue;
      }

      try {
        const createdEvent = await this.createOpenPlayEventWithLinkedBlock({
          sellerId: service.seller_id,
          serviceId: service.id,
          eventDate,
          startTime: normalizedTimeRange.start_time,
          endTime: normalizedTimeRange.end_time,
          title,
          description,
          ratePerPerson,
          maxApplicants,
          skillLevelCode,
          status,
          registrationStartAt,
          registrationEndAt,
          user,
        });

        created.push({
          event_id: createdEvent.id,
          store_unavailability_id: createdEvent.store_unavailability_id,
          event_date: createdEvent.event_date,
          start_time: this.normalizeTimeToSeconds(createdEvent.start_time),
          end_time: this.normalizeTimeToSeconds(createdEvent.end_time),
        });

        this.availabilityRealtimeService.publishAvailabilityChanged({
          change_type: 'open_play_blocked',
          seller_id: createdEvent.seller_id,
          service_id: createdEvent.service_id,
          date: createdEvent.event_date,
          start_time: this.normalizeTimeToSeconds(createdEvent.start_time),
          end_time: this.normalizeTimeToSeconds(createdEvent.end_time),
          block_type: 'open_play',
          open_play_event_id: createdEvent.id,
          source: 'open_play_event_recurring',
        });
      } catch (error) {
        failed.push({
          event_date: eventDate,
          start_time: normalizedTimeRange.start_time,
          end_time: normalizedTimeRange.end_time,
          code: 'create_failed',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to create recurring open play occurrence.',
        });
      }
    }

    return {
      summary: {
        generated: occurrenceDates.length,
        created: created.length,
        failed: failed.length,
      },
      created,
      failed,
    };
  }

  async getSellerOpenPlayEvents(
    query: QueryOpenPlayEventsDto,
    user: User,
  ): Promise<{
    data: any[];
    totalCount: number;
    skip: number;
    take: number;
  }> {
    const sellerScopeId = await this.resolveSellerScope(user);
    const skillLevelCode = await this.resolveOptionalOpenPlaySkillLevelCode(
      query.skill_level_code,
    );
    const skip = Number(query.skip ?? 0);
    const take = Number(query.take ?? 20);
    const normalizedSkip = Number.isFinite(skip) && skip >= 0 ? skip : 0;
    const normalizedTake =
      Number.isFinite(take) && take >= 1 ? Math.min(take, 200) : 20;

    const qb = this.openPlayEventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.service', 'service')
      .where('event.deleted_at IS NULL');

    if (sellerScopeId) {
      qb.andWhere('event.seller_id = :sellerId', { sellerId: sellerScopeId });
    } else if (query.seller_id) {
      qb.andWhere('event.seller_id = :sellerId', { sellerId: query.seller_id });
    }

    if (query.service_id) {
      qb.andWhere('event.service_id = :serviceId', {
        serviceId: query.service_id,
      });
    }

    if (query.event_date) {
      qb.andWhere('event.event_date = :eventDate', {
        eventDate: this.normalizeDateOnly(query.event_date, 'event_date'),
      });
    }

    if (query.status && query.status.trim()) {
      qb.andWhere('LOWER(event.status) = :status', {
        status: query.status.trim().toLowerCase(),
      });
    }

    if (skillLevelCode) {
      qb.andWhere('event.skill_level_code = :skillLevelCode', {
        skillLevelCode,
      });
    }

    qb.orderBy('event.event_date', 'ASC')
      .addOrderBy('event.start_time', 'ASC')
      .addOrderBy('event.id', 'ASC')
      .skip(normalizedSkip)
      .take(normalizedTake);

    const [events, totalCount] = await qb.getManyAndCount();
    const counts = await this.getOpenPlayRegisteredCounts(
      events.map((event) => event.id),
    );

    return {
      data: events.map((event) =>
        this.mapOpenPlayEventResponse(event, counts.get(event.id) ?? 0),
      ),
      totalCount,
      skip: normalizedSkip,
      take: normalizedTake,
    };
  }

  async cancelOpenPlayEvent(eventId: number, user: User) {
    const event = await this.openPlayEventRepository.findOne({
      where: {
        id: eventId,
        deleted_at: IsNull(),
      },
      relations: ['service'],
    });

    if (!event) {
      throw new NotFoundException('Open play event not found.');
    }

    const sellerScopeId = await this.resolveSellerScope(user);
    if (sellerScopeId && event.seller_id !== sellerScopeId) {
      throw new ForbiddenException(
        'Access denied. This open play event belongs to a different seller.',
      );
    }

    if (String(event.status).trim().toLowerCase() === 'cancelled') {
      const currentCounts = await this.getOpenPlayRegisteredCounts([event.id]);
      return this.mapOpenPlayEventResponse(
        event,
        currentCounts.get(event.id) ?? 0,
      );
    }

    await this.openPlayEventRepository.update(event.id, {
      status: 'Cancelled',
      updated_by: user as any,
      updated_at: new Date(),
    } as any);

    if (event.store_unavailability_id) {
      await this.storeUnavailabilityRepository.update(
        event.store_unavailability_id,
        {
          status: 'Inactive',
          updated_by: user as any,
          updated_at: new Date(),
        } as any,
      );
    } else {
      await this.storeUnavailabilityRepository
        .createQueryBuilder()
        .update(StoreUnavailabilityEntity)
        .set({
          status: 'Inactive',
          updated_by: user as any,
          updated_at: new Date(),
        } as any)
        .where('open_play_event_id = :eventId', { eventId: event.id })
        .execute();
    }

    const updatedEvent = await this.openPlayEventRepository.findOne({
      where: {
        id: event.id,
      },
      relations: ['service'],
    });

    if (!updatedEvent) {
      throw new NotFoundException('Open play event not found.');
    }

    const currentCounts = await this.getOpenPlayRegisteredCounts([
      updatedEvent.id,
    ]);

    this.availabilityRealtimeService.publishAvailabilityChanged({
      change_type: 'open_play_cancelled',
      seller_id: updatedEvent.seller_id,
      service_id: updatedEvent.service_id,
      date: updatedEvent.event_date,
      start_time: this.normalizeTimeToSeconds(updatedEvent.start_time),
      end_time: this.normalizeTimeToSeconds(updatedEvent.end_time),
      block_type: 'open_play',
      open_play_event_id: updatedEvent.id,
      source: 'open_play_event_cancel',
    });

    return this.mapOpenPlayEventResponse(
      updatedEvent,
      currentCounts.get(updatedEvent.id) ?? 0,
    );
  }

  async getOpenPlayEventById(eventId: number, user: User) {
    const event = await this.openPlayEventRepository.findOne({
      where: {
        id: eventId,
        deleted_at: IsNull(),
      },
      relations: ['service'],
    });

    if (!event) {
      throw new NotFoundException('Open play event not found.');
    }

    const sellerScopeId = await this.resolveSellerScope(user);
    if (sellerScopeId && event.seller_id !== sellerScopeId) {
      throw new ForbiddenException(
        'Access denied. This open play event belongs to a different seller.',
      );
    }

    const currentCounts = await this.getOpenPlayRegisteredCounts([event.id]);
    return this.mapOpenPlayEventResponse(
      event,
      currentCounts.get(event.id) ?? 0,
    );
  }

  async updateOpenPlayEvent(
    eventId: number,
    dto: UpdateOpenPlayEventDto,
    user: User,
  ) {
    const event = await this.openPlayEventRepository.findOne({
      where: {
        id: eventId,
        deleted_at: IsNull(),
      },
      relations: ['service'],
    });

    if (!event) {
      throw new NotFoundException('Open play event not found.');
    }

    const sellerScopeId = await this.resolveSellerScope(user);
    if (sellerScopeId && event.seller_id !== sellerScopeId) {
      throw new ForbiddenException(
        'Access denied. This open play event belongs to a different seller.',
      );
    }

    if (String(event.status).trim().toLowerCase() === 'cancelled') {
      throw new BadRequestException(
        'Cannot update a cancelled open play event.',
      );
    }

    const updatePayload: Record<string, unknown> = {};

    if (dto.title !== undefined) {
      const trimmedTitle = String(dto.title).trim();
      if (!trimmedTitle) {
        throw new BadRequestException('Title cannot be empty.');
      }
      updatePayload.title = trimmedTitle;
    }

    if (dto.rate_per_person !== undefined) {
      updatePayload.rate_per_person = dto.rate_per_person;
    }

    if (dto.max_applicants !== undefined) {
      const currentCounts = await this.getOpenPlayRegisteredCounts([event.id]);
      const registeredCount = currentCounts.get(event.id) ?? 0;
      if (dto.max_applicants < registeredCount) {
        throw new BadRequestException(
          `max_applicants cannot be lower than currently registered guests (${registeredCount}).`,
        );
      }
      updatePayload.max_applicants = dto.max_applicants;
    }

    if (dto.skill_level_code !== undefined) {
      const resolvedCode = await this.resolveOpenPlaySkillLevelCode(
        dto.skill_level_code,
      );
      updatePayload.skill_level_code = resolvedCode;
    }

    if (Object.keys(updatePayload).length === 0) {
      const currentCounts = await this.getOpenPlayRegisteredCounts([event.id]);
      return this.mapOpenPlayEventResponse(
        event,
        currentCounts.get(event.id) ?? 0,
      );
    }

    updatePayload.updated_by = user;
    updatePayload.updated_at = new Date();

    await this.openPlayEventRepository.update(event.id, updatePayload as any);

    if (updatePayload.title) {
      if (event.store_unavailability_id) {
        await this.storeUnavailabilityRepository.update(
          event.store_unavailability_id,
          {
            reason: updatePayload.title as string,
            updated_by: user as any,
            updated_at: new Date(),
          } as any,
        );
      } else {
        await this.storeUnavailabilityRepository
          .createQueryBuilder()
          .update(StoreUnavailabilityEntity)
          .set({
            reason: updatePayload.title as string,
            updated_by: user as any,
            updated_at: new Date(),
          } as any)
          .where('open_play_event_id = :eventId', { eventId: event.id })
          .execute();
      }
    }

    const updatedEvent = await this.openPlayEventRepository.findOne({
      where: { id: event.id },
      relations: ['service'],
    });

    if (!updatedEvent) {
      throw new NotFoundException('Open play event not found after update.');
    }

    const counts = await this.getOpenPlayRegisteredCounts([updatedEvent.id]);

    this.availabilityRealtimeService.publishAvailabilityChanged({
      change_type: 'open_play_updated',
      seller_id: updatedEvent.seller_id,
      service_id: updatedEvent.service_id,
      date: updatedEvent.event_date,
      start_time: this.normalizeTimeToSeconds(updatedEvent.start_time),
      end_time: this.normalizeTimeToSeconds(updatedEvent.end_time),
      block_type: 'open_play',
      open_play_event_id: updatedEvent.id,
      source: 'open_play_event_update',
    });

    return this.mapOpenPlayEventResponse(
      updatedEvent,
      counts.get(updatedEvent.id) ?? 0,
    );
  }

  async createGuestOpenPlayRegistration(
    openPlayEventId: number,
    dto: CreateGuestOpenPlayRegistrationDto,
  ): Promise<GuestBookingResponseDto> {
    const event = await this.openPlayEventRepository.findOne({
      where: {
        id: openPlayEventId,
        deleted_at: IsNull(),
      },
      relations: ['service'],
    });

    if (!event) {
      throw new NotFoundException('Open play event not found.');
    }

    const service =
      event.service || (await this.servicesService.findById(event.service_id));
    if (service.status !== ServiceStatusEnum.ACTIVE) {
      throw new NotFoundException('Service not found.');
    }
    if (service.service_type !== ServiceTypeEnum.VENUE) {
      throw new BadRequestException(
        'Open play registration is only available for venue services.',
      );
    }

    const roster = this.buildGuestRosterFromOpenPlayDto(dto);
    const requestedSlots = roster.length;
    const registrationCounts = await this.getOpenPlayRegisteredCounts([
      event.id,
    ]);
    const registeredCount = registrationCounts.get(event.id) ?? 0;
    const remainingSlots = Math.max(
      0,
      Number(event.max_applicants || 0) - registeredCount,
    );

    if (!this.isOpenPlayRegistrationOpen(event, remainingSlots)) {
      throw new BadRequestException(
        'Open play registration is closed for this event.',
      );
    }

    if (requestedSlots > remainingSlots) {
      throw new BadRequestException(
        `Only ${remainingSlots} slot(s) remaining for this open play event.`,
      );
    }

    const paymentMethod = this.resolveGuestPaymentMethod([
      {
        payment_method: dto.payment_method || 'gcash',
      } as CreateGuestVenueBookingDto,
    ]);

    const guestUser = await this.usersService.findOrCreateGuestUser({
      email: dto.email,
      first_name: dto.first_name,
      last_name: dto.last_name,
      phone: dto.phone,
    });

    const record = await this.createGuestOpenPlayBookingRecord({
      event,
      dto,
      guestUser,
      paymentMethod,
      roster,
    });

    const paymentMetadata = {
      guest_booking: true,
      open_play_registration: true,
      open_play_event_id: event.id,
      payment_method: paymentMethod,
      booking_id: record.booking_id,
      booking_number: record.booking_number,
      booking_group_number: record.booking_group_number,
      guest_email: dto.email,
      guest_count: roster.length,
      guest_names_summary: this.buildGuestNamesSummary(roster),
    };

    const payment = this.isManualGuestPaymentMethod(paymentMethod)
      ? await this.createGuestManualPayment({
          primaryOrderId: record.order_id,
          paymentMethod,
          amount: record.total_amount,
          metadata: paymentMetadata,
          user: guestUser,
        })
      : await this.checkoutPaymentsService.initiatePayment(
          {
            sales_order_id: record.order_id,
            payment_method_code: paymentMethod,
            amount: record.total_amount,
            currency_code: 'PHP',
            description: `Open play registration payment for ${record.booking_number}`,
            ip_address: dto.ip_address,
            metadata: paymentMetadata,
          },
          guestUser,
        );

    await this.paymentOrderRepository.insert({
      checkout_payment_id: payment.id,
      sales_order_id: record.order_id,
      is_primary: true,
    });

    await this.sendGuestPendingPaymentEmail({
      bookingId: record.booking_id,
      payment,
      salesOrderIds: [record.order_id],
      bookingType: 'open_play',
      guestEmail: dto.email,
    });
    await this.sendVenueBookingSubmittedMirrorNotifications(record.booking_id);

    const response = new GuestBookingResponseDto();
    response.booking_group_number = record.booking_group_number;
    response.booking_numbers = [record.booking_number];
    response.selected_slots = [
      this.buildGuestSelectedSlot({
        booking_number: record.booking_number,
        service_id: record.service_id,
        venue_name: record.venue_name,
        scheduled_date: record.scheduled_date,
        scheduled_start_time: record.scheduled_start_time,
        scheduled_end_time: record.scheduled_end_time,
      }),
    ];
    response.payment_url = this.isManualGuestPaymentMethod(paymentMethod)
      ? this.buildGuestPaymentPageUrl(record.booking_group_number, dto.email)
      : (payment.gateway_checkout_url ?? null);
    response.payment_expires_at = payment.expires_at
      ? payment.expires_at.toISOString()
      : null;
    response.amount = Number(payment.amount);
    response.currency = payment.currency?.code || 'PHP';
    response.payment_not_required = false;
    response.guest_count = roster.length;
    return response;
  }

  private async createGuestOpenPlayBookingRecord(params: {
    event: OpenPlayEventEntity;
    dto: CreateGuestOpenPlayRegistrationDto;
    guestUser: User;
    paymentMethod: GuestVenuePaymentMethod;
    roster: NormalizedGuestRosterEntry[];
  }): Promise<{
    booking_number: string;
    booking_group_number: string;
    booking_id: number;
    order_id: number;
    total_amount: number;
    service_id: number;
    venue_name: string | null;
    scheduled_date: string;
    scheduled_start_time: string;
    scheduled_end_time: string;
  }> {
    const { event, dto, guestUser, paymentMethod, roster } = params;
    const ratePerPerson = Number(event.rate_per_person || 0);
    const totalAmount = Number((ratePerPerson * roster.length).toFixed(2));
    const orderNumber = this.generateOrderNumber();

    const orderEntity = await this.salesOrderRepository.save(
      this.salesOrderRepository.create({
        user_id: guestUser.id,
        seller_id: event.seller_id,
        order_number: orderNumber,
        status: OrderStatusEnum.PENDING,
        notes: dto.notes ?? null,
        payment_method: paymentMethod,
        payment_status: PaymentStatusEnum.AWAITING_PAYMENT,
        checkout_source: 'guest_web',
        subtotal: totalAmount,
        tax_amount: 0,
        shipping_amount: 0,
        total_amount: totalAmount,
        created_by: { id: guestUser.id } as any,
        updated_by: { id: guestUser.id } as any,
      }),
    );

    const orderItemEntity = await this.salesOrderItemRepository.save(
      this.salesOrderItemRepository.create({
        order_id: orderEntity.id,
        item_type: CartItemTypeEnum.SERVICE,
        variant_id: null,
        service_id: event.service_id,
        package_id: null,
        scheduled_date: new Date(event.event_date),
        scheduled_start_time: event.start_time,
        service_address_id: null,
        special_requests: dto.notes ?? null,
        location_additional_fee: 0,
        quantity: roster.length,
        quantity_returned: 0,
        unit_price: ratePerPerson,
        total_price: totalAmount,
        source_quotation_id: null,
        source_quotation_item_id: null,
        created_by: { id: guestUser.id } as any,
        updated_by: { id: guestUser.id } as any,
      }),
    );

    const booking = await this.bookingsService.createFromSalesOrderItem({
      salesOrderId: orderEntity.id,
      salesOrderItemId: orderItemEntity.id,
      serviceId: event.service_id,
      sellerId: event.seller_id,
      packageId: null,
      scheduledDate: event.event_date,
      scheduledStartTime: event.start_time,
      scheduledEndTime: event.end_time,
      serviceAddressId: null,
      appointmentLocationType: null,
      subtotal: totalAmount,
      customerNotes: dto.notes ?? null,
      formSubmissionId: null,
      user: guestUser,
    });

    const bookingGroupNumber = booking.booking_number;

    try {
      await this.bookingRepository.update(booking.id, {
        booking_group_number: bookingGroupNumber,
        guest_email: dto.email,
        guest_payment_method: paymentMethod,
        guest_count: roster.length,
        open_play_event_id: event.id,
        updated_by: guestUser,
      } as any);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        String((error as any)?.message || '').includes(
          'CHK_bookings_guest_count',
        )
      ) {
        throw new BadRequestException(
          'Open play guest count exceeded the configured booking limit. Please contact support if this persists.',
        );
      }

      throw error;
    }

    await this.bookingGuestRepository.removeAllForBooking(booking.id);
    await this.bookingGuestRepository.createMany(
      roster.map((guest) => ({
        booking_id: booking.id,
        sort_order: guest.sort_order,
        is_primary_contact: guest.is_primary_contact,
        first_name: guest.first_name,
        last_name: guest.last_name,
        email: guest.email,
        phone: guest.phone,
        created_by: guestUser.id,
        updated_by: guestUser.id,
      })),
    );

    this.publishBookingCreatedAvailabilityEvent({
      seller_id: event.seller_id,
      service_id: event.service_id,
      date: event.event_date,
      start_time: event.start_time,
      end_time: event.end_time,
      source: 'guest_open_play_registration',
      open_play_event_id: event.id,
      block_type: 'open_play',
    });

    return {
      booking_number: booking.booking_number,
      booking_group_number: bookingGroupNumber,
      booking_id: booking.id,
      order_id: orderEntity.id,
      total_amount: totalAmount,
      service_id: event.service_id,
      venue_name: event.service?.title || null,
      scheduled_date: event.event_date,
      scheduled_start_time: event.start_time,
      scheduled_end_time: event.end_time,
    };
  }

  async createGuestBookings(
    dtos: CreateGuestVenueBookingDto[],
    voucherAssignments?: GuestVoucherAssignmentDto[],
  ): Promise<GuestBookingResponseDto> {
    if (!dtos.length) {
      throw new BadRequestException('At least one booking is required.');
    }

    const first = dtos[0];
    const normalizedEmail = first.email.trim().toLowerCase();
    const hasMixedEmail = dtos.some(
      (dto) => dto.email.trim().toLowerCase() !== normalizedEmail,
    );

    if (hasMixedEmail) {
      throw new BadRequestException(
        'All bookings in one payment must use the same guest email.',
      );
    }

    const firstRosterSignature = this.buildGuestRosterSignature(first);
    const hasMixedRoster = dtos.some(
      (dto) => this.buildGuestRosterSignature(dto) !== firstRosterSignature,
    );

    if (hasMixedRoster) {
      throw new BadRequestException(
        'All bookings in one payment must use the same guest roster.',
      );
    }

    this.validateVenueBookingBatchSelections(dtos);

    const paymentMethod = this.resolveGuestPaymentMethod(dtos);
    await this.assertManualPaymentMethodEnabled(paymentMethod);
    const roster = this.buildGuestRosterFromDto(first);

    const guestUser = await this.usersService.findOrCreateGuestUser({
      email: first.email,
      first_name: first.first_name,
      last_name: first.last_name,
      phone: first.phone,
    });
    const bookingGroupNumber =
      dtos.length > 1 ? await this.generateUniqueBookingGroupNumber() : null;

    const records: Array<{
      booking_number: string;
      booking_group_number: string;
      booking_id: number;
      order_id: number;
      total_amount: number;
      service_id: number;
      venue_name: string | null;
      scheduled_date: string;
      scheduled_start_time: string;
      scheduled_end_time: string;
    }> = [];

    let payment: CheckoutPayment | CheckoutPaymentEntity | null = null;
    try {
      // Process sequentially to keep slot-availability checks consistent per request.
      for (const dto of dtos) {
        const record = await this.createGuestBookingRecord(
          dto,
          guestUser,
          paymentMethod,
          bookingGroupNumber,
        );
        records.push(record);
      }

      const subtotal = records.reduce(
        (sum, record) => sum + record.total_amount,
        0,
      );
      let totalAmount = subtotal;
      let voucherDiscountAmount = 0;

      // Apply voucher assignments if provided
      if (voucherAssignments && voucherAssignments.length > 0) {
        // Group assignments by user_voucher_id to validate each user voucher once
        const assignmentsByUserVoucher = new Map<
          number,
          GuestVoucherAssignmentDto[]
        >();
        for (const assignment of voucherAssignments) {
          const key = assignment.user_voucher_id;
          const existing = assignmentsByUserVoucher.get(key) ?? [];
          existing.push(assignment);
          assignmentsByUserVoucher.set(key, existing);
        }

        const serviceIds = [...new Set(records.map((r) => r.service_id))];

        // Validate each unique user voucher and apply its assignments
        for (const [userVoucherId, assignments] of assignmentsByUserVoucher) {
          const voucherCode = assignments[0].voucher_code.trim().toUpperCase();

          // Look up user_voucher directly by ID (already validated at add-time)
          const userVoucher =
            await this.vouchersService.findUserVoucherById(userVoucherId);
          if (!userVoucher || !userVoucher.voucher) {
            throw new BadRequestException(`Voucher ${voucherCode} not found`);
          }
          if (userVoucher.status === 'used') {
            throw new BadRequestException(
              `Voucher ${voucherCode} has already been used`,
            );
          }

          const voucher = userVoucher.voucher;
          if (voucher.status !== 'active') {
            throw new BadRequestException(
              `Voucher ${voucherCode} is no longer active`,
            );
          }
          if (voucher.discount_type !== 'per_hours') {
            throw new BadRequestException(
              'Only per-hour vouchers are supported for venue bookings',
            );
          }

          // Get hourly rate from first eligible service
          const firstServiceId = serviceIds[0];
          const serviceForRate =
            await this.servicesService.findById(firstServiceId);
          const hourlyRate = serviceForRate?.hourly_rate
            ? Number(serviceForRate.hourly_rate)
            : 0;
          const discountValue = Number(voucher.discount_value);

          const totalAssignedHours = assignments.reduce(
            (sum, a) => sum + a.hours,
            0,
          );

          if (totalAssignedHours > discountValue) {
            throw new BadRequestException(
              `Voucher ${voucherCode} has ${discountValue} free hour(s) but ${totalAssignedHours} were assigned`,
            );
          }

          // Apply discount to each assigned booking
          for (const assignment of assignments) {
            if (
              assignment.booking_index < 0 ||
              assignment.booking_index >= records.length
            ) {
              throw new BadRequestException(
                `Invalid booking_index ${assignment.booking_index}`,
              );
            }
            const record = records[assignment.booking_index];
            const deduction =
              Math.round(hourlyRate * assignment.hours * 100) / 100;
            const capped = Math.min(deduction, record.total_amount);
            voucherDiscountAmount += capped;

            await this.salesOrderRepository.update(record.order_id, {
              total_amount: Math.max(
                0,
                Math.round((record.total_amount - capped) * 100) / 100,
              ),
            });

            // Create sales_order_vouchers record for this booking
            await this.salesOrderVoucherRepository.save(
              this.salesOrderVoucherRepository.create({
                sales_order_id: record.order_id,
                user_voucher_id: userVoucherId,
                voucher_code: voucherCode,
                voucher_discount: capped,
              }),
            );
          }

          // Consume the voucher — one redemption per booking it was applied to
          const redemptionEntries: Array<{
            sales_order_id: number;
            seller_id: number | null;
            discount_amount: number;
            order_subtotal: number;
          }> = [];
          for (const assignment of assignments) {
            const record = records[assignment.booking_index];
            const assignmentOrder = await this.salesOrderRepository.findOne({
              where: { id: record.order_id },
              select: ['id', 'seller_id', 'total_amount'],
            });
            redemptionEntries.push({
              sales_order_id: record.order_id,
              seller_id: assignmentOrder?.seller_id ?? null,
              discount_amount:
                Math.round(hourlyRate * assignment.hours * 100) / 100,
              order_subtotal: record.total_amount,
            });
          }
          await this.vouchersService.consumeGuestVoucher({
            user_voucher_id: userVoucherId,
            user_id: guestUser.id,
            redemptions: redemptionEntries,
          });
        }

        totalAmount = Math.max(0, subtotal - voucherDiscountAmount);
      }

      // Fully discounted: skip payment, set bookings to awaiting_confirmation
      if (totalAmount === 0) {
        const bookingIds = records.map((r) => r.booking_id);
        await this.bookingEntityRepository.update(
          { id: In(bookingIds) },
          { status: BookingStatusEnum.AWAITING_CONFIRMATION },
        );

        const orderIds = records.map((r) => r.order_id);
        await this.salesOrderRepository.update(
          { id: In(orderIds) },
          {
            payment_status: PaymentStatusEnum.PAID,
            status: OrderStatusEnum.CONFIRMED,
          },
        );

        const groupNumber =
          records[0].booking_group_number || records[0].booking_number;

        return {
          booking_group_number: groupNumber,
          booking_numbers: records.map((r) => r.booking_number),
          selected_slots: records.map((r) => ({
            booking_number: r.booking_number,
            service_id: r.service_id,
            venue_name: r.venue_name ?? '',
            scheduled_date: r.scheduled_date,
            scheduled_start_time: r.scheduled_start_time,
            scheduled_end_time: r.scheduled_end_time,
          })),
          payment_url: null,
          payment_expires_at: null,
          payment_not_required: true,
          amount: 0,
          currency: 'PHP',
          guest_count: roster.length,
        };
      }

      const primaryOrderId = records[0].order_id;

      const paymentMetadata = {
        guest_booking: true,
        payment_method: paymentMethod,
        booking_id: records[0].booking_id,
        booking_ids: records.map((r) => r.booking_id),
        booking_number: records[0].booking_number,
        booking_group_number:
          records[0].booking_group_number || records[0].booking_number,
        booking_numbers: records.map((r) => r.booking_number),
        guest_email: first.email,
        guest_count: roster.length,
        guest_names_summary: this.buildGuestNamesSummary(roster),
      };

      payment = this.isManualGuestPaymentMethod(paymentMethod)
        ? await this.createGuestManualPayment({
            primaryOrderId,
            paymentMethod,
            amount: totalAmount,
            metadata: paymentMetadata,
            user: guestUser,
          })
        : await this.checkoutPaymentsService.initiatePayment(
            {
              sales_order_id: primaryOrderId,
              payment_method_code: paymentMethod,
              amount: totalAmount,
              currency_code: 'PHP',
              description: `Venue booking payment for ${records.length} booking(s)`,
              ip_address: first.ip_address,
              metadata: paymentMetadata,
            },
            guestUser,
          );

      if (!payment) {
        throw new Error('Failed to initialize guest payment.');
      }

      const checkoutPaymentId = payment.id;

      await this.paymentOrderRepository.insert(
        records.map((record, index) => ({
          checkout_payment_id: checkoutPaymentId,
          sales_order_id: record.order_id,
          is_primary: index === 0,
        })),
      );

      await this.sendGuestPendingPaymentEmail({
        bookingId: records[0].booking_id,
        payment,
        salesOrderIds: records.map((record) => record.order_id),
        bookingType: 'regular_slot',
        guestEmail: first.email,
      });
      await this.sendVenueBookingSubmittedMirrorNotifications(
        records[0].booking_id,
      );
    } catch (error) {
      if (payment?.id) {
        await this.checkoutPaymentRepository.update(payment.id, {
          status: CheckoutPaymentStatusEnum.CANCELLED,
          failure_reason:
            'Batch venue booking failed before payment initialization completed.',
          updated_at: new Date(),
        } as any);
      }
      await this.cleanupFailedGuestBatchRecords(
        records,
        'Batch venue booking failed before payment initialization.',
      );
      throw error;
    }

    if (!payment) {
      throw new BadRequestException(
        'Payment could not be initialized for this booking request.',
      );
    }

    const response = new GuestBookingResponseDto();
    response.booking_group_number =
      records[0].booking_group_number || records[0].booking_number;
    response.booking_numbers = records.map((record) => record.booking_number);
    response.selected_slots = records.map((record) =>
      this.buildGuestSelectedSlot({
        booking_number: record.booking_number,
        service_id: record.service_id,
        venue_name: record.venue_name,
        scheduled_date: record.scheduled_date,
        scheduled_start_time: record.scheduled_start_time,
        scheduled_end_time: record.scheduled_end_time,
      }),
    );
    response.payment_url = this.isManualGuestPaymentMethod(paymentMethod)
      ? this.buildGuestPaymentPageUrl(
          response.booking_group_number,
          first.email,
        )
      : (payment.gateway_checkout_url ?? null);
    response.payment_expires_at = payment.expires_at
      ? payment.expires_at.toISOString()
      : null;
    response.amount = Number(payment.amount);
    response.currency = payment.currency?.code || 'PHP';
    response.payment_not_required = false;
    response.guest_count = roster.length;
    return response;
  }

  async createAdminVenueBookings(
    dtos: CreateAdminGuestVenueBookingDto[],
    user: User,
  ): Promise<GuestBookingResponseDto> {
    if (!user.system_admin) {
      throw new ForbiddenException('System admin access required.');
    }

    if (!dtos.length) {
      throw new BadRequestException('At least one booking is required.');
    }

    this.validateVenueBookingBatchSelections(dtos);

    const records: Array<{
      booking_number: string;
      booking_id: number;
      order_id: number;
      total_amount: number;
      service_id: number;
      venue_name: string | null;
      scheduled_date: string;
      scheduled_start_time: string;
      scheduled_end_time: string;
    }> = [];

    for (const dto of dtos) {
      const record = await this.createAdminVenueBookingRecord(dto, user);
      records.push(record);
    }

    const response = new GuestBookingResponseDto();
    response.booking_numbers = records.map((record) => record.booking_number);
    response.selected_slots = records.map((record) =>
      this.buildGuestSelectedSlot({
        booking_number: record.booking_number,
        service_id: record.service_id,
        venue_name: record.venue_name,
        scheduled_date: record.scheduled_date,
        scheduled_start_time: record.scheduled_start_time,
        scheduled_end_time: record.scheduled_end_time,
      }),
    );
    response.payment_url = null;
    response.payment_expires_at = null;
    response.amount = 0;
    response.currency = 'PHP';
    return response;
  }

  async createGuestBooking(
    dto: CreateGuestVenueBookingDto,
  ): Promise<GuestBookingResponseDto> {
    const paymentMethod = this.resolveGuestPaymentMethod([dto]);
    await this.assertManualPaymentMethodEnabled(paymentMethod);
    const roster = this.buildGuestRosterFromDto(dto);
    const guestUser = await this.usersService.findOrCreateGuestUser({
      email: dto.email,
      first_name: dto.first_name,
      last_name: dto.last_name,
      phone: dto.phone,
    });
    const record = await this.createGuestBookingRecord(
      dto,
      guestUser,
      paymentMethod,
    );

    const paymentMetadata = {
      guest_booking: true,
      payment_method: paymentMethod,
      booking_id: record.booking_id,
      booking_number: record.booking_number,
      booking_group_number: record.booking_group_number,
      guest_email: dto.email,
      guest_count: roster.length,
      guest_names_summary: this.buildGuestNamesSummary(roster),
    };

    const payment = this.isManualGuestPaymentMethod(paymentMethod)
      ? await this.createGuestManualPayment({
          primaryOrderId: record.order_id,
          paymentMethod,
          amount: record.total_amount,
          metadata: paymentMetadata,
          user: guestUser,
        })
      : await this.checkoutPaymentsService.initiatePayment(
          {
            sales_order_id: record.order_id,
            payment_method_code: paymentMethod,
            amount: record.total_amount,
            currency_code: 'PHP',
            description: `Venue booking payment for ${record.booking_number}`,
            ip_address: dto.ip_address,
            metadata: paymentMetadata,
          },
          guestUser,
        );

    await this.paymentOrderRepository.insert({
      checkout_payment_id: payment.id,
      sales_order_id: record.order_id,
      is_primary: true,
    });

    await this.sendGuestPendingPaymentEmail({
      bookingId: record.booking_id,
      payment,
      salesOrderIds: [record.order_id],
      bookingType: 'regular_slot',
      guestEmail: dto.email,
    });
    await this.sendVenueBookingSubmittedMirrorNotifications(record.booking_id);

    const response = new GuestBookingResponseDto();
    response.booking_group_number = record.booking_group_number;
    response.booking_numbers = [record.booking_number];
    response.selected_slots = [
      this.buildGuestSelectedSlot({
        booking_number: record.booking_number,
        service_id: record.service_id,
        venue_name: record.venue_name,
        scheduled_date: record.scheduled_date,
        scheduled_start_time: record.scheduled_start_time,
        scheduled_end_time: record.scheduled_end_time,
      }),
    ];
    response.payment_url = this.isManualGuestPaymentMethod(paymentMethod)
      ? this.buildGuestPaymentPageUrl(record.booking_group_number, dto.email)
      : (payment.gateway_checkout_url ?? null);
    response.payment_expires_at = payment.expires_at
      ? payment.expires_at.toISOString()
      : null;
    response.amount = Number(payment.amount);
    response.currency = payment.currency?.code || 'PHP';
    response.payment_not_required = false;
    response.guest_count = roster.length;
    return response;
  }

  private async createGuestBookingRecord(
    dto: CreateGuestVenueBookingDto,
    guestUser: User,
    paymentMethod: GuestVenuePaymentMethod,
    bookingGroupNumber?: string | null,
  ): Promise<{
    booking_number: string;
    booking_group_number: string;
    booking_id: number;
    order_id: number;
    total_amount: number;
    service_id: number;
    venue_name: string | null;
    scheduled_date: string;
    scheduled_start_time: string;
    scheduled_end_time: string;
  }> {
    const service = await this.servicesService.findById(dto.service_id);
    const roster = this.buildGuestRosterFromDto(dto);

    if (service.status !== ServiceStatusEnum.ACTIVE) {
      throw new NotFoundException('Service not found');
    }

    if (service.service_type !== ServiceTypeEnum.VENUE) {
      throw new BadRequestException('Service is not a venue type');
    }

    const availability = await this.sellerSchedulesService.checkAvailability({
      seller_id: service.seller_id,
      date: dto.scheduled_date,
      start_time: dto.scheduled_start_time,
      end_time: dto.scheduled_end_time,
      service_id: dto.service_id,
    });

    if (!availability.available) {
      throw new BadRequestException(
        availability.reason ||
          'The selected time slot is not available. Please choose another time.',
      );
    }

    const orderNumber = this.generateOrderNumber();

    const { baseRate, venueTotal, addonsTotal } =
      await this.calculateVenuePricing({
        serviceId: dto.service_id,
        scheduledDate: dto.scheduled_date,
        scheduledStartTime: dto.scheduled_start_time,
        scheduledEndTime: dto.scheduled_end_time,
        addonIds: dto.addon_ids,
      });

    const totalAmount = venueTotal + addonsTotal;

    const orderEntity = await this.salesOrderRepository.save(
      this.salesOrderRepository.create({
        user_id: guestUser.id,
        seller_id: service.seller_id,
        order_number: orderNumber,
        status: OrderStatusEnum.PENDING,
        notes: dto.notes ?? null,
        payment_method: paymentMethod,
        payment_status: PaymentStatusEnum.AWAITING_PAYMENT,
        checkout_source: 'guest_web',
        subtotal: totalAmount,
        tax_amount: 0,
        shipping_amount: 0,
        total_amount: totalAmount,
        created_by: { id: guestUser.id } as any,
        updated_by: { id: guestUser.id } as any,
      }),
    );

    const orderItemEntity = await this.salesOrderItemRepository.save(
      this.salesOrderItemRepository.create({
        order_id: orderEntity.id,
        item_type: CartItemTypeEnum.SERVICE,
        variant_id: null,
        service_id: dto.service_id,
        package_id: null,
        scheduled_date: new Date(dto.scheduled_date),
        scheduled_start_time: dto.scheduled_start_time,
        service_address_id: null,
        special_requests: dto.notes ?? null,
        location_additional_fee: 0,
        quantity: 1,
        quantity_returned: 0,
        unit_price: baseRate,
        total_price: totalAmount,
        source_quotation_id: null,
        source_quotation_item_id: null,
        created_by: { id: guestUser.id } as any,
        updated_by: { id: guestUser.id } as any,
      }),
    );

    if (dto.addon_ids && dto.addon_ids.length > 0) {
      await this.attachAddonsToSalesOrderItem(
        orderItemEntity.id,
        dto.addon_ids,
        guestUser,
      );
    }

    const booking = await this.bookingsService.createFromSalesOrderItem({
      salesOrderId: orderEntity.id,
      salesOrderItemId: orderItemEntity.id,
      serviceId: dto.service_id,
      sellerId: service.seller_id,
      packageId: null,
      scheduledDate: dto.scheduled_date,
      scheduledStartTime: dto.scheduled_start_time,
      scheduledEndTime: dto.scheduled_end_time,
      serviceAddressId: null,
      appointmentLocationType: null,
      subtotal: totalAmount,
      customerNotes: dto.notes ?? null,
      formSubmissionId: null,
      user: guestUser,
    });

    const resolvedBookingGroupNumber =
      bookingGroupNumber || booking.booking_number;

    await this.bookingRepository.update(booking.id, {
      booking_group_number: resolvedBookingGroupNumber,
      guest_email: dto.email,
      guest_payment_method: paymentMethod,
      guest_count: roster.length,
      updated_by: guestUser,
    } as any);

    await this.bookingGuestRepository.removeAllForBooking(booking.id);
    await this.bookingGuestRepository.createMany(
      roster.map((guest) => ({
        booking_id: booking.id,
        sort_order: guest.sort_order,
        is_primary_contact: guest.is_primary_contact,
        first_name: guest.first_name,
        last_name: guest.last_name,
        email: guest.email,
        phone: guest.phone,
        created_by: guestUser.id,
        updated_by: guestUser.id,
      })),
    );

    this.publishBookingCreatedAvailabilityEvent({
      seller_id: service.seller_id,
      service_id: dto.service_id,
      date: dto.scheduled_date,
      start_time: dto.scheduled_start_time,
      end_time: dto.scheduled_end_time,
      source: 'guest_booking',
      open_play_event_id: null,
      block_type: null,
    });

    return {
      booking_number: booking.booking_number,
      booking_group_number: resolvedBookingGroupNumber,
      booking_id: booking.id,
      order_id: orderEntity.id,
      total_amount: totalAmount,
      service_id: dto.service_id,
      venue_name: service.title || null,
      scheduled_date: dto.scheduled_date,
      scheduled_start_time: dto.scheduled_start_time,
      scheduled_end_time: dto.scheduled_end_time,
    };
  }

  private async createAdminVenueBookingRecord(
    dto: CreateAdminGuestVenueBookingDto,
    user: User,
  ): Promise<{
    booking_number: string;
    booking_id: number;
    order_id: number;
    total_amount: number;
    service_id: number;
    venue_name: string | null;
    scheduled_date: string;
    scheduled_start_time: string;
    scheduled_end_time: string;
  }> {
    const service = await this.servicesService.findById(dto.service_id);

    if (service.status !== ServiceStatusEnum.ACTIVE) {
      throw new NotFoundException('Service not found');
    }

    if (service.service_type !== ServiceTypeEnum.VENUE) {
      throw new BadRequestException('Service is not a venue type');
    }

    const availability = await this.sellerSchedulesService.checkAvailability({
      seller_id: service.seller_id,
      date: dto.scheduled_date,
      start_time: dto.scheduled_start_time,
      end_time: dto.scheduled_end_time,
      service_id: dto.service_id,
    });

    if (!availability.available) {
      throw new BadRequestException(
        availability.reason ||
          'The selected time slot is not available. Please choose another time.',
      );
    }

    const orderNumber = this.generateOrderNumber();
    const totalAmount = 0;

    const orderEntity = await this.salesOrderRepository.save(
      this.salesOrderRepository.create({
        user_id: user.id,
        seller_id: service.seller_id,
        order_number: orderNumber,
        status: OrderStatusEnum.CONFIRMED,
        notes: dto.notes ?? null,
        payment_method: 'admin_manual',
        payment_status: PaymentStatusEnum.PAID,
        checkout_source: 'admin_manual',
        subtotal: totalAmount,
        tax_amount: 0,
        shipping_amount: 0,
        total_amount: totalAmount,
        created_by: { id: user.id } as any,
        updated_by: { id: user.id } as any,
      }),
    );

    const orderItemEntity = await this.salesOrderItemRepository.save(
      this.salesOrderItemRepository.create({
        order_id: orderEntity.id,
        item_type: CartItemTypeEnum.SERVICE,
        variant_id: null,
        service_id: dto.service_id,
        package_id: null,
        scheduled_date: new Date(dto.scheduled_date),
        scheduled_start_time: dto.scheduled_start_time,
        service_address_id: null,
        special_requests: dto.notes ?? null,
        location_additional_fee: 0,
        quantity: 1,
        quantity_returned: 0,
        unit_price: totalAmount,
        total_price: totalAmount,
        source_quotation_id: null,
        source_quotation_item_id: null,
        created_by: { id: user.id } as any,
        updated_by: { id: user.id } as any,
      }),
    );

    const booking = await this.bookingsService.createFromSalesOrderItem({
      salesOrderId: orderEntity.id,
      salesOrderItemId: orderItemEntity.id,
      serviceId: dto.service_id,
      sellerId: service.seller_id,
      packageId: null,
      scheduledDate: dto.scheduled_date,
      scheduledStartTime: dto.scheduled_start_time,
      scheduledEndTime: dto.scheduled_end_time,
      serviceAddressId: null,
      appointmentLocationType: null,
      subtotal: totalAmount,
      customerNotes: dto.notes ?? null,
      formSubmissionId: null,
      user,
    });

    await this.bookingRepository.update(booking.id, {
      status: BookingStatusEnum.CONFIRMED,
      updated_by: user,
    } as any);

    this.publishBookingCreatedAvailabilityEvent({
      seller_id: service.seller_id,
      service_id: dto.service_id,
      date: dto.scheduled_date,
      start_time: dto.scheduled_start_time,
      end_time: dto.scheduled_end_time,
      source: 'admin_booking',
      open_play_event_id: null,
      block_type: null,
    });

    return {
      booking_number: booking.booking_number,
      booking_id: booking.id,
      order_id: orderEntity.id,
      total_amount: totalAmount,
      service_id: dto.service_id,
      venue_name: service.title || null,
      scheduled_date: dto.scheduled_date,
      scheduled_start_time: dto.scheduled_start_time,
      scheduled_end_time: dto.scheduled_end_time,
    };
  }

  private normalizeGuestName(value: string, fieldLabel: string): string {
    const normalized = String(value || '').trim();
    if (!normalized) {
      throw new BadRequestException(`${fieldLabel} is required.`);
    }
    return normalized;
  }

  private buildFullName(firstName: string, lastName: string): string {
    return [String(firstName || '').trim(), String(lastName || '').trim()]
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  private buildGuestRoster(
    input: {
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
      additional_guests?: Array<{ first_name: string; last_name: string }>;
    },
    options: {
      maxAdditionalGuests: number;
      maxTotalGuests: number;
      maxAdditionalGuestsMessage: string;
      maxTotalGuestsMessage: string;
    },
  ): NormalizedGuestRosterEntry[] {
    const primaryFirstName = this.normalizeGuestName(
      input.first_name,
      'Primary contact first name',
    );
    const primaryLastName = this.normalizeGuestName(
      input.last_name,
      'Primary contact last name',
    );
    const additionalGuests = Array.isArray(input.additional_guests)
      ? input.additional_guests
      : [];

    if (additionalGuests.length > options.maxAdditionalGuests) {
      throw new BadRequestException(options.maxAdditionalGuestsMessage);
    }

    const roster: NormalizedGuestRosterEntry[] = [
      {
        sort_order: 1,
        is_primary_contact: true,
        first_name: primaryFirstName,
        last_name: primaryLastName,
        full_name: this.buildFullName(primaryFirstName, primaryLastName),
        email: this.normalizeGuestEmail(input.email),
        phone: String(input.phone || '').trim() || null,
      },
    ];

    additionalGuests.forEach((guest, index) => {
      const firstName = this.normalizeGuestName(
        guest.first_name,
        `Guest ${index + 2} first name`,
      );
      const lastName = this.normalizeGuestName(
        guest.last_name,
        `Guest ${index + 2} last name`,
      );
      roster.push({
        sort_order: index + 2,
        is_primary_contact: false,
        first_name: firstName,
        last_name: lastName,
        full_name: this.buildFullName(firstName, lastName),
        email: null,
        phone: null,
      });
    });

    if (roster.length > options.maxTotalGuests) {
      throw new BadRequestException(options.maxTotalGuestsMessage);
    }

    return roster;
  }

  private buildGuestRosterFromDto(
    dto: CreateGuestVenueBookingDto,
  ): NormalizedGuestRosterEntry[] {
    return this.buildGuestRoster(dto, {
      maxAdditionalGuests: 7,
      maxTotalGuests: 8,
      maxAdditionalGuestsMessage:
        'A booking can have at most 7 additional guests.',
      maxTotalGuestsMessage:
        'A booking can include at most 8 persons in total.',
    });
  }

  private buildGuestRosterFromOpenPlayDto(
    dto: CreateGuestOpenPlayRegistrationDto,
  ): NormalizedGuestRosterEntry[] {
    return this.buildGuestRoster(dto, {
      maxAdditionalGuests: OPEN_PLAY_REGISTRATION_MAX_ADDITIONAL_GUESTS,
      maxTotalGuests: OPEN_PLAY_REGISTRATION_MAX_TOTAL_GUESTS,
      maxAdditionalGuestsMessage: `An open play registration can have at most ${OPEN_PLAY_REGISTRATION_MAX_ADDITIONAL_GUESTS} additional guests.`,
      maxTotalGuestsMessage: `An open play registration can include at most ${OPEN_PLAY_REGISTRATION_MAX_TOTAL_GUESTS} persons in total.`,
    });
  }

  private buildGuestRosterSignature(dto: CreateGuestVenueBookingDto): string {
    return this.buildGuestRosterFromDto(dto)
      .map((guest) => guest.full_name.toLowerCase())
      .join('|');
  }

  private buildGuestRosterFromBooking(
    booking: any,
  ): NormalizedGuestRosterEntry[] {
    const bookingGuests = Array.isArray(booking?.booking_guests)
      ? booking.booking_guests
      : [];

    if (bookingGuests.length > 0) {
      return bookingGuests
        .map((guest: any, index: number) => {
          const firstName = String(guest?.first_name || '').trim();
          const lastName = String(guest?.last_name || '').trim();
          const sortOrder =
            typeof guest?.sort_order === 'number'
              ? guest.sort_order
              : index + 1;
          return {
            sort_order: sortOrder,
            is_primary_contact:
              typeof guest?.is_primary_contact === 'boolean'
                ? guest.is_primary_contact
                : sortOrder === 1,
            first_name: firstName,
            last_name: lastName,
            full_name:
              String(guest?.full_name || '').trim() ||
              this.buildFullName(firstName, lastName),
            email:
              typeof guest?.email === 'string' && guest.email.trim()
                ? guest.email.trim()
                : null,
            phone:
              typeof guest?.phone === 'string' && guest.phone.trim()
                ? guest.phone.trim()
                : null,
          } satisfies NormalizedGuestRosterEntry;
        })
        .sort((a, b) =>
          a.sort_order !== b.sort_order
            ? a.sort_order - b.sort_order
            : a.full_name.localeCompare(b.full_name),
        );
    }

    const primaryFirstName =
      String(
        booking?.primary_guest?.first_name ||
          booking?.customer?.first_name ||
          '',
      ).trim() || 'Guest';
    const primaryLastName = String(
      booking?.primary_guest?.last_name || booking?.customer?.last_name || '',
    ).trim();

    return [
      {
        sort_order: 1,
        is_primary_contact: true,
        first_name: primaryFirstName,
        last_name: primaryLastName,
        full_name: this.buildFullName(primaryFirstName, primaryLastName),
        email: this.normalizeGuestEmail(
          booking?.primary_guest?.email ||
            booking?.guest_email ||
            booking?.customer?.email ||
            '',
        ),
        phone:
          String(
            booking?.primary_guest?.phone ||
              booking?.customer?.phone ||
              booking?.customer?.phone_number ||
              '',
          ).trim() || null,
      },
    ];
  }

  private buildGuestNamesSummary(
    roster: NormalizedGuestRosterEntry[],
  ): string | null {
    const names = roster
      .map((guest) => guest.full_name)
      .filter((name) => String(name).trim().length > 0);
    return names.length > 0 ? names.join(', ') : null;
  }

  private toGuestBookingGuestDto(
    guest: NormalizedGuestRosterEntry,
  ): GuestBookingGuestDto {
    const item = new GuestBookingGuestDto();
    item.sort_order = guest.sort_order;
    item.is_primary_contact = guest.is_primary_contact;
    item.first_name = guest.first_name;
    item.last_name = guest.last_name;
    item.full_name = guest.full_name;
    item.email = guest.email;
    item.phone = guest.phone;
    return item;
  }

  private resolvePrimaryGuest(
    roster: NormalizedGuestRosterEntry[],
  ): NormalizedGuestRosterEntry | null {
    return (
      roster.find((guest) => guest.is_primary_contact) ?? roster[0] ?? null
    );
  }

  async getGuestBookingByNumber(
    bookingNumber: string,
    email: string,
  ): Promise<GuestBookingDetailDto> {
    const booking = await this.findGuestBookingByNumberAndEmail(
      bookingNumber,
      email,
    );
    const roster = this.buildGuestRosterFromBooking(booking);
    const primaryGuest = this.resolvePrimaryGuest(roster);
    const expected = this.normalizeGuestEmail(
      primaryGuest?.email ||
        booking.guest_email ||
        booking.customer?.email ||
        email,
    );

    const detail = new GuestBookingDetailDto();
    detail.booking_number = this.resolveGuestPublicBookingNumber(booking);
    detail.booking_group_number = booking.booking_group_number ?? null;
    detail.status = booking.status;
    detail.payment_status = booking.payment_status ?? 'pending';
    detail.service_title = booking.service?.title || 'Service';
    detail.seller_store_name =
      booking.seller?.store_name || booking.seller?.business_name || 'Provider';
    detail.scheduled_date = booking.scheduled_date
      ? new Date(booking.scheduled_date).toISOString().split('T')[0]
      : '';
    detail.scheduled_start_time =
      normalizeTimeForPresentation(booking.scheduled_start_time) ??
      booking.scheduled_start_time;
    detail.scheduled_end_time =
      normalizeTimeForPresentation(booking.scheduled_end_time ?? null) ?? null;
    detail.amount = Number(booking.total ?? 0);
    detail.currency = 'PHP';
    detail.guest_name = primaryGuest?.full_name || 'Guest';
    detail.confirmation_sent_to = expected;
    detail.guest_count = roster.length;
    detail.guests = roster.map((guest) => this.toGuestBookingGuestDto(guest));
    detail.primary_guest = primaryGuest
      ? this.toGuestBookingGuestDto(primaryGuest)
      : null;
    return detail;
  }

  async getGuestBookingPaymentPage(
    bookingNumber: string,
    email: string,
  ): Promise<GuestBookingPaymentPageDto> {
    // 1. Fetch booking + payment in parallel
    const booking = await this.findGuestBookingByNumberAndEmail(
      bookingNumber,
      email,
    );
    const rawPayment = await this.findLatestCheckoutPaymentForBooking(booking);

    // 2. Only run expiry scheduler for pending payments (skip for terminal states)
    let payment = rawPayment;
    if (
      rawPayment &&
      rawPayment.status !== CheckoutPaymentStatusEnum.CANCELLED &&
      rawPayment.status !== CheckoutPaymentStatusEnum.FAILED
    ) {
      const paymentResult = await this.expirePaymentIfDueAndReload(rawPayment);
      payment = paymentResult.payment;
      // No need to re-fetch booking — expiry only changes payment status
    }

    // 3. Resolve sales order IDs (includes group-booking fallback in one pass)
    const salesOrderIdSet = new Set<number>();
    const fallbackId = booking.sales_order_id;
    if (typeof fallbackId === 'number' && fallbackId > 0) {
      salesOrderIdSet.add(fallbackId);
    }
    if (payment) {
      if (
        typeof payment.sales_order_id === 'number' &&
        payment.sales_order_id > 0
      ) {
        salesOrderIdSet.add(payment.sales_order_id);
      }
      const links = await this.paymentOrderRepository.find({
        where: { checkout_payment_id: payment.id },
      });
      for (const link of links) {
        if (
          typeof link.sales_order_id === 'number' &&
          link.sales_order_id > 0
        ) {
          salesOrderIdSet.add(link.sales_order_id);
        }
      }
    }
    // For fully discounted bookings (no payment), resolve via booking group
    if (!payment && booking.booking_group_number && salesOrderIdSet.size <= 1) {
      const groupBookings = await this.bookingEntityRepository.find({
        where: {
          booking_group_number: booking.booking_group_number,
        } as any,
        select: ['id', 'sales_order_id'] as any,
      });
      for (const b of groupBookings) {
        const oid = (b as any).sales_order_id;
        if (typeof oid === 'number' && oid > 0) salesOrderIdSet.add(oid);
      }
    }
    const salesOrderIds = [...salesOrderIdSet];

    // 4. Fetch related bookings + resolve amount in parallel
    const [relatedBookings, resolvedAmount] = await Promise.all([
      salesOrderIds.length > 0
        ? this.bookingEntityRepository.find({
            where: { sales_order_id: In(salesOrderIds) } as any,
            relations: ['service'],
            order: {
              scheduled_date: 'ASC',
              scheduled_start_time: 'ASC',
            },
          })
        : Promise.resolve([]),
      this.resolvePaymentAmount(payment, salesOrderIds),
    ]);

    const orderedRelatedBookings =
      relatedBookings.length > 0
        ? relatedBookings
        : [
            {
              booking_number: booking.booking_number,
              service_id: booking.service_id,
              scheduled_date: booking.scheduled_date as any,
              scheduled_start_time: booking.scheduled_start_time,
              scheduled_end_time: booking.scheduled_end_time,
              total: booking.total as any,
              service: booking.service as any,
            } as BookingEntity,
          ];

    const firstSlot = orderedRelatedBookings[0];
    const lastSlot = orderedRelatedBookings[orderedRelatedBookings.length - 1];
    const roster = this.buildGuestRosterFromBooking(booking);
    const primaryGuest = this.resolvePrimaryGuest(roster);
    const openPlayEventId = Number(
      orderedRelatedBookings.find(
        (item) => Number(item.open_play_event_id ?? 0) > 0,
      )?.open_play_event_id ??
        booking.open_play_event_id ??
        0,
    );
    const isOpenPlayBooking =
      Number.isInteger(openPlayEventId) && openPlayEventId > 0;
    const openPlayEvent =
      isOpenPlayBooking && openPlayEventId > 0
        ? await this.openPlayEventRepository.findOne({
            where: { id: openPlayEventId, deleted_at: IsNull() },
            select: ['id', 'max_applicants'],
          })
        : null;
    const maxPersons = isOpenPlayBooking
      ? Math.max(
          1,
          Number.isFinite(Number(openPlayEvent?.max_applicants))
            ? Number(openPlayEvent?.max_applicants)
            : roster.length,
        )
      : 8;
    const uniqueVenueNames = [
      ...new Set(
        orderedRelatedBookings
          .map((item) => item.service?.title || '')
          .filter((name) => String(name).trim().length > 0),
      ),
    ];
    const publicBookingNumber = this.resolveGuestPublicBookingNumber(booking);

    const page = new GuestBookingPaymentPageDto();
    page.booking_number = publicBookingNumber;
    page.booking_group_number = booking.booking_group_number ?? null;
    page.booking_numbers = orderedRelatedBookings.map((b) => b.booking_number);
    page.booking_status = booking.status;
    page.payment_status =
      payment?.status ??
      this.resolvePaymentStatusForNoPaymentBooking(booking.status);
    page.ui_status = this.resolveGuestUiStatus(booking.status, payment?.status);
    page.booking_type = isOpenPlayBooking ? 'open_play' : 'regular';
    page.service_title =
      uniqueVenueNames.length > 1
        ? 'Multiple Courts'
        : uniqueVenueNames[0] || booking.service?.title || 'Service';
    page.seller_store_name =
      booking.seller?.store_name || booking.seller?.business_name || 'Provider';
    page.scheduled_date = firstSlot?.scheduled_date
      ? new Date(firstSlot.scheduled_date).toISOString().split('T')[0]
      : '';
    page.scheduled_start_time =
      normalizeTimeForPresentation(firstSlot?.scheduled_start_time || '') || '';
    page.scheduled_end_time =
      normalizeTimeForPresentation(
        lastSlot?.scheduled_end_time || lastSlot?.scheduled_start_time || null,
      ) ?? null;
    page.amount = resolvedAmount;
    page.currency = payment?.currency?.code || 'PHP';
    page.payment_method =
      payment?.payment_method_code ||
      String((payment?.metadata as any)?.payment_method || 'gcash');
    page.payment_not_required =
      !payment && booking.status === BookingStatusEnum.AWAITING_CONFIRMATION;
    page.payment_reference = payment?.transaction_number ?? null;
    page.booked_at = booking.created_at
      ? new Date(booking.created_at).toISOString()
      : null;
    page.payment_expires_at = payment?.expires_at
      ? new Date(payment.expires_at).toISOString()
      : null;
    page.payment_proof_url = await this.resolvePaymentProofUrl(payment);
    page.payment_proof_uploaded_at =
      typeof payment?.metadata?.guest_payment_proof_uploaded_at === 'string'
        ? payment.metadata.guest_payment_proof_uploaded_at
        : null;
    page.guest_email = this.normalizeGuestEmail(
      primaryGuest?.email ||
        booking.guest_email ||
        booking.customer?.email ||
        email,
    );
    page.guest_count = roster.length;
    page.max_persons = Math.max(1, Math.floor(maxPersons));
    page.guests = roster.map((guest) => this.toGuestBookingGuestDto(guest));
    page.primary_guest = primaryGuest
      ? this.toGuestBookingGuestDto(primaryGuest)
      : null;
    page.booking_slots = orderedRelatedBookings.map((item) =>
      this.buildGuestPaymentPageSlot(item),
    );

    // Resolve QR image URL and label from custom_payment_methods using the normalized method code.
    const normalizedCode = this.normalizePaymentMethodCodeForQr(
      page.payment_method,
    );
    const paymentPresentation = await this.resolveQrPaymentPresentation(
      normalizedCode,
      booking.seller_id ?? null,
    );
    page.qr_image_url = paymentPresentation.qr_image_url;
    page.payment_method_label = paymentPresentation.label;

    return page;
  }

  private async resolvePaymentAmount(
    payment: CheckoutPaymentEntity | null,
    salesOrderIds: number[],
  ): Promise<number> {
    if (payment?.amount !== undefined && payment?.amount !== null) {
      return Number(payment.amount);
    }
    if (salesOrderIds.length > 0) {
      const orders = await this.salesOrderRepository.find({
        where: { id: In(salesOrderIds) },
        select: ['id', 'total_amount'],
      });
      return orders.reduce((sum, o) => sum + Number(o.total_amount ?? 0), 0);
    }
    return 0;
  }

  /**
   * Validate that a manual payment method is currently enabled in custom_payment_methods.
   * Throws BadRequestException with a user-readable message when disabled or not found.
   */
  private async assertManualPaymentMethodEnabled(
    paymentMethod: GuestVenuePaymentMethod,
  ): Promise<void> {
    const code = this.normalizePaymentMethodCodeForQr(paymentMethod);
    const record = await this.findCustomPaymentMethodByQrCode(code);
    if (!record || !record.is_enabled) {
      const label = this.fallbackPaymentMethodLabel(code);
      throw new BadRequestException(
        `Payment method '${label}' is currently unavailable. Please select a different payment method.`,
      );
    }
  }

  /** Map any payment method code variant to the canonical code stored in custom_payment_methods. */
  private normalizePaymentMethodCodeForQr(raw: string): string {
    const normalized = String(raw ?? '')
      .trim()
      .toLowerCase();
    if (
      normalized === 'paymaya' ||
      normalized === 'paymaya_direct' ||
      normalized === 'maya_qr'
    ) {
      return 'maya_qr';
    }
    if (
      normalized === 'union_bank' ||
      normalized === 'unionbank' ||
      normalized === 'unionbank_qr'
    ) {
      return 'unionbank_qr';
    }
    return normalized; // 'gcash', 'unionbank', etc.
  }

  private async findCustomPaymentMethodByQrCode(
    code: string,
  ): Promise<CustomPaymentMethodEntity | null> {
    const normalized = String(code ?? '')
      .trim()
      .toLowerCase();

    if (normalized.startsWith('custom-')) {
      const id = Number.parseInt(normalized.slice('custom-'.length), 10);
      if (!Number.isNaN(id) && Number.isInteger(id) && id > 0) {
        return this.customPaymentMethodRepository.findById(id);
      }
      return null;
    }

    return this.customPaymentMethodRepository.findByCode(normalized);
  }

  private async resolveQrPaymentPresentation(
    code: string,
    sellerId: number | null,
  ): Promise<{ qr_image_url: string | null; label: string }> {
    const normalized = String(code ?? '')
      .trim()
      .toLowerCase();

    if (normalized === 'gcash' && sellerId) {
      const sellerProfile = await this.sellerPaymentProfileRepository.findOne({
        where: { seller_id: sellerId, deleted_at: IsNull() },
      });

      if (sellerProfile?.gcash_qr_image_url) {
        return {
          qr_image_url: this.toPublicQrImageUrl(
            sellerProfile.gcash_qr_image_url,
          ),
          label: sellerProfile.gcash_display_name || 'GCash',
        };
      }
    }

    const customMethod = await this.findCustomPaymentMethodByQrCode(normalized);

    return {
      qr_image_url: customMethod?.qr_image_url ?? null,
      label: customMethod?.name ?? this.fallbackPaymentMethodLabel(normalized),
    };
  }

  /**
   * Some legacy rows in `seller_payment_profiles.gcash_qr_image_url` contain
   * the raw S3 object key from when the merchant application was stored. New
   * rows store the public URL directly; this helper handles both cases so the
   * mobile/web client always receives a usable URL.
   */
  private toPublicQrImageUrl(value: string | null | undefined): string | null {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('assets/')
    ) {
      return trimmed;
    }
    const publicEndpoint =
      process.env.AWS_S3_PUBLIC_ENDPOINT || 'http://localhost:9002';
    const bucket = process.env.AWS_DEFAULT_S3_BUCKET || 'media';
    const encodedPath = trimmed
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');
    return trimmed.startsWith(`${bucket}/`)
      ? `${publicEndpoint}/${encodedPath}`
      : `${publicEndpoint}/${bucket}/${encodedPath}`;
  }

  /** Fallback label when no matching custom_payment_methods record is found. */
  private fallbackPaymentMethodLabel(code: string): string {
    if (
      String(code ?? '')
        .toLowerCase()
        .startsWith('custom-')
    ) {
      return 'Manual QR Payment';
    }
    switch (code) {
      case 'gcash':
        return 'GCash';
      case 'maya_qr':
      case 'paymaya_direct':
        return 'Maya';
      case 'unionbank':
      case 'unionbank_qr':
        return 'UnionBank';
      default:
        return code;
    }
  }

  async getGuestBookingPaymentStatus(
    bookingNumber: string,
    email: string,
  ): Promise<GuestBookingPaymentStatusDto> {
    let booking = await this.findGuestBookingByNumberAndEmail(
      bookingNumber,
      email,
    );
    const paymentResult = await this.expirePaymentIfDueAndReload(
      await this.findLatestCheckoutPaymentForBooking(booking),
    );
    const payment = paymentResult.payment;
    if (paymentResult.expired) {
      booking = await this.findGuestBookingByNumberAndEmail(
        bookingNumber,
        email,
      );
    }

    const status = new GuestBookingPaymentStatusDto();
    status.booking_number = this.resolveGuestPublicBookingNumber(booking);
    status.booking_group_number = booking.booking_group_number ?? null;
    status.booking_status = booking.status;
    status.payment_status =
      payment?.status ??
      this.resolvePaymentStatusForNoPaymentBooking(booking.status);
    status.ui_status = this.resolveGuestUiStatus(
      booking.status,
      payment?.status,
    );
    status.payment_reference = payment?.transaction_number ?? null;
    status.payment_expires_at = payment?.expires_at
      ? new Date(payment.expires_at).toISOString()
      : null;
    status.payment_proof_url = await this.resolvePaymentProofUrl(payment);
    status.payment_proof_uploaded_at =
      typeof payment?.metadata?.guest_payment_proof_uploaded_at === 'string'
        ? payment.metadata.guest_payment_proof_uploaded_at
        : null;
    status.guest_count = Number(booking.guest_count ?? 1);
    return status;
  }

  async notifyGuestBookingPayment(
    bookingNumber: string,
    dto: NotifyGuestBookingPaymentDto,
    paymentProofFile?: Express.Multer.File,
  ): Promise<GuestBookingPaymentStatusDto> {
    const booking = await this.findGuestBookingByNumberAndEmail(
      bookingNumber,
      dto.email,
    );

    if (
      booking.status === BookingStatusEnum.CANCELLED ||
      booking.status === BookingStatusEnum.COMPLETED
    ) {
      throw new BadRequestException(
        `Booking is already ${booking.status} and can no longer accept payment notification.`,
      );
    }

    const paymentResult = await this.expirePaymentIfDueAndReload(
      await this.findLatestCheckoutPaymentForBooking(booking),
    );
    const payment = paymentResult.payment;
    if (!payment) {
      throw new NotFoundException('Payment record not found for this booking.');
    }

    if (paymentResult.expired) {
      this.sendBookingPaymentEventEmails({
        eventType: 'expired',
        booking,
        payment: paymentResult.payment!,
      }).catch((err) =>
        this.logger.warn(
          `Failed to send expiry email for booking ${bookingNumber}: ${err instanceof Error ? err.message : String(err)}`,
        ),
      );
      this.sendBookingPaymentMirrorNotifications({
        eventType: 'expired',
        booking,
      }).catch((err) =>
        this.logger.warn(
          `Failed to send expiry mirror notification for booking ${bookingNumber}: ${err instanceof Error ? err.message : String(err)}`,
        ),
      );
      return this.getGuestBookingPaymentStatus(bookingNumber, dto.email);
    }

    if (
      payment.status === CheckoutPaymentStatusEnum.FAILED ||
      payment.status === CheckoutPaymentStatusEnum.CANCELLED ||
      payment.status === CheckoutPaymentStatusEnum.EXPIRED
    ) {
      throw new BadRequestException(
        `Payment cannot be notified because it is ${payment.status}.`,
      );
    }

    if (payment.status === CheckoutPaymentStatusEnum.COMPLETED) {
      return this.getGuestBookingPaymentStatus(bookingNumber, dto.email);
    }

    const now = new Date();
    const existingProofUrl = await this.resolvePaymentProofUrl(payment);
    const publicBookingNumber = this.resolveGuestPublicBookingNumber(booking);
    const uploadedProof = paymentProofFile
      ? await this.uploadGuestPaymentProof(
          publicBookingNumber,
          paymentProofFile,
        )
      : null;

    if (!existingProofUrl && !uploadedProof) {
      throw new BadRequestException(
        'Payment proof image/receipt is required before submitting payment notification.',
      );
    }

    const metadata = {
      ...(payment.metadata || {}),
      guest_payment_notified_at: now.toISOString(),
      ...(dto.payment_reference
        ? { guest_payment_reference: dto.payment_reference }
        : {}),
      ...(uploadedProof
        ? {
            guest_payment_proof_key: uploadedProof.key,
            guest_payment_proof_url: uploadedProof.url,
            guest_payment_proof_filename: uploadedProof.originalName,
            guest_payment_proof_mime_type: uploadedProof.mimeType,
            guest_payment_proof_size: uploadedProof.size,
            guest_payment_proof_uploaded_at: now.toISOString(),
          }
        : {
            ...(existingProofUrl
              ? { guest_payment_proof_url: existingProofUrl }
              : {}),
            ...(typeof payment.metadata?.guest_payment_proof_uploaded_at ===
            'string'
              ? {
                  guest_payment_proof_uploaded_at:
                    payment.metadata.guest_payment_proof_uploaded_at,
                }
              : {}),
          }),
    };

    const shouldSendAwaitingConfirmationNotifications =
      payment.status !== CheckoutPaymentStatusEnum.PROCESSING;

    await this.checkoutPaymentRepository.update(payment.id, {
      status: CheckoutPaymentStatusEnum.PROCESSING,
      metadata,
    } as any);

    const salesOrderIds = await this.resolveSalesOrderIdsForPayment(
      payment,
      booking.sales_order_id ?? null,
    );

    if (salesOrderIds.length > 0) {
      await this.bookingEntityRepository
        .createQueryBuilder()
        .update(BookingEntity)
        .set({
          status: BookingStatusEnum.AWAITING_CONFIRMATION,
          updated_at: now,
        } as any)
        .where('sales_order_id IN (:...salesOrderIds)', { salesOrderIds })
        .andWhere('status = :pendingStatus', {
          pendingStatus: BookingStatusEnum.PENDING,
        })
        .execute();
    }

    if (shouldSendAwaitingConfirmationNotifications) {
      await this.sendBookingPaymentEventEmails({
        eventType: 'awaiting_confirmation',
        booking,
        payment: { ...payment, metadata } as CheckoutPaymentEntity,
        salesOrderIds,
      });
      await this.sendBookingPaymentMirrorNotifications({
        eventType: 'awaiting_confirmation',
        booking,
      });
    }

    return this.getGuestBookingPaymentStatus(bookingNumber, dto.email);
  }

  async abandonGuestBookingPayment(
    bookingNumber: string,
    email: string,
  ): Promise<GuestBookingPaymentStatusDto> {
    const booking = await this.findGuestBookingByNumberAndEmail(
      bookingNumber,
      email,
    );

    const paymentResult = await this.expirePaymentIfDueAndReload(
      await this.findLatestCheckoutPaymentForBooking(booking),
    );
    const payment = paymentResult.payment;

    if (!payment) {
      throw new NotFoundException('Payment record not found for this booking.');
    }

    if (paymentResult.expired) {
      return this.getGuestBookingPaymentStatus(bookingNumber, email);
    }

    const isAbandonableBooking =
      booking.status === BookingStatusEnum.PENDING ||
      booking.status === BookingStatusEnum.AWAITING_CONFIRMATION;
    const isAbandonablePayment =
      payment.status === CheckoutPaymentStatusEnum.PENDING ||
      payment.status === CheckoutPaymentStatusEnum.AWAITING_PAYMENT;

    if (!isAbandonableBooking || !isAbandonablePayment) {
      return this.getGuestBookingPaymentStatus(bookingNumber, email);
    }

    const now = new Date();
    const abandonmentReason =
      'Payment page abandoned by guest before submitting payment.';
    const paymentMetadata = {
      ...(payment.metadata || {}),
      guest_payment_abandoned_at: now.toISOString(),
    };

    await this.checkoutPaymentRepository.update(payment.id, {
      status: CheckoutPaymentStatusEnum.CANCELLED,
      failure_reason: abandonmentReason,
      metadata: paymentMetadata,
    } as any);

    const salesOrderIds = await this.resolveSalesOrderIdsForPayment(
      payment,
      booking.sales_order_id ?? null,
    );
    const bookingsToCancel =
      salesOrderIds.length > 0
        ? await this.bookingEntityRepository.find({
            where: {
              sales_order_id: In(salesOrderIds),
              status: In([
                BookingStatusEnum.PENDING,
                BookingStatusEnum.AWAITING_CONFIRMATION,
              ]),
            },
          })
        : [];

    if (salesOrderIds.length > 0) {
      await this.bookingEntityRepository
        .createQueryBuilder()
        .update(BookingEntity)
        .set({
          status: BookingStatusEnum.CANCELLED,
          cancelled_at: now,
          cancelled_by: null,
          cancellation_reason: abandonmentReason,
          updated_at: now,
        } as any)
        .where('sales_order_id IN (:...salesOrderIds)', { salesOrderIds })
        .andWhere('status IN (:...statuses)', {
          statuses: [
            BookingStatusEnum.PENDING,
            BookingStatusEnum.AWAITING_CONFIRMATION,
          ],
        })
        .execute();

      await this.salesOrderRepository
        .createQueryBuilder()
        .update(SalesOrderEntity)
        .set({
          status: OrderStatusEnum.CANCELLED,
          payment_status: PaymentStatusEnum.FAILED,
          cancellation_reason: abandonmentReason,
          cancelled_at: now,
          status_notes: abandonmentReason,
          updated_at: now,
        } as any)
        .where('id IN (:...salesOrderIds)', { salesOrderIds })
        .andWhere('status IN (:...statuses)', {
          statuses: MUTABLE_ORDER_STATUSES,
        })
        .execute();
    }

    if (bookingsToCancel.length > 0) {
      this.publishBookingCancelledAvailabilityEvents(
        bookingsToCancel,
        'guest_booking_payment_abandon',
      );
    }

    return this.getGuestBookingPaymentStatus(bookingNumber, email);
  }

  async getSellerAwaitingConfirmationBookings(
    user: User,
    query: QuerySellerAwaitingConfirmationDto,
  ): Promise<SellerAwaitingConfirmationResponseDto> {
    const sellerScopeId = await this.resolveSellerScope(user);
    const skip = Number(query.skip ?? 0);
    const take = Number(query.take ?? 20);
    const normalizedSkip = Number.isFinite(skip) && skip >= 0 ? skip : 0;
    const normalizedTake =
      Number.isFinite(take) && take >= 1 ? Math.min(take, 100) : 20;
    const search = query.search?.trim();

    const qb = this.bookingEntityRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.service', 'service')
      .leftJoinAndSelect('booking.seller', 'seller')
      .leftJoinAndSelect('booking.customer', 'customer')
      .where('booking.status = :status', {
        status: BookingStatusEnum.AWAITING_CONFIRMATION,
      });

    if (sellerScopeId) {
      qb.andWhere('booking.seller_id = :sellerScopeId', { sellerScopeId });
    }

    if (search) {
      qb.andWhere(
        `(booking.booking_number ILIKE :search OR booking.guest_email ILIKE :search OR customer.email ILIKE :search)`,
        { search: `%${search}%` },
      );
    }

    qb.orderBy('booking.updated_at', 'ASC')
      .addOrderBy('booking.id', 'ASC')
      .skip(normalizedSkip)
      .take(normalizedTake);

    const [bookings, totalCount] = await qb.getManyAndCount();
    const bookingGuests = await this.bookingGuestRepository.findByBookingIds(
      bookings.map((booking) => booking.id),
    );
    const bookingGuestsMap = bookingGuests.reduce<
      Map<number, typeof bookingGuests>
    >((map, guest) => {
      const existing = map.get(guest.booking_id) ?? [];
      existing.push(guest);
      map.set(guest.booking_id, existing);
      return map;
    }, new Map());
    const items: SellerAwaitingConfirmationBookingDto[] = [];

    for (const booking of bookings) {
      const payment = await this.findLatestCheckoutPaymentForBooking(booking);
      const item = new SellerAwaitingConfirmationBookingDto();
      item.booking_id = booking.id;
      item.booking_number = booking.booking_number;
      item.guest_email = this.normalizeGuestEmail(
        booking.guest_email || booking.customer?.email || '',
      );
      const roster =
        bookingGuestsMap.get(booking.id)?.map((guest) => ({
          sort_order: guest.sort_order,
          is_primary_contact: guest.is_primary_contact,
          first_name: guest.first_name,
          last_name: guest.last_name,
          full_name: guest.full_name,
          email: guest.email,
          phone: guest.phone,
        })) ?? this.buildGuestRosterFromBooking(booking);
      const primaryGuest = this.resolvePrimaryGuest(roster);
      item.guest_name = primaryGuest?.full_name || 'Guest';
      item.guest_count = Number(booking.guest_count ?? roster.length);
      item.guest_names_summary = this.buildGuestNamesSummary(roster);
      item.guests = roster.map((guest) => this.toGuestBookingGuestDto(guest));
      item.service_title = booking.service?.title || '';
      item.scheduled_date = booking.scheduled_date
        ? new Date(booking.scheduled_date).toISOString().split('T')[0]
        : '';
      item.scheduled_start_time =
        normalizeTimeForPresentation(booking.scheduled_start_time) ??
        booking.scheduled_start_time;
      item.scheduled_end_time =
        normalizeTimeForPresentation(booking.scheduled_end_time) ?? null;
      item.amount =
        payment?.amount !== undefined && payment?.amount !== null
          ? Number(payment.amount)
          : Number(booking.total || 0);
      item.currency = payment?.currency?.code || 'PHP';
      item.booking_status = booking.status;
      item.payment_status =
        payment?.status || CheckoutPaymentStatusEnum.AWAITING_PAYMENT;
      item.payment_reference = payment?.transaction_number ?? null;
      item.payment_notified_at =
        typeof payment?.metadata?.guest_payment_notified_at === 'string'
          ? payment.metadata.guest_payment_notified_at
          : null;
      item.payment_proof_url = await this.resolvePaymentProofUrl(payment);
      item.payment_proof_uploaded_at =
        typeof payment?.metadata?.guest_payment_proof_uploaded_at === 'string'
          ? payment.metadata.guest_payment_proof_uploaded_at
          : null;
      items.push(item);
    }

    return {
      data: items,
      totalCount,
      skip: normalizedSkip,
      take: normalizedTake,
    };
  }

  async confirmGuestBookingPaymentBySeller(
    bookingId: number,
    user: User,
    options: { applyToGroup?: boolean } = {},
  ): Promise<GuestBookingPaymentStatusDto> {
    const booking = await this.findBookingEntityByIdOrThrow(bookingId);
    await this.assertSellerAccessToBooking(booking, user);

    if (booking.status !== BookingStatusEnum.AWAITING_CONFIRMATION) {
      if (options.applyToGroup !== true) {
        throw new BadRequestException(
          `Booking #${booking.booking_number} is not awaiting confirmation.`,
        );
      }

      // When applying to group, allow if any sibling booking is still awaiting
      const resolvedSiblingOrderIds = await this.resolveSalesOrderIdsForPayment(
        await this.findLatestCheckoutPaymentForBooking(booking),
        booking.sales_order_id ?? null,
      );
      const siblingTargetIds = this.resolveTargetSalesOrderIdsForSellerDecision(
        {
          applyToGroup: true,
          booking,
          resolvedSalesOrderIds: resolvedSiblingOrderIds,
        },
      );
      if (siblingTargetIds.length > 0) {
        const awaitingSiblingCount = await this.bookingEntityRepository.count({
          where: {
            sales_order_id: In(siblingTargetIds),
            status: BookingStatusEnum.AWAITING_CONFIRMATION,
          },
        });
        if (awaitingSiblingCount === 0) {
          throw new BadRequestException(
            `No bookings in this group are awaiting confirmation.`,
          );
        }
      } else {
        throw new BadRequestException(
          `Booking #${booking.booking_number} is not awaiting confirmation.`,
        );
      }
    }

    const paymentResult = await this.expirePaymentIfDueAndReload(
      await this.findLatestCheckoutPaymentForBooking(booking),
    );
    const payment = paymentResult.payment;

    // --- Fully discounted path (no checkout_payment exists) ---
    if (!payment) {
      const salesOrder = booking.sales_order_id
        ? await this.salesOrderRepository.findOne({
            where: { id: booking.sales_order_id },
            select: ['id', 'total_amount'],
          })
        : null;

      if (!salesOrder || Number(salesOrder.total_amount ?? 0) !== 0) {
        throw new NotFoundException(
          'Payment record not found for this booking.',
        );
      }

      const now = new Date();
      let salesOrderIds = [booking.sales_order_id!];

      if (options.applyToGroup === true && booking.booking_group_number) {
        const groupBookings = await this.bookingEntityRepository.find({
          where: { booking_group_number: booking.booking_group_number } as any,
        });
        salesOrderIds = [
          ...new Set(
            groupBookings
              .map((b) => b.sales_order_id)
              .filter((id): id is number => typeof id === 'number' && id > 0),
          ),
        ];
      }

      if (salesOrderIds.length > 0) {
        const bookingUpdateQuery = this.bookingEntityRepository
          .createQueryBuilder()
          .update(BookingEntity)
          .set({
            status: BookingStatusEnum.CONFIRMED,
            confirmed_at: now,
            updated_at: now,
          } as any);

        if (options.applyToGroup === true) {
          bookingUpdateQuery.where('sales_order_id IN (:...salesOrderIds)', {
            salesOrderIds,
          });
        } else {
          bookingUpdateQuery.where('id = :bookingId', {
            bookingId: booking.id,
          });
        }

        await bookingUpdateQuery
          .andWhere('status IN (:...statuses)', {
            statuses: [
              BookingStatusEnum.PENDING,
              BookingStatusEnum.AWAITING_CONFIRMATION,
            ],
          })
          .execute();

        await this.salesOrderRepository
          .createQueryBuilder()
          .update(SalesOrderEntity)
          .set({
            status: OrderStatusEnum.CONFIRMED,
            payment_status: PaymentStatusEnum.PAID,
            updated_at: now,
          } as any)
          .where('id IN (:...salesOrderIds)', { salesOrderIds })
          .execute();

        // Send confirmation lifecycle emails for the primary booking.
        // For group approvals, send only for the booking the seller acted on
        // to avoid duplicate emails per slot — the primary booking carries the
        // full booking info recipients need.
        this.bookingsService
          .findByIdInternal(booking.id)
          .then((domainBooking) =>
            this.bookingsService.sendBookingLifecycleEmails({
              booking: domainBooking,
              event: 'confirmed',
            }),
          )
          .catch((error) => {
            this.logger.warn(
              `Failed to send confirmed lifecycle email for fully-covered booking ${booking.id}: ${error instanceof Error ? error.message : String(error)}`,
            );
          });
      }

      return this.buildPaymentStatusForBookingId(booking.id, null);
    }

    // --- Normal payment path ---
    if (paymentResult.expired) {
      throw new BadRequestException(
        'Payment confirmation window expired. Booking was cancelled and the sales order was marked disputed.',
      );
    }

    if (
      payment.status === CheckoutPaymentStatusEnum.FAILED ||
      payment.status === CheckoutPaymentStatusEnum.CANCELLED ||
      payment.status === CheckoutPaymentStatusEnum.EXPIRED
    ) {
      throw new BadRequestException(
        `Payment cannot be confirmed because it is ${payment.status}.`,
      );
    }

    const now = new Date();
    const paymentMetadata = {
      ...(payment.metadata || {}),
      seller_payment_confirmed_at: now.toISOString(),
      seller_payment_confirmed_by: user.id,
    };

    await this.checkoutPaymentRepository.update(payment.id, {
      status: CheckoutPaymentStatusEnum.COMPLETED,
      paid_at: now,
      metadata: paymentMetadata,
    } as any);

    const resolvedSalesOrderIds = await this.resolveSalesOrderIdsForPayment(
      payment,
      booking.sales_order_id ?? null,
    );
    const salesOrderIds = this.resolveTargetSalesOrderIdsForSellerDecision({
      applyToGroup: options.applyToGroup === true,
      booking,
      resolvedSalesOrderIds,
    });

    let transitionedToConfirmed = false;
    if (salesOrderIds.length > 0) {
      const bookingUpdateQuery = this.bookingEntityRepository
        .createQueryBuilder()
        .update(BookingEntity)
        .set({
          status: BookingStatusEnum.CONFIRMED,
          confirmed_at: now,
          updated_at: now,
        } as any);
      if (options.applyToGroup === true) {
        bookingUpdateQuery.where('sales_order_id IN (:...salesOrderIds)', {
          salesOrderIds,
        });
      } else {
        bookingUpdateQuery.where('id = :bookingId', { bookingId: booking.id });
      }
      const bookingUpdateResult = await bookingUpdateQuery
        .andWhere('status IN (:...statuses)', {
          statuses: [
            BookingStatusEnum.PENDING,
            BookingStatusEnum.AWAITING_CONFIRMATION,
          ],
        })
        .execute();
      transitionedToConfirmed = Number(bookingUpdateResult.affected || 0) > 0;

      await this.salesOrderRepository
        .createQueryBuilder()
        .update(SalesOrderEntity)
        .set({
          payment_status: PaymentStatusEnum.PAID,
          status: OrderStatusEnum.CONFIRMED,
          updated_at: now,
        } as any)
        .where('id IN (:...salesOrderIds)', { salesOrderIds })
        .execute();
    }

    if (transitionedToConfirmed) {
      await this.sendBookingPaymentEventEmails({
        eventType: 'confirmed',
        booking,
        payment: {
          ...payment,
          metadata: paymentMetadata,
        } as CheckoutPaymentEntity,
        salesOrderIds,
      });
      await this.sendBookingPaymentMirrorNotifications({
        eventType: 'confirmed',
        booking,
        actorUserId: user.id,
      });
    }

    return this.buildPaymentStatusForBookingId(booking.id, payment.id);
  }

  async rejectGuestBookingPaymentBySeller(
    bookingId: number,
    user: User,
    reason: string,
    options: { applyToGroup?: boolean } = {},
  ): Promise<GuestBookingPaymentStatusDto> {
    const booking = await this.findBookingEntityByIdOrThrow(bookingId);
    await this.assertSellerAccessToBooking(booking, user);

    if (booking.status !== BookingStatusEnum.AWAITING_CONFIRMATION) {
      if (options.applyToGroup !== true) {
        throw new BadRequestException(
          `Booking #${booking.booking_number} is not awaiting confirmation.`,
        );
      }

      // When applying to group, allow if any sibling booking is still awaiting
      const resolvedSiblingOrderIds = await this.resolveSalesOrderIdsForPayment(
        await this.findLatestCheckoutPaymentForBooking(booking),
        booking.sales_order_id ?? null,
      );
      const siblingTargetIds = this.resolveTargetSalesOrderIdsForSellerDecision(
        {
          applyToGroup: true,
          booking,
          resolvedSalesOrderIds: resolvedSiblingOrderIds,
        },
      );
      if (siblingTargetIds.length > 0) {
        const awaitingSiblingCount = await this.bookingEntityRepository.count({
          where: {
            sales_order_id: In(siblingTargetIds),
            status: BookingStatusEnum.AWAITING_CONFIRMATION,
          },
        });
        if (awaitingSiblingCount === 0) {
          throw new BadRequestException(
            `No bookings in this group are awaiting confirmation.`,
          );
        }
      } else {
        throw new BadRequestException(
          `Booking #${booking.booking_number} is not awaiting confirmation.`,
        );
      }
    }

    const paymentResult = await this.expirePaymentIfDueAndReload(
      await this.findLatestCheckoutPaymentForBooking(booking),
    );
    const payment = paymentResult.payment;

    // --- Fully discounted path (no checkout_payment exists) ---
    if (!payment) {
      const salesOrder = booking.sales_order_id
        ? await this.salesOrderRepository.findOne({
            where: { id: booking.sales_order_id },
            select: ['id', 'total_amount'],
          })
        : null;

      if (!salesOrder || Number(salesOrder.total_amount ?? 0) !== 0) {
        throw new NotFoundException(
          'Payment record not found for this booking.',
        );
      }

      const rejectionReason = reason?.trim();
      if (!rejectionReason) {
        throw new BadRequestException('Cancellation reason is required.');
      }

      const now = new Date();
      let salesOrderIds = [booking.sales_order_id!];

      if (options.applyToGroup === true && booking.booking_group_number) {
        const groupBookings = await this.bookingEntityRepository.find({
          where: { booking_group_number: booking.booking_group_number } as any,
        });
        salesOrderIds = [
          ...new Set(
            groupBookings
              .map((b) => b.sales_order_id)
              .filter((id): id is number => typeof id === 'number' && id > 0),
          ),
        ];
      }

      const bookingsToReject =
        options.applyToGroup === true && salesOrderIds.length > 0
          ? await this.bookingEntityRepository.find({
              where: {
                sales_order_id: In(salesOrderIds),
                status: In([
                  BookingStatusEnum.PENDING,
                  BookingStatusEnum.AWAITING_CONFIRMATION,
                ]),
              },
            })
          : [booking];

      let transitionedToRejected = false;
      if (salesOrderIds.length > 0) {
        const bookingUpdateQuery = this.bookingEntityRepository
          .createQueryBuilder()
          .update(BookingEntity)
          .set({
            status: BookingStatusEnum.CANCELLED,
            cancelled_at: now,
            cancelled_by: user.id,
            cancellation_reason: rejectionReason,
            updated_at: now,
          } as any);

        if (options.applyToGroup === true) {
          bookingUpdateQuery.where('sales_order_id IN (:...salesOrderIds)', {
            salesOrderIds,
          });
        } else {
          bookingUpdateQuery.where('id = :bookingId', {
            bookingId: booking.id,
          });
        }

        const bookingUpdateResult = await bookingUpdateQuery
          .andWhere('status IN (:...statuses)', {
            statuses: [
              BookingStatusEnum.PENDING,
              BookingStatusEnum.AWAITING_CONFIRMATION,
            ],
          })
          .execute();
        transitionedToRejected = Number(bookingUpdateResult.affected || 0) > 0;

        await this.salesOrderRepository
          .createQueryBuilder()
          .update(SalesOrderEntity)
          .set({
            payment_status: PaymentStatusEnum.FAILED,
            status: OrderStatusEnum.CANCELLED,
            cancellation_reason: rejectionReason,
            cancelled_at: now,
            updated_at: now,
          } as any)
          .where('id IN (:...salesOrderIds)', { salesOrderIds })
          .execute();
      }

      // Restore vouchers for cancelled bookings
      for (const b of bookingsToReject) {
        await this.vouchersService.restoreVouchersForCancelledBooking(
          b.id,
          b.sales_order_id ?? undefined,
        );
      }

      if (transitionedToRejected) {
        if (bookingsToReject.length > 0) {
          this.publishBookingCancelledAvailabilityEvents(
            bookingsToReject,
            'seller_reject_payment',
          );
        }

        await this.sendBookingPaymentEventEmails({
          eventType: 'rejected',
          booking,
          payment: { amount: 0, metadata: {} } as any,
          salesOrderIds,
          rejectionReason,
        });
        await this.sendBookingPaymentMirrorNotifications({
          eventType: 'rejected',
          booking,
          actorUserId: user.id,
          rejectionReason,
        });
      }

      return this.buildPaymentStatusForBookingId(booking.id, null);
    }

    if (paymentResult.expired) {
      throw new BadRequestException(
        'Payment confirmation window expired. Booking was cancelled and the sales order was marked disputed.',
      );
    }

    if (payment.status === CheckoutPaymentStatusEnum.COMPLETED) {
      // Payment was already completed (e.g. a sibling in the group was
      // confirmed first).  We can still cancel the individual booking(s)
      // that are awaiting confirmation — just don't touch the payment record.
      const rejectionReason = reason?.trim();
      if (!rejectionReason) {
        throw new BadRequestException('Cancellation reason is required.');
      }

      const now = new Date();
      const resolvedSalesOrderIds = await this.resolveSalesOrderIdsForPayment(
        payment,
        booking.sales_order_id ?? null,
      );
      const salesOrderIds = this.resolveTargetSalesOrderIdsForSellerDecision({
        applyToGroup: options.applyToGroup === true,
        booking,
        resolvedSalesOrderIds,
      });
      const bookingsToReject =
        options.applyToGroup === true && salesOrderIds.length > 0
          ? await this.bookingEntityRepository.find({
              where: {
                sales_order_id: In(salesOrderIds),
                status: In([
                  BookingStatusEnum.PENDING,
                  BookingStatusEnum.AWAITING_CONFIRMATION,
                ]),
              },
            })
          : [booking];

      let transitionedToRejected = false;
      if (salesOrderIds.length > 0) {
        const bookingUpdateQuery = this.bookingEntityRepository
          .createQueryBuilder()
          .update(BookingEntity)
          .set({
            status: BookingStatusEnum.CANCELLED,
            cancelled_at: now,
            cancelled_by: user.id,
            cancellation_reason: rejectionReason,
            updated_at: now,
          } as any);
        if (options.applyToGroup === true) {
          bookingUpdateQuery.where('sales_order_id IN (:...salesOrderIds)', {
            salesOrderIds,
          });
        } else {
          bookingUpdateQuery.where('id = :bookingId', {
            bookingId: booking.id,
          });
        }
        const bookingUpdateResult = await bookingUpdateQuery
          .andWhere('status IN (:...statuses)', {
            statuses: [
              BookingStatusEnum.PENDING,
              BookingStatusEnum.AWAITING_CONFIRMATION,
            ],
          })
          .execute();
        transitionedToRejected = Number(bookingUpdateResult.affected || 0) > 0;

        // Only cancel sales orders that have no remaining active bookings
        for (const soId of salesOrderIds) {
          const remainingActiveCount = await this.bookingEntityRepository.count(
            {
              where: {
                sales_order_id: soId,
                status: In([
                  BookingStatusEnum.PENDING,
                  BookingStatusEnum.AWAITING_CONFIRMATION,
                  BookingStatusEnum.CONFIRMED,
                  BookingStatusEnum.IN_PROGRESS,
                ]),
              },
            },
          );
          if (remainingActiveCount === 0) {
            await this.salesOrderRepository
              .createQueryBuilder()
              .update(SalesOrderEntity)
              .set({
                payment_status: PaymentStatusEnum.FAILED,
                status: OrderStatusEnum.CANCELLED,
                cancellation_reason: rejectionReason,
                cancelled_at: now,
                updated_at: now,
              } as any)
              .where('id = :soId', { soId })
              .execute();
          }
        }
      }

      // Restore vouchers for cancelled bookings
      for (const b of bookingsToReject) {
        await this.vouchersService.restoreVouchersForCancelledBooking(
          b.id,
          b.sales_order_id ?? undefined,
        );
      }

      if (transitionedToRejected) {
        if (bookingsToReject.length > 0) {
          this.publishBookingCancelledAvailabilityEvents(
            bookingsToReject,
            'seller_reject_payment',
          );
        }

        await this.sendBookingPaymentEventEmails({
          eventType: 'rejected',
          booking,
          payment: payment as CheckoutPaymentEntity,
          salesOrderIds,
          rejectionReason,
        });
        await this.sendBookingPaymentMirrorNotifications({
          eventType: 'rejected',
          booking,
          actorUserId: user.id,
          rejectionReason,
        });
      }

      return this.buildPaymentStatusForBookingId(booking.id, payment.id);
    }

    const rejectionReason = reason?.trim();
    if (!rejectionReason) {
      throw new BadRequestException('Cancellation reason is required.');
    }
    const now = new Date();
    const paymentMetadata = {
      ...(payment.metadata || {}),
      seller_payment_rejected_at: now.toISOString(),
      seller_payment_rejected_by: user.id,
      seller_payment_rejection_reason: rejectionReason,
    };

    await this.checkoutPaymentRepository.update(payment.id, {
      status: CheckoutPaymentStatusEnum.FAILED,
      failure_reason: rejectionReason,
      metadata: paymentMetadata,
      updated_by: user as any,
    } as any);

    const resolvedSalesOrderIds = await this.resolveSalesOrderIdsForPayment(
      payment,
      booking.sales_order_id ?? null,
    );
    const salesOrderIds = this.resolveTargetSalesOrderIdsForSellerDecision({
      applyToGroup: options.applyToGroup === true,
      booking,
      resolvedSalesOrderIds,
    });
    const bookingsToReject =
      options.applyToGroup === true && salesOrderIds.length > 0
        ? await this.bookingEntityRepository.find({
            where: {
              sales_order_id: In(salesOrderIds),
              status: In([
                BookingStatusEnum.PENDING,
                BookingStatusEnum.AWAITING_CONFIRMATION,
              ]),
            },
          })
        : [booking];

    let transitionedToRejected = false;
    if (salesOrderIds.length > 0) {
      const bookingUpdateQuery = this.bookingEntityRepository
        .createQueryBuilder()
        .update(BookingEntity)
        .set({
          status: BookingStatusEnum.CANCELLED,
          cancelled_at: now,
          cancelled_by: user.id,
          cancellation_reason: rejectionReason,
          updated_at: now,
        } as any);
      if (options.applyToGroup === true) {
        bookingUpdateQuery.where('sales_order_id IN (:...salesOrderIds)', {
          salesOrderIds,
        });
      } else {
        bookingUpdateQuery.where('id = :bookingId', { bookingId: booking.id });
      }
      const bookingUpdateResult = await bookingUpdateQuery
        .andWhere('status IN (:...statuses)', {
          statuses: [
            BookingStatusEnum.PENDING,
            BookingStatusEnum.AWAITING_CONFIRMATION,
          ],
        })
        .execute();
      transitionedToRejected = Number(bookingUpdateResult.affected || 0) > 0;

      await this.salesOrderRepository
        .createQueryBuilder()
        .update(SalesOrderEntity)
        .set({
          payment_status: PaymentStatusEnum.FAILED,
          status: OrderStatusEnum.CANCELLED,
          cancellation_reason: rejectionReason,
          cancelled_at: now,
          updated_at: now,
        } as any)
        .where('id IN (:...salesOrderIds)', { salesOrderIds })
        .execute();
    }

    // Restore vouchers for cancelled bookings
    for (const b of bookingsToReject) {
      await this.vouchersService.restoreVouchersForCancelledBooking(
        b.id,
        b.sales_order_id ?? undefined,
      );
    }

    if (transitionedToRejected) {
      if (bookingsToReject.length > 0) {
        this.publishBookingCancelledAvailabilityEvents(
          bookingsToReject,
          'seller_reject_payment',
        );
      }

      await this.sendBookingPaymentEventEmails({
        eventType: 'rejected',
        booking,
        payment: {
          ...payment,
          metadata: paymentMetadata,
        } as CheckoutPaymentEntity,
        salesOrderIds,
        rejectionReason,
      });
      await this.sendBookingPaymentMirrorNotifications({
        eventType: 'rejected',
        booking,
        actorUserId: user.id,
        rejectionReason,
      });
    }

    return this.buildPaymentStatusForBookingId(booking.id, payment.id);
  }

  private resolveGuestPaymentMethod(
    dtos: CreateGuestVenueBookingDto[],
  ): GuestVenuePaymentMethod {
    const methods = dtos.map((dto) =>
      normalizeGuestVenuePaymentMethod(dto.payment_method || 'gcash'),
    );
    const invalid = methods.find(
      (method): method is string =>
        !(GUEST_VENUE_PAYMENT_METHODS as readonly string[]).includes(method) &&
        !/^custom-\d+$/.test(method),
    );

    if (invalid) {
      throw new BadRequestException(
        `Unsupported payment_method: ${invalid}. Allowed: ${GUEST_VENUE_PAYMENT_METHODS.join(', ')} or custom-{id}`,
      );
    }

    const uniqueMethods = new Set(methods);
    if (uniqueMethods.size > 1) {
      throw new BadRequestException(
        'All bookings in one payment must use the same payment_method.',
      );
    }

    return methods[0] as GuestVenuePaymentMethod;
  }

  private async createGuestManualPayment(params: {
    primaryOrderId: number;
    paymentMethod: GuestVenuePaymentMethod;
    amount: number;
    metadata: Record<string, any>;
    user: User;
  }): Promise<CheckoutPaymentEntity> {
    const initiatedAt = new Date();
    const expiresAt = new Date(initiatedAt);
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    const payment = this.checkoutPaymentRepository.create({
      sales_order_id: params.primaryOrderId,
      transaction_number: this.generateGuestTransactionNumber(),
      payment_method_code: params.paymentMethod,
      payment_gateway: this.resolveGuestManualPaymentGateway(
        params.paymentMethod,
      ),
      gateway_transaction_id: null,
      gateway_reference_number: null,
      gateway_checkout_url: null,
      gateway_response: null,
      metadata: params.metadata,
      payment_type: 'full',
      installment_id: null,
      amount: params.amount,
      gateway_fee: 0,
      net_amount: params.amount,
      currency_id: null,
      status: CheckoutPaymentStatusEnum.AWAITING_PAYMENT,
      failure_reason: null,
      failure_code: null,
      initiated_at: initiatedAt,
      paid_at: null,
      expires_at: expiresAt,
      created_by: params.user as any,
      updated_by: params.user as any,
    });

    return this.checkoutPaymentRepository.save(payment);
  }

  private isManualGuestPaymentMethod(
    paymentMethod: GuestVenuePaymentMethod,
  ): boolean {
    return MANUAL_GUEST_PAYMENT_METHODS.includes(paymentMethod);
  }

  private resolveGuestManualPaymentGateway(
    paymentMethod: GuestVenuePaymentMethod,
  ): string {
    switch (paymentMethod) {
      case 'paymaya_direct':
      case 'maya_qr':
        return 'manual_maya';
      case 'unionbank':
      case 'unionbank_qr':
        return 'manual_unionbank';
      case 'gcash':
      default:
        return 'manual_gcash';
    }
  }

  private buildGuestPaymentPagePath(
    bookingNumber: string,
    email: string,
  ): string {
    const normalizedEmail = this.normalizeGuestEmail(email);
    return `/en/pickleball-selection/payment/${encodeURIComponent(
      bookingNumber,
    )}?email=${encodeURIComponent(normalizedEmail)}`;
  }

  private buildGuestPaymentPageUrl(
    bookingNumber: string,
    email: string,
  ): string {
    const frontendDomain =
      this.configService.get<string>('FRONTEND_DOMAIN', { infer: true }) ||
      'http://localhost:3000';
    const normalizedDomain = frontendDomain.replace(/\/+$/, '');
    return `${normalizedDomain}${this.buildGuestPaymentPagePath(
      bookingNumber,
      email,
    )}`;
  }

  private normalizeGuestEmail(email: string): string {
    return String(email || '')
      .trim()
      .toLowerCase();
  }

  private async resolveSellerScope(user: User): Promise<number | null> {
    if (user.system_admin) {
      return null;
    }

    if (user.seller_id) {
      return user.seller_id;
    }

    const seller = await this.sellersService.findByUserId(user.id);
    if (!seller?.id) {
      throw new ForbiddenException(
        'Access denied. You must have a seller profile.',
      );
    }

    return seller.id;
  }

  private async assertSellerAccessToBooking(
    booking: BookingEntity,
    user: User,
  ): Promise<void> {
    const sellerScopeId = await this.resolveSellerScope(user);
    if (sellerScopeId && booking.seller_id !== sellerScopeId) {
      throw new ForbiddenException(
        'Access denied. This booking belongs to a different seller.',
      );
    }
  }

  private async findBookingEntityByIdOrThrow(
    id: number,
  ): Promise<BookingEntity> {
    const booking = await this.bookingEntityRepository.findOne({
      where: { id },
      relations: ['customer', 'service', 'seller', 'booking_guests'],
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }

  private async buildPaymentStatusForBookingId(
    bookingId: number,
    paymentId: number | null,
  ): Promise<GuestBookingPaymentStatusDto> {
    const booking = await this.findBookingEntityByIdOrThrow(bookingId);
    const payment = paymentId
      ? await this.checkoutPaymentRepository.findOne({
          where: { id: paymentId },
        })
      : null;

    const status = new GuestBookingPaymentStatusDto();
    status.booking_number = this.resolveGuestPublicBookingNumber(booking);
    status.booking_group_number = booking.booking_group_number ?? null;
    status.booking_status = booking.status;
    status.payment_status =
      payment?.status ??
      this.resolvePaymentStatusForNoPaymentBooking(booking.status);
    status.ui_status = this.resolveGuestUiStatus(
      booking.status,
      payment?.status,
    );
    status.payment_reference = payment?.transaction_number ?? null;
    status.payment_expires_at = payment?.expires_at
      ? new Date(payment.expires_at).toISOString()
      : null;
    status.payment_proof_url = await this.resolvePaymentProofUrl(payment);
    status.payment_proof_uploaded_at =
      typeof payment?.metadata?.guest_payment_proof_uploaded_at === 'string'
        ? payment.metadata.guest_payment_proof_uploaded_at
        : null;
    status.guest_count = Number(booking.guest_count ?? 1);
    return status;
  }

  private async findGuestBookingByNumberAndEmail(
    bookingNumber: string,
    email: string,
  ) {
    // Use the lightweight query that loads only the 4 relations needed for
    // payment-page flows (seller, service, customer, booking_guests).
    // The heavy findManyByBookingGroupNumber (14+ relations) was causing
    // 136-second response times on this endpoint.
    const groupBookings =
      await this.bookingRepository.findManyForGuestPaymentPage(bookingNumber);
    const booking = groupBookings[0];
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const roster = this.buildGuestRosterFromBooking(booking);
    const primaryGuest = this.resolvePrimaryGuest(roster);
    const expected = this.normalizeGuestEmail(
      primaryGuest?.email ||
        booking.guest_email ||
        booking.customer?.email ||
        '',
    );
    const provided = this.normalizeGuestEmail(email);
    if (!expected || expected !== provided) {
      throw new ForbiddenException('Invalid booking credentials');
    }

    return booking;
  }

  private resolveGuestPublicBookingNumber(booking: {
    booking_group_number?: string | null;
    booking_number?: string | null;
  }): string {
    const bookingGroupNumber = String(
      booking?.booking_group_number || '',
    ).trim();
    if (bookingGroupNumber) {
      return bookingGroupNumber;
    }

    return String(booking?.booking_number || '').trim();
  }

  private async findLatestCheckoutPaymentForBooking(booking: {
    sales_order_id?: number | null;
  }): Promise<CheckoutPaymentEntity | null> {
    const salesOrderId =
      typeof booking.sales_order_id === 'number' && booking.sales_order_id > 0
        ? booking.sales_order_id
        : null;

    if (!salesOrderId) {
      return null;
    }

    const paymentFromJoin = await this.checkoutPaymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.currency', 'currency')
      .innerJoin(
        CheckoutPaymentOrderEntity,
        'payment_order',
        'payment_order.checkout_payment_id = payment.id',
      )
      .where('payment_order.sales_order_id = :salesOrderId', { salesOrderId })
      .orderBy('payment.created_at', 'DESC')
      .addOrderBy('payment_order.is_primary', 'DESC')
      .getOne();

    if (paymentFromJoin) {
      return paymentFromJoin;
    }

    return this.checkoutPaymentRepository.findOne({
      where: { sales_order_id: salesOrderId },
      relations: ['currency'],
      order: { created_at: 'DESC' },
    });
  }

  private async resolveSalesOrderIdsForPayment(
    payment: CheckoutPaymentEntity | null,
    fallbackSalesOrderId: number | null,
  ): Promise<number[]> {
    const salesOrderIds = new Set<number>();

    if (typeof fallbackSalesOrderId === 'number' && fallbackSalesOrderId > 0) {
      salesOrderIds.add(fallbackSalesOrderId);
    }

    if (!payment) {
      return [...salesOrderIds];
    }

    if (
      typeof payment.sales_order_id === 'number' &&
      payment.sales_order_id > 0
    ) {
      salesOrderIds.add(payment.sales_order_id);
    }

    const links = await this.paymentOrderRepository.find({
      where: { checkout_payment_id: payment.id },
    });
    for (const link of links) {
      if (typeof link.sales_order_id === 'number' && link.sales_order_id > 0) {
        salesOrderIds.add(link.sales_order_id);
      }
    }

    return [...salesOrderIds];
  }

  private resolveTargetSalesOrderIdsForSellerDecision(params: {
    applyToGroup: boolean;
    booking: { sales_order_id?: number | null };
    resolvedSalesOrderIds: number[];
  }): number[] {
    if (params.applyToGroup) {
      return params.resolvedSalesOrderIds;
    }

    const targetedSalesOrderId =
      typeof params.booking.sales_order_id === 'number' &&
      params.booking.sales_order_id > 0
        ? params.booking.sales_order_id
        : params.resolvedSalesOrderIds[0];
    if (
      typeof targetedSalesOrderId !== 'number' ||
      !Number.isInteger(targetedSalesOrderId) ||
      targetedSalesOrderId <= 0
    ) {
      return [];
    }

    return [targetedSalesOrderId];
  }

  private async expirePaymentIfDueAndReload(
    payment: CheckoutPaymentEntity | null,
  ): Promise<{
    payment: CheckoutPaymentEntity | null;
    expired: boolean;
  }> {
    if (!payment) {
      return { payment: null, expired: false };
    }

    // Skip scheduler call for terminal payment statuses
    const terminalStatuses: string[] = [
      CheckoutPaymentStatusEnum.CANCELLED,
      CheckoutPaymentStatusEnum.FAILED,
      String(CheckoutPaymentStatusEnum.PROCESSING ?? ''),
    ].filter(Boolean);
    if (terminalStatuses.includes(payment.status)) {
      return { payment, expired: false };
    }

    const expired =
      await this.guestVenueBookingExpirySchedulerService.expirePaymentIfDue(
        payment.id,
      );

    if (!expired) {
      return { payment, expired: false };
    }

    const refreshedPayment = await this.checkoutPaymentRepository.findOne({
      where: { id: payment.id },
      relations: ['currency'],
    });

    return {
      payment: refreshedPayment || payment,
      expired: true,
    };
  }

  private async sendBookingPaymentEventEmails(input: {
    eventType: 'awaiting_confirmation' | 'confirmed' | 'rejected' | 'expired';
    booking: any;
    payment: CheckoutPaymentEntity;
    salesOrderIds?: number[];
    rejectionReason?: string;
  }): Promise<void> {
    const orderedBookings = await this.getOrderedBookingsForNotification(
      input.booking,
      input.salesOrderIds,
    );
    if (!orderedBookings.length) return;

    const primaryBooking = orderedBookings[0];
    const bookingEmailData = this.buildBookingPaymentEmailData(
      orderedBookings,
      input.payment,
    );

    // Fetch voucher data for the email
    const salesOrderIds = input.salesOrderIds?.length
      ? input.salesOrderIds
      : primaryBooking.sales_order_id
        ? [primaryBooking.sales_order_id]
        : [];
    let vouchersApplied: Array<{
      voucher_code: string;
      voucher_discount: number;
    }> = [];
    let orderSubtotal: number | null = null;
    let orderTotalAmount: number | null = null;
    if (salesOrderIds.length > 0) {
      const appliedVouchers = await this.salesOrderVoucherRepository.find({
        where: { sales_order_id: In(salesOrderIds) },
        select: ['voucher_code', 'voucher_discount'],
      });
      vouchersApplied = appliedVouchers.map((v) => ({
        voucher_code: v.voucher_code,
        voucher_discount: Number(v.voucher_discount),
      }));
      if (vouchersApplied.length > 0) {
        const salesOrders = await this.salesOrderRepository.find({
          where: { id: In(salesOrderIds) },
          select: ['id', 'subtotal', 'total_amount'],
        });
        orderSubtotal = salesOrders.reduce(
          (sum, so) => sum + Number(so.subtotal || 0),
          0,
        );
        orderTotalAmount = salesOrders.reduce(
          (sum, so) => sum + Number(so.total_amount || 0),
          0,
        );
      }
    }

    const recipients = await this.resolveBookingPaymentEventRecipients(
      primaryBooking,
      bookingEmailData.guestEmail,
    );

    if (recipients.recipientEmails.length === 0) {
      this.logger.warn(
        `No recipients found for ${input.eventType} booking email event (booking=${bookingEmailData.bookingNumber}).`,
      );
      return;
    }

    const customerEmail = recipients.customerEmail;
    const emailConfig = this.buildBookingPaymentEventConfig(input.eventType, {
      bookingNumber: bookingEmailData.bookingNumber,
      sellerName: bookingEmailData.sellerName,
      guestName: bookingEmailData.guestName,
      customerEmail,
      rejectionReason: input.rejectionReason,
    });

    const isGeneralBooking =
      (primaryBooking as any)?.service?.service_type !== ServiceTypeEnum.VENUE;
    const isGeneralServiceType =
      (primaryBooking as any)?.service?.service_type ===
      ServiceTypeEnum.GENERAL;

    let generalPricingBreakdown: {
      serviceAmount?: number;
      addOnsTotal?: number;
      addOns?: Array<{ name: string; amount: number }>;
      optionsTotal?: number;
      options?: Array<{ label: string; adjustment: number }>;
    } = {};

    if (isGeneralServiceType) {
      const bookingWithPricing = await this.bookingEntityRepository.findOne({
        where: { id: primaryBooking.id },
        relations: ['booking_addons', 'booking_options'],
      });

      if (bookingWithPricing) {
        generalPricingBreakdown = {
          serviceAmount: Math.max(
            0,
            Number(bookingWithPricing.subtotal ?? 0) -
              Number(bookingWithPricing.addons_total ?? 0) -
              Number(bookingWithPricing.options_total ?? 0) -
              Number(bookingWithPricing.location_additional_fee ?? 0),
          ),
          addOnsTotal: Number(bookingWithPricing.addons_total ?? 0),
          addOns: (bookingWithPricing.booking_addons || []).map((addon) => ({
            name: addon.addon_name,
            amount: Number(addon.total_price ?? 0),
          })),
          optionsTotal: Number(bookingWithPricing.options_total ?? 0),
          options: (bookingWithPricing.booking_options || []).map((option) => ({
            label: `${option.group_name}: ${option.value_label}`,
            adjustment: Number(option.price_adjustment ?? 0),
          })),
        };
      }
    }

    const resolvedPaymentMethodCode = String(
      input.payment?.payment_method_code ||
        (input.payment?.metadata as any)?.payment_method ||
        '',
    )
      .trim()
      .toLowerCase();
    const isQrPayment =
      !resolvedPaymentMethodCode ||
      MANUAL_GUEST_PAYMENT_METHODS.includes(
        resolvedPaymentMethodCode as GuestVenuePaymentMethod,
      );

    const sendResults = await Promise.allSettled(
      recipients.recipientEmails.map((email) => {
        const isCustomerRecipient = Boolean(
          customerEmail && email === customerEmail,
        );
        return this.mailService.sendBookingPaymentStatusEmail({
          to: email,
          data: {
            recipientName: isCustomerRecipient
              ? bookingEmailData.guestName
              : bookingEmailData.sellerName,
            emailTitle: emailConfig.emailTitle,
            emailIntro: isCustomerRecipient
              ? emailConfig.customerIntro
              : emailConfig.staffIntro,
            bookingNumber: bookingEmailData.bookingNumber,
            bookingNumbers: bookingEmailData.bookingNumbers,
            guestName: bookingEmailData.guestName,
            guestEmail: bookingEmailData.guestEmail,
            primaryGuestName: bookingEmailData.primaryGuestName,
            primaryGuestEmail: bookingEmailData.primaryGuestEmail,
            primaryGuestPhone: bookingEmailData.primaryGuestPhone,
            additionalGuestNames: bookingEmailData.additionalGuestNames,
            serviceTitle: bookingEmailData.serviceTitle,
            sellerName: bookingEmailData.sellerName,
            scheduledDate: bookingEmailData.scheduledDate,
            scheduledStartTime: bookingEmailData.scheduledStartTime,
            scheduledEndTime: bookingEmailData.scheduledEndTime,
            slotDetails: bookingEmailData.slotDetails,
            paymentReference: bookingEmailData.paymentReference,
            paymentNotifiedAt: bookingEmailData.paymentNotifiedAt,
            paymentStatusLabel: emailConfig.paymentStatusLabel,
            bookingStatusLabel: emailConfig.bookingStatusLabel,
            recipientRole: isCustomerRecipient ? 'customer' : 'merchant',
            isQrPayment,
            isGeneralBooking,
            sellerContact: bookingEmailData.sellerContact,
            sellerEmail: bookingEmailData.sellerEmail,
            requiresAction:
              !isCustomerRecipient &&
              input.eventType === 'awaiting_confirmation',
            rejectionReason:
              input.eventType === 'rejected'
                ? input.rejectionReason
                : undefined,
            actionUrl:
              isCustomerRecipient && isGeneralBooking
                ? undefined
                : isCustomerRecipient
                  ? emailConfig.customerActionUrl
                  : isGeneralBooking
                    ? `/en/service-booking?bookingNumber=${bookingEmailData.bookingNumber}`
                    : `/en/court-details?bookingNumber=${bookingEmailData.bookingNumber}`,
            ctaLabel: isCustomerRecipient
              ? emailConfig.customerCtaLabel
              : isGeneralBooking
                ? 'Review Booking'
                : emailConfig.staffCtaLabel,
            amount: bookingEmailData.amount,
            currency: bookingEmailData.currency,
            vouchersApplied,
            orderSubtotal,
            orderTotalAmount,
            ...generalPricingBreakdown,
          },
        });
      }),
    );

    const failedCount = sendResults.filter(
      (result) => result.status === 'rejected',
    ).length;
    if (failedCount > 0) {
      this.logger.warn(
        `Booking email event ${input.eventType} completed with ${failedCount} failure(s) for booking=${bookingEmailData.bookingNumber}.`,
      );
      return;
    }

    this.logger.log(
      `Sent ${input.eventType} booking email event to ${recipients.recipientEmails.length} recipient(s) for booking=${bookingEmailData.bookingNumber}.`,
    );
  }

  private async loadBookingForMirrorNotifications(
    bookingId: number,
  ): Promise<BookingEntity | null> {
    if (!Number.isFinite(bookingId) || bookingId <= 0) {
      return null;
    }

    return this.bookingEntityRepository.findOne({
      where: { id: bookingId },
      relations: ['service', 'seller', 'customer'],
    });
  }

  private async sendVenueBookingSubmittedMirrorNotifications(
    bookingId: number,
  ): Promise<void> {
    const booking = await this.loadBookingForMirrorNotifications(bookingId);
    if (!booking) {
      this.logger.warn(
        `Unable to send venue booking submitted mirror notification: booking_id=${bookingId} not found.`,
      );
      return;
    }

    await this.bookingEmailMirrorNotificationService.sendVenueBookingSubmittedNotifications(
      booking,
    );
  }

  private async sendBookingPaymentMirrorNotifications(input: {
    eventType: 'awaiting_confirmation' | 'confirmed' | 'rejected' | 'expired';
    booking: { id: number } | BookingEntity;
    actorUserId?: number | null;
    rejectionReason?: string | null;
  }): Promise<void> {
    const booking = await this.loadBookingForMirrorNotifications(
      Number(input.booking?.id),
    );
    if (!booking) {
      this.logger.warn(
        `Unable to send booking payment mirror notification: booking_id=${input.booking?.id} not found.`,
      );
      return;
    }

    await this.bookingEmailMirrorNotificationService.sendBookingPaymentEventNotifications(
      {
        eventType: input.eventType,
        booking,
        actorUserId: input.actorUserId,
        rejectionReason: input.rejectionReason,
      },
    );
  }

  private async sendGuestPendingPaymentEmail(input: {
    bookingId: number;
    payment: CheckoutPayment | CheckoutPaymentEntity;
    salesOrderIds: number[];
    bookingType: 'open_play' | 'regular_slot';
    guestEmail?: string | null;
  }): Promise<void> {
    const emailTitleMap: Record<'open_play' | 'regular_slot', string> = {
      open_play: 'Open Play Booking Created - Pending Payment',
      regular_slot: 'Regular Slot Booking Created - Pending Payment',
    };
    const customerEmailIntroMap: Record<'open_play' | 'regular_slot', string> =
      {
        open_play:
          'your open play registration has been created. Please complete payment to secure your slot.',
        regular_slot:
          'your regular slot booking has been created. Please complete payment to secure your schedule.',
      };
    const staffEmailIntroMap: Record<'open_play' | 'regular_slot', string> = {
      open_play:
        'submitted an open play registration. Payment is pending — the booking will be confirmed once payment is completed.',
      regular_slot:
        'submitted a regular slot booking. Payment is pending — the booking will be confirmed once payment is completed.',
    };

    try {
      const booking = await this.bookingEntityRepository.findOne({
        where: { id: input.bookingId },
        relations: ['service', 'seller', 'customer', 'booking_guests'],
      });

      if (!booking) {
        this.logger.warn(
          `Unable to send ${input.bookingType} pending-payment email: booking_id=${input.bookingId} not found.`,
        );
        return;
      }

      const orderedBookings = await this.getOrderedBookingsForNotification(
        booking,
        input.salesOrderIds,
      );
      if (!orderedBookings.length) {
        return;
      }

      const bookingEmailData = this.buildBookingPaymentEmailData(
        orderedBookings,
        input.payment as CheckoutPaymentEntity,
      );
      const customerEmail = this.normalizeGuestEmail(
        bookingEmailData.guestEmail || input.guestEmail || '',
      );

      if (!customerEmail) {
        this.logger.warn(
          `Unable to send ${input.bookingType} pending-payment email: customer email is missing (booking=${bookingEmailData.bookingNumber}).`,
        );
        return;
      }

      const resolvedPendingPaymentMethodCode = String(
        (input.payment as any)?.payment_method_code ||
          (input.payment as any)?.metadata?.payment_method ||
          '',
      )
        .trim()
        .toLowerCase();
      const isQrPayment =
        !resolvedPendingPaymentMethodCode ||
        MANUAL_GUEST_PAYMENT_METHODS.includes(
          resolvedPendingPaymentMethodCode as GuestVenuePaymentMethod,
        );

      const recipients = await this.resolveBookingPaymentEventRecipients(
        booking,
        customerEmail,
      );

      if (recipients.recipientEmails.length === 0) {
        this.logger.warn(
          `No recipients found for ${input.bookingType} pending-payment email (booking=${bookingEmailData.bookingNumber}).`,
        );
        return;
      }

      const sendResults = await Promise.allSettled(
        recipients.recipientEmails.map((email) => {
          const isCustomerRecipient = Boolean(
            customerEmail && email === customerEmail,
          );
          return this.mailService.sendBookingPaymentStatusEmail({
            to: email,
            data: {
              recipientName: isCustomerRecipient
                ? bookingEmailData.guestName
                : bookingEmailData.sellerName,
              emailTitle: emailTitleMap[input.bookingType],
              emailIntro: isCustomerRecipient
                ? customerEmailIntroMap[input.bookingType]
                : `${bookingEmailData.guestName} ${staffEmailIntroMap[input.bookingType]}`,
              bookingNumber: bookingEmailData.bookingNumber,
              bookingNumbers: bookingEmailData.bookingNumbers,
              guestName: bookingEmailData.guestName,
              guestEmail: bookingEmailData.guestEmail,
              primaryGuestName: bookingEmailData.primaryGuestName,
              primaryGuestEmail: bookingEmailData.primaryGuestEmail,
              primaryGuestPhone: bookingEmailData.primaryGuestPhone,
              additionalGuestNames: bookingEmailData.additionalGuestNames,
              serviceTitle: bookingEmailData.serviceTitle,
              sellerName: bookingEmailData.sellerName,
              sellerContact: bookingEmailData.sellerContact,
              sellerEmail: bookingEmailData.sellerEmail,
              scheduledDate: bookingEmailData.scheduledDate,
              scheduledStartTime: bookingEmailData.scheduledStartTime,
              scheduledEndTime: bookingEmailData.scheduledEndTime,
              slotDetails: bookingEmailData.slotDetails,
              paymentReference: bookingEmailData.paymentReference,
              paymentNotifiedAt: bookingEmailData.paymentNotifiedAt,
              paymentStatusLabel: 'Pending Payment',
              bookingStatusLabel: 'Pending',
              recipientRole: isCustomerRecipient ? 'customer' : 'merchant',
              isQrPayment,
              requiresAction: isCustomerRecipient,
              actionUrl: isCustomerRecipient
                ? this.buildGuestBookingPaymentActionUrl(
                    bookingEmailData.bookingNumber,
                    customerEmail,
                  )
                : `/en/court-details?bookingNumber=${bookingEmailData.bookingNumber}`,
              ctaLabel: isCustomerRecipient
                ? 'Open Payment Page'
                : 'View Booking',
              amount: bookingEmailData.amount,
              currency: bookingEmailData.currency,
            },
          });
        }),
      );

      const failedCount = sendResults.filter(
        (result) => result.status === 'rejected',
      ).length;
      if (failedCount > 0) {
        this.logger.warn(
          `${input.bookingType} pending-payment email completed with ${failedCount} failure(s) for booking=${bookingEmailData.bookingNumber}.`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Failed to send ${input.bookingType} pending-payment email for booking_id=${input.bookingId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async resolveBookingPaymentEventRecipients(
    booking: any,
    guestEmail: string,
  ): Promise<{ recipientEmails: string[]; customerEmail: string | null }> {
    const recipientEmailSet = new Set<string>();

    const customerEmail = this.normalizeGuestEmail(guestEmail);
    if (customerEmail) {
      recipientEmailSet.add(customerEmail);
    }

    const sellerId = Number(booking?.seller_id ?? booking?.seller?.id);
    if (!Number.isFinite(sellerId) || sellerId <= 0) {
      return {
        recipientEmails: [...recipientEmailSet],
        customerEmail: customerEmail || null,
      };
    }

    const [approverEmails, storeOwnerEmail, sellerTableEmail] =
      await Promise.all([
        this.getBookingApproverRecipientEmails(sellerId),
        this.getStoreOwnerRecipientEmail(sellerId),
        this.getSellerTableRecipientEmail(sellerId, booking?.seller?.email),
      ]);

    for (const approverEmail of approverEmails) {
      recipientEmailSet.add(approverEmail);
    }
    if (storeOwnerEmail) {
      recipientEmailSet.add(storeOwnerEmail);
    }
    if (sellerTableEmail) {
      recipientEmailSet.add(sellerTableEmail);
    }

    return {
      recipientEmails: [...recipientEmailSet],
      customerEmail: customerEmail || null,
    };
  }

  private buildBookingPaymentEventConfig(
    eventType: 'awaiting_confirmation' | 'confirmed' | 'rejected' | 'expired',
    input: {
      bookingNumber: string;
      sellerName: string;
      guestName: string;
      customerEmail: string | null;
      rejectionReason?: string;
    },
  ): {
    emailTitle: string;
    customerIntro: string;
    staffIntro: string;
    paymentStatusLabel: string;
    bookingStatusLabel: string;
    customerActionUrl: string;
    customerCtaLabel: string;
    staffCtaLabel: string;
  } {
    const customerActionUrl = this.buildGuestBookingPaymentActionUrl(
      input.bookingNumber,
      input.customerEmail,
    );

    if (eventType === 'awaiting_confirmation') {
      return {
        emailTitle: 'Booking Awaiting Payment Confirmation',
        customerIntro:
          'We received your payment submission. Your booking is pending store approval.',
        staffIntro: `${input.guestName} submitted payment proof and the booking is awaiting confirmation.`,
        paymentStatusLabel: 'Awaiting Confirmation',
        bookingStatusLabel: 'Awaiting Confirmation',
        customerActionUrl,
        customerCtaLabel: 'View Booking Status',
        staffCtaLabel: 'Review Booking',
      };
    }

    if (eventType === 'confirmed') {
      return {
        emailTitle: 'Booking Payment Confirmed',
        customerIntro: `Your payment has been approved by ${input.sellerName}.`,
        staffIntro: `Payment for booking ${input.bookingNumber} has been confirmed.`,
        paymentStatusLabel: 'Confirmed',
        bookingStatusLabel: 'Confirmed',
        customerActionUrl,
        customerCtaLabel: 'View Booking Details',
        staffCtaLabel: 'Open Court Details',
      };
    }

    if (eventType === 'expired') {
      return {
        emailTitle: 'QR Payment Link Expired',
        customerIntro:
          'your QR payment link has expired. Please contact the provider or submit a new booking to proceed.',
        staffIntro: `the payment link for booking ${input.bookingNumber} has expired without payment being submitted.`,
        paymentStatusLabel: 'Expired',
        bookingStatusLabel: 'Payment Expired',
        customerActionUrl,
        customerCtaLabel: 'View Booking',
        staffCtaLabel: 'View Booking',
      };
    }

    return {
      emailTitle: 'Booking Payment Rejected',
      customerIntro: `Your payment was rejected by ${input.sellerName}. Please review the details below and submit again.`,
      staffIntro: `Payment for booking ${input.bookingNumber} was rejected.`,
      paymentStatusLabel: 'Rejected',
      bookingStatusLabel: 'Cancelled',
      customerActionUrl,
      customerCtaLabel: 'Submit New Payment Proof',
      staffCtaLabel: 'Open Court Details',
    };
  }

  private buildGuestBookingPaymentActionUrl(
    bookingNumber: string,
    customerEmail: string | null,
  ): string {
    if (!customerEmail) {
      return '/pickleball-selection';
    }
    return this.buildGuestPaymentPagePath(bookingNumber, customerEmail);
  }

  private async getOrderedBookingsForNotification(
    booking: any,
    salesOrderIds?: number[],
  ): Promise<any[]> {
    const relatedBookings =
      salesOrderIds && salesOrderIds.length > 0
        ? await this.bookingEntityRepository.find({
            where: { sales_order_id: In(salesOrderIds) } as any,
            relations: ['service', 'seller', 'customer', 'booking_guests'],
          })
        : [booking].filter(Boolean);

    if (!relatedBookings.length) {
      return [];
    }

    return [...relatedBookings].sort((a, b) => {
      const aDate = a.scheduled_date
        ? new Date(a.scheduled_date).getTime()
        : Number.MAX_SAFE_INTEGER;
      const bDate = b.scheduled_date
        ? new Date(b.scheduled_date).getTime()
        : Number.MAX_SAFE_INTEGER;

      if (aDate !== bDate) {
        return aDate - bDate;
      }

      return (a.scheduled_start_time || '').localeCompare(
        b.scheduled_start_time || '',
      );
    });
  }

  private buildBookingPaymentEmailData(
    orderedBookings: any[],
    payment: CheckoutPaymentEntity,
  ): {
    bookingNumber: string;
    bookingNumbers: string[];
    guestName: string;
    guestEmail: string;
    primaryGuestName: string;
    primaryGuestEmail: string;
    primaryGuestPhone: string | null;
    additionalGuestNames: string[];
    guestCount: number;
    guestNamesSummary: string | null;
    serviceTitle: string;
    sellerName: string;
    sellerContact: string | null;
    sellerEmail: string | null;
    scheduledDate: string;
    scheduledStartTime: string;
    scheduledEndTime: string;
    slotDetails: Array<{
      bookingNumber: string;
      serviceTitle: string;
      scheduledDate: string;
      scheduledStartTime: string;
      scheduledEndTime: string;
      slotCount: number;
      status: string;
    }>;
    paymentReference: string | null;
    paymentNotifiedAt: string | null;
    amount: number;
    currency: string;
  } {
    const primaryBooking = orderedBookings[0];
    const roster = this.buildGuestRosterFromBooking(primaryBooking);
    const primaryGuest = this.resolvePrimaryGuest(roster);
    const bookingNumber = this.resolveGuestPublicBookingNumber(primaryBooking);
    const bookingNumbers = orderedBookings
      .map((item) => String(item.booking_number || '').trim())
      .filter(Boolean);
    const guestName = primaryGuest?.full_name || 'Guest';
    const guestEmail =
      primaryGuest?.email ||
      primaryBooking?.guest_email ||
      primaryBooking?.customer?.email ||
      '';
    const additionalGuestNames = roster
      .filter((guest) => !guest.is_primary_contact)
      .map((guest) => guest.full_name)
      .filter((name) => String(name).trim().length > 0);
    const serviceTitle =
      primaryBooking?.service?.title || 'Pickleball Court Booking';
    const sellerName =
      primaryBooking?.seller?.store_name ||
      primaryBooking?.seller?.business_name ||
      'Seller';
    const sellerContact = (primaryBooking?.seller as any)?.contact ?? null;
    const sellerEmail = (primaryBooking?.seller as any)?.email ?? null;
    const uniqueScheduledDates = [
      ...new Set(
        orderedBookings
          .map((item) =>
            item.scheduled_date
              ? new Date(item.scheduled_date).toISOString().split('T')[0]
              : '',
          )
          .filter(Boolean),
      ),
    ];
    const scheduledDate =
      uniqueScheduledDates.length === 1
        ? uniqueScheduledDates[0]
        : uniqueScheduledDates.join(', ');
    const firstSlot = orderedBookings[0];
    const lastSlot = orderedBookings[orderedBookings.length - 1];
    const paymentMetadata = (payment?.metadata || {}) as Record<string, any>;
    const paymentReference =
      paymentMetadata.guest_payment_reference ||
      payment?.transaction_number ||
      null;
    const paymentNotifiedAt =
      typeof paymentMetadata.guest_payment_notified_at === 'string'
        ? paymentMetadata.guest_payment_notified_at
        : null;
    const slotDetails = orderedBookings.map((item) => {
      const scheduledStartTime = String(
        item?.scheduled_start_time || '',
      ).trim();
      const scheduledEndTime = String(
        item?.scheduled_end_time || item?.scheduled_start_time || '',
      ).trim();
      const slotDuration = this.resolveSlotDurationForNotification(
        item?.service?.slot_duration_minutes,
      );

      return {
        bookingNumber: String(item?.booking_number || '').trim(),
        serviceTitle:
          String(item?.service?.title || '').trim() ||
          'Pickleball Court Booking',
        scheduledDate: item?.scheduled_date
          ? new Date(item.scheduled_date).toISOString().split('T')[0]
          : '',
        scheduledStartTime,
        scheduledEndTime,
        slotCount: this.computeSlotCountForNotification(
          scheduledStartTime,
          scheduledEndTime,
          slotDuration,
        ),
        status: String(item?.status || '').trim(),
      };
    });
    const amount = Number(
      payment?.amount ??
        orderedBookings.reduce(
          (sum, item) => sum + Number(item.total || 0),
          0,
        ) ??
        0,
    );
    const currency = payment?.currency?.code || 'PHP';

    return {
      bookingNumber,
      bookingNumbers,
      guestName,
      guestEmail,
      primaryGuestName: guestName,
      primaryGuestEmail: guestEmail,
      primaryGuestPhone:
        typeof primaryGuest?.phone === 'string' && primaryGuest.phone.trim()
          ? primaryGuest.phone.trim()
          : null,
      additionalGuestNames,
      guestCount: roster.length,
      guestNamesSummary: this.buildGuestNamesSummary(roster),
      serviceTitle,
      sellerName,
      sellerContact,
      sellerEmail,
      scheduledDate: scheduledDate || 'N/A',
      scheduledStartTime: firstSlot?.scheduled_start_time || '',
      scheduledEndTime:
        lastSlot?.scheduled_end_time || lastSlot?.scheduled_start_time || '',
      slotDetails,
      paymentReference,
      paymentNotifiedAt,
      amount: Number.isFinite(amount) && amount > 0 ? amount : 0,
      currency,
    };
  }

  private async getBookingApproverRecipientEmails(
    sellerId: number,
  ): Promise<string[]> {
    const approverGroup = await this.userGroupRepository.findOne({
      where: {
        seller_id: sellerId,
        group_name: GuestVenueBookingService.BOOKING_APPROVERS_GROUP_NAME,
        status: UserGroupStatusEnum.ACTIVE,
      },
    });

    if (!approverGroup) {
      this.logger.warn(
        `Missing seeded "${GuestVenueBookingService.BOOKING_APPROVERS_GROUP_NAME}" group for seller_id=${sellerId}.`,
      );
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
      const email = String(assignment.user?.email || '')
        .trim()
        .toLowerCase();
      if (email) {
        uniqueEmails.add(email);
      }
    }

    return [...uniqueEmails];
  }

  private async getStoreOwnerRecipientEmail(
    sellerId: number,
  ): Promise<string | null> {
    try {
      const seller = await this.sellersService.findById(sellerId);
      if (!seller?.user_id) {
        return null;
      }

      const owner = await this.usersService.findById(seller.user_id);
      if (!owner || owner.status !== UserStatusEnum.ACTIVE) {
        return null;
      }
      const ownerEmail = String(owner?.email || '')
        .trim()
        .toLowerCase();
      return ownerEmail || null;
    } catch (error) {
      this.logger.warn(
        `Unable to resolve store owner email for seller_id=${sellerId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  private async getSellerTableRecipientEmail(
    sellerId: number,
    sellerEmailFromRelation?: string | null,
  ): Promise<string | null> {
    const resolvedFromRelation = this.normalizeGuestEmail(
      String(sellerEmailFromRelation || ''),
    );
    if (resolvedFromRelation) {
      return resolvedFromRelation;
    }

    try {
      const seller = await this.sellersService.findById(sellerId);
      const sellerEmail = this.normalizeGuestEmail(String(seller?.email || ''));
      return sellerEmail || null;
    } catch (error) {
      this.logger.warn(
        `Unable to resolve seller table email for seller_id=${sellerId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  private resolveGuestUiStatus(
    bookingStatus: BookingStatusEnum | string,
    paymentStatus?: CheckoutPaymentStatusEnum | null,
  ): 'pending_payment' | 'awaiting_confirmation' | 'confirmed' | 'cancelled' {
    if (bookingStatus === BookingStatusEnum.CONFIRMED) {
      return 'confirmed';
    }

    if (
      bookingStatus === BookingStatusEnum.CANCELLED ||
      paymentStatus === CheckoutPaymentStatusEnum.CANCELLED ||
      paymentStatus === CheckoutPaymentStatusEnum.EXPIRED ||
      paymentStatus === CheckoutPaymentStatusEnum.FAILED
    ) {
      return 'cancelled';
    }

    if (
      bookingStatus === BookingStatusEnum.AWAITING_CONFIRMATION ||
      paymentStatus === CheckoutPaymentStatusEnum.PROCESSING
    ) {
      return 'awaiting_confirmation';
    }

    return 'pending_payment';
  }

  private resolvePaymentStatusForNoPaymentBooking(
    bookingStatus: BookingStatusEnum | string,
  ): CheckoutPaymentStatusEnum {
    if (
      bookingStatus === BookingStatusEnum.AWAITING_CONFIRMATION ||
      bookingStatus === BookingStatusEnum.CONFIRMED
    ) {
      return CheckoutPaymentStatusEnum.COMPLETED;
    }
    return CheckoutPaymentStatusEnum.PENDING;
  }

  private async resolvePaymentProofUrl(
    payment: CheckoutPaymentEntity | null,
  ): Promise<string | null> {
    const metadata = (payment?.metadata || {}) as Record<string, any>;
    const directUrl =
      typeof metadata.guest_payment_proof_url === 'string' &&
      metadata.guest_payment_proof_url.trim().length > 0
        ? metadata.guest_payment_proof_url.trim()
        : null;

    if (directUrl) {
      return directUrl;
    }

    const proofKey =
      typeof metadata.guest_payment_proof_key === 'string' &&
      metadata.guest_payment_proof_key.trim().length > 0
        ? metadata.guest_payment_proof_key.trim()
        : null;

    if (!proofKey) {
      return null;
    }

    return this.resolveStoragePublicUrl(proofKey);
  }

  private async resolveStoragePublicUrl(key: string): Promise<string | null> {
    try {
      const result = await this.storageService.get(key);
      if (typeof result === 'string' && result.trim().length > 0) {
        return result.trim();
      }

      if (
        result &&
        typeof result === 'object' &&
        typeof (result as any).url === 'string' &&
        (result as any).url.trim().length > 0
      ) {
        return (result as any).url.trim();
      }

      return null;
    } catch {
      return null;
    }
  }

  private async uploadGuestPaymentProof(
    bookingNumber: string,
    file: Express.Multer.File,
  ): Promise<{
    key: string;
    url: string | null;
    originalName: string;
    mimeType: string;
    size: number;
  }> {
    if (!file?.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Uploaded payment proof file is empty.');
    }

    const maxSizeBytes = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSizeBytes) {
      throw new BadRequestException(
        'Payment proof file is too large. Maximum file size is 10MB.',
      );
    }

    const allowedMimeTypes = new Set([
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf',
    ]);

    if (!allowedMimeTypes.has(file.mimetype)) {
      throw new BadRequestException(
        'Invalid payment proof file type. Allowed: JPG, PNG, WEBP, PDF.',
      );
    }

    const safeBookingNumber = bookingNumber.replace(/[^A-Za-z0-9_-]/g, '');
    const mimeBasedExt = this.getFileExtensionFromMime(file.mimetype);
    const originalExt = extname(file.originalname || '').toLowerCase();
    const extension = originalExt || mimeBasedExt || '.jpg';
    const randomToken = randomBytes(8).toString('hex');
    const timestamp = Date.now();
    const objectKey = `guest-venue-bookings/payment-proofs/${safeBookingNumber}/${timestamp}-${randomToken}${extension}`;

    const uploadResult = await this.storageService.put(file, objectKey);
    return {
      key: uploadResult.key,
      url:
        typeof uploadResult.url === 'string'
          ? uploadResult.url
          : await this.resolveStoragePublicUrl(uploadResult.key),
      originalName: file.originalname || 'payment-proof',
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  private getFileExtensionFromMime(mimeType: string): string {
    switch (mimeType) {
      case 'image/jpeg':
      case 'image/jpg':
        return '.jpg';
      case 'image/png':
        return '.png';
      case 'image/webp':
        return '.webp';
      case 'application/pdf':
        return '.pdf';
      default:
        return '';
    }
  }

  private async calculateVenuePricing(params: {
    serviceId: number;
    scheduledDate: string;
    scheduledStartTime: string;
    scheduledEndTime: string;
    addonIds?: number[];
  }): Promise<{ baseRate: number; venueTotal: number; addonsTotal: number }> {
    const service = await this.servicesService.findById(params.serviceId);
    const baseRate = Number(service.base_price || service.hourly_rate || 0);
    const slotDuration = service.slot_duration_minutes || 60;

    const startMinutes = this.timeToMinutes(params.scheduledStartTime);
    const endMinutes = this.timeToMinutes(params.scheduledEndTime);
    const dayOfWeek = new Date(params.scheduledDate).getDay();

    let totalVenuePrice = 0;
    let cursor = startMinutes;
    while (cursor < endMinutes) {
      const slotStart = this.minutesToTime(cursor);
      const isPeak = this.isPeakSlot(slotStart, service as any, dayOfWeek);
      const slotRate = isPeak
        ? baseRate * Number(service.peak_price_multiplier || 1)
        : baseRate;
      totalVenuePrice += slotRate * (slotDuration / 60);
      cursor += slotDuration;
    }

    let addonsTotal = 0;
    if (params.addonIds && params.addonIds.length > 0) {
      const addons = await Promise.all(
        params.addonIds.map((id) => this.serviceAddonsService.findById(id)),
      );
      for (const addon of addons) {
        if (addon.service_id !== params.serviceId) {
          throw new BadRequestException('Addon does not belong to the service');
        }
        if (addon.status !== AddonStatusEnum.ACTIVE) {
          throw new BadRequestException('Addon is not active');
        }
        addonsTotal += Number(addon.price || 0);
      }
    }

    return {
      baseRate: Number(baseRate),
      venueTotal: Number(totalVenuePrice),
      addonsTotal: Number(addonsTotal),
    };
  }

  private async attachAddonsToSalesOrderItem(
    salesOrderItemId: number,
    addonIds: number[],
    causer: User,
  ): Promise<void> {
    const addons = await Promise.all(
      addonIds.map((id) => this.serviceAddonsService.findById(id)),
    );

    const rows: Omit<
      SalesOrderItemAddon,
      'id' | 'created_at' | 'updated_at'
    >[] = addons.map((addon) => ({
      sales_order_item_id: salesOrderItemId,
      addon_id: addon.id,
      addon_name: addon.name,
      addon_code: addon.code,
      addon_description: addon.description ?? null,
      unit_type: addon.unit_type ?? null,
      quantity: 1,
      unit_price: Number(addon.price),
      total_price: Number(addon.price),
      duration_minutes: addon.duration_minutes ?? null,
      created_by: causer.id,
      updated_by: causer.id,
    }));

    await this.salesOrderItemAddonRepository.createMany(rows);
  }

  private timeToMinutes(time: string): number {
    const raw = String(time || '').trim();
    if (!raw) {
      return Number.NaN;
    }

    const twentyFourHourMatch = raw.match(
      /^(\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/,
    );
    if (twentyFourHourMatch) {
      const hours = Number(twentyFourHourMatch[1]);
      const minutes = Number(twentyFourHourMatch[2]);
      const seconds = Number(twentyFourHourMatch[3] ?? 0);
      const isValidMidnightBoundary =
        hours === 24 && minutes === 0 && seconds === 0;
      if (
        !Number.isFinite(hours) ||
        !Number.isFinite(minutes) ||
        !Number.isFinite(seconds) ||
        hours < 0 ||
        hours > 24 ||
        minutes < 0 ||
        minutes > 59 ||
        seconds < 0 ||
        seconds > 59 ||
        (hours === 24 && !isValidMidnightBoundary)
      ) {
        return Number.NaN;
      }
      return hours * 60 + minutes + seconds / 60;
    }

    const twelveHourMatch = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!twelveHourMatch) {
      return Number.NaN;
    }

    let hours = Number(twelveHourMatch[1]);
    const minutes = Number(twelveHourMatch[2]);
    const period = String(twelveHourMatch[3] || '').toUpperCase();
    if (
      !Number.isFinite(hours) ||
      !Number.isFinite(minutes) ||
      hours < 1 ||
      hours > 12 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return Number.NaN;
    }

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    }
    if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;
  }

  private computeSlotCountForNotification(
    scheduledStartTime: string,
    scheduledEndTime: string,
    slotDurationMinutes: number,
  ): number {
    const startMinutes = this.timeToMinutes(scheduledStartTime);
    const endMinutes = this.timeToMinutes(
      scheduledEndTime || scheduledStartTime,
    );
    const durationMinutes = endMinutes - startMinutes;
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      return 1;
    }

    const normalizedSlotDuration =
      this.resolveSlotDurationForNotification(slotDurationMinutes);
    const slotCount = Math.ceil(durationMinutes / normalizedSlotDuration);
    if (!Number.isFinite(slotCount) || slotCount <= 0) {
      return 1;
    }
    return slotCount;
  }

  private resolveSlotDurationForNotification(value: unknown): number {
    const normalized = Number(value ?? 0);
    if (!Number.isFinite(normalized) || normalized <= 0) {
      return 60;
    }
    return normalized;
  }

  private isPeakSlot(
    startTime: string,
    service: any,
    dayOfWeek: number,
  ): boolean {
    if (!service.peak_price_multiplier || !service.peak_days?.length) {
      return false;
    }
    const peakDays: number[] = Array.isArray(service.peak_days)
      ? service.peak_days.map(Number)
      : [];
    if (!peakDays.includes(dayOfWeek)) return false;
    if (!service.peak_start_time || !service.peak_end_time) return true;
    const slotMin = this.timeToMinutes(startTime);
    const peakStart = this.timeToMinutes(service.peak_start_time);
    const peakEnd = this.timeToMinutes(service.peak_end_time);
    return slotMin >= peakStart && slotMin < peakEnd;
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  private async generateUniqueBookingGroupNumber(
    maxAttempts = 10,
  ): Promise<string> {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const candidate = this.generateBookingGroupNumber();
      const existing =
        await this.bookingRepository.findByBookingGroupNumber(candidate);
      if (!existing) {
        return candidate;
      }
    }

    throw new InternalServerErrorException(
      'Failed to generate unique booking group number. Please try again.',
    );
  }

  private generateBookingGroupNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    const random = Math.floor(1000 + Math.random() * 9000);

    return `BKG-${dateStr}-${random}`;
  }

  private generateGuestTransactionNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PAY-GUEST-${timestamp}-${random}`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Service-booking manual-payment endpoints (JWT-authenticated)
  // These mirror the guest/venue-booking equivalents but verify ownership via
  // the authenticated user's ID instead of verifying an email parameter.
  // ─────────────────────────────────────────────────────────────────────────

  private async findServiceBookingByNumberAndUser(
    bookingNumber: string,
    user: User,
  ) {
    const groupBookings =
      await this.bookingRepository.findManyForGuestPaymentPage(bookingNumber);
    const booking = groupBookings[0];
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    const customerId = Number(booking.customer?.id ?? 0);
    if (!customerId || customerId !== Number(user.id)) {
      throw new ForbiddenException('Access denied');
    }
    return booking;
  }

  async getServiceBookingPaymentPage(
    bookingNumber: string,
    user: User,
  ): Promise<GuestBookingPaymentPageDto> {
    const booking = await this.findServiceBookingByNumberAndUser(
      bookingNumber,
      user,
    );
    const rawPayment = await this.findLatestCheckoutPaymentForBooking(booking);

    let payment = rawPayment;
    if (
      rawPayment &&
      rawPayment.status !== CheckoutPaymentStatusEnum.CANCELLED &&
      rawPayment.status !== CheckoutPaymentStatusEnum.FAILED
    ) {
      const paymentResult = await this.expirePaymentIfDueAndReload(rawPayment);
      payment = paymentResult.payment;
    }

    const salesOrderIdSet = new Set<number>();
    const fallbackId = (booking as any).sales_order_id;
    if (typeof fallbackId === 'number' && fallbackId > 0) {
      salesOrderIdSet.add(fallbackId);
    }
    if (payment) {
      if (
        typeof payment.sales_order_id === 'number' &&
        payment.sales_order_id > 0
      ) {
        salesOrderIdSet.add(payment.sales_order_id);
      }
      const links = await this.paymentOrderRepository.find({
        where: { checkout_payment_id: payment.id },
      });
      for (const link of links) {
        if (
          typeof link.sales_order_id === 'number' &&
          link.sales_order_id > 0
        ) {
          salesOrderIdSet.add(link.sales_order_id);
        }
      }
    }
    if (!payment && booking.booking_group_number && salesOrderIdSet.size <= 1) {
      const groupBookings = await this.bookingEntityRepository.find({
        where: { booking_group_number: booking.booking_group_number } as any,
        select: ['id', 'sales_order_id'] as any,
      });
      for (const b of groupBookings) {
        const oid = (b as any).sales_order_id;
        if (typeof oid === 'number' && oid > 0) salesOrderIdSet.add(oid);
      }
    }
    const salesOrderIds = [...salesOrderIdSet];

    const [relatedBookings, resolvedAmount] = await Promise.all([
      salesOrderIds.length > 0
        ? this.bookingEntityRepository.find({
            where: { sales_order_id: In(salesOrderIds) } as any,
            relations: ['service'],
            order: {
              scheduled_date: 'ASC',
              scheduled_start_time: 'ASC',
            },
          })
        : Promise.resolve([]),
      this.resolvePaymentAmount(payment, salesOrderIds),
    ]);

    const orderedRelatedBookings =
      relatedBookings.length > 0
        ? relatedBookings
        : [
            {
              booking_number: booking.booking_number,
              service_id: (booking as any).service_id,
              scheduled_date: (booking as any).scheduled_date,
              scheduled_start_time: booking.scheduled_start_time,
              scheduled_end_time: booking.scheduled_end_time,
              total: (booking as any).total,
              service: booking.service,
            } as BookingEntity,
          ];

    const firstSlot = orderedRelatedBookings[0];
    const lastSlot = orderedRelatedBookings[orderedRelatedBookings.length - 1];
    const roster = this.buildGuestRosterFromBooking(booking);
    const primaryGuest = this.resolvePrimaryGuest(roster);
    const openPlayEventId = Number(
      orderedRelatedBookings.find(
        (item) => Number((item as any).open_play_event_id ?? 0) > 0,
      )?.open_play_event_id ??
        (booking as any).open_play_event_id ??
        0,
    );
    const isOpenPlayBooking =
      Number.isInteger(openPlayEventId) && openPlayEventId > 0;
    const openPlayEvent =
      isOpenPlayBooking && openPlayEventId > 0
        ? await this.openPlayEventRepository.findOne({
            where: { id: openPlayEventId, deleted_at: IsNull() },
            select: ['id', 'max_applicants'],
          })
        : null;
    const maxPersons = isOpenPlayBooking
      ? Math.max(
          1,
          Number.isFinite(Number(openPlayEvent?.max_applicants))
            ? Number(openPlayEvent?.max_applicants)
            : roster.length,
        )
      : 8;
    const uniqueVenueNames = [
      ...new Set(
        orderedRelatedBookings
          .map((item) => (item as any).service?.title || '')
          .filter((name) => String(name).trim().length > 0),
      ),
    ];
    const publicBookingNumber = this.resolveGuestPublicBookingNumber(booking);
    const userEmail = String(user.email ?? '');

    const page = new GuestBookingPaymentPageDto();
    page.booking_number = publicBookingNumber;
    page.booking_group_number = booking.booking_group_number ?? null;
    page.booking_numbers = orderedRelatedBookings.map((b) => b.booking_number);
    page.booking_status = booking.status;
    page.payment_status =
      payment?.status ??
      this.resolvePaymentStatusForNoPaymentBooking(booking.status);
    page.ui_status = this.resolveGuestUiStatus(booking.status, payment?.status);
    page.booking_type = isOpenPlayBooking ? 'open_play' : 'regular';
    page.service_title =
      uniqueVenueNames.length > 1
        ? 'Multiple Services'
        : uniqueVenueNames[0] || booking.service?.title || 'Service';
    page.seller_store_name =
      booking.seller?.store_name ||
      (booking.seller as any)?.business_name ||
      'Provider';
    page.scheduled_date = firstSlot?.scheduled_date
      ? new Date(firstSlot.scheduled_date).toISOString().split('T')[0]
      : '';
    page.scheduled_start_time =
      normalizeTimeForPresentation(firstSlot?.scheduled_start_time || '') || '';
    page.scheduled_end_time =
      normalizeTimeForPresentation(
        lastSlot?.scheduled_end_time || lastSlot?.scheduled_start_time || null,
      ) ?? null;
    page.amount = resolvedAmount;
    page.currency = payment?.currency?.code || 'PHP';
    page.payment_method =
      payment?.payment_method_code ||
      String((payment?.metadata as any)?.payment_method || 'gcash');
    page.payment_not_required =
      !payment && booking.status === BookingStatusEnum.AWAITING_CONFIRMATION;
    page.payment_reference = payment?.transaction_number ?? null;
    page.booked_at = booking.created_at
      ? new Date(booking.created_at).toISOString()
      : null;
    page.payment_expires_at = payment?.expires_at
      ? new Date(payment.expires_at).toISOString()
      : null;
    page.payment_proof_url = await this.resolvePaymentProofUrl(payment);
    page.payment_proof_uploaded_at =
      typeof payment?.metadata?.guest_payment_proof_uploaded_at === 'string'
        ? payment.metadata.guest_payment_proof_uploaded_at
        : null;
    page.guest_email = this.normalizeGuestEmail(
      primaryGuest?.email ||
        (booking as any).guest_email ||
        booking.customer?.email ||
        userEmail,
    );
    page.guest_count = roster.length;
    page.max_persons = Math.max(1, Math.floor(maxPersons));
    page.guests = roster.map((guest) => this.toGuestBookingGuestDto(guest));
    page.primary_guest = primaryGuest
      ? this.toGuestBookingGuestDto(primaryGuest)
      : null;
    page.booking_slots = orderedRelatedBookings.map((item) =>
      this.buildGuestPaymentPageSlot(item),
    );

    const normalizedCode = this.normalizePaymentMethodCodeForQr(
      page.payment_method,
    );
    const paymentPresentation = await this.resolveQrPaymentPresentation(
      normalizedCode,
      booking.seller_id ?? null,
    );
    page.qr_image_url = paymentPresentation.qr_image_url;
    page.payment_method_label = paymentPresentation.label;

    return page;
  }

  async getServiceBookingPaymentStatus(
    bookingNumber: string,
    user: User,
  ): Promise<GuestBookingPaymentStatusDto> {
    let booking = await this.findServiceBookingByNumberAndUser(
      bookingNumber,
      user,
    );
    const paymentResult = await this.expirePaymentIfDueAndReload(
      await this.findLatestCheckoutPaymentForBooking(booking),
    );
    const payment = paymentResult.payment;
    if (paymentResult.expired) {
      booking = await this.findServiceBookingByNumberAndUser(
        bookingNumber,
        user,
      );
    }

    const status = new GuestBookingPaymentStatusDto();
    status.booking_number = this.resolveGuestPublicBookingNumber(booking);
    status.booking_group_number = booking.booking_group_number ?? null;
    status.booking_status = booking.status;
    status.payment_status =
      payment?.status ??
      this.resolvePaymentStatusForNoPaymentBooking(booking.status);
    status.ui_status = this.resolveGuestUiStatus(
      booking.status,
      payment?.status,
    );
    status.payment_reference = payment?.transaction_number ?? null;
    status.payment_expires_at = payment?.expires_at
      ? new Date(payment.expires_at).toISOString()
      : null;
    status.payment_proof_url = await this.resolvePaymentProofUrl(payment);
    status.payment_proof_uploaded_at =
      typeof payment?.metadata?.guest_payment_proof_uploaded_at === 'string'
        ? payment.metadata.guest_payment_proof_uploaded_at
        : null;
    status.guest_count = Number((booking as any).guest_count ?? 1);
    return status;
  }

  async notifyServiceBookingPayment(
    bookingNumber: string,
    dto: NotifyServiceBookingPaymentDto,
    user: User,
    paymentProofFile?: Express.Multer.File,
  ): Promise<GuestBookingPaymentStatusDto> {
    const booking = await this.findServiceBookingByNumberAndUser(
      bookingNumber,
      user,
    );

    if (
      booking.status === BookingStatusEnum.CANCELLED ||
      booking.status === BookingStatusEnum.COMPLETED
    ) {
      throw new BadRequestException(
        `Booking is already ${booking.status} and can no longer accept payment notification.`,
      );
    }

    const paymentResult = await this.expirePaymentIfDueAndReload(
      await this.findLatestCheckoutPaymentForBooking(booking),
    );
    const payment = paymentResult.payment;
    if (!payment) {
      throw new NotFoundException('Payment record not found for this booking.');
    }

    if (paymentResult.expired) {
      this.sendBookingPaymentEventEmails({
        eventType: 'expired',
        booking,
        payment: paymentResult.payment!,
      }).catch((err) =>
        this.logger.warn(
          `Failed to send expiry email for service booking ${bookingNumber}: ${err instanceof Error ? err.message : String(err)}`,
        ),
      );
      this.sendBookingPaymentMirrorNotifications({
        eventType: 'expired',
        booking,
      }).catch((err) =>
        this.logger.warn(
          `Failed to send expiry mirror notification for service booking ${bookingNumber}: ${err instanceof Error ? err.message : String(err)}`,
        ),
      );
      return this.getServiceBookingPaymentStatus(bookingNumber, user);
    }

    if (
      payment.status === CheckoutPaymentStatusEnum.FAILED ||
      payment.status === CheckoutPaymentStatusEnum.CANCELLED ||
      payment.status === CheckoutPaymentStatusEnum.EXPIRED
    ) {
      throw new BadRequestException(
        `Payment cannot be notified because it is ${payment.status}.`,
      );
    }

    if (payment.status === CheckoutPaymentStatusEnum.COMPLETED) {
      return this.getServiceBookingPaymentStatus(bookingNumber, user);
    }

    const now = new Date();
    const existingProofUrl = await this.resolvePaymentProofUrl(payment);
    const publicBookingNumber = this.resolveGuestPublicBookingNumber(booking);
    const uploadedProof = paymentProofFile
      ? await this.uploadGuestPaymentProof(
          publicBookingNumber,
          paymentProofFile,
        )
      : null;

    if (!existingProofUrl && !uploadedProof) {
      throw new BadRequestException(
        'Payment proof image/receipt is required before submitting payment notification.',
      );
    }

    const metadata = {
      ...(payment.metadata || {}),
      guest_payment_notified_at: now.toISOString(),
      ...(dto.payment_reference
        ? { guest_payment_reference: dto.payment_reference }
        : {}),
      ...(uploadedProof
        ? {
            guest_payment_proof_key: uploadedProof.key,
            guest_payment_proof_url: uploadedProof.url,
            guest_payment_proof_filename: uploadedProof.originalName,
            guest_payment_proof_mime_type: uploadedProof.mimeType,
            guest_payment_proof_size: uploadedProof.size,
            guest_payment_proof_uploaded_at: now.toISOString(),
          }
        : {}),
    };

    const shouldSendAwaitingConfirmationNotifications =
      payment.status !== CheckoutPaymentStatusEnum.PROCESSING;

    await this.checkoutPaymentRepository.update(payment.id, {
      status: CheckoutPaymentStatusEnum.PROCESSING,
      metadata,
    } as any);

    const salesOrderIds = await this.resolveSalesOrderIdsForPayment(
      payment,
      (booking as any).sales_order_id ?? null,
    );

    if (salesOrderIds.length > 0) {
      await this.bookingEntityRepository
        .createQueryBuilder()
        .update(BookingEntity)
        .set({
          status: BookingStatusEnum.AWAITING_CONFIRMATION,
          updated_at: now,
        } as any)
        .where('sales_order_id IN (:...salesOrderIds)', { salesOrderIds })
        .andWhere('status = :pendingStatus', {
          pendingStatus: BookingStatusEnum.PENDING,
        })
        .execute();
    }

    if (shouldSendAwaitingConfirmationNotifications) {
      await this.sendBookingPaymentEventEmails({
        eventType: 'awaiting_confirmation',
        booking,
        payment: { ...payment, metadata } as CheckoutPaymentEntity,
        salesOrderIds,
      });
      await this.sendBookingPaymentMirrorNotifications({
        eventType: 'awaiting_confirmation',
        booking,
      });
    }

    return this.getServiceBookingPaymentStatus(bookingNumber, user);
  }

  async abandonServiceBookingPayment(
    bookingNumber: string,
    user: User,
  ): Promise<GuestBookingPaymentStatusDto> {
    const booking = await this.findServiceBookingByNumberAndUser(
      bookingNumber,
      user,
    );

    const paymentResult = await this.expirePaymentIfDueAndReload(
      await this.findLatestCheckoutPaymentForBooking(booking),
    );
    const payment = paymentResult.payment;

    if (!payment) {
      throw new NotFoundException('Payment record not found for this booking.');
    }

    if (paymentResult.expired) {
      return this.getServiceBookingPaymentStatus(bookingNumber, user);
    }

    const isAbandonableBooking =
      booking.status === BookingStatusEnum.PENDING ||
      booking.status === BookingStatusEnum.AWAITING_CONFIRMATION;
    const isAbandonablePayment =
      payment.status === CheckoutPaymentStatusEnum.PENDING ||
      payment.status === CheckoutPaymentStatusEnum.AWAITING_PAYMENT;

    if (!isAbandonableBooking || !isAbandonablePayment) {
      return this.getServiceBookingPaymentStatus(bookingNumber, user);
    }

    const now = new Date();
    const abandonmentReason =
      'Payment page abandoned by customer before submitting payment.';
    const paymentMetadata = {
      ...(payment.metadata || {}),
      guest_payment_abandoned_at: now.toISOString(),
    };

    await this.checkoutPaymentRepository.update(payment.id, {
      status: CheckoutPaymentStatusEnum.CANCELLED,
      failure_reason: abandonmentReason,
      metadata: paymentMetadata,
    } as any);

    const salesOrderIds = await this.resolveSalesOrderIdsForPayment(
      payment,
      (booking as any).sales_order_id ?? null,
    );
    const bookingsToCancel =
      salesOrderIds.length > 0
        ? await this.bookingEntityRepository.find({
            where: {
              sales_order_id: In(salesOrderIds),
              status: In([
                BookingStatusEnum.PENDING,
                BookingStatusEnum.AWAITING_CONFIRMATION,
              ]),
            },
          })
        : [];

    if (salesOrderIds.length > 0) {
      await this.bookingEntityRepository
        .createQueryBuilder()
        .update(BookingEntity)
        .set({
          status: BookingStatusEnum.CANCELLED,
          cancelled_at: now,
          cancelled_by: null,
          cancellation_reason: abandonmentReason,
          updated_at: now,
        } as any)
        .where('sales_order_id IN (:...salesOrderIds)', { salesOrderIds })
        .andWhere('status IN (:...statuses)', {
          statuses: [
            BookingStatusEnum.PENDING,
            BookingStatusEnum.AWAITING_CONFIRMATION,
          ],
        })
        .execute();

      await this.salesOrderRepository
        .createQueryBuilder()
        .update(SalesOrderEntity)
        .set({
          status: OrderStatusEnum.CANCELLED,
          payment_status: PaymentStatusEnum.FAILED,
          cancellation_reason: abandonmentReason,
          cancelled_at: now,
          status_notes: abandonmentReason,
          updated_at: now,
        } as any)
        .where('id IN (:...salesOrderIds)', { salesOrderIds })
        .andWhere('status IN (:...statuses)', {
          statuses: MUTABLE_ORDER_STATUSES,
        })
        .execute();
    }

    if (bookingsToCancel.length > 0) {
      this.publishBookingCancelledAvailabilityEvents(
        bookingsToCancel,
        'service_booking_payment_abandon',
      );
    }

    return this.getServiceBookingPaymentStatus(bookingNumber, user);
  }
}
