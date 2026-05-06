import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { BaseSellerRepository } from '@/sellers/persistence/base-seller.repository';
import { BaseSellerScheduleRepository } from '@/seller-schedules/persistence/base-seller-schedule.repository';
import { BaseStoreUnavailabilityRepository } from '@/store-unavailability/persistence/base-store-unavailability.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import { OrderStatusEnum } from '@/sales-orders/domain/order-status.enum';

export interface PickupTimeSlot {
  time: string;
  available: boolean;
  remaining_capacity?: number;
}

export interface PickupAvailabilityResponse {
  seller_id: number;
  date: string;
  slots: PickupTimeSlot[];
}

@Injectable()
export class PickupAvailabilityService {
  constructor(
    private readonly sellerRepository: BaseSellerRepository,
    private readonly sellerScheduleRepository: BaseSellerScheduleRepository,
    private readonly storeUnavailabilityRepository: BaseStoreUnavailabilityRepository,
    @InjectRepository(SalesOrderEntity)
    private readonly salesOrderRepository: Repository<SalesOrderEntity>,
  ) {}

  /**
   * Get available pickup slots for a seller on a specific date
   */
  async getAvailableSlots(
    sellerId: number,
    date: string,
  ): Promise<PickupAvailabilityResponse> {
    // Validate seller exists and pickup is enabled
    const seller = await this.sellerRepository.findById(sellerId);
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    if (!seller.pickup_enabled) {
      throw new BadRequestException('Pickup is not enabled for this seller');
    }

    // Parse date
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Convert to seller schedule format (0 = Monday, 6 = Sunday in their system)
    const scheduleDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    // Get seller schedule for that day
    const schedule = await this.sellerScheduleRepository.findBySellerAndDay(
      sellerId,
      scheduleDayOfWeek,
    );

    if (!schedule || schedule.status !== 'Active') {
      return {
        seller_id: sellerId,
        date,
        slots: [],
      };
    }

    // Check for full-day store unavailability
    const unavailabilityBlocks =
      await this.storeUnavailabilityRepository.findOverlapsForWindow({
        seller_id: sellerId,
        date: date,
        start_time: schedule.start_time || '00:00',
        end_time: schedule.end_time || '23:59',
      });

    const hasFullDayBlock = unavailabilityBlocks.some(
      (block) => block.is_full_day,
    );

    if (hasFullDayBlock) {
      return {
        seller_id: sellerId,
        date,
        slots: [],
      };
    }

    // Generate 30-minute time slots
    const slots = this.generateTimeSlots(
      schedule.start_time || '09:00',
      schedule.end_time || '18:00',
      schedule.break_start || undefined,
      schedule.break_end || undefined,
    );

    // Apply preparation time constraint
    const now = new Date();
    const earliestPickupTime = new Date(
      now.getTime() + seller.pickup_preparation_time * 60000,
    );

    // Get existing pickup orders for capacity checking
    const existingOrders = await this.getExistingPickupOrders(sellerId, date);

    // Process each slot
    const processedSlots = slots.map((slot) => {
      const slotDateTime = new Date(`${date} ${slot.time}`);

      // Check if slot is before earliest pickup time
      if (slotDateTime < earliestPickupTime) {
        return { ...slot, available: false };
      }

      // Check if slot conflicts with partial-day unavailability blocks
      // Full-day blocks already handled above; skip them here (their times may be null)
      const hasConflict = unavailabilityBlocks.some(
        (block) =>
          !block.is_full_day &&
          block.start_time != null &&
          block.end_time != null &&
          this.isTimeSlotInConflict(
            slot.time,
            block.start_time,
            block.end_time,
          ),
      );

      if (hasConflict) {
        return { ...slot, available: false };
      }

      // Check capacity — normalize both sides to HH:MM since DB `time` columns may include seconds
      const ordersAtThisTime = existingOrders.filter((order) => {
        if (!order.pickup_time) return false;
        const normalized = String(order.pickup_time).substring(0, 5);
        return normalized === slot.time;
      });
      const remainingCapacity =
        seller.pickup_max_concurrent_orders - ordersAtThisTime.length;

      return {
        ...slot,
        available: remainingCapacity > 0,
        remaining_capacity: Math.max(0, remainingCapacity),
      };
    });

    return {
      seller_id: sellerId,
      date,
      slots: processedSlots,
    };
  }

  /**
   * Generate 30-minute time slots between start and end time
   */
  private generateTimeSlots(
    startTime: string,
    endTime: string,
    breakStart?: string,
    breakEnd?: string,
  ): PickupTimeSlot[] {
    const slots: PickupTimeSlot[] = [];

    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);

    const breakStartMin = breakStart ? this.timeToMinutes(breakStart) : null;
    const breakEndMin = breakEnd ? this.timeToMinutes(breakEnd) : null;

    for (let minutes = start; minutes < end; minutes += 30) {
      const slotEnd = Math.min(minutes + 30, end);

      // Skip if slot is entirely within break time
      if (breakStartMin && breakEndMin) {
        if (minutes >= breakStartMin && slotEnd <= breakEndMin) {
          continue;
        }
        // Adjust slot if it overlaps with break time
        if (minutes < breakEndMin && slotEnd > breakStartMin) {
          if (minutes < breakStartMin) {
            // Slot starts before break, create slot up to break
            if (breakStartMin - minutes >= 30) {
              slots.push({
                time: this.minutesToTime(minutes),
                available: true,
              });
            }
          }
          continue;
        }
      }

      slots.push({
        time: this.minutesToTime(minutes),
        available: true,
      });
    }

    return slots;
  }

  /**
   * Get existing pickup orders for a seller on a specific date
   */
  private async getExistingPickupOrders(
    sellerId: number,
    date: string,
  ): Promise<SalesOrderEntity[]> {
    return this.salesOrderRepository.find({
      where: {
        seller_id: sellerId,
        fulfillment_type: 'pickup',
        pickup_date: date as any,
        status: Not(OrderStatusEnum.CANCELLED),
      },
      select: ['pickup_time'],
    });
  }

  /**
   * Check if a time slot conflicts with an unavailability block
   */
  private isTimeSlotInConflict(
    slotTime: string,
    blockStart: string,
    blockEnd: string,
  ): boolean {
    const slotMinutes = this.timeToMinutes(slotTime);
    const slotEndMinutes = slotMinutes + 30;

    const blockStartMinutes = this.timeToMinutes(blockStart);
    const blockEndMinutes = this.timeToMinutes(blockEnd);

    return slotMinutes < blockEndMinutes && slotEndMinutes > blockStartMinutes;
  }

  /**
   * Convert time string to minutes since midnight
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convert minutes since midnight to time string
   */
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
}
