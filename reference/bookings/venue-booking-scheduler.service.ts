import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingEntity } from './persistence/entities/booking.entity';
import { BookingStatusEnum } from './enums/booking-status.enum';
import { ServiceTypeEnum } from '@/services/enums/service-type.enum';
import { BookingsService } from './bookings.service';
import { EscrowTransactionsService } from '@/escrow-transactions/escrow-transactions.service';
import { SellerEarningsService } from '@/seller-earnings/seller-earnings.service';

const VENUE_BOOKING_CRON_EXPRESSION =
  process.env.VENUE_BOOKING_CRON || '0 */15 * * * *';

/**
 * Scheduler service for automated venue booking lifecycle transitions.
 *
 * Venue bookings auto-start when scheduled_start_time arrives (CONFIRMED → IN_PROGRESS)
 * and auto-complete when scheduled_end_time passes (IN_PROGRESS/CONFIRMED → COMPLETED).
 *
 * On auto-complete, also releases escrow to provider and records seller earning.
 *
 * Runs based on VENUE_BOOKING_CRON (default: every 15 minutes).
 *
 * @version 2
 * @since 1.0.0
 */
@Injectable()
export class VenueBookingSchedulerService {
  private readonly logger = new Logger(VenueBookingSchedulerService.name);

  constructor(
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
    @Inject(forwardRef(() => BookingsService))
    private readonly bookingsService: BookingsService,
    @Inject(forwardRef(() => EscrowTransactionsService))
    private readonly escrowTransactionsService: EscrowTransactionsService,
    private readonly sellerEarningsService: SellerEarningsService,
  ) {}

  /**
   * Auto-start and auto-complete venue bookings based on their scheduled times.
   *
   * 1. PENDING/CONFIRMED → IN_PROGRESS when scheduled_date + scheduled_start_time <= now
   *    AND scheduled_date + scheduled_end_time > now (still within the booking window).
   *
   * 2. PENDING/CONFIRMED/IN_PROGRESS → COMPLETED when scheduled_date + scheduled_end_time <= now.
   */
  @Cron(VENUE_BOOKING_CRON_EXPRESSION)
  async handleVenueBookingTransitions(): Promise<void> {
    this.logger.log(
      `Starting venue booking auto-transition job... (cron: ${VENUE_BOOKING_CRON_EXPRESSION})`,
    );

    try {
      const now = new Date();
      let startedCount = 0;
      let completedCount = 0;

      // ── Auto-complete first (PENDING/CONFIRMED/IN_PROGRESS → COMPLETED) ──
      // End time has passed — booking is done regardless of current status.
      const toComplete = await this.bookingRepository
        .createQueryBuilder('booking')
        .innerJoinAndSelect('booking.service', 'service')
        .where('service.service_type = :venueType', {
          venueType: ServiceTypeEnum.VENUE,
        })
        .andWhere('booking.status IN (:...statuses)', {
          statuses: [
            BookingStatusEnum.PENDING,
            BookingStatusEnum.CONFIRMED,
            BookingStatusEnum.IN_PROGRESS,
          ],
        })
        .andWhere(
          `(booking.scheduled_date + booking.scheduled_end_time) <= :now`,
          { now },
        )
        .andWhere('booking.scheduled_end_time IS NOT NULL')
        .getMany();

      for (const booking of toComplete) {
        try {
          if (booking.service?.service_type !== ServiceTypeEnum.VENUE) {
            this.logger.warn(
              `Skipping non-venue booking #${booking.id} during auto-complete.`,
            );
            continue;
          }

          const nowTimestamp = new Date();
          await this.bookingRepository.update(booking.id, {
            status: BookingStatusEnum.COMPLETED,
            actual_end_time: nowTimestamp,
            completed_at: nowTimestamp,
            // If it was never started, stamp start time at transition time.
            ...(booking.status !== BookingStatusEnum.IN_PROGRESS && {
              actual_start_time: nowTimestamp,
            }),
            ...(booking.status === BookingStatusEnum.PENDING && {
              confirmed_at: nowTimestamp,
            }),
          });

          completedCount++;
          this.logger.log(
            `Auto-completed venue booking #${booking.id} (was ${booking.status})`,
          );

          // Release escrow and record earning for auto-completed booking
          this.releaseEscrowForAutoComplete(booking.id).catch((error) => {
            this.logger.error(
              `Failed to release escrow for auto-completed booking ${booking.id}: ${error.message}`,
            );
          });
        } catch (error) {
          this.logger.error(
            `Failed to auto-complete venue booking ${booking.id}: ${error.message}`,
          );
        }
      }

      // ── Auto-start (PENDING/CONFIRMED → IN_PROGRESS) ──
      // Start time has arrived but end time hasn't yet.
      const toStart = await this.bookingRepository
        .createQueryBuilder('booking')
        .innerJoinAndSelect('booking.service', 'service')
        .where('service.service_type = :venueType', {
          venueType: ServiceTypeEnum.VENUE,
        })
        .andWhere('booking.status IN (:...statuses)', {
          statuses: [BookingStatusEnum.PENDING, BookingStatusEnum.CONFIRMED],
        })
        .andWhere(
          `(booking.scheduled_date + booking.scheduled_start_time) <= :now`,
          { now },
        )
        .andWhere(
          `(booking.scheduled_date + booking.scheduled_end_time) > :now`,
          { now },
        )
        .andWhere('booking.scheduled_end_time IS NOT NULL')
        .getMany();

      for (const booking of toStart) {
        try {
          if (booking.service?.service_type !== ServiceTypeEnum.VENUE) {
            this.logger.warn(
              `Skipping non-venue booking #${booking.id} during auto-start.`,
            );
            continue;
          }

          const nowTimestamp = new Date();
          await this.bookingRepository.update(booking.id, {
            status: BookingStatusEnum.IN_PROGRESS,
            actual_start_time: nowTimestamp,
            ...(booking.status === BookingStatusEnum.PENDING && {
              confirmed_at: nowTimestamp,
            }),
          });

          startedCount++;
          this.logger.log(`Auto-started venue booking #${booking.id}`);
        } catch (error) {
          this.logger.error(
            `Failed to auto-start venue booking ${booking.id}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `Venue booking job finished. ${startedCount} started, ${completedCount} completed.`,
      );
    } catch (error) {
      this.logger.error('Error in venue booking auto-transition job:', error);
    }
  }

  /**
   * Release escrow and record seller earning for an auto-completed booking.
   * Uses BookingsService.releaseEscrowAndRecordEarning for consistency.
   */
  private async releaseEscrowForAutoComplete(bookingId: number): Promise<void> {
    const booking = await this.bookingsService.findByIdInternal(bookingId);
    await this.bookingsService.releaseEscrowAndRecordEarning(booking, null);
  }
}
