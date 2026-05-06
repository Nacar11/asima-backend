import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BaseStoreUnavailabilityRepository } from '@/store-unavailability/persistence/base-store-unavailability.repository';
import { CreateStoreUnavailabilityDto } from '@/store-unavailability/dto/create-store-unavailability.dto';
import { UpdateStoreUnavailabilityDto } from '@/store-unavailability/dto/update-store-unavailability.dto';
import { QueryStoreUnavailabilityDto } from '@/store-unavailability/dto/query-store-unavailability.dto';
import { StoreUnavailability } from '@/store-unavailability/domain/store-unavailability';
import { SellersService } from '@/sellers/sellers.service';
import { ServicesService } from '@/services/services.service';
import { User } from '@/users/domain/user';
import { BaseBookingRepository } from '@/bookings/persistence/base-booking.repository';
import { BookingStatusEnum } from '@/bookings/enums/booking-status.enum';
import { AvailabilityRealtimeService } from '@/availability-realtime/availability-realtime.service';

const SLOT_OCCUPYING_BOOKING_STATUSES: BookingStatusEnum[] = [
  BookingStatusEnum.PENDING,
  BookingStatusEnum.AWAITING_CONFIRMATION,
  BookingStatusEnum.CONFIRMED,
  BookingStatusEnum.IN_PROGRESS,
  BookingStatusEnum.COMPLETED,
];

const FULL_DAY_START_TIME = '00:00:00';
const FULL_DAY_END_TIME = '23:59:59';
const MINIMUM_BLOCK_LEAD_TIME_MINUTES = 60;

/**
 * Store Unavailability Service.
 *
 * Simplified: No member-specific unavailability (seller is the provider).
 *
 * @version 2
 * @since 1.0.0
 */
@Injectable()
export class StoreUnavailabilityService {
  constructor(
    private readonly repository: BaseStoreUnavailabilityRepository,
    private readonly sellersService: SellersService,
    private readonly servicesService: ServicesService,
    private readonly bookingRepository: BaseBookingRepository,
    private readonly availabilityRealtimeService: AvailabilityRealtimeService,
  ) {}

  private timeToMinutes(time: string): number {
    const [hours, minutes, seconds] = time.split(':').map((v) => Number(v));
    return hours * 60 + minutes + (seconds ? seconds / 60 : 0);
  }

  private ensureTimeWindow(
    isFullDay: boolean,
    start?: string | null,
    end?: string | null,
  ) {
    if (isFullDay) {
      return;
    }
    if (!start || !end) {
      throw new BadRequestException(
        'For partial-day unavailability, start_time and end_time are required',
      );
    }
    if (this.timeToMinutes(start) >= this.timeToMinutes(end)) {
      throw new BadRequestException('start_time must be before end_time');
    }
  }

  private async ensureServiceScope(
    sellerId: number,
    serviceId?: number | null,
  ): Promise<number | null> {
    if (serviceId === undefined || serviceId === null) {
      return null;
    }

    const service = await this.servicesService.findById(serviceId);
    if (service.seller_id !== sellerId) {
      throw new BadRequestException(
        'service_id does not belong to the specified seller_id',
      );
    }

    return serviceId;
  }

  private expandDateRange(
    startDate: string,
    endDate?: string | null,
  ): string[] {
    const normalizedEndDate = endDate ?? startDate;
    const dates: string[] = [];
    const cursor = new Date(`${startDate}T00:00:00`);
    const lastDate = new Date(`${normalizedEndDate}T00:00:00`);

    while (cursor <= lastDate) {
      const year = cursor.getFullYear();
      const month = String(cursor.getMonth() + 1).padStart(2, '0');
      const day = String(cursor.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
      cursor.setDate(cursor.getDate() + 1);
    }

    return dates;
  }

  private normalizeWindow(params: {
    isFullDay: boolean;
    startTime?: string | null;
    endTime?: string | null;
  }): {
    startTime: string;
    endTime: string;
  } {
    if (params.isFullDay) {
      return {
        startTime: FULL_DAY_START_TIME,
        endTime: FULL_DAY_END_TIME,
      };
    }

    return {
      startTime: params.startTime as string,
      endTime: params.endTime as string,
    };
  }

  private buildLocalDateTime(date: string, time: string): Date | null {
    const normalizedDate = String(date || '').trim();
    const normalizedTime = String(time || '').trim();
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate) ||
      !/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.test(normalizedTime)
    ) {
      return null;
    }

    const localDateTime = new Date(`${normalizedDate}T${normalizedTime}`);
    if (!Number.isFinite(localDateTime.getTime())) {
      return null;
    }

