import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CancellationRoleEnum } from '@/booking-cancellations/enums/cancellation-role.enum';
import { CancellationReasonEnum } from '@/booking-cancellations/enums/cancellation-reason.enum';
import { CancellationPolicyEnum } from '@/booking-cancellations/enums/cancellation-policy.enum';

/**
 * Booking Cancellation domain model.
 *
 * Represents a cancelled booking with refund calculations and policy application.
 *
 * @version 1
 * @since 1.0.0
 */
export class BookingCancellation {
  @ApiProperty({ type: Number, example: 1 })
  id: number;

  @ApiProperty({ type: Number, example: 1 })
  booking_id: number;

  @ApiProperty({ type: Number, example: 1 })
  cancelled_by: number;

  @ApiProperty({
    enum: CancellationRoleEnum,
    example: CancellationRoleEnum.CUSTOMER,
  })
  cancelled_by_role: CancellationRoleEnum;

  @ApiProperty({
    enum: CancellationReasonEnum,
    example: CancellationReasonEnum.SCHEDULE_CONFLICT,
  })
  reason: CancellationReasonEnum;

  @ApiPropertyOptional({
    type: String,
    example: 'Need to reschedule due to emergency',
  })
  reason_details?: string | null;

  @ApiProperty({ type: String, example: '2024-12-15' })
  scheduled_date: string;

  @ApiProperty({ type: String, example: '10:00:00' })
  scheduled_time: string;

  @ApiProperty({ type: String, example: '2024-12-11T10:00:00Z' })
  cancelled_at: string;

  @ApiPropertyOptional({ type: Number, example: 72 })
  hours_before_scheduled?: number | null;

  @ApiProperty({
    enum: CancellationPolicyEnum,
    example: CancellationPolicyEnum.FREE_CANCELLATION,
  })
  policy_applied: CancellationPolicyEnum;

  @ApiPropertyOptional({ type: Number, example: 0 })
  cancellation_fee_percent?: number | null;

  @ApiPropertyOptional({ type: Number, example: 0 })
  cancellation_fee_amount?: number | null;

  @ApiProperty({ type: Number, example: 1000.0 })
  original_amount: number;

  @ApiProperty({ type: Number, example: 1000.0 })
  refund_amount: number;

  @ApiProperty({ type: Number, example: 0 })
  store_compensation: number;

  @ApiProperty({ type: Number, example: 0 })
  platform_fee_refunded: number;

  @ApiProperty({ type: Number, example: 1000.0 })
  escrow_refunded: number;

  @ApiProperty({ type: Number, example: 0 })
  escrow_released_to_store: number;

  @ApiPropertyOptional({ type: Number, example: 1 })
  refund_id?: number | null;

  @ApiPropertyOptional({ type: String, example: '2024-12-11T10:05:00Z' })
  processed_at?: string | null;

  @ApiPropertyOptional({ type: String })
  internal_notes?: string | null;

  @ApiProperty({ type: String, example: '2024-12-11T10:00:00Z' })
  created_at: string;

  @ApiProperty({ type: String, example: '2024-12-11T10:00:00Z' })
  updated_at: string;

  @ApiPropertyOptional({ type: String })
  deleted_at?: string | null;
}
