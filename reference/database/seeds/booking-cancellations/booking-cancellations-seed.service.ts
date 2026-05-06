import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ISeedService } from '../seed.interface';
import { Repository } from 'typeorm';
import { BookingCancellationEntity } from '@/booking-cancellations/persistence/entities/booking-cancellation.entity';
import { BookingEntity } from '@/bookings/persistence/entities/booking.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { BookingStatusEnum } from '@/bookings/enums/booking-status.enum';
import { CancellationRoleEnum } from '@/booking-cancellations/enums/cancellation-role.enum';
import { CancellationReasonEnum } from '@/booking-cancellations/enums/cancellation-reason.enum';
import { CancellationPolicyEnum } from '@/booking-cancellations/enums/cancellation-policy.enum';
import { faker } from '@faker-js/faker';

/**
 * Service for seeding booking cancellations
 */
@Injectable()
export class BookingCancellationsSeedService implements ISeedService {
  constructor(
    @InjectRepository(BookingCancellationEntity)
    private repository: Repository<BookingCancellationEntity>,
    @InjectRepository(BookingEntity)
    private bookingRepository: Repository<BookingEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async run(): Promise<void> {
    const count = await this.repository.count();

    if (!count) {
      // Fetch cancelled bookings that don't already have cancellation records
      const cancelledBookings = await this.bookingRepository
        .createQueryBuilder('booking')
        .leftJoin(
          'booking_cancellations',
          'cancellation',
          'cancellation.booking_id = booking.id',
        )
        .where('booking.status = :status', {
          status: BookingStatusEnum.CANCELLED,
        })
        .andWhere('cancellation.id IS NULL')
        .getMany();

      if (cancelledBookings.length === 0) {
        console.log(
          '⚠️  No cancelled bookings found without cancellation records. Skipping booking cancellations seed.',
        );
        return;
      }

      // Fetch users for cancelled_by assignments
      const users = await this.userRepository.find({ take: 10 });

      if (users.length === 0) {
        console.log('⚠️  No users found. Skipping booking cancellations seed.');
        return;
      }

      const cancellations: Partial<BookingCancellationEntity>[] = [];

      for (const booking of cancelledBookings) {
        // Determine who cancelled and their role
        const cancelledByRole = faker.helpers.arrayElement([
          CancellationRoleEnum.CUSTOMER,
          CancellationRoleEnum.STORE,
          CancellationRoleEnum.STORE_MEMBER,
          CancellationRoleEnum.ADMIN,
        ]);

        // Select appropriate cancellation reason based on role
        let reason: CancellationReasonEnum;
        if (cancelledByRole === CancellationRoleEnum.CUSTOMER) {
          reason = faker.helpers.arrayElement([
            CancellationReasonEnum.SCHEDULE_CONFLICT,
            CancellationReasonEnum.CHANGED_MIND,
            CancellationReasonEnum.EMERGENCY,
            CancellationReasonEnum.FOUND_ALTERNATIVE,
            CancellationReasonEnum.ILLNESS,
          ]);
        } else if (
          cancelledByRole === CancellationRoleEnum.STORE ||
          cancelledByRole === CancellationRoleEnum.STORE_MEMBER
        ) {
          reason = faker.helpers.arrayElement([
            CancellationReasonEnum.PROVIDER_UNAVAILABLE,
            CancellationReasonEnum.SCHEDULE_CONFLICT,
            CancellationReasonEnum.EMERGENCY,
            CancellationReasonEnum.SERVICE_UNAVAILABLE,
          ]);
        } else {
          reason = faker.helpers.arrayElement([
            CancellationReasonEnum.OTHER,
            CancellationReasonEnum.DUPLICATE_BOOKING,
          ]);
        }

        // Use booking's cancelled_at or generate one
        const cancelledAt =
          booking.cancelled_at || faker.date.recent({ days: 7 });

        // Calculate scheduled datetime
        const scheduledDate = new Date(booking.scheduled_date);
        const [hours, minutes] = booking.scheduled_start_time
          .split(':')
          .map(Number);
        const scheduledDateTime = new Date(scheduledDate);
        scheduledDateTime.setHours(hours, minutes, 0, 0);

        // Calculate hours before scheduled
        const hoursBeforeScheduled = Math.floor(
          (scheduledDateTime.getTime() - cancelledAt.getTime()) /
            (1000 * 60 * 60),
        );

        // Determine policy based on hours and role
        let policyApplied: CancellationPolicyEnum;
        let cancellationFeePercent: number;

        if (
          cancelledByRole === CancellationRoleEnum.STORE ||
          cancelledByRole === CancellationRoleEnum.STORE_MEMBER
        ) {
          // Provider fault - full refund
          policyApplied = CancellationPolicyEnum.PROVIDER_FAULT;
          cancellationFeePercent = 0;
        } else if (cancelledByRole === CancellationRoleEnum.ADMIN) {
          // Admin override
          policyApplied = CancellationPolicyEnum.ADMIN_OVERRIDE;
          cancellationFeePercent = faker.number.float({
            min: 0,
            max: 50,
            fractionDigits: 2,
          });
        } else {
          // Customer cancellation - based on timing
          if (hoursBeforeScheduled >= 48) {
            policyApplied = CancellationPolicyEnum.FREE_CANCELLATION;
            cancellationFeePercent = 0;
          } else if (hoursBeforeScheduled >= 24) {
            policyApplied = CancellationPolicyEnum.PARTIAL_CHARGE;
            cancellationFeePercent = 50.0;
          } else {
            policyApplied = CancellationPolicyEnum.FULL_CHARGE;
            cancellationFeePercent = 100.0;
          }
        }

        // Calculate financial fields
        const originalAmount = Number(booking.total);
        const cancellationFeeAmount =
          (originalAmount * cancellationFeePercent) / 100;
        const refundAmount = originalAmount - cancellationFeeAmount;

        // Calculate platform fee refund (proportional to refund)
        const platformFee = Number(booking.platform_fee || 0);
        const platformFeeRefunded =
          (platformFee * refundAmount) / originalAmount;

        // Calculate store compensation and escrow amounts
        let storeCompensation = 0;
        let escrowRefunded = 0;
        let escrowReleasedToStore = 0;

        if (policyApplied === CancellationPolicyEnum.PROVIDER_FAULT) {
          // Provider fault - customer gets full refund, store gets nothing
          escrowRefunded = originalAmount;
          storeCompensation = 0;
        } else if (policyApplied === CancellationPolicyEnum.FREE_CANCELLATION) {
          // Free cancellation - full refund to customer
          escrowRefunded = originalAmount;
        } else if (policyApplied === CancellationPolicyEnum.PARTIAL_CHARGE) {
          // Partial charge - split the escrow
          escrowRefunded = refundAmount;
          escrowReleasedToStore = cancellationFeeAmount;
          storeCompensation = cancellationFeeAmount;
        } else if (policyApplied === CancellationPolicyEnum.FULL_CHARGE) {
          // Full charge - store keeps all
          escrowReleasedToStore = originalAmount;
          storeCompensation = originalAmount;
        } else {
          // Admin override - calculate based on refund
          escrowRefunded = refundAmount;
          escrowReleasedToStore = cancellationFeeAmount;
          storeCompensation = cancellationFeeAmount;
        }

        // Format scheduled_date and scheduled_time
        const scheduledDateStr =
          booking.scheduled_date instanceof Date
            ? booking.scheduled_date.toISOString().split('T')[0]
            : String(booking.scheduled_date).split('T')[0];

        const cancellation: Partial<BookingCancellationEntity> = {
          booking_id: booking.id,
          cancelled_by:
            booking.cancelled_by || faker.helpers.arrayElement(users).id,
          cancelled_by_role: cancelledByRole,
          reason: reason,
          reason_details: faker.helpers.maybe(() => faker.lorem.sentence(), {
            probability: 0.4,
          }),
          scheduled_date: scheduledDateStr as any,
          scheduled_time: booking.scheduled_start_time,
          cancelled_at: cancelledAt,
          hours_before_scheduled: hoursBeforeScheduled,
          policy_applied: policyApplied,
          cancellation_fee_percent: cancellationFeePercent,
          cancellation_fee_amount: cancellationFeeAmount,
          original_amount: originalAmount,
          refund_amount: refundAmount,
          store_compensation: storeCompensation,
          platform_fee_refunded: platformFeeRefunded,
          escrow_refunded: escrowRefunded,
          escrow_released_to_store: escrowReleasedToStore,
          refund_id: null, // No refund records yet
          processed_at: faker.helpers.maybe(
            () => faker.date.between({ from: cancelledAt, to: new Date() }),
            { probability: 0.7 },
          ),
          internal_notes: faker.helpers.maybe(() => faker.lorem.sentence(), {
            probability: 0.3,
          }),
          created_by: faker.helpers.arrayElement(users),
          updated_by: faker.helpers.arrayElement(users),
        };

        cancellations.push(cancellation);
      }

      await this.repository.save(cancellations);

      console.log(
        `✅ ${cancellations.length} booking cancellations seeded successfully`,
      );
    }
  }
}