    return localDateTime;
  }

  private ensureMinimumLeadTimeForWindow(params: {
    unavailableDate: string;
    endDate?: string | null;
    isFullDay: boolean;
    startTime?: string | null;
    endTime?: string | null;
  }): void {
    const normalizedWindow = this.normalizeWindow({
      isFullDay: params.isFullDay,
      startTime: params.startTime,
      endTime: params.endTime,
    });
    const minimumAllowedStart = new Date(
      Date.now() + MINIMUM_BLOCK_LEAD_TIME_MINUTES * 60 * 1000,
    );

    this.expandDateRange(
      params.unavailableDate,
      params.endDate ?? null,
    ).forEach((date) => {
      const slotStartDateTime = this.buildLocalDateTime(
        date,
        normalizedWindow.startTime,
      );
      if (!slotStartDateTime) {
        throw new BadRequestException(
          'Invalid blocked slot date/time. Please refresh and try again.',
        );
      }

      if (slotStartDateTime.getTime() < minimumAllowedStart.getTime()) {
        throw new BadRequestException(
          'Blocked slots must be scheduled at least 1 hour in advance.',
        );
      }
    });
  }

  private normalizeBlockType(
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

  private publishAvailabilityForBlockedWindow(input: {
    sellerId: number;
    serviceId?: number | null;
    unavailableDate: string;
    endDate?: string | null;
    isFullDay: boolean;
    startTime?: string | null;
    endTime?: string | null;
    blockType?: string | null;
    openPlayEventId?: number | null;
    status?: string | null;
    source: string;
  }): void {
    const normalizedStatus = String(input.status || '')
      .trim()
      .toLowerCase();
    const normalizedBlockType = this.normalizeBlockType(input.blockType);
    const changeType =
      normalizedStatus === 'inactive'
        ? 'blocked_released'
        : normalizedBlockType === 'open_play'
          ? 'open_play_blocked'
          : 'slot_blocked';
    const window = this.normalizeWindow({
      isFullDay: input.isFullDay,
      startTime: input.startTime,
      endTime: input.endTime,
    });

    this.expandDateRange(input.unavailableDate, input.endDate ?? null).forEach(
      (date) => {
        this.availabilityRealtimeService.publishAvailabilityChanged({
          change_type: changeType,
          seller_id: input.sellerId,
          service_id: input.serviceId ?? null,
          date,
          start_time: window.startTime,
          end_time: window.endTime,
          block_type: normalizedBlockType,
          open_play_event_id: input.openPlayEventId ?? null,
          source: input.source,
        });
      },
    );
  }

  private async ensureWindowIsAvailable(params: {
    sellerId: number;
    serviceId?: number | null;
    unavailableDate: string;
    endDate?: string | null;
    isFullDay: boolean;
    startTime?: string | null;
    endTime?: string | null;
    ignoreUnavailabilityId?: number;
  }): Promise<void> {
    const { startTime, endTime } = this.normalizeWindow({
      isFullDay: params.isFullDay,
      startTime: params.startTime,
      endTime: params.endTime,
    });

    const dates = this.expandDateRange(
      params.unavailableDate,
      params.endDate ?? null,
    );

    for (const date of dates) {
      const overlappingBlocks = await this.repository.findOverlapsForWindow({
        seller_id: params.sellerId,
        service_id: params.serviceId,
        date,
        start_time: startTime,
        end_time: endTime,
      });

      const conflictingBlocks = overlappingBlocks.filter(
        (block) => block.id !== params.ignoreUnavailabilityId,
      );

      if (conflictingBlocks.length > 0) {
        throw new BadRequestException(
          'Selected schedule is already blocked. Please refresh and try again.',
        );
      }

      const overlappingBookings =
        await this.bookingRepository.findOverlappingBookings({
          seller_id: params.sellerId,
          date,
          start_time: startTime,
          end_time: endTime,
          service_id: params.serviceId ?? undefined,
          statuses: SLOT_OCCUPYING_BOOKING_STATUSES,
        });

      if (overlappingBookings.length > 0) {
        throw new BadRequestException(
          'Selected schedule overlaps an existing booking and can no longer be blocked. Please refresh and try again.',
        );
      }
    }
  }

  async create(dto: CreateStoreUnavailabilityDto, causer: User) {
    await this.sellersService.findById(dto.seller_id);
    const serviceId = await this.ensureServiceScope(
      dto.seller_id,
      dto.service_id,
    );

    // Validate end_date if provided
    if (dto.end_date) {
      const startDate = new Date(dto.unavailable_date);
      const endDate = new Date(dto.end_date);
      if (endDate < startDate) {
        throw new BadRequestException('end_date must be >= unavailable_date');
      }
    }

    const isFullDay = dto.is_full_day ?? true;
    this.ensureTimeWindow(isFullDay, dto.start_time, dto.end_time);
    this.ensureMinimumLeadTimeForWindow({
      unavailableDate: dto.unavailable_date,
      endDate: dto.end_date ?? null,
      isFullDay,
      startTime: dto.start_time ?? null,
      endTime: dto.end_time ?? null,
    });
    await this.ensureWindowIsAvailable({
      sellerId: dto.seller_id,
      serviceId,
      unavailableDate: dto.unavailable_date,
      endDate: dto.end_date ?? null,
      isFullDay,
      startTime: dto.start_time ?? null,
      endTime: dto.end_time ?? null,
    });

    const record = Object.assign(new StoreUnavailability(), dto, {
      service_id: serviceId,
      end_date: dto.end_date ?? null,
      start_time: dto.start_time ?? null,
      end_time: dto.end_time ?? null,
      is_full_day: isFullDay,
      reason: dto.reason ?? null,
      block_type: dto.block_type ?? 'maintenance',
      open_play_event_id: dto.open_play_event_id ?? null,
      status: dto.status ?? 'Active',
      created_by: causer,
      updated_by: causer,
    });

    const createdRecord = await this.repository.create(record);
    this.publishAvailabilityForBlockedWindow({
      sellerId: createdRecord.seller_id,
      serviceId: createdRecord.service_id ?? null,
      unavailableDate: createdRecord.unavailable_date,
      endDate: createdRecord.end_date ?? null,
      isFullDay: createdRecord.is_full_day,
      startTime: createdRecord.start_time ?? null,
      endTime: createdRecord.end_time ?? null,
      blockType: createdRecord.block_type ?? null,
      openPlayEventId: createdRecord.open_play_event_id ?? null,
      status: createdRecord.status ?? null,
      source: 'store_unavailability',
    });

    return createdRecord;
  }

  async findAll(query: QueryStoreUnavailabilityDto) {
    return this.repository.findAll(query);
  }

  async findById(id: number) {
    const record = await this.repository.findById(id);
    if (!record) throw new NotFoundException('Store unavailability not found');
    return record;
  }

  async update(id: number, dto: UpdateStoreUnavailabilityDto, causer: User) {
    const existing = await this.findById(id);
    const sellerId = dto.seller_id ?? existing.seller_id;
    const serviceId =
      dto.service_id !== undefined ? dto.service_id : existing.service_id;
    const isFullDay = dto.is_full_day ?? existing.is_full_day;
    const unavailableDate = dto.unavailable_date ?? existing.unavailable_date;
    const endDate = dto.end_date ?? existing.end_date ?? null;

    await this.sellersService.findById(sellerId);
    const normalizedServiceId = await this.ensureServiceScope(
      sellerId,
      serviceId,
    );

    // Validate end_date if provided
    if (endDate) {
      const startDate = new Date(unavailableDate);
      const endDateObj = new Date(endDate);
      if (endDateObj < startDate) {
        throw new BadRequestException('end_date must be >= unavailable_date');
      }
    }

    this.ensureTimeWindow(
      isFullDay,
      dto.start_time ?? existing.start_time,
      dto.end_time ?? existing.end_time,
    );
    const hasSchedulingChange =
      dto.unavailable_date !== undefined ||
      dto.end_date !== undefined ||
      dto.start_time !== undefined ||
      dto.end_time !== undefined ||
      dto.is_full_day !== undefined ||
      dto.service_id !== undefined ||
      dto.seller_id !== undefined;
    if (hasSchedulingChange) {
      this.ensureMinimumLeadTimeForWindow({
        unavailableDate,
        endDate,
        isFullDay,
        startTime: dto.start_time ?? existing.start_time,
        endTime: dto.end_time ?? existing.end_time,
      });
    }

    await this.ensureWindowIsAvailable({
      sellerId,
      serviceId: normalizedServiceId,
      unavailableDate,
      endDate,
      isFullDay,
      startTime: dto.start_time ?? existing.start_time,
      endTime: dto.end_time ?? existing.end_time,
      ignoreUnavailabilityId: existing.id,
    });

    const updatedRecord = await this.repository.update(id, {
      ...dto,
      seller_id: sellerId,
      service_id: normalizedServiceId,
      is_full_day: isFullDay,
      block_type: dto.block_type ?? existing.block_type ?? 'maintenance',
      open_play_event_id:
        dto.open_play_event_id !== undefined
          ? dto.open_play_event_id
          : (existing.open_play_event_id ?? null),
      updated_by: causer,
    });
    this.publishAvailabilityForBlockedWindow({
      sellerId: updatedRecord.seller_id,
      serviceId: updatedRecord.service_id ?? null,
      unavailableDate: updatedRecord.unavailable_date,
      endDate: updatedRecord.end_date ?? null,
      isFullDay: updatedRecord.is_full_day,
      startTime: updatedRecord.start_time ?? null,
      endTime: updatedRecord.end_time ?? null,
      blockType: updatedRecord.block_type ?? null,
      openPlayEventId: updatedRecord.open_play_event_id ?? null,
      status: updatedRecord.status ?? null,
      source: 'store_unavailability',
    });

    return updatedRecord;
  }

  async remove(id: number, causer: User) {
    const record = await this.findById(id);
    await this.repository.remove(id, causer?.id);
    this.publishAvailabilityForBlockedWindow({
      sellerId: record.seller_id,
      serviceId: record.service_id ?? null,
      unavailableDate: record.unavailable_date,
      endDate: record.end_date ?? null,
      isFullDay: record.is_full_day,
      startTime: record.start_time ?? null,
      endTime: record.end_time ?? null,
      blockType: record.block_type ?? null,
      openPlayEventId: record.open_play_event_id ?? null,
      status: 'Inactive',
      source: 'store_unavailability',
    });
  }
}
