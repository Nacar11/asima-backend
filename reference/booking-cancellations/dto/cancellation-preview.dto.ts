import { ApiProperty } from '@nestjs/swagger';

/**
 * Cancellation Preview Response DTO.
 *
 * Shows preview of refund amounts before confirming cancellation.
 */
export class CancellationPreviewDto {
  @ApiProperty({ example: 1, description: 'Booking ID' })
  booking_id: number;

  @ApiProperty({ example: '2025-12-25', description: 'Scheduled date' })
  scheduled_date: string;

  @ApiProperty({ example: '14:00', description: 'Scheduled time' })
  scheduled_time: string;

  @ApiProperty({ example: 1000, description: 'Original booking amount' })
  original_amount: number;

  @ApiProperty({
    example: 48,
    description: 'Hours until scheduled appointment',
  })
  hours_before_scheduled: number;

  @ApiProperty({
    example: 'FREE_CANCELLATION',
    description: 'Policy that will be applied',
  })
  policy_applied: string;

  @ApiProperty({ example: 0, description: 'Cancellation fee percentage' })
  cancellation_fee_percent: number;

  @ApiProperty({ example: 0, description: 'Cancellation fee amount' })
  cancellation_fee_amount: number;

  @ApiProperty({
    example: 1000,
    description: 'Refund amount customer receives',
  })
  refund_amount: number;

  @ApiProperty({ example: 0, description: 'Amount store keeps' })
  store_compensation: number;

  @ApiProperty({
    example: 'Full refund - cancelled more than 48 hours before booking',
    description: 'Human-readable policy message',
  })
  message: string;
}
