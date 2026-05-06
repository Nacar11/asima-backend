import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GuestBookingSelectedSlotDto {
  @ApiPropertyOptional({
    type: String,
    example: 'BK-20260315-0042',
    nullable: true,
  })
  booking_number?: string | null;

  @ApiPropertyOptional({ type: Number, example: 42, nullable: true })
  service_id?: number | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Court 1',
    nullable: true,
  })
  venue_name?: string | null;

  @ApiProperty({ type: String, format: 'date', example: '2026-03-06' })
  scheduled_date: string;

  @ApiProperty({ type: String, format: 'time', example: '10:00:00' })
  scheduled_start_time: string;

  @ApiProperty({ type: String, format: 'time', example: '11:00:00' })
  scheduled_end_time: string;
}

export class GuestBookingResponseDto {
  @ApiPropertyOptional({
    type: String,
    example: 'BKG-20260315-0042',
    description: 'Shared booking reference for this guest payment flow.',
    nullable: true,
  })
  booking_group_number?: string | null;

  @ApiPropertyOptional({
    type: [String],
    example: ['BK-20260315-0042'],
    description: 'Per-slot booking numbers created for this request.',
    nullable: true,
  })
  booking_numbers?: string[] | null;

  @ApiPropertyOptional({
    type: [GuestBookingSelectedSlotDto],
    description: 'Selected booking slot(s) for this request.',
    nullable: true,
  })
  selected_slots?: GuestBookingSelectedSlotDto[] | null;

  @ApiProperty({
    type: String,
    example:
      'http://localhost:3000/en/pickleball-selection/payment/BK-20260315-0042?email=juan%40example.com',
    nullable: true,
  })
  payment_url: string | null;

  @ApiProperty({
    type: String,
    example: '2026-03-15T11:00:00.000Z',
    nullable: true,
  })
  payment_expires_at: string | null;

  @ApiProperty({ type: Number, example: 1200.0 })
  amount: number;

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'True when the total is fully covered by a voucher — no payment action is needed.',
  })
  payment_not_required: boolean;

  @ApiProperty({ type: String, example: 'PHP' })
  currency: string;

  @ApiPropertyOptional({
    type: Number,
    example: 4,
    description: 'Total persons on the booking, including the primary contact.',
    nullable: true,
  })
  guest_count?: number | null;
}
