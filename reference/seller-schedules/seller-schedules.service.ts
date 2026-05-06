import {
  BadRequestException,
  Injectable,
  Inject,
  forwardRef,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { BaseSellerScheduleRepository } from '@/seller-schedules/persistence/base-seller-schedule.repository';
import { CreateSellerScheduleDto } from '@/seller-schedules/dto/create-seller-schedule.dto';
import { UpdateSellerScheduleDto } from '@/seller-schedules/dto/update-seller-schedule.dto';
import { QuerySellerScheduleDto } from '@/seller-schedules/dto/query-seller-schedule.dto';
import { SellerSchedule } from '@/seller-schedules/domain/seller-schedule';
import { SellersService } from '@/sellers/sellers.service';
import { User } from '@/users/domain/user';
import { CheckAvailabilityDto } from '@/seller-schedules/dto/check-availability.dto';
import { BaseStoreUnavailabilityRepository } from '@/store-unavailability/persistence/base-store-unavailability.repository';
import { StoreUnavailability } from '@/store-unavailability/domain/store-unavailability';
import { BaseBookingRepository } from '@/bookings/persistence/base-booking.repository';
import { Booking } from '@/bookings/domain/booking';
import { BookingStatusEnum } from '@/bookings/enums/booking-status.enum';
import { ServicesService } from '@/services/services.service';
import { BaseServiceAreaRepository } from '@/service-areas/persistence/base-service-area.repository';
import { Service } from '@/services/domain/service';
import { ServiceTypeEnum } from '@/services/enums/service-type.enum';
import {
  AvailableSlotsDto,
  AvailableSlotResponseDto,
} from './dto/available-slots.dto';
import dayjs from 'dayjs';
import { getCurrentTimezone } from '@/utils/helpers/timezone.helper';
import { ParametersService } from '@/parameters/parameters.service';
import { ParameterCode } from '@/parameters/parameter.enum';

type AvailabilitySchedule = Pick<
  SellerSchedule,
  'status' | 'start_time' | 'end_time' | 'break_start' | 'break_end'
> & {
  seller_id?: number;
};

const VENUE_CAPACITY_BOOKING_STATUSES: BookingStatusEnum[] = [
  BookingStatusEnum.PENDING,
  BookingStatusEnum.AWAITING_CONFIRMATION,
  BookingStatusEnum.CONFIRMED,
  BookingStatusEnum.IN_PROGRESS,
  BookingStatusEnum.COMPLETED,
];
const DEFAULT_SCHEDULE_TIMEZONE = process.env.DEFAULT_TIMEZONE || 'Asia/Manila';
const SCHEDULE_TIME_STORAGE_MODE_LOCAL = 'local';
const SCHEDULE_TIME_STORAGE_MODE_UTC_CLOCK = 'utc_clock';
const SCHEDULE_SETTINGS_CACHE_TTL_MS = 60_000;

type UnavailableSource = NonNullable<
  AvailableSlotResponseDto['unavailable_source']
>;

@Injectable()
export class SellerSchedulesService {
  private scheduleTimezone = DEFAULT_SCHEDULE_TIMEZONE;
  private scheduleTimeStorageMode = SCHEDULE_TIME_STORAGE_MODE_LOCAL;
  private scheduleSettingsCacheAt = 0;
  private scheduleSettingsRefreshPromise: Promise<void> | null = null;

  constructor(
    private readonly repository: BaseSellerScheduleRepository,
    private readonly sellersService: SellersService,
    private readonly storeUnavailabilityRepository: BaseStoreUnavailabilityRepository,
    private readonly bookingRepository: BaseBookingRepository,
    private readonly parametersService: ParametersService,
    @Inject(forwardRef(() => ServicesService))
    private readonly servicesService: ServicesService,
    private readonly serviceAreaRepository: BaseServiceAreaRepository,
  ) {}

  private async refreshScheduleSettings(force = false): Promise<void> {
    const now = Date.now();
    const isFresh =
      now - this.scheduleSettingsCacheAt < SCHEDULE_SETTINGS_CACHE_TTL_MS;

    if (!force && isFresh) {
      return;
    }

    if (this.scheduleSettingsRefreshPromise) {
      return this.scheduleSettingsRefreshPromise;
    }

    this.scheduleSettingsRefreshPromise = (async () => {
      try {
        const [modeParameter, timezoneParameter] = await Promise.all([
          this.parametersService.findByCode(
            ParameterCode.SCHEDULE_TIME_STORAGE_MODE,
          ),
          this.parametersService.findByCode(ParameterCode.SCHEDULE_TIMEZONE),
        ]);

        const rawMode = String(modeParameter?.string_value ?? '')
          .trim()
          .toLowerCase();
        if (
          rawMode === SCHEDULE_TIME_STORAGE_MODE_LOCAL ||
          rawMode === SCHEDULE_TIME_STORAGE_MODE_UTC_CLOCK
        ) {
          this.scheduleTimeStorageMode = rawMode;
        }

        const rawTimezone = String(
          timezoneParameter?.string_value ?? '',
        ).trim();
        if (rawTimezone) {
          this.scheduleTimezone = rawTimezone;
        }
      } catch {
        // Keep cached/default values when parameters are unavailable.
      } finally {
        this.scheduleSettingsCacheAt = Date.now();
      }
    })();

    try {
      await this.scheduleSettingsRefreshPromise;
    } finally {
      this.scheduleSettingsRefreshPromise = null;
    }
  }

  private get isScheduleTimesStoredAsUtcClock(): boolean {
    return (
      this.scheduleTimeStorageMode === SCHEDULE_TIME_STORAGE_MODE_UTC_CLOCK
    );
  }

  private getScheduleTimezoneOffsetMinutes(): number {
    return getCurrentTimezone(undefined, this.scheduleTimezone).utcOffset();
  }

  private parseTime(time: string): {
    hours: number;
    minutes: number;
    seconds: number;
  } | null {
    const normalized = String(time || '').trim();
    const match = normalized.match(
      /^([01]\d|2[0-4]):([0-5]\d)(?::([0-5]\d))?$/,
    );
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    const seconds = Number(match[3] ?? '00');

    // Allow 24:00(:00) for end-of-day schedules, but reject invalid 24:xx values.
    if (hours === 24 && (minutes !== 0 || seconds !== 0)) {
      return null;
    }

    return {
      hours,
      minutes,
      seconds,
    };
  }

  private normalizeTimeWithSeconds(time?: string | null): string | null {
    if (!time) return null;
    const parsed = this.parseTime(time);
    if (!parsed) return null;
    const hh = String(parsed.hours).padStart(2, '0');
    const mm = String(parsed.minutes).padStart(2, '0');
    const ss = String(parsed.seconds).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }

  private shiftTimeByMinutes(
    time: string,
    deltaMinutes: number,
  ): string | null {
    const parsed = this.parseTime(time);
    if (!parsed) return null;
    const minutesInDay = 24 * 60;
    const isExactEndOfDay =
      parsed.hours === 24 && parsed.minutes === 0 && parsed.seconds === 0;
    if (isExactEndOfDay && deltaMinutes === 0) {
      return '24:00:00';
    }

    const baseMinutes = isExactEndOfDay
      ? minutesInDay
      : parsed.hours * 60 + parsed.minutes;
    const shiftedMinutes =
      (((baseMinutes + deltaMinutes) % minutesInDay) + minutesInDay) %
      minutesInDay;
    const hh = String(Math.floor(shiftedMinutes / 60)).padStart(2, '0');
    const mm = String(shiftedMinutes % 60).padStart(2, '0');
    const ss = String(parsed.seconds).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }

  private toStorageScheduleTime(time?: string | null): string | null {
    const normalized = this.normalizeTimeWithSeconds(time);
    if (!normalized) return null;
    if (!this.isScheduleTimesStoredAsUtcClock) {
      return normalized;
    }
    const shifted = this.shiftTimeByMinutes(
      normalized,
      -this.getScheduleTimezoneOffsetMinutes(),
    );
    return shifted ?? normalized;
  }

  private fromStorageScheduleTime(time?: string | null): string | null {
    const normalized = this.normalizeTimeWithSeconds(time);
    if (!normalized) return null;
    if (!this.isScheduleTimesStoredAsUtcClock) {
      return normalized;
    }
    const shifted = this.shiftTimeByMinutes(
      normalized,
      this.getScheduleTimezoneOffsetMinutes(),
    );
    return shifted ?? normalized;
  }

  private mapScheduleTimesFromStorage<
    T extends {
      start_time?: string | null;
      end_time?: string | null;
      break_start?: string | null;
      break_end?: string | null;
    },
  >(schedule: T): T {
    return {
      ...schedule,
      start_time: this.fromStorageScheduleTime(schedule.start_time),
      end_time: this.fromStorageScheduleTime(schedule.end_time),
      break_start: this.fromStorageScheduleTime(schedule.break_start),
      break_end: this.fromStorageScheduleTime(schedule.break_end),
    };
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes, seconds] = time.split(':').map((v) => Number(v));
    return hours * 60 + minutes + (seconds ? seconds / 60 : 0);
  }

  private formatTimeAmPm(time: string): string {
    const normalized = this.normalizeTimeWithSeconds(time);
    if (!normalized) {
      return time;
    }

    const [hoursStr, minutesStr] = normalized.split(':');
    const hours24 = Number(hoursStr);
    const suffix = hours24 >= 12 ? 'pm' : 'am';
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;

    return `${hours12}:${minutesStr}${suffix}`;
  }

  private buildBookedSlotReason(
    startTime: string,
    endTime: string,
    latestBefore: string | null,
    earliestAfter: string | null,
  ): string {
    const slotLabel = `${this.formatTimeAmPm(startTime)} to ${this.formatTimeAmPm(endTime)}`;

    if (latestBefore && earliestAfter) {
      return `Timeslot ${slotLabel} is booked. Please try ${this.formatTimeAmPm(latestBefore)} (latest time before the selected time slot) or ${this.formatTimeAmPm(earliestAfter)} (earliest time after the selected time slot).`;
    }

    if (latestBefore) {
      return `Timeslot ${slotLabel} is booked. Please try ${this.formatTimeAmPm(latestBefore)} (latest time before the selected time slot).`;
    }

    if (earliestAfter) {
      return `Timeslot ${slotLabel} is booked. Please try ${this.formatTimeAmPm(earliestAfter)} (earliest time after the selected time slot).`;
    }

    return `Timeslot ${slotLabel} is booked. Please choose a different time.`;
  }

  private async findNearestAvailableStartTimes(
    dto: CheckAvailabilityDto,
    dayOfWeek: number,
    stepMinutes: number,
  ): Promise<{ latestBefore: string | null; earliestAfter: string | null }> {
    const requestedStart = this.timeToMinutes(dto.start_time);
    const requestedEnd = this.timeToMinutes(dto.end_time);
    const slotDuration = Math.round(requestedEnd - requestedStart);

    if (!Number.isFinite(slotDuration) || slotDuration <= 0) {
      return { latestBefore: null, earliestAfter: null };
    }

    const schedule = await this.getSellerSchedule(dto.seller_id, dayOfWeek);
    if (
      !schedule ||
      schedule.status !== 'Active' ||
      !schedule.start_time ||
      !schedule.end_time
    ) {
      return { latestBefore: null, earliestAfter: null };
    }

    const scheduleStart = this.timeToMinutes(schedule.start_time);
    const scheduleEnd = this.timeToMinutes(schedule.end_time);
    const step = Math.max(5, Math.round(stepMinutes));

    let latestBefore: string | null = null;
    for (
      let candidateStart = requestedStart - step;
      candidateStart >= scheduleStart;
      candidateStart -= step
    ) {
      const candidateEnd = candidateStart + slotDuration;
      if (candidateEnd > scheduleEnd) continue;

      const availability = await this.checkAvailability(
        {
          ...dto,
          day_of_week: dayOfWeek,
          start_time: this.minutesToTime(candidateStart),
          end_time: this.minutesToTime(candidateEnd),
        },
        { includeAlternativeSuggestions: false },
      );

      if (availability.available) {
        latestBefore = this.minutesToTime(candidateStart);
        break;
      }
    }

    let earliestAfter: string | null = null;
    for (
      let candidateStart = requestedStart + step;
      candidateStart + slotDuration <= scheduleEnd;
      candidateStart += step
    ) {
      const candidateEnd = candidateStart + slotDuration;

      const availability = await this.checkAvailability(
        {
          ...dto,
          day_of_week: dayOfWeek,
          start_time: this.minutesToTime(candidateStart),
          end_time: this.minutesToTime(candidateEnd),
        },
        { includeAlternativeSuggestions: false },
      );

      if (availability.available) {
        earliestAfter = this.minutesToTime(candidateStart);
        break;
      }
    }

    return { latestBefore, earliestAfter };
  }

  private getMinimumNoticeMinutes(service: Service): number {
    const minimumNoticeMinutes = Number(service.minimum_notice_hours);
    if (!Number.isFinite(minimumNoticeMinutes) || minimumNoticeMinutes < 0) {
      return 0;
    }

    return Math.ceil(minimumNoticeMinutes);
  }

  private formatLeadTimeLabel(minutes: number): string {
    const normalizedMinutes = Math.max(0, Math.ceil(minutes));
    const hours = Math.floor(normalizedMinutes / 60);
    const remainingMinutes = normalizedMinutes % 60;

    if (hours > 0 && remainingMinutes > 0) {
      const hoursLabel = hours === 1 ? '1 hour' : `${hours} hours`;
      const minutesLabel =
        remainingMinutes === 1 ? '1 minute' : `${remainingMinutes} minutes`;
      return `${hoursLabel} ${minutesLabel}`;
    }

    if (hours > 0) {
      return hours === 1 ? '1 hour' : `${hours} hours`;
    }

    return normalizedMinutes === 1
      ? '1 minute'
      : `${normalizedMinutes} minutes`;
  }

  private getMinimumNoticeReason(minutes: number): string {
    if (minutes <= 0) {
      return 'Booking start time must be in the future';
    }

    return `Bookings require at least ${this.formatLeadTimeLabel(minutes)} lead time`;
  }

  private parseScheduleDateStart(date: string) {
    const normalizedDate = String(date || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
      return null;
    }

    const parsed = dayjs.tz(
      `${normalizedDate}T00:00:00`,
      this.scheduleTimezone,
    );
    if (!parsed.isValid()) {
      return null;
    }

    return parsed.startOf('day');
  }

  private getScheduleDayOfWeek(date: string): number | null {
    const parsedDate = this.parseScheduleDateStart(date);
    if (!parsedDate) return null;
    return parsedDate.day();
  }

  private parseScheduleDateTime(date: string, time: string) {
    const normalizedDate = String(date || '').trim();
    const normalizedTime = this.normalizeTimeWithSeconds(time);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate) || !normalizedTime) {
      return null;
    }

    const parsed = dayjs.tz(
      `${normalizedDate}T${normalizedTime}`,
      this.scheduleTimezone,
    );
    if (!parsed.isValid()) {
      return null;
    }

    return parsed;
  }

  private ensureTimeWindow(
    start?: string | null,
    end?: string | null,
    label = 'schedule',
  ) {
    if ((start && !end) || (end && !start)) {
      throw new BadRequestException(
        `${label} start_time and end_time must both be provided together`,
      );
    }
    if (start && end && this.timeToMinutes(start) >= this.timeToMinutes(end)) {
      throw new BadRequestException(
        `${label} start_time must be before end_time`,
      );
    }
  }

  private ensureBreakWindow(
    breakStart?: string | null,
    breakEnd?: string | null,
  ) {
    if ((breakStart && !breakEnd) || (breakEnd && !breakStart)) {
      throw new BadRequestException(
        'break_start and break_end must both be provided together',
      );
    }
    if (
      breakStart &&
      breakEnd &&
      this.timeToMinutes(breakStart) >= this.timeToMinutes(breakEnd)
    ) {
      throw new BadRequestException(
        'break_start must be before break_end when provided',
      );
    }
  }

  async create(dto: CreateSellerScheduleDto, causer: User) {
    await this.refreshScheduleSettings();
    await this.sellersService.findById(dto.seller_id);
    this.ensureTimeWindow(dto.start_time, dto.end_time);
    this.ensureBreakWindow(dto.break_start, dto.break_end);

    const existing = await this.repository.findBySellerAndDay(
      dto.seller_id,
      dto.day_of_week,
    );
    if (existing) {
      throw new UnprocessableEntityException(
        'A schedule for this seller and day already exists',
      );
    }

    const schedule = Object.assign(new SellerSchedule(), dto, {
      status: dto.status ?? 'Active',
      start_time: this.toStorageScheduleTime(dto.start_time ?? null),
      end_time: this.toStorageScheduleTime(dto.end_time ?? null),
      break_start: this.toStorageScheduleTime(dto.break_start ?? null),
      break_end: this.toStorageScheduleTime(dto.break_end ?? null),
      created_by: causer,
      updated_by: causer,
    });

    const created = await this.repository.create(schedule);
    return this.mapScheduleTimesFromStorage(created);
  }

  async findAll(query: QuerySellerScheduleDto) {
    await this.refreshScheduleSettings();
    const { data, totalCount } = await this.repository.findAll(query);
    return {
      data: data.map((schedule) => this.mapScheduleTimesFromStorage(schedule)),
      totalCount,
    };
  }

  async findById(id: number) {
    await this.refreshScheduleSettings();
    const schedule = await this.repository.findById(id);
    if (!schedule) throw new NotFoundException('Seller schedule not found');
    return this.mapScheduleTimesFromStorage(schedule);
  }

  async update(id: number, dto: UpdateSellerScheduleDto, causer: User) {
    await this.refreshScheduleSettings();
    const existing = await this.findById(id);
    const sellerId = dto.seller_id ?? existing.seller_id;
    const dayOfWeek = dto.day_of_week ?? existing.day_of_week;

    await this.sellersService.findById(sellerId);
    this.ensureTimeWindow(dto.start_time, dto.end_time);

    // For break window validation, we need to consider the merged state
    // If break_start or break_end is explicitly in the DTO (including null), use that value
    // Otherwise use the existing value from the database
    const hasBreakStartInDto = 'break_start' in dto;
    const hasBreakEndInDto = 'break_end' in dto;

    const mergedBreakStart = hasBreakStartInDto
      ? dto.break_start
      : existing.break_start;
    const mergedBreakEnd = hasBreakEndInDto
      ? dto.break_end
      : existing.break_end;

    this.ensureBreakWindow(mergedBreakStart, mergedBreakEnd);

    if (
      (dto.seller_id && dto.seller_id !== existing.seller_id) ||
      (dto.day_of_week !== undefined &&
        dto.day_of_week !== existing.day_of_week)
    ) {
      const conflict = await this.repository.findBySellerAndDay(
        sellerId,
        dayOfWeek,
      );
      if (conflict && conflict.id !== id) {
        throw new UnprocessableEntityException(
          'A schedule for this seller and day already exists',
        );
      }
    }

    const payload: Partial<SellerSchedule> = {
      ...dto,
      seller_id: sellerId,
      day_of_week: dayOfWeek,
      updated_by: causer,
    };

    if ('start_time' in dto) {
      payload.start_time = this.toStorageScheduleTime(dto.start_time ?? null);
    }
    if ('end_time' in dto) {
      payload.end_time = this.toStorageScheduleTime(dto.end_time ?? null);
    }
    if ('break_start' in dto) {
      payload.break_start = this.toStorageScheduleTime(dto.break_start ?? null);
    }
    if ('break_end' in dto) {
      payload.break_end = this.toStorageScheduleTime(dto.break_end ?? null);
    }

    const updated = await this.repository.update(id, payload);
    return this.mapScheduleTimesFromStorage(updated);
  }

  async remove(id: number, causer: User) {
    await this.findById(id);
    await this.repository.remove(id, causer?.id);
  }

  /**
   * Get seller schedule for a specific day.
   * Simplified: Only uses seller-level schedule (no member schedules).
   */
  private async getSellerSchedule(
    sellerId: number,
    dayOfWeek: number,
  ): Promise<AvailabilitySchedule | null> {
    const schedule = await this.repository.findBySellerAndDay(
      sellerId,
      dayOfWeek,
    );
    if (!schedule) return null;
    return this.mapScheduleTimesFromStorage(schedule);
  }

  private isWithinSchedule(
    schedule: AvailabilitySchedule,
    startTime: string,
    endTime: string,
  ) {
    if (schedule.status !== 'Active') return false;
    if (schedule.start_time && schedule.end_time) {
      const windowStart = this.timeToMinutes(schedule.start_time);
      const windowEnd = this.timeToMinutes(schedule.end_time);
      const reqStart = this.timeToMinutes(startTime);
      const reqEnd = this.timeToMinutes(endTime);
      return reqStart >= windowStart && reqEnd <= windowEnd;
    }
    return true;
  }

  private hasOverlap(
    blocks: StoreUnavailability[],
    startTime: string,
    endTime: string,
  ): StoreUnavailability | null {
    const reqStart = this.timeToMinutes(startTime);
    const reqEnd = this.timeToMinutes(endTime);
    for (const block of blocks) {
      if (block.is_full_day || (!block.start_time && !block.end_time)) {
        return block;
      }
      const blockStart = this.timeToMinutes(block.start_time as string);
      const blockEnd = this.timeToMinutes(block.end_time as string);
      const overlaps =
        (blockStart <= reqStart && blockEnd > reqStart) ||
        (blockStart < reqEnd && blockEnd >= reqEnd) ||
        (blockStart >= reqStart && blockEnd <= reqEnd);
      if (overlaps) return block;
    }
    return null;
  }

  /**
   * Check availability for a specific time slot.
   * Validation logic:
   * 1. Check seller schedule exists and is active
   * 2. Check time is within schedule window
   * 3. Check for store unavailability blocks
   * 4. Check concurrent booking capacity (seller level)
   * 5. Check advance_booking_days limit (service level)
   * 6. Check minimum lead time (service minimum_notice_hours, interpreted as minutes)
   * 7. Check max_daily_bookings (service level)
   * 8. Check service area coverage (service level)
   */
  async checkAvailability(
    dto: CheckAvailabilityDto,
    options?: { includeAlternativeSuggestions?: boolean },
  ) {
    await this.refreshScheduleSettings();
    const includeAlternativeSuggestions =
      options?.includeAlternativeSuggestions ?? true;
    const seller = await this.sellersService.findById(dto.seller_id);
    const computedDayOfWeek = this.getScheduleDayOfWeek(dto.date);
    const dayOfWeek = dto.day_of_week ?? computedDayOfWeek;

    if (dayOfWeek === null || dayOfWeek === undefined) {
      throw new BadRequestException('date must be in YYYY-MM-DD format');
    }

    if (dayOfWeek < 0 || dayOfWeek > 6) {
      throw new BadRequestException('day_of_week must be between 0 and 6');
    }

    this.ensureTimeWindow(dto.start_time, dto.end_time, 'requested window');

    // Get seller schedule (simplified - no member schedules)
    const schedule = await this.getSellerSchedule(dto.seller_id, dayOfWeek);

    if (!schedule) {
      return {
        available: false,
        reason: 'No schedule found for requested day',
        source: 'rule' as UnavailableSource,
      };
    }

    if (!this.isWithinSchedule(schedule, dto.start_time, dto.end_time)) {
      return {
        available: false,
        reason: 'Requested time is outside available schedule',
        source: 'rule' as UnavailableSource,
      };
    }

    // Check for unavailability blocks (service-scoped when service_id is provided).
    const conflicts =
      await this.storeUnavailabilityRepository.findOverlapsForWindow({
        seller_id: dto.seller_id,
        service_id: dto.service_id,
        date: dto.date,
        start_time: dto.start_time,
        end_time: dto.end_time,
      });

    const overlap = this.hasOverlap(conflicts, dto.start_time, dto.end_time);
    if (overlap) {
      return {
        available: false,
        reason: overlap.reason ?? 'Blocked by venue',
        source: 'blocked' as UnavailableSource,
      };
    }

    // ==================== Capacity check ====================
    // For venue services, check per-service capacity.
    // For other services, check seller-level concurrent booking capacity.
    let venueService: Service | undefined;
    if (dto.service_id) {
      try {
        venueService = await this.servicesService.findById(dto.service_id);
      } catch {
        // Service not found — fall through to seller-level check
      }
    }

    if (
      venueService?.service_type === ServiceTypeEnum.VENUE &&
      venueService.venue_capacity
    ) {
      // Venue: count overlapping bookings for THIS SERVICE (not seller-level)
      const overlappingBookings =
        await this.bookingRepository.findOverlappingBookings({
          seller_id: dto.seller_id,
          date: dto.date,
          start_time: dto.start_time,
          end_time: dto.end_time,
          exclude_booking_id: dto.exclude_booking_id,
          exclude_customer_id: dto.exclude_customer_id,
          service_id: dto.service_id,
          statuses: [
            BookingStatusEnum.PENDING,
            BookingStatusEnum.AWAITING_CONFIRMATION,
            BookingStatusEnum.CONFIRMED,
            BookingStatusEnum.IN_PROGRESS,
            BookingStatusEnum.COMPLETED,
          ],
        });

      const maxCapacity = venueService.venue_capacity;
      const remaining = maxCapacity - overlappingBookings.length;

      if (remaining <= 0) {
        const suggestions = includeAlternativeSuggestions
          ? await this.findNearestAvailableStartTimes(
              dto,
              dayOfWeek,
              venueService.slot_duration_minutes || 60,
            )
          : { latestBefore: null, earliestAfter: null };

        return {
          available: false,
          reason: this.buildBookedSlotReason(
            dto.start_time,
            dto.end_time,
            suggestions.latestBefore,
            suggestions.earliestAfter,
          ),
          source: 'capacity' as UnavailableSource,
          concurrent_bookings: overlappingBookings.length,
          max_concurrent: maxCapacity,
        };
      }

      // Service-level validations (advance days, notice hours, etc.)
      const serviceValidation = await this.validateServiceLevelConstraints(
        dto.service_id!,
        dto.date,
        dto.start_time,
        dto,
      );
      if (!serviceValidation.available) {
        return serviceValidation;
      }

      return {
        available: true,
        concurrent_bookings: overlappingBookings.length,
        max_concurrent: maxCapacity,
      };
    }

    // Non-venue: seller-level concurrent booking check
    // If exclude_customer_id is provided, exclude that customer's bookings
    // (useful when adding to cart - allows user to add service even if they have existing booking)
    const overlappingBookings =
      await this.bookingRepository.findOverlappingBookings({
        seller_id: dto.seller_id,
        date: dto.date,
        start_time: dto.start_time,
        end_time: dto.end_time,
        exclude_booking_id: dto.exclude_booking_id,
        exclude_customer_id: dto.exclude_customer_id,
      });

    const maxConcurrent = seller.max_concurrent_bookings || 1;

    if (overlappingBookings.length >= maxConcurrent) {
      const suggestions = includeAlternativeSuggestions
        ? await this.findNearestAvailableStartTimes(dto, dayOfWeek, 15)
        : { latestBefore: null, earliestAfter: null };

      const reason = this.buildBookedSlotReason(
        dto.start_time,
        dto.end_time,
        suggestions.latestBefore,
        suggestions.earliestAfter,
      );

      return {
        available: false,
        reason,
        source: 'booking' as UnavailableSource,
        concurrent_bookings: overlappingBookings.length,
        max_concurrent: maxConcurrent,
      };
    }

    // ==================== Service-level validations ====================
    // Only perform if service_id is provided
    if (dto.service_id) {
      const serviceValidation = await this.validateServiceLevelConstraints(
        dto.service_id,
        dto.date,
        dto.start_time,
        dto,
      );
      if (!serviceValidation.available) {
        return serviceValidation;
      }
    }

    return {
      available: true,
      concurrent_bookings: overlappingBookings.length,
      max_concurrent: maxConcurrent,
    };
  }

  /**
   * Validate service-level constraints.
   *
   * Checks:
   * - advance_booking_days: How far in advance can book
   * - minimum lead time: minimum_notice_hours minutes from now
   * - max_daily_bookings: Maximum bookings per day for this service
   * - Service area coverage: Location within service area
   */
  private async validateServiceLevelConstraints(
    serviceId: number,
    date: string,
    startTime: string,
    locationDto: {
      city?: string;
      province?: string;
      postal_code?: string;
      latitude?: number;
      longitude?: number;
      skip_minimum_notice_hours?: boolean;
    },
  ): Promise<{
    available: boolean;
    reason?: string;
    source?: UnavailableSource;
  }> {
    let service: Service;
    try {
      service = await this.servicesService.findById(serviceId);
    } catch {
      return {
        available: false,
        reason: 'Service not found',
        source: 'rule' as UnavailableSource,
      };
    }

    const now = getCurrentTimezone(undefined, this.scheduleTimezone);
    const bookingDateTime = this.parseScheduleDateTime(date, startTime);

    if (!bookingDateTime) {
      return {
        available: false,
        reason: 'Invalid booking date or time',
        source: 'rule' as UnavailableSource,
      };
    }

    // 1. Check advance_booking_days
    if (service.advance_booking_days) {
      const maxAdvanceDate = now
        .add(service.advance_booking_days, 'day')
        .endOf('day');

      if (bookingDateTime.valueOf() > maxAdvanceDate.valueOf()) {
        return {
          available: false,
          reason: `Bookings can only be made up to ${service.advance_booking_days} days in advance`,
          source: 'rule' as UnavailableSource,
        };
      }
    }

    // 2. Check minimum_notice_hours (stored in DB but interpreted as minutes)
    if (!locationDto.skip_minimum_notice_hours) {
      const minimumNoticeMinutes = this.getMinimumNoticeMinutes(service);
      const earliestAllowedStart = now.add(minimumNoticeMinutes, 'minute');

      if (bookingDateTime.valueOf() < earliestAllowedStart.valueOf()) {
        return {
          available: false,
          reason: this.getMinimumNoticeReason(minimumNoticeMinutes),
          source: 'notice' as UnavailableSource,
        };
      }
    }

    // 3. Check max_daily_bookings
    if (service.max_bookings_per_day) {
      const dailyCount =
        await this.bookingRepository.countDailyBookingsForService(
          serviceId,
          date,
        );

      if (dailyCount >= service.max_bookings_per_day) {
        return {
          available: false,
          reason: `Maximum daily bookings (${service.max_bookings_per_day}) reached for this service`,
          source: 'daily_limit' as UnavailableSource,
        };
      }
    }

    // 4. Check service area coverage (only if location is provided and service requires it)
    // Skip location check if service is remote, walk-in, or legacy remote-available
    if (
      service.service_location_type === 'remote' ||
      service.service_location_type === 'walk_in' ||
      service.is_remote_available
    ) {
      return { available: true };
    }

    const hasLocationInfo =
      locationDto.city ||
      locationDto.province ||
      locationDto.postal_code ||
      (locationDto.latitude && locationDto.longitude);

    if (hasLocationInfo) {
      // Get seller for fallback location check using service_radius_km
      let sellerLatitude: number | undefined;
      let sellerLongitude: number | undefined;

      try {
        const seller = await this.sellersService.findById(service.seller_id);
        sellerLatitude = seller.pickup_latitude ?? undefined;
        sellerLongitude = seller.pickup_longitude ?? undefined;
      } catch {
        // Seller lookup failed, continue without seller coordinates
      }

      const areaCoverage =
        await this.serviceAreaRepository.checkLocationCoverage({
          service_id: serviceId,
          city: locationDto.city,
          province: locationDto.province,
          postal_code: locationDto.postal_code,
          latitude: locationDto.latitude,
          longitude: locationDto.longitude,
          // Pass service_radius_km as fallback for distance check
          service_radius_km: service.service_radius_km ?? undefined,
          seller_latitude: sellerLatitude,
          seller_longitude: sellerLongitude,
        });

      if (!areaCoverage.covered) {
        return {
          available: false,
          reason: 'Service is not available in this location',
          source: 'location' as UnavailableSource,
        };
      }
    }

    return { available: true };
  }

  private hasLocationInfo(
    location: Pick<
      AvailableSlotsDto,
      'city' | 'province' | 'postal_code' | 'latitude' | 'longitude'
    >,
  ): boolean {
    return Boolean(
      location.city ||
        location.province ||
        location.postal_code ||
        (location.latitude !== undefined &&
          location.latitude !== null &&
          location.longitude !== undefined &&
          location.longitude !== null),
    );
  }

  private doesBookingOverlapSlot(
    booking: Booking,
    slotStartMinutes: number,
    slotEndMinutes: number,
  ): boolean {
    if (!booking.scheduled_start_time) {
      return false;
    }

    const bookingStartMinutes = this.timeToMinutes(
      booking.scheduled_start_time,
    );
    // Keep parity with findOverlappingBookings SQL (COALESCE(end, start))
    const bookingEndMinutes = booking.scheduled_end_time
      ? this.timeToMinutes(booking.scheduled_end_time)
      : bookingStartMinutes;

    return (
      bookingStartMinutes < slotEndMinutes &&
      bookingEndMinutes > slotStartMinutes
    );
  }

  private async hasServiceAreaCoverage(
    service: Service,
    location: Pick<
      AvailableSlotsDto,
      'city' | 'province' | 'postal_code' | 'latitude' | 'longitude'
    >,
  ): Promise<boolean> {
    if (
      service.service_location_type === 'remote' ||
      service.service_location_type === 'walk_in' ||
      service.is_remote_available
    ) {
      return true;
    }

    if (!this.hasLocationInfo(location)) {
      return true;
    }

    let sellerLatitude: number | undefined;
    let sellerLongitude: number | undefined;

    try {
      const seller = await this.sellersService.findById(service.seller_id);
      sellerLatitude = seller.pickup_latitude ?? undefined;
      sellerLongitude = seller.pickup_longitude ?? undefined;
    } catch {
      // Seller lookup failed, continue without seller coordinates
    }

    const areaCoverage = await this.serviceAreaRepository.checkLocationCoverage(
      {
        service_id: service.id,
        city: location.city,
        province: location.province,
        postal_code: location.postal_code,
        latitude: location.latitude,
        longitude: location.longitude,
        service_radius_km: service.service_radius_km ?? undefined,
        seller_latitude: sellerLatitude,
        seller_longitude: sellerLongitude,
      },
    );

    return areaCoverage.covered;
  }

  private async getVenueAvailableSlotsOptimized(params: {
    dto: AvailableSlotsDto;
    service: Service;
    sellerId: number;
    dayOfWeek: number;
    slotDuration: number;
  }): Promise<AvailableSlotResponseDto[]> {
    const { dto, service, sellerId, dayOfWeek, slotDuration } = params;
    const schedule = await this.getSellerSchedule(sellerId, dayOfWeek);

    if (
      !schedule ||
      schedule.status !== 'Active' ||
      !schedule.start_time ||
      !schedule.end_time
    ) {
      return [];
    }

    const [
      dayConflicts,
      sellerBookingsForDay,
      serviceAreaCovered,
      dailyBookingCount,
    ] = await Promise.all([
      this.storeUnavailabilityRepository.findOverlapsForWindow({
        seller_id: sellerId,
        service_id: service.id,
        date: dto.date,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
      }),
      this.bookingRepository.findBySellerAndDate(sellerId, dto.date),
      this.hasServiceAreaCoverage(service, dto),
      service.max_bookings_per_day
        ? this.bookingRepository.countDailyBookingsForService(
            service.id,
            dto.date,
          )
        : Promise.resolve(0),
    ]);

    const isDailyLimitReached = Boolean(
      service.max_bookings_per_day &&
        dailyBookingCount >= service.max_bookings_per_day,
    );
    const totalCapacity = service.venue_capacity || 0;
    const basePrice = Number(service.base_price) || 0;
    const now = getCurrentTimezone(undefined, this.scheduleTimezone);
    const isRequestedDateToday = dto.date === now.format('YYYY-MM-DD');
    const minimumLeadMinutes = this.getMinimumNoticeMinutes(service);
    const minimumAllowedStartMinutes = isRequestedDateToday
      ? now.hour() * 60 + now.minute() + now.second() / 60 + minimumLeadMinutes
      : null;
    const minimumNoticeReason = this.getMinimumNoticeReason(minimumLeadMinutes);

    const activeServiceBookings = sellerBookingsForDay.filter(
      (booking) =>
        booking.service_id === service.id &&
        VENUE_CAPACITY_BOOKING_STATUSES.includes(booking.status),
    );

    const slots: AvailableSlotResponseDto[] = [];
    const scheduleStart = this.timeToMinutes(schedule.start_time);
    const scheduleEnd = this.timeToMinutes(schedule.end_time);
    const breakStart = schedule.break_start
      ? this.timeToMinutes(schedule.break_start)
      : null;
    const breakEnd = schedule.break_end
      ? this.timeToMinutes(schedule.break_end)
      : null;

    let currentTime = scheduleStart;
    while (currentTime + slotDuration <= scheduleEnd) {
      const slotStartMinutes = currentTime;
      const slotEndMinutes = currentTime + slotDuration;

      if (
        breakStart !== null &&
        breakEnd !== null &&
        slotStartMinutes < breakEnd &&
        slotEndMinutes > breakStart
      ) {
        currentTime = breakEnd;
        continue;
      }

      const startTimeStr = this.minutesToTime(slotStartMinutes);
      const endTimeStr = this.minutesToTime(slotEndMinutes);
      const bookedCount = activeServiceBookings.reduce(
        (count, booking) =>
          count +
          (this.doesBookingOverlapSlot(
            booking,
            slotStartMinutes,
            slotEndMinutes,
          )
            ? 1
            : 0),
        0,
      );
      const remaining = Math.max(0, totalCapacity - bookedCount);
      const overlappingBlock = this.hasOverlap(
        dayConflicts,
        startTimeStr,
        endTimeStr,
      );
      const hasUnavailabilityConflict = overlappingBlock !== null;
      const hasMinimumLeadTime =
        minimumAllowedStartMinutes === null ||
        slotStartMinutes >= minimumAllowedStartMinutes;
      const isPeak = this.isPeakSlot(startTimeStr, service, dayOfWeek);
      const isAvailable =
        hasMinimumLeadTime &&
        serviceAreaCovered &&
        !hasUnavailabilityConflict &&
        remaining > 0 &&
        !isDailyLimitReached;

      let unavailableReason: string | null = null;
      let unavailableSource: UnavailableSource | undefined;
      if (!isAvailable) {
        if (!hasMinimumLeadTime) {
          unavailableReason = minimumNoticeReason;
          unavailableSource = 'notice';
        } else if (hasUnavailabilityConflict) {
          unavailableReason = overlappingBlock?.reason ?? 'Blocked by venue';
          unavailableSource = 'blocked';
        } else if (remaining <= 0) {
          unavailableReason = 'This time slot is already booked';
          unavailableSource = bookedCount > 0 ? 'booking' : 'capacity';
        } else if (isDailyLimitReached) {
          unavailableReason = `Maximum daily bookings (${service.max_bookings_per_day}) reached for this service`;
          unavailableSource = 'daily_limit';
        } else if (!serviceAreaCovered) {
          unavailableReason = 'Service is not available in this location';
          unavailableSource = 'location';
        } else {
          unavailableReason = 'Unavailable';
          unavailableSource = 'rule';
        }
      }

      slots.push({
        start_time: startTimeStr,
        end_time: endTimeStr,
        available: isAvailable,
        total_capacity: totalCapacity,
        booked_count: bookedCount,
        remaining,
        is_peak: isPeak,
        hourly_rate: isPeak
          ? basePrice * Number(service.peak_price_multiplier || 1)
          : basePrice,
        unavailable_reason: unavailableReason,
        unavailable_source: unavailableSource,
      });

      currentTime += slotDuration;
    }

    return slots;
  }

  /**
   * Get available time slots for a service on a specific date.
   * Includes all validations: schedule, capacity, and service-level constraints.
   *
   * @param dto - Available slots query DTO
   * @returns Array of available time slots
   */
  async getAvailableSlots(
    dto: AvailableSlotsDto,
  ): Promise<AvailableSlotResponseDto[]> {
    await this.refreshScheduleSettings();
    // Get service to find seller_id and service-level constraints
    const service = await this.servicesService.findById(dto.service_id);
    const sellerId = service.seller_id;
    const parsedRequestedDate = this.parseScheduleDateStart(dto.date);
    if (!parsedRequestedDate) {
      return [];
    }
    const dayOfWeek = parsedRequestedDate.day();
    const isVenue = service.service_type === ServiceTypeEnum.VENUE;

    // For venue services, always use service.slot_duration_minutes
    // For other services, use DTO or estimated_duration_minutes
    const slotDuration = isVenue
      ? service.slot_duration_minutes || 60
      : dto.slot_duration_minutes || service.estimated_duration_minutes || 30;

    // ==================== Early validation: Date-level checks ====================
    const now = getCurrentTimezone(undefined, this.scheduleTimezone);

    // Check advance_booking_days (date level)
    if (service.advance_booking_days) {
      const maxAdvanceDate = now
        .add(service.advance_booking_days, 'day')
        .endOf('day');

      if (parsedRequestedDate.valueOf() > maxAdvanceDate.valueOf()) {
        // Return empty - date is too far in advance
        return [];
      }
    }

    // Check if date is in the past
    const todayStart = now.startOf('day');
    if (parsedRequestedDate.valueOf() < todayStart.valueOf()) {
      // Return empty - date is in the past
      return [];
    }

    if (isVenue && service.venue_capacity) {
      return this.getVenueAvailableSlotsOptimized({
        dto,
        service,
        sellerId,
        dayOfWeek,
        slotDuration,
      });
    }

    // Get seller schedule
    const schedule = await this.getSellerSchedule(sellerId, dayOfWeek);

    if (
      !schedule ||
      schedule.status !== 'Active' ||
      !schedule.start_time ||
      !schedule.end_time
    ) {
      return [];
    }

    const slots: AvailableSlotResponseDto[] = [];
    const scheduleStart = this.timeToMinutes(schedule.start_time);
    const scheduleEnd = this.timeToMinutes(schedule.end_time);
    const breakStart = schedule.break_start
      ? this.timeToMinutes(schedule.break_start)
      : null;
    const breakEnd = schedule.break_end
      ? this.timeToMinutes(schedule.break_end)
      : null;

    // Generate slots
    let currentTime = scheduleStart;
    while (currentTime + slotDuration <= scheduleEnd) {
      const slotStart = currentTime;
      const slotEnd = currentTime + slotDuration;

      // Skip if slot overlaps with break
      if (
        breakStart !== null &&
        breakEnd !== null &&
        slotStart < breakEnd &&
        slotEnd > breakStart
      ) {
        // For venue services, jump past break; for others, try next 15-min interval
        if (isVenue) {
          currentTime = breakEnd;
        } else {
          currentTime += 15;
        }
        continue;
      }

      // Convert back to time string
      const startTimeStr = this.minutesToTime(slotStart);
      const endTimeStr = this.minutesToTime(slotEnd);

      // Check availability for this slot (includes service-level validations)
      const availability = await this.checkAvailability({
        seller_id: sellerId,
        date: dto.date,
        start_time: startTimeStr,
        end_time: endTimeStr,
        day_of_week: dayOfWeek,
        service_id: dto.service_id,
      });

      const slot: AvailableSlotResponseDto = {
        start_time: startTimeStr,
        end_time: endTimeStr,
        available: availability.available,
      };

      if (!availability.available) {
        slot.unavailable_reason = availability.reason ?? 'Unavailable';
        slot.unavailable_source =
          availability.source ?? ('rule' as UnavailableSource);
      }

      // For venue services, include capacity and pricing info
      if (isVenue) {
        const totalCapacity = service.venue_capacity || 0;
        const bookedCount =
          'concurrent_bookings' in availability
            ? (availability.concurrent_bookings as number)
            : 0;
        slot.total_capacity = totalCapacity;
        slot.booked_count = bookedCount;
        slot.remaining = Math.max(0, totalCapacity - bookedCount);
        slot.is_peak = this.isPeakSlot(startTimeStr, service, dayOfWeek);

        const basePrice = Number(service.base_price) || 0;
        slot.hourly_rate = slot.is_peak
          ? basePrice * Number(service.peak_price_multiplier || 1)
          : basePrice;
      }

      slots.push(slot);

      // For venue services, step by slot duration (no fragmentation)
      // For other services, step by 15-minute intervals
      currentTime += isVenue ? slotDuration : 15;
    }

    // For non-venue services, only return available slots
    // For venue services, return all slots (including full ones) for the UI
    if (!isVenue) {
      return slots.filter((slot) => slot.available);
    }

    return slots;
  }

  /**
   * Determine if a time slot falls within peak pricing hours.
   */
  private isPeakSlot(
    startTime: string,
    service: Service,
    dayOfWeek: number,
  ): boolean {
    if (!service.peak_price_multiplier || !service.peak_days?.length) {
      return false;
    }
    if (!service.peak_days.includes(dayOfWeek)) {
      return false;
    }
    // If no peak hours specified, the entire peak day is peak
    if (!service.peak_start_time || !service.peak_end_time) {
      return true;
    }
    // Check if slot start time falls within peak hours
    const slotMinutes = this.timeToMinutes(startTime);
    const peakStart = this.timeToMinutes(service.peak_start_time);
    const peakEnd = this.timeToMinutes(service.peak_end_time);
    return slotMinutes >= peakStart && slotMinutes < peakEnd;
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;
  }

  /**
   * Bulk check availability for multiple service items.
   *
   * Checks each item in parallel for efficiency.
   * Returns individual results for each item plus an overall all_available flag.
   *
   * @param items Array of items to check
   * @returns Bulk availability response with all_available flag and individual results
   */
  async checkBulkAvailability(
    items: Array<{
      seller_id: number;
      service_id: number;
      date: string;
      start_time: string;
      end_time: string;
      day_of_week?: number;
      city?: string;
      province?: string;
      postal_code?: string;
      latitude?: number;
      longitude?: number;
    }>,
  ) {
    // Check all items in parallel
    const results = await Promise.all(
      items.map(async (item) => {
        try {
          const availability = await this.checkAvailability({
            seller_id: item.seller_id,
            date: item.date,
            start_time: item.start_time,
            end_time: item.end_time,
            day_of_week: item.day_of_week,
            service_id: item.service_id,
            city: item.city,
            province: item.province,
            postal_code: item.postal_code,
            latitude: item.latitude,
            longitude: item.longitude,
          });

          return {
            service_id: item.service_id,
            available: availability.available,
            reason: availability.reason,
            concurrent_bookings:
              'concurrent_bookings' in availability
                ? availability.concurrent_bookings
                : undefined,
            max_concurrent:
              'max_concurrent' in availability
                ? availability.max_concurrent
                : undefined,
          };
        } catch (error) {
          // Handle any errors for individual items
          return {
            service_id: item.service_id,
            available: false,
            reason:
              error instanceof Error
                ? error.message
                : 'Unable to check availability',
          };
        }
      }),
    );

    const allAvailable = results.every((r) => r.available);

    return {
      all_available: allAvailable,
      results,
    };
  }
}
